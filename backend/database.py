import os
from sqlalchemy import text
from sqlmodel import create_engine, Session, SQLModel
from typing import Generator

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./skullking.db")

# For SQLite, we need to allow multi-threaded access
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)


def create_db_and_tables():
    from names import generate_game_name
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        try:
            session.exec(text("ALTER TABLE game ADD COLUMN name VARCHAR"))
            session.commit()
        except Exception:
            pass  # Column already exists
        # Backfill names for any games that don't have one
        rows = session.exec(text("SELECT id FROM game WHERE name IS NULL")).fetchall()
        for (game_id,) in rows:
            session.exec(text("UPDATE game SET name = :name WHERE id = :id").bindparams(name=generate_game_name(), id=str(game_id)))
        if rows:
            session.commit()


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
