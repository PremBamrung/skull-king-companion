This is a comprehensive specification for **"Skull King: Captain’s Log"**, a dedicated open-source companion app.

The goal is to move beyond a simple spreadsheet and create an immersive, pirate-themed "Game Master" that handles the complex math of the Skull King (and Rascal) scoring systems, validates round logic, and persists history.

---

# 1. Technical Stack & Architecture

### **Infrastructure (Docker Compose)**

The application will run as two isolated containers orchestrated via `docker-compose.yml`.

1. **`backend`**: Python 3.11 + FastAPI. Running on `uvicorn`. Includes a persistent SQLite database.
2. **`frontend`**: React (Vite). Served via a development server or a lightweight Nginx container for production-like simulation.

### **Frontend Technologies**

* **Framework:** React 18 with TypeScript.
* **State Management:** TanStack Query (React Query) for server state; Zustand for local game session state.
* **Styling:** Tailwind CSS.
* **UI Library:** ShadCN UI (for accessible, clean components) heavily customized with a "Pirate/Nautical" theme (custom font loading, paper textures).
* **PWA:** Vite PWA plugin (allows "Add to Home Screen" on tablets/mobile).

### **Backend Technologies**

* **Framework:** FastAPI.
* **ORM:** SQLModel (combines Pydantic & SQLAlchemy).
* **Validation:** Pydantic V2.
* **Migrations:** Alembic.

---

# 2. Database Schema (SQLite)

We need a relational structure that supports game history and detailed round analytics. SQLite is used for its simplicity and portability, with the database file stored in a shared volume.

### **Table: `games**`

* `id` (UUID, PK)
* `status` (Enum: `SETUP`, `ACTIVE`, `COMPLETED`)
* `created_at` (Timestamp)
* `rules_config` (JSONB): Stores rule variants enabled for this specific game.
* *Example:* `{"system": "SKULL_KING", "expansion_loot": true, "ghost_player": false}`



### **Table: `players**`

* `id` (UUID, PK)
* `game_id` (FK -> games.id)
* `name` (String)
* `is_ghost` (Boolean): For the "Greybeard" 2-player variant.
* `seat_index` (Int): To maintain turn order visualization.

### **Table: `rounds**`

* `id` (UUID, PK)
* `game_id` (FK -> games.id)
* `round_number` (Int): 1 through 10.
* `card_count` (Int): Usually matches `round_number`, but can differ in "Whirlpool" mode.

### **Table: `round_player_stats**`

* `id` (UUID, PK)
* `round_id` (FK -> rounds.id)
* `player_id` (FK -> players.id)
* `bid` (Int): The player's "Yo-Ho-Ho" prediction.
* `tricks_won` (Int): Actual outcome.
* `bonus_points` (Int): Manual entry for capturing pirates/loot bonuses (e.g., +10, +20).
* `round_score` (Int): Calculated by the backend.
* `total_score_snapshot` (Int): Cumulative score up to this round (for graphing).

---

# 3. Application Flow & UI Specifications

The UI should be "Mobile First" but scale to "Tablet Landscape" for a central table view.

### **Phase 1: The Tavern (Lobby)**

* **Hero Section:** App Title with animated Skull King logo.
* **Action:** "New Voyage" (Big CTA).
* **History:** "Captain's Log" - A scrollable list of previous game summaries (Date, Winner, Score).

### **Phase 2: Voyage Setup**

* **Player Entry:** Dynamic list to add 2-8 names. Drag-and-drop handle to reorder seating positions (crucial for dealer tracking).
* **Rule Configuration (Accordion Menu):**
* *Scoring Style:* Toggle between "Classic Skull King" and "Rascal Variant".
* *Expansions:* Toggle "Loot Cards", "Kraken/White Whale".
* *Duration:* Standard (10 rounds), Blitz (5 rounds), or Broadside.



### **Phase 3: The Game Loop (Repeats Rounds 1-10)**

The screen is divided into **three tabs/views** during active play:

#### **View A: Bidding (The "Yo-Ho-Ho")**

* **Visual:** A grid of player names.
* **Input:** Next to each name, a stepper `[-] 0 [+]` or a numeric keypad popover.
* **UX:** Large, tap-friendly numbers.
* **Zero Bid:** If a player selects "0", visually highlight it (e.g., turn the border gold or red) to emphasize the risk.

#### **View B: The Skirmish (Result Input)**

* This screen appears after the round is played physically.
* **Input Columns:**
1. **Tricks Won:** Numeric input.
2. **Bonus Points:** A distinct button that opens a "Bonus Calculator" modal.
* *Modal:* Toggles for "Captured 14 (+10)", "Black 14 (+20)", "Pirate on Mermaid (+20)", "King on Pirate (+30)", "Mermaid on King (+40)".




