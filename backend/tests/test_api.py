"""
Integration tests for the Skull King API.
Each test gets a fresh in-memory SQLite via the `client` fixture in conftest.py.
"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def player_stats(players, bids_tricks_bonuses):
    """Build player_stats payload from player list + [(bid, tricks, bonus), ...]."""
    return [
        {"player_id": p["id"], "bid": bid, "tricks": tricks, "bonus": bonus}
        for p, (bid, tricks, bonus) in zip(players, bids_tricks_bonuses)
    ]


def submit(client, game, round_num, bids_tricks_bonuses, kraken_played=False):
    """Submit a round and assert 200."""
    resp = client.post(
        f"/api/games/{game['id']}/rounds/{round_num}",
        json={
            "player_stats": player_stats(game["players"], bids_tricks_bonuses),
            "kraken_played": kraken_played,
        }
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


def play_all_rounds(client, game):
    """Play all 10 rounds with simple valid data (player 0 bids 0 every time)."""
    for rnd in range(1, 11):
        # card_count == rnd; player 0 bids 0 (tricks=0), everyone else takes all tricks
        num_players = len(game["players"])
        btt = [(0, 0, 0)] + [(rnd, rnd, 0)] if num_players > 1 else [(0, 0, 0)]
        # simpler: player 0 tricks=0, player 1 tricks=rnd
        if num_players >= 2:
            btt = [(0, 0, 0), (rnd, rnd, 0)]
        game = submit(client, game, rnd, btt)
    return game


# ---------------------------------------------------------------------------
# POST /api/games
# ---------------------------------------------------------------------------

def test_create_game_returns_game(client):
    resp = client.post("/api/games", json={"players": [{"name": "Alice"}, {"name": "Bob"}], "config": {}})
    assert resp.status_code == 200
    game = resp.json()
    assert game["status"] == "ACTIVE"
    assert len(game["players"]) == 2
    assert len(game["rounds"]) == 1
    assert game["rounds"][0]["round_number"] == 1
    assert game["rounds"][0]["card_count"] == 1


def test_create_game_seat_indices(client):
    resp = client.post("/api/games", json={"players": [{"name": "Alice"}, {"name": "Bob"}], "config": {}})
    players = resp.json()["players"]
    seats = [p["seat_index"] for p in sorted(players, key=lambda p: p["seat_index"])]
    assert seats == [0, 1]


def test_create_game_ghost_player(client):
    resp = client.post("/api/games", json={
        "players": [{"name": "Alice"}, {"name": "Ghost", "is_ghost": True}],
        "config": {}
    })
    assert resp.status_code == 200
    players = {p["name"]: p for p in resp.json()["players"]}
    assert players["Ghost"]["is_ghost"] is True
    assert players["Alice"]["is_ghost"] is False


# ---------------------------------------------------------------------------
# GET /api/games/{id}
# ---------------------------------------------------------------------------

def test_get_game(client, game_with_players):
    resp = client.get(f"/api/games/{game_with_players['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == game_with_players["id"]


def test_get_game_not_found(client):
    resp = client.get("/api/games/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/games/{id}/rounds/{num}  — submit round
# ---------------------------------------------------------------------------

def test_submit_round_happy_path(client, game_with_players):
    game = game_with_players
    players = game["players"]
    # Round 1: card_count=1 → total tricks must equal 1
    # Alice bid=1, tricks=1 → score=20; Bob bid=0, tricks=0 → score=10
    resp = client.post(f"/api/games/{game['id']}/rounds/1", json={
        "player_stats": [
            {"player_id": players[0]["id"], "bid": 1, "tricks": 1, "bonus": 0},
            {"player_id": players[1]["id"], "bid": 0, "tricks": 0, "bonus": 0},
        ],
        "kraken_played": False,
    })
    assert resp.status_code == 200
    updated = resp.json()
    # Round 2 should now be created
    round_numbers = [r["round_number"] for r in updated["rounds"]]
    assert 2 in round_numbers


def test_submit_round_scores_are_correct(client, game_with_players):
    game = game_with_players
    players = sorted(game["players"], key=lambda p: p["seat_index"])
    game = submit(client, game, 1, [(1, 1, 0), (0, 0, 0)])

    round1 = next(r for r in game["rounds"] if r["round_number"] == 1)
    stats = {s["player_id"]: s for s in round1["player_stats"]}
    assert stats[players[0]["id"]]["round_score"] == 20
    assert stats[players[1]["id"]]["round_score"] == 10


def test_submit_round_invalid_trick_count(client, game_with_players):
    game = game_with_players
    players = game["players"]
    # Round 1 expects total tricks=1, but we send 2
    resp = client.post(f"/api/games/{game['id']}/rounds/1", json={
        "player_stats": [
            {"player_id": players[0]["id"], "bid": 1, "tricks": 1, "bonus": 0},
            {"player_id": players[1]["id"], "bid": 1, "tricks": 1, "bonus": 0},
        ],
        "kraken_played": False,
    })
    assert resp.status_code == 400


def test_submit_round_with_kraken(client, game_with_players):
    game = game_with_players
    players = sorted(game["players"], key=lambda p: p["seat_index"])
    # Round 1: card_count=1, kraken → expected tricks = 0
    resp = client.post(f"/api/games/{game['id']}/rounds/1", json={
        "player_stats": [
            {"player_id": players[0]["id"], "bid": 0, "tricks": 0, "bonus": 0},
            {"player_id": players[1]["id"], "bid": 0, "tricks": 0, "bonus": 0},
        ],
        "kraken_played": True,
    })
    assert resp.status_code == 200


def test_submit_round_kraken_wrong_total(client, game_with_players):
    game = game_with_players
    players = game["players"]
    # Round 1: card_count=1, kraken → expected=0, but we send 1
    resp = client.post(f"/api/games/{game['id']}/rounds/1", json={
        "player_stats": [
            {"player_id": players[0]["id"], "bid": 1, "tricks": 1, "bonus": 0},
            {"player_id": players[1]["id"], "bid": 0, "tricks": 0, "bonus": 0},
        ],
        "kraken_played": True,
    })
    assert resp.status_code == 400


def test_submit_cumulative_score(client, game_with_players):
    game = game_with_players
    players = sorted(game["players"], key=lambda p: p["seat_index"])
    alice_id = players[0]["id"]

    # Round 1 (1 card): Alice bid=1, tricks=1 → score=20, total=20
    game = submit(client, game, 1, [(1, 1, 0), (0, 0, 0)])
    # Round 2 (2 cards): Alice bid=2, tricks=2 → score=40, total=60
    game = submit(client, game, 2, [(2, 2, 0), (0, 0, 0)])

    round2 = next(r for r in game["rounds"] if r["round_number"] == 2)
    alice_stat = next(s for s in round2["player_stats"] if s["player_id"] == alice_id)
    assert alice_stat["total_score_snapshot"] == 60


def test_submit_final_round_marks_game_completed(client, game_with_players):
    game = game_with_players
    game = play_all_rounds(client, game)
    assert game["status"] == "COMPLETED"


# ---------------------------------------------------------------------------
# PUT /api/games/{id}/rounds/{num}  — update round
# ---------------------------------------------------------------------------

def test_update_round_recalculates_subsequent_scores(client, game_with_players):
    game = game_with_players
    players = sorted(game["players"], key=lambda p: p["seat_index"])
    alice_id = players[0]["id"]

    # Submit round 1: Alice bid=1, tricks=1 → score=20, total=20
    game = submit(client, game, 1, [(1, 1, 0), (0, 0, 0)])
    # Submit round 2: Alice bid=2, tricks=2 → score=40, total=60
    game = submit(client, game, 2, [(2, 2, 0), (0, 0, 0)])

    # Now update round 1: Alice bid=0, tricks=0 → score=10, total=10
    resp = client.put(f"/api/games/{game['id']}/rounds/1", json={
        "player_stats": [
            {"player_id": alice_id, "bid": 0, "tricks": 0, "bonus": 0},
            {"player_id": players[1]["id"], "bid": 1, "tricks": 1, "bonus": 0},
        ],
        "kraken_played": False,
    })
    assert resp.status_code == 200
    updated = resp.json()

    round2 = next(r for r in updated["rounds"] if r["round_number"] == 2)
    alice_stat = next(s for s in round2["player_stats"] if s["player_id"] == alice_id)
    # Alice round1 total=10, round2 score=40 → new total=50
    assert alice_stat["total_score_snapshot"] == 50


def test_update_round_invalid_trick_count(client, game_with_players):
    game = game_with_players
    players = game["players"]
    game = submit(client, game, 1, [(1, 1, 0), (0, 0, 0)])

    resp = client.put(f"/api/games/{game['id']}/rounds/1", json={
        "player_stats": [
            {"player_id": players[0]["id"], "bid": 1, "tricks": 1, "bonus": 0},
            {"player_id": players[1]["id"], "bid": 1, "tricks": 1, "bonus": 0},
        ],
        "kraken_played": False,
    })
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# DELETE /api/games/{id}/rounds/{num}  — undo round
# ---------------------------------------------------------------------------

def test_undo_round_removes_stats_and_next_round(client, game_with_players):
    game = game_with_players
    game = submit(client, game, 1, [(1, 1, 0), (0, 0, 0)])

    resp = client.delete(f"/api/games/{game['id']}/rounds/1")
    assert resp.status_code == 200

    updated = client.get(f"/api/games/{game['id']}").json()
    round1 = next((r for r in updated["rounds"] if r["round_number"] == 1), None)
    assert round1 is not None
    assert round1["player_stats"] == []

    round_numbers = [r["round_number"] for r in updated["rounds"]]
    assert 2 not in round_numbers


def test_undo_final_round_reactivates_game(client, game_with_players):
    game = game_with_players
    game = play_all_rounds(client, game)
    assert game["status"] == "COMPLETED"

    resp = client.delete(f"/api/games/{game['id']}/rounds/10")
    assert resp.status_code == 200

    updated = client.get(f"/api/games/{game['id']}").json()
    assert updated["status"] == "ACTIVE"


# ---------------------------------------------------------------------------
# GET /api/history
# ---------------------------------------------------------------------------

def test_get_history(client):
    client.post("/api/games", json={"players": [{"name": "A"}], "config": {}})
    client.post("/api/games", json={"players": [{"name": "B"}], "config": {}})
    resp = client.get("/api/history")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


# ---------------------------------------------------------------------------
# DELETE /api/games/{id}
# ---------------------------------------------------------------------------

def test_delete_game(client, game_with_players):
    game_id = game_with_players["id"]
    resp = client.delete(f"/api/games/{game_id}")
    assert resp.status_code == 200

    resp = client.get(f"/api/games/{game_id}")
    assert resp.status_code == 404


def test_delete_game_not_found(client):
    resp = client.delete("/api/games/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404
