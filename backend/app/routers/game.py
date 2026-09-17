import random

import jwt
from app.core.db import get_db
from app.core.security import create_game_token, decode_game_token
from app.deps import get_current_user_optional
from app.models import Pokemon, User, UserPokemon
from app.schemas.game import GuessIn, GuessOut, NewGameOut
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/game", tags=["game"])


def _mask(name: str, guessed: set[str]) -> str:
    return "".join(
        ch if (not ch.isalpha() or ch.upper() in guessed) else "_" for ch in name
    )


def _max_attempts(name: str, authenticated: bool) -> int:
    base = len(name) // 2
    return (
        base + 1 if authenticated else base
    )  # logged-in players get a bonus attempt, matches the old logic


@router.get("/new", response_model=NewGameOut)
async def new_game(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    if current_user:
        captured_ids = (
            await db.scalars(
                select(UserPokemon.pokemon_id).where(
                    UserPokemon.user_id == current_user.id
                )
            )
        ).all()
        stmt = (
            select(Pokemon).where(Pokemon.id.notin_(captured_ids))
            if captured_ids
            else select(Pokemon)
        )
    else:
        stmt = select(Pokemon)

    candidates = (await db.scalars(stmt)).all()
    if not candidates:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "No Pokémon left to guess — you've caught them all!",
        )

    pokemon = random.choice(candidates)
    max_attempts = _max_attempts(pokemon.name, current_user is not None)
    token = create_game_token(pokemon.id, [], max_attempts)

    return NewGameOut(
        game_token=token,
        masked_name=_mask(pokemon.name, set()),
        attempts_remaining=max_attempts,
        max_attempts=max_attempts,
        sprite_url=pokemon.sprite_url,
    )


@router.post("/guess", response_model=GuessOut)
async def guess(
    data: GuessIn,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    try:
        payload = decode_game_token(data.game_token)
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired game")

    pokemon = await db.get(Pokemon, payload["pokemon_id"])
    if not pokemon:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown Pokémon")

    guessed = set(payload["guessed_letters"])
    guessed.add(data.letter.upper())

    max_attempts = payload["max_attempts"]
    wrong_guesses = sum(1 for g in guessed if g not in pokemon.name.upper())
    attempts_remaining = max(max_attempts - wrong_guesses, 0)

    masked = _mask(pokemon.name, guessed)
    won = masked == pokemon.name
    lost = not won and attempts_remaining <= 0
    game_over = won or lost

    if won and current_user:
        already_captured = await db.scalar(
            select(UserPokemon).where(
                UserPokemon.user_id == current_user.id,
                UserPokemon.pokemon_id == pokemon.id,
            )
        )
        if not already_captured:
            db.add(UserPokemon(user_id=current_user.id, pokemon_id=pokemon.id))
            await db.commit()

    return GuessOut(
        game_token=None
        if game_over
        else create_game_token(pokemon.id, sorted(guessed), max_attempts),
        masked_name=masked if not game_over else pokemon.name.upper(),
        guessed_letters=sorted(guessed),
        attempts_remaining=attempts_remaining,
        status="won" if won else "lost" if lost else "playing",
        pokemon_name=pokemon.name if game_over else None,
        sprite_url=pokemon.sprite_url if game_over else None,
        end_url=pokemon.slug if game_over else None,
    )
