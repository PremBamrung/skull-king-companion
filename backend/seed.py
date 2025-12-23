from sqlmodel import Session, select
from models import Game, Player, Round, RoundPlayerStats, GameStatus
from scoring import ScoringService
from datetime import datetime, timedelta

def seed_data(session: Session):
    # Check if we already have games
    existing_games = session.exec(select(Game)).first()
    if existing_games:
        return

    print("Seeding mock games...")

    # 1. COMPLETED GAME
    completed_game = Game(
        status=GameStatus.COMPLETED,
        created_at=datetime.utcnow() - timedelta(days=2),
        last_accessed=datetime.utcnow() - timedelta(days=2),
        rules_config={}
    )
    session.add(completed_game)
    session.commit()
    session.refresh(completed_game)

    players_comp = [
        Player(game_id=completed_game.id, name="Alice", seat_index=0),
        Player(game_id=completed_game.id, name="Bob", seat_index=1),
        Player(game_id=completed_game.id, name="Charlie", seat_index=2)
    ]
    for p in players_comp:
        session.add(p)
    session.commit()
    for p in players_comp:
        session.refresh(p)

    # Add 10 rounds for the completed game
    for r_num in range(1, 11):
        round_obj = Round(game_id=completed_game.id, round_number=r_num, card_count=r_num)
        session.add(round_obj)
        session.commit()
        session.refresh(round_obj)

        for i, p in enumerate(players_comp):
            # Simple mock scoring logic
            # Round 1: card_count=1. 
            # Give Alice what she bid, Bob fails, Charlie bids 0 and gets it.
            bid = 1 if i == 0 else (1 if i == 1 else 0)
            tricks = 1 if i == 0 else (0 if i == 1 else 0)
            bonus = 0
            
            # Adjust tricks to match card_count for the round (except maybe Kraken logic which we won't mock deeply)
            # Actually, total tricks should match card_count.
            # Round 1: Alice gets the 1 trick. Bob gets 0. Charlie gets 0.
            
            # Overriding for mock variety:
            if r_num % 3 == i:
                tricks = r_num # One person takes all
            else:
                tricks = 0

            # Bid logic:
            bid = tricks if r_num % 2 == 0 else (tricks + 1)
            
            score = ScoringService.calculate_score(
                bid=bid, tricks=tricks, bonus=bonus, 
                round_cards=r_num, rules={}
            )
            
            prev_total = 0
            if r_num > 1:
                # Get last round's total
                statement = select(RoundPlayerStats).join(Round).where(
                    Round.game_id == completed_game.id,
                    Round.round_number == r_num - 1,
                    RoundPlayerStats.player_id == p.id
                )
                last_stat = session.exec(statement).first()
                if last_stat:
                    prev_total = last_stat.total_score_snapshot

            stat = RoundPlayerStats(
                round_id=round_obj.id,
                player_id=p.id,
                bid=bid,
                tricks_won=tricks,
                bonus_points=bonus,
                round_score=score,
                total_score_snapshot=prev_total + score
            )
            session.add(stat)
        session.commit()

    # 2. ACTIVE GAME
    active_game = Game(
        status=GameStatus.ACTIVE,
        created_at=datetime.utcnow() - timedelta(hours=5),
        last_accessed=datetime.utcnow(),
        rules_config={"allow_blank_lead": True}
    )
    session.add(active_game)
    session.commit()
    session.refresh(active_game)

    players_active = [
        Player(game_id=active_game.id, name="Dave", seat_index=0),
        Player(game_id=active_game.id, name="Eve", seat_index=1)
    ]
    for p in players_active:
        session.add(p)
    session.commit()
    for p in players_active:
        session.refresh(p)

    # Add 3 completed rounds
    for r_num in range(1, 4):
        round_obj = Round(game_id=active_game.id, round_number=r_num, card_count=r_num)
        session.add(round_obj)
        session.commit()
        session.refresh(round_obj)

        for i, p in enumerate(players_active):
            # Eve always wins everything in this mock
            tricks = r_num if i == 1 else 0
            bid = tricks
            score = ScoringService.calculate_score(bid, tricks, 0, r_num, {})
            
            prev_total = 0
            if r_num > 1:
                statement = select(RoundPlayerStats).join(Round).where(
                    Round.game_id == active_game.id,
                    Round.round_number == r_num - 1,
                    RoundPlayerStats.player_id == p.id
                )
                last_stat = session.exec(statement).first()
                if last_stat:
                    prev_total = last_stat.total_score_snapshot

            stat = RoundPlayerStats(
                round_id=round_obj.id,
                player_id=p.id,
                bid=bid,
                tricks_won=tricks,
                bonus_points=0,
                round_score=score,
                total_score_snapshot=prev_total + score
            )
            session.add(stat)
        session.commit()

    # Initialize the "current" round (Round 4) for the active game
    next_round = Round(game_id=active_game.id, round_number=4, card_count=4)
    session.add(next_round)
    session.commit()

    print("Seeding complete.")
