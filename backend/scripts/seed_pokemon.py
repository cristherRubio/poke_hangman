"""
One-off / idempotent seed script — loads from data/pokemon_data.csv.
Run with: uv run python scripts/seed_pokemon.py
"""

import asyncio
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import select

sys.path.append(str(Path(__file__).parent.parent))

from app.core.db import async_session
from app.models import Pokemon

CSV_PATH = Path(__file__).parent.parent / "data/pokemon_data.csv"


async def seed() -> None:
    df = pd.read_csv(CSV_PATH)
    df = df[~df.sprite_url.isna()].copy()
    print(f"Loaded {len(df)} rows from CSV.")

    async with async_session() as db:
        existing_slugs = set((await db.scalars(select(Pokemon.slug))).all())

        added = 0
        for row in df.itertuples(index=False):
            if row.slug in existing_slugs:
                continue
            db.add(
                Pokemon(
                    name=row.name,
                    slug=row.slug,
                    sprite_url=row.sprite_url,
                    types=row.types.split(","),
                )
            )
            added += 1

        await db.commit()
        print(f"Inserted {added} new Pokémon ({len(df) - added} already existed).")


if __name__ == "__main__":
    asyncio.run(seed())
