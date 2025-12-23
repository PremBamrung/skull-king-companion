# Skull King Companion

A full-stack web application designed to track scores, manage rounds, and view history for the "Skull King" card game. This companion app simplifies the scoring process, handles special card rules (like the Kraken), and provides a clean interface for a seamless gaming experience.

## 🚀 Features

-   **Game Management**: Create new games and track up to 10 rounds of play.
-   **Smart Scoring**: Automatically calculates scores based on bids, tricks won, and bonus points.
-   **Special Rules Support**: Includes support for the Kraken (no tricks awarded) and customizable game configurations.
-   **Game History**: View a history of past games and their final scores.
-   **Responsive UI**: A modern, dark-themed interface built with Tailwind CSS, optimized for both desktop and mobile use.
-   **Localization**: Support for multiple languages (English and others).

## 🛠 Tech Stack

### Frontend
-   **Framework**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **Data Fetching**: [React Query (TanStack Query)](https://tanstack.com/query/latest)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Lucide React](https://lucide.dev/) icons
-   **Charts**: [Recharts](https://recharts.org/) for visualizing score progression

### Backend
-   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
-   **Database**: [SQLite](https://www.sqlite.org/) with [SQLModel](https://sqlmodel.tiangolo.com/) (ORM)
-   **API Design**: RESTful endpoints with automatic OpenAPI documentation.

### DevOps
-   **Containerization**: [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

## 📁 Project Structure

```text
.
├── backend/            # FastAPI source code, models, and scoring logic
├── frontend/           # React source code, components, and assets
├── rule_processing/    # Scripts and data for game rules and design
├── data/               # Persistent SQLite database storage
└── docker-compose.yml  # Multi-container orchestration
```

## 🚦 Getting Started

### Prerequisites

-   [Docker](https://docs.docker.com/get-docker/)
-   [Docker Compose](https://docs.docker.com/compose/install/)

### Running with Docker (Recommended)

The easiest way to get the app running is using Docker Compose:

1.  Start the services:
    ```bash
    docker-compose up --build
    ```

2.  Access the application:
    -   **Frontend**: [http://localhost:5173](http://localhost:5173)
    -   **Backend API**: [http://localhost:8000](http://localhost:8000)
    -   **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Local Development

If you prefer to run the services manually:

#### Backend
1.  Navigate to `backend/`.
2.  Install dependencies: `pip install -r requirements.txt`.
3.  Run the server: `uvicorn main:app --reload`.

#### Frontend
1.  Navigate to `frontend/`.
2.  Install dependencies: `npm install`.
3.  Start the dev server: `npm run dev`.

## 📜 Rule Processing

The `rule_processing/` directory contains various scripts and markdown files used for extracting and compiling game rules from images and text. This is primarily for development and maintenance of the scoring logic.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
