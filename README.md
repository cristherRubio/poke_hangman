# Poké-Hangman

A hangman game where you guess Pokémon names, with accounts, a saved Pokédex, and email verification. FastAPI backend, React (Vite) frontend.

## Project structure

```
poke_hangman/
├── backend/     # FastAPI, uv, PostgreSQL (via SQLAlchemy/Alembic)
└── frontend/    # React + Vite
```

## Backend

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload
```

Runs on `http://localhost:8000`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. In dev, requests to `/api/*` are proxied to the backend on `:8000` (see `vite.config.js`), so no `.env` is needed locally. For a deployed build, set `VITE_API_BASE_URL` to the backend's URL (see `.env.example`).

## Running both together

Two terminals: one in `backend/` running uvicorn, one in `frontend/` running Vite. Visit `http://localhost:5173`.

## TODO

- [ ] Testing (backend and frontend)
- [ ] DevOps (deployment, CI)
- [ ] Email sender (verify `app/core/email.py` is wired to a real provider - currently needed for register/forgot-password to actually deliver emails)