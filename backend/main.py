from datetime import datetime
from typing import List, Dict, Optional
from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from contextlib import asynccontextmanager

from database import engine, create_db_and_tables, get_session
from models import Game, Player, Round, RoundPlayerStats, GameStatus
from scoring import ScoringService
from pydantic import BaseModel
from seed import seed_data

# Response Models with Relationships
class RoundPlayerStatsRead(BaseModel):
    id: UUID
    round_id: UUID
    player_id: UUID
    bid: int
    tricks_won: int
    bonus_points: int
    round_score: int
    total_score_snapshot: int

class RoundRead(BaseModel):
    id: UUID
    game_id: UUID
    round_number: int
    card_count: int
    player_stats: List[RoundPlayerStatsRead] = []

class PlayerRead(BaseModel):
    id: UUID
    name: str
    is_ghost: bool
    seat_index: int

class GameRead(BaseModel):
    id: UUID
    status: GameStatus
    created_at: datetime
    last_accessed: datetime
    rules_config: Dict
    players: List[PlayerRead] = []
    rounds: List[RoundRead] = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    # Seed mock data
    with Session(engine) as session:
        seed_data(session)
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class PlayerCreate(BaseModel):
    name: str
    is_ghost: bool = False

class GameCreate(BaseModel):
    players: List[PlayerCreate]
    config: Dict = {}

class PlayerStatInput(BaseModel):
    player_id: UUID
    bid: int
    tricks: int
    bonus: int = 0

class RoundSubmit(BaseModel):
    player_stats: List[PlayerStatInput]
    kraken_played: bool = False

@app.get("/")
async def root():
    return {"message": "Skull King API"}

@app.post("/api/games", response_model=GameRead)
def create_game(data: GameCreate, session: Session = Depends(get_session)):
    game = Game(status=GameStatus.ACTIVE, rules_config=data.config)
    session.add(game)
    session.commit()
    session.refresh(game)
    
    for idx, p_data in enumerate(data.players):
        player = Player(
            game_id=game.id,
            name=p_data.name,
            is_ghost=p_data.is_ghost,
            seat_index=idx
        )
        session.add(player)
    
    # Initialize first round
    first_round = Round(game_id=game.id, round_number=1, card_count=1)
    session.add(first_round)
    
    session.commit()
    session.refresh(game)
    return game

@app.get("/api/games/{game_id}", response_model=GameRead)
def get_game(game_id: UUID, session: Session = Depends(get_session)):
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Update last accessed
    game.last_accessed = datetime.utcnow()
    session.add(game)
    session.commit()
    session.refresh(game)
    
    # Ensure players and rounds are loaded (SQLModel Relationship handles this)
    return game

@app.post("/api/games/{game_id}/rounds/{round_num}", response_model=GameRead)
def submit_round(
    game_id: UUID, 
    round_num: int, 
    data: RoundSubmit, 
    session: Session = Depends(get_session)
):
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Find the current round
    statement = select(Round).where(Round.game_id == game_id, Round.round_number == round_num)
    round_obj = session.exec(statement).first()
    if not round_obj:
        raise HTTPException(status_code=404, detail="Round not found")

    # Validation
    total_tricks = sum(p.tricks for p in data.player_stats)
    expected_tricks = round_obj.card_count - 1 if data.kraken_played else round_obj.card_count
    if total_tricks != expected_tricks:
        raise HTTPException(
            status_code=400, 
            detail=f"Total tricks ({total_tricks}) does not match expected ({expected_tricks})."
        )

    # Process scores
    for p_stat in data.player_stats:
        # Calculate score
        score = ScoringService.calculate_score(
            bid=p_stat.bid,
            tricks=p_stat.tricks,
            bonus=p_stat.bonus,
            round_cards=round_obj.card_count,
            rules=game.rules_config
        )
        
        # Get previous total score snapshot
        prev_total = 0
        statement = select(RoundPlayerStats).join(Round).where(
            Round.game_id == game_id,
            Round.round_number < round_num,
            RoundPlayerStats.player_id == p_stat.player_id
        ).order_by(Round.round_number.desc())
        last_stat = session.exec(statement).first()
        if last_stat:
            prev_total = last_stat.total_score_snapshot

        stat_obj = RoundPlayerStats(
            round_id=round_obj.id,
            player_id=p_stat.player_id,
            bid=p_stat.bid,
            tricks_won=p_stat.tricks,
            bonus_points=p_stat.bonus,
            round_score=score,
            total_score_snapshot=prev_total + score
        )
        session.add(stat_obj)

    # Advance game
    if round_num < 10:
        next_round = Round(game_id=game_id, round_number=round_num + 1, card_count=round_num + 1)
        session.add(next_round)
    else:
        game.status = GameStatus.COMPLETED

    game.last_accessed = datetime.utcnow()
    session.add(game)
    session.commit()
    session.refresh(game)
    return game

