from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Relationship, JSON, Column


class GameStatus(str, Enum):
    SETUP = "SETUP"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"


class Game(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    status: GameStatus = Field(default=GameStatus.SETUP)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rules_config: Dict = Field(default={}, sa_column=Column(JSON))
    
    players: List["Player"] = Relationship(back_populates="game")
    rounds: List["Round"] = Relationship(back_populates="game")


class Player(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    game_id: UUID = Field(foreign_key="game.id")
    name: str
    is_ghost: bool = Field(default=False)
    seat_index: int
    
    game: Game = Relationship(back_populates="players")
    stats: List["RoundPlayerStats"] = Relationship(back_populates="player")


class Round(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    game_id: UUID = Field(foreign_key="game.id")
    round_number: int
    card_count: int
    
    game: Game = Relationship(back_populates="rounds")
    player_stats: List["RoundPlayerStats"] = Relationship(back_populates="round")


class RoundPlayerStats(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    round_id: UUID = Field(foreign_key="round.id")
    player_id: UUID = Field(foreign_key="player.id")
    bid: int
    tricks_won: int
    bonus_points: int = Field(default=0)
    round_score: int = Field(default=0)
    total_score_snapshot: int = Field(default=0)
    
    round: Round = Relationship(back_populates="player_stats")
    player: Player = Relationship(back_populates="stats")
