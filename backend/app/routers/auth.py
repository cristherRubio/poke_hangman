from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.db import get_db
from app.core.email import send_email
from app.core.security import (
    create_access_token,
    hash_password,
    hash_token,
    new_action_token,
    new_refresh_token,
    verify_password,
)
from app.deps import get_current_user, limiter
from app.models import ActionToken, ActionTokenType, RefreshSession, User
from app.schemas.auth import (
    ForgotPassword,
    ResetPassword,
    TokenResponse,
    UserLogin,
    UserOut,
    UserRegister,
    VerifyEmail,
)
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_NAME = "refresh_token"


def _set_refresh_cookie(
    response: Response, raw_token: str, expires_at: datetime
) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        secure=True,  # requires HTTPS — fine in prod, use a dev-only override locally if needed
        samesite="strict",  # tightest option: browser withholds the cookie on any cross-site navigation/request
        expires=expires_at,
        path="/auth",  # scope the cookie narrowly — only sent to auth endpoints, not every request
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def register(
    request: Request, data: UserRegister, db: AsyncSession = Depends(get_db)
):
    existing = await db.scalar(
        select(User).where(
            (User.username == data.username) | (User.email == data.email)
        )
    )
    if existing:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Username or email already registered"
        )

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    await (
        db.flush()
    )  # get user.id before commit, so we can attach the verification token

    raw, token_hash = new_action_token()
    db.add(
        ActionToken(
            user_id=user.id,
            token_hash=token_hash,
            type=ActionTokenType.EMAIL_VERIFY,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
    )
    await db.commit()
    await db.refresh(user)

    verify_link = f"{settings.FRONTEND_URL}/verify-email?token={raw}"
    await send_email(
        user.email,
        "Verify your Pokémon Hangman account",
        f"Click to verify: {verify_link}\nExpires in 24 hours.",
    )

    return user


@router.post("/verify-email", status_code=status.HTTP_204_NO_CONTENT)
async def verify_email(data: VerifyEmail, db: AsyncSession = Depends(get_db)):
    token_hash = hash_token(data.token)
    action = await db.scalar(
        select(ActionToken).where(
            ActionToken.token_hash == token_hash,
            ActionToken.type == ActionTokenType.EMAIL_VERIFY,
            ActionToken.used_at.is_(None),
        )
    )
    if not action or action.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired token")

    user = await db.get(User, action.user_id)
    user.is_verified = True
    action.used_at = datetime.now(timezone.utc)
    await db.commit()


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    response: Response,
    data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    user = await db.scalar(select(User).where(User.username == data.username))

    # Constant-shape response whether the user exists or not, to avoid username enumeration
    if user is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid username or password"
        )

    now = datetime.now(timezone.utc)
    if user.locked_until and user.locked_until > now:
        raise HTTPException(
            status.HTTP_423_LOCKED,
            f"Account locked until {user.locked_until.isoformat()}",
        )

    if not verify_password(data.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=settings.LOCKOUT_MINUTES)
            user.failed_login_attempts = 0
        await db.commit()
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid username or password"
        )

    if not user.is_verified:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Please verify your email before logging in"
        )

    # Successful login: reset lockout counters, issue new tokens
    user.failed_login_attempts = 0
    user.locked_until = None

    raw_refresh, refresh_hash, expires_at = new_refresh_token()

    # Single-session: overwrite any existing row for this user rather than adding a new one
    existing_session = await db.scalar(
        select(RefreshSession).where(RefreshSession.user_id == user.id)
    )
    if existing_session:
        existing_session.token_hash = refresh_hash
        existing_session.expires_at = expires_at
    else:
        db.add(
            RefreshSession(
                user_id=user.id, token_hash=refresh_hash, expires_at=expires_at
            )
        )

    await db.commit()

    _set_refresh_cookie(response, raw_refresh, expires_at)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request, response: Response, db: AsyncSession = Depends(get_db)
):
    raw = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No refresh token")

    token_hash = hash_token(raw)
    session_row = await db.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == token_hash)
    )

    if not session_row or session_row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token"
        )

    # Rotate: issue a fresh refresh token on every use, invalidating the old one immediately.
    # This limits how long a stolen refresh token stays useful, and a reuse of an old token
    # (rotated-out) is a strong signal of theft if you want to add detection later.
    raw_new, hash_new, expires_at = new_refresh_token()
    session_row.token_hash = hash_new
    session_row.expires_at = expires_at
    await db.commit()

    _set_refresh_cookie(response, raw_new, expires_at)
    return TokenResponse(access_token=create_access_token(str(session_row.user_id)))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request, response: Response, db: AsyncSession = Depends(get_db)
):
    raw = request.cookies.get(REFRESH_COOKIE_NAME)
    if raw:
        token_hash = hash_token(raw)
        session_row = await db.scalar(
            select(RefreshSession).where(RefreshSession.token_hash == token_hash)
        )
        if session_row:
            await db.delete(session_row)
            await db.commit()
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/auth")


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("3/hour")
async def forgot_password(
    request: Request, data: ForgotPassword, db: AsyncSession = Depends(get_db)
):
    user = await db.scalar(select(User).where(User.email == data.email))
    if user:  # deliberately no error on unknown email — don't leak which emails are registered
        raw, token_hash = new_action_token()
        db.add(
            ActionToken(
                user_id=user.id,
                token_hash=token_hash,
                type=ActionTokenType.PASSWORD_RESET,
                expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            )
        )
        await db.commit()
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw}"
        await send_email(
            user.email,
            "Reset your password",
            f"Click to reset: {reset_link}\nExpires in 1 hour.",
        )


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(data: ResetPassword, db: AsyncSession = Depends(get_db)):
    token_hash = hash_token(data.token)
    action = await db.scalar(
        select(ActionToken).where(
            ActionToken.token_hash == token_hash,
            ActionToken.type == ActionTokenType.PASSWORD_RESET,
            ActionToken.used_at.is_(None),
        )
    )
    if not action or action.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired token")

    user = await db.get(User, action.user_id)
    user.hashed_password = hash_password(data.new_password)
    action.used_at = datetime.now(timezone.utc)

    # Resetting the password kills any existing session — if an attacker had it hijacked, this cuts them off
    existing_session = await db.scalar(
        select(RefreshSession).where(RefreshSession.user_id == user.id)
    )
    if existing_session:
        await db.delete(existing_session)

    await db.commit()


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
