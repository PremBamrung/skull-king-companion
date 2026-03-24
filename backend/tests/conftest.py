import pytest
from fastapi.testclient import TestClient
from sqlmodel import create_engine, SQLModel, Session
from sqlalchemy.pool import StaticPool

from main import app
from database import get_session


@pytest.fixture(name="client")
def client_fixture():
    # Use a shared in-memory SQLite connection for all sessions in this fixture.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def get_test_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = get_test_session
    yield TestClient(app)
    app.dependency_overrides.clear()
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="game_with_players")
def game_with_players_fixture(client):
    resp = client.post("/api/games", json={
        "players": [{"name": "Alice"}, {"name": "Bob"}],
        "config": {}
    })
    assert resp.status_code == 200
    return resp.json()
