"""
Rebuilds data/pokemon_data.csv from PokeAPI, capturing ALL types per Pokémon
and the correct display name from the species endpoint (rather than deriving
it from the slug, which mangles names like "Mr. Mime" or "Ho-Oh").

Run with: uv run python scripts/fetch_pokemon_csv.py
"""

import asyncio
from pathlib import Path

import httpx
import pandas as pd

OUT_PATH = Path(__file__).parent.parent / "data" / "pokemon_data.csv"
LIST_URL = "https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0"
CONCURRENCY = 10


async def fetch_species_name(
    client: httpx.AsyncClient, species_url: str, fallback: str
) -> str:
    try:
        resp = await client.get(species_url)
        resp.raise_for_status()
    except httpx.HTTPError as e:
        print(f"  ! failed species fetch for {fallback}: {e}")
        return fallback.capitalize()

    names = resp.json()["names"]
    for entry in names:
        if entry["language"]["name"] == "en":
            return entry["name"]
    return (
        fallback.capitalize()
    )  # no English name found — shouldn't happen, but don't crash the run over it


async def fetch_one(
    client: httpx.AsyncClient, slug: str, sem: asyncio.Semaphore
) -> dict | None:
    async with sem:
        try:
            resp = await client.get(f"https://pokeapi.co/api/v2/pokemon/{slug}")
            resp.raise_for_status()
        except httpx.HTTPError as e:
            print(f"  ! failed {slug}: {e}")
            return None
        data = resp.json()

        display_name = await fetch_species_name(client, data["species"]["url"], slug)

    types = [t["type"]["name"] for t in sorted(data["types"], key=lambda t: t["slot"])]
    return {
        "name": display_name,
        "slug": slug,
        "types": ",".join(types),
        "sprite_url": data["sprites"]["front_default"],
    }


async def main() -> None:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(LIST_URL)
        resp.raise_for_status()
        names = sorted(p["name"] for p in resp.json()["results"])
        print(f"Fetching {len(names)} Pokémon...")

        sem = asyncio.Semaphore(CONCURRENCY)
        results = await asyncio.gather(*(fetch_one(client, n, sem) for n in names))

    rows = [r for r in results if r and r["sprite_url"]]
    print(f"Got {len(rows)}/{len(names)} with valid sprites.")

    OUT_PATH.parent.mkdir(exist_ok=True)
    pd.DataFrame(rows).to_csv(OUT_PATH, index=False)
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
