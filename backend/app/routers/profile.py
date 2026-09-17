from app.core.db import get_db
from app.deps import get_current_user
from app.models import Pokemon, User, UserPokemon
from app.schemas.game import PokedexOut
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/users/me", tags=["profile"])


@router.get("/pokedex", response_model=PokedexOut)
async def pokedex(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    captured = (
        await db.scalars(
            select(Pokemon)
            .join(UserPokemon, UserPokemon.pokemon_id == Pokemon.id)
            .where(UserPokemon.user_id == current_user.id)
        )
    ).all()
    types = sorted({t for p in captured for t in p.types})
    return PokedexOut(pokemon=captured, count=len(captured), types=types)
