# Poké-Hangman

A hangman game where you guess Pokémon names, with accounts, a saved Pokédex, and email verification. FastAPI backend, React (Vite) frontend.

## Project structure

```
docker-compose.yml
docker-compose.prod.yml   # prod-only overlay (TLS, ports 80/443)
deploy/
└── ssl.conf              # prod-only nginx TLS config, mirrors frontend/nginx.conf
poke_hangman/
├── backend/     # FastAPI, uv, PostgreSQL (via SQLAlchemy/Alembic)
└── frontend/    # React + Vite
```


## Local dev (without Docker)

Two vars at `.env` file matter here:
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

## Production deployment

Domain: `poke-hangman.com`, proxied through Cloudflare. TLS is terminated at nginx on the VPS using a Cloudflare Origin Certificate. Cloudflare's SSL/TLS mode is **Full (strict)**.

### Deploy / update
SSH into the VPS, then from the repo directory:
```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### TLS certificate
- The Origin Certificate + private key live outside the repo at `/opt/poke-hangman/certs/` (`cert.pem`, `key.pem`) on the VPS — never committed to git.
- `key.pem` permissions `600`, `cert.pem` permissions `644`, directory `700`.
- `docker-compose.prod.yml` bind-mounts that directory read-only into the `web` container, plus `deploy/ssl.conf` into `/etc/nginx/conf.d/`.
- If routing changes in `frontend/nginx.conf`, the same changes must be made manually in `deploy/ssl.conf` (no shared include, by design).


## TODO

- [ ] Testing (backend and frontend)
- [x] DevOps (deployment, CI) — HTTPS deployment done; CI still outstanding
- [ ] Email sender (verify `app/core/email.py` is wired to a real provider — currently needed for register/forgot-password to actually deliver emails)