@app.put("/api/games/{game_id}/rounds/{round_num}", response_model=GameRead)
def update_round(
    game_id: UUID, 
    round_num: int, 
    data: RoundSubmit, 
    session: Session = Depends(get_session)
):
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    statement = select(Round).where(Round.game_id == game_id, Round.round_number == round_num)
    round_obj = session.exec(statement).first()
    if not round_obj:
        raise HTTPException(status_code=404, detail="Round not found")

    # Delete old stats for this round
    for stat in round_obj.player_stats:
        session.delete(stat)
    session.commit()
    session.refresh(round_obj)

    # Re-submit with new data
    # (Simplified: we'll just reuse the core logic but without adding a next round)
    total_tricks = sum(p.tricks for p in data.player_stats)
    expected_tricks = round_obj.card_count - 1 if data.kraken_played else round_obj.card_count
    if total_tricks != expected_tricks:
        raise HTTPException(status_code=400, detail=f"Invalid trick count (expected {expected_tricks})")

    for p_stat in data.player_stats:
        score = ScoringService.calculate_score(
            bid=p_stat.bid, tricks=p_stat.tricks, bonus=p_stat.bonus, 
            round_cards=round_obj.card_count, rules=game.rules_config
        )
        
        # Get previous total score snapshot
        prev_total = 0
        statement = select(RoundPlayerStats).join(Round).where(
            Round.game_id == game_id,
            Round.round_number < round_num,
            RoundPlayerStats.player_id == p_stat.player_id
        ).order_by(Round.round_number.desc())
        last_stat = session.exec(statement).first()
        if last_stat:
            prev_total = last_stat.total_score_snapshot

        stat_obj = RoundPlayerStats(
            round_id=round_obj.id, player_id=p_stat.player_id,
            bid=p_stat.bid, tricks_won=p_stat.tricks, bonus_points=p_stat.bonus,
            round_score=score, total_score_snapshot=prev_total + score
        )
        session.add(stat_obj)
    
    session.commit()
    
    game.last_accessed = datetime.utcnow()
    session.add(game)
    session.commit()

    # RE-CALCULATE ALL SUBSEQUENT ROUNDS
    for r_num in range(round_num + 1, 11):
        statement = select(Round).where(Round.game_id == game_id, Round.round_number == r_num)
        nxt_round = session.exec(statement).first()
        if not nxt_round or not nxt_round.player_stats:
            break
            
        for s in nxt_round.player_stats:
            # prev total for THIS player
            statement = select(RoundPlayerStats).join(Round).where(
                Round.game_id == game_id,
                Round.round_number == r_num - 1,
                RoundPlayerStats.player_id == s.player_id
            )
            prev = session.exec(statement).first()
            s.total_score_snapshot = (prev.total_score_snapshot if prev else 0) + s.round_score
            session.add(s)
        session.commit()

    session.refresh(game)
    return game

@app.delete("/api/games/{game_id}/rounds/{round_num}")
def undo_round(game_id: UUID, round_num: int, session: Session = Depends(get_session)):
    statement = select(Round).where(Round.game_id == game_id, Round.round_number == round_num)
    round_obj = session.exec(statement).first()
    if not round_obj:
        raise HTTPException(status_code=404, detail="Round not found")
    
    # Delete stats
    for stat in round_obj.player_stats:
        session.delete(stat)
    
    # If there's a "next" round that was initialized, delete it too
    next_statement = select(Round).where(Round.game_id == game_id, Round.round_number == round_num + 1)
    next_round = session.exec(next_statement).first()
    if next_round:
        session.delete(next_round)
        
    game = session.get(Game, game_id)
    if game.status == GameStatus.COMPLETED:
        game.status = GameStatus.ACTIVE
        session.add(game)
        
    session.commit()
    return {"message": "Round undone"}

@app.get("/api/history", response_model=List[GameRead])
def get_history(session: Session = Depends(get_session)):
    statement = select(Game).order_by(Game.last_accessed.desc())
    return session.exec(statement).all()

@app.delete("/api/games/{game_id}")
def delete_game(game_id: UUID, session: Session = Depends(get_session)):
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Relationships with cascade delete should be handled by the model, 
    # but let's be explicit if needed or rely on the DB.
    # In SQLModel, if we have sa_column_kwargs={"ondelete": "CASCADE"}, it's easier.
    # For now, let's just delete the game and see. 
    # Usually, we'd delete rounds and stats first if not cascaded.
    
    # Let's check models.py to see cascade settings.
    session.delete(game)
    session.commit()
    return {"message": "Game deleted"}
