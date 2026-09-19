import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from app.core.config import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


def hash_token(raw: str) -> str:
    # opaque, high-entropy tokens — sha256 is appropriate here, unlike for passwords
    return hashlib.sha256(raw.encode()).hexdigest()


def new_refresh_token() -> tuple[str, str, datetime]:
    """Returns (raw_token_for_cookie, hash_for_db, expires_at)."""
    raw = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    return raw, hash_token(raw), expires_at


def new_action_token() -> tuple[str, str]:
    """For email-verify / password-reset links. Returns (raw_for_email_link, hash_for_db)."""
    raw = secrets.token_urlsafe(32)
    return raw, hash_token(raw)


def create_game_token(
    pokemon_id: int, guessed_letters: list[str], max_attempts: int, penalty: int = 0
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "type": "game",
        "pokemon_id": pokemon_id,
        "guessed_letters": guessed_letters,
        "max_attempts": max_attempts,
        "penalty": penalty,
        "iat": now,
        "exp": now + timedelta(minutes=30),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_game_token(token: str) -> dict:
    payload = jwt.decode(
        token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
    )
    if payload.get("type") != "game":
        raise jwt.InvalidTokenError("Not a game token")
    return payload
