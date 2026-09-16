#!/bin/sh
set -e

echo "Running migrations..."
uv run alembic upgrade head

echo "Checking Pokémon DB..."
uv run python scripts/seed_pokemon.py

echo "Starting API..."
exec uv run uvicorn main:app --host 0.0.0.0 --port 8000