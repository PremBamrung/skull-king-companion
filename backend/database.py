import os
from sqlmodel import create_engine, Session, SQLModel
from typing import Generator

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./skullking.db")

# For SQLite, we need to allow multi-threaded access
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