* **Validation Logic (Frontend):**
* The "Commit Round" button is disabled unless the sum of `Tricks Won` equals the `Card Count`.
* *Exception:* If "Kraken" rule is active, allow `Sum(Tricks) < Card Count` (user must toggle a "Kraken was played" checkbox to bypass validation).



#### **View C: The Scoreboard (Leaderboard)**

* **Display:** Sorted list of players by Total Score.
* **Visuals:**
* Show the delta from the last round (e.g., `+50` or `-20` in red).
* "Dealer" indicator icon moves to the next player.



### **Phase 4: Victory**

* **Confetti:** Pirate-themed particles (coins/skulls).
* **Stats:**
* "The Prophet" (Most accurate bids).
* "The Wreckage" (Most negative points).


* **Graph:** Line chart showing score trajectory over 10 rounds.

---

# 4. Backend Logic & API Specs (FastAPI)

The backend is the "Source of Truth" for scoring math.

### **Core Scoring Algorithm (Python)**

This logic should be encapsulated in a `ScoringService`.

```python
def calculate_score(bid: int, tricks: int, bonus: int, round_cards: int, rules: dict) -> int:
    score = 0
    
    # 1. Handle ZERO Bid
    if bid == 0:
        multiplier = 10  # Standard
        if tricks == 0:
            score = round_cards * multiplier
        else:
            score = (round_cards * multiplier) * -1
        # Note: Bonuses are usually NOT added if you fail a zero bid, 
        # but allowed if you succeed (check specific house rules).
        # We will assume Bonuses apply if bid is successful.
        if tricks == 0:
            score += bonus
        return score

    # 2. Handle NON-ZERO Bid
    if bid == tricks:
        # Success
        score = (tricks * 20) + bonus
    else:
        # Failure
        diff = abs(bid - tricks)
        score = (diff * -10)
        # Note: In standard rules, you get 0 points for tricks won if you fail,
        # and you do NOT get bonus points if the bid fails.
    
    return score

```

### **API Endpoints**

**1. Create Game**
`POST /api/games`

* Payload: `{ "players": ["Alice", "Bob"], "config": {...} }`
* Response: `{ "game_id": "uuid", "current_round": 1 }`

**2. Submit Round Data**
`POST /api/games/{game_id}/rounds/{round_num}`

* Payload:
```json
{
  "player_stats": [
    { "player_id": "uuid", "bid": 1, "tricks": 1, "bonus": 20 },
    { "player_id": "uuid", "bid": 0, "tricks": 1, "bonus": 0 }
  ],
  "kraken_played": false
}

```


* **Logic:**
* Validate `sum(tricks)` logic.
* Calculate scores using `ScoringService`.
* Save to DB.
* If round < 10, initialize next round. If 10, set game status `COMPLETED`.


* Response: Returns updated Leaderboard.

**3. Get Game State**
`GET /api/games/{game_id}`

* Returns full history: previous rounds, current round status, and rule config. Essential for page refreshes.

**4. Undo Round (Safety Feature)**
`DELETE /api/games/{game_id}/rounds/{round_num}`

* Allows the users to go back if they made a mistake entering scores.

---

# 5. Advanced Implementation Details

### **Validation Strategy (The "Kraken" Edge Case)**

The most common annoyance in scorekeeping apps is strict validation blocking input when players disagree or an odd rule occurs.

* **Soft Validation:** If the total tricks do not match the round card count, show a Warning Toast: *"Total tricks (5) does not match round cards (6). Is this correct (Kraken)?"*
* Allow the user to "Force Submit" if necessary.

### **The "Ghost of Greybeard" (2-Player Logic)**

If `is_ghost` is true for a player:

* The frontend automatically skips the "Bidding" input for this player (Greybeard doesn't bid).
* In the "Results" phase, the user enters Greybeard's tricks won.
* The Backend calculates Greybeard's score as 0 (or hidden) but uses his trick count to validate that `Player 1 + Player 2 + Greybeard = Total Cards`.

### **Rascal Variant Logic**

If `config.system == "RASCAL"`:

* Change the math in `ScoringService`.
* **Bidding UI changes:** Add a toggle for "Buckshot" vs "Cannonball" alongside the bid input.

---

# 6. Development Roadmap

1. **Phase 1 (The Skeleton):**
* Set up Docker Compose.
* Create DB Schema.
* Implement "Standard" scoring endpoint (No Rascal, No expansions).
* Basic Frontend with simple inputs.


2. **Phase 2 (The Polish):**
* Add "Bonus Points" calculator modal.
* Implement "Undo" functionality (deleting last row in DB).
* Add LocalStorage persistence in Frontend (so a browser refresh doesn't lose unsaved round data).


3. **Phase 3 (The Pirate Lord):**
* Add Charts/Graphs.
* Add "Rascal" variant support.
* Export game history to CSV/PDF.



### **Next Step for You**

Would you like me to generate the **`docker-compose.yml`** and the **SQLModel (Python) classes** to get the repository structure started immediately?
