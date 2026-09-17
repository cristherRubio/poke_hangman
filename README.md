# Poké-Hangman

A hangman game where you guess Pokémon names, with accounts, a saved Pokédex, and email verification. FastAPI backend, React (Vite) frontend.

## Project structure

```
docker-compose.yml
poke_hangman/
├── backend/     # FastAPI, uv, PostgreSQL (via SQLAlchemy/Alembic)
└── frontend/    # React + Vite
```


## Local dev (without Docker)

Two `.env` files matter here:
- root `.env` — `DATABASE_URL` should point at `localhost:5432` (Postgres reachable via the port Docker publishes to your host)
- Postgres itself still needs to be running — easiest is `docker compose up postgres`

**Backend:**
```bash
cd backend
uv sync
uv run alembic upgrade head
uv run python scripts/seed_pokemon.py   # only needed once, or if the DB is empty
uv run uvicorn main:app --reload
```
Runs on `http://localhost:8000`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`. Requests to `/api/*` are proxied to `:8000` in dev (see `vite.config.js`), so no `frontend/.env` is needed locally.

Visit `http://localhost:5173`.

## Docker (full stack)

```bash
docker compose up --build
```

This starts three services:
- `postgres` — Postgres 16
- `api` — FastAPI. On start, `entrypoint.sh` runs migrations, seeds the Pokémon table if empty, then starts uvicorn
- `web` — the Vite build served by nginx, which also reverse-proxies `/api/*` to `api:8000` (avoids CORS, keeps the frontend build environment-agnostic)

Visit `http://localhost:5173`.

**Important:** inside containers, services reach each other by service name (`postgres`, `api`), not `localhost`. The root `.env`'s `DATABASE_URL` is set for the host-based flow above; the `api` service overrides it in `docker-compose.yml` to point at `postgres` instead.

`api` bind-mounts an anonymous volume on `/app/.venv` so the container's dependencies never leak onto (or get overwritten by) the host filesystem.

## TODO

- [ ] Testing (backend and frontend)
- [ ] DevOps (deployment, CI)
- [ ] Email sender (verify `app/core/email.py` is wired to a real provider — currently needed for register/forgot-password to actually deliver emails)