from typing import Literal

from pydantic import BaseModel, Field


class NewGameOut(BaseModel):
    game_token: str
    masked_name: str
    attempts_remaining: int
    max_attempts: int
    sprite_url: str


class GuessIn(BaseModel):
    game_token: str
    letter: str = Field(min_length=1, max_length=1)


class HintIn(BaseModel):
    game_token: str
    reveal: bool = False


class GuessOut(BaseModel):
    game_token: str | None = None  # null once the game is over
    masked_name: str
    guessed_letters: list[str]
    attempts_remaining: int
    status: Literal["playing", "won", "lost"]
    pokemon_name: str | None = None
    sprite_url: str | None = None
    end_url: str | None = None


class PokemonOut(BaseModel):
    id: int
    name: str
    sprite_url: str
    types: list[str]
    model_config = {"from_attributes": True}


class PokedexOut(BaseModel):
    pokemon: list[PokemonOut]
    count: int
    types: list[str]
