FROM python:3.13-slim

# uv installed via the official static binary, not pip, to keep the image lean
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency files first so this layer caches independently of source changes
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Now copy the actual app code
COPY . .
RUN uv sync --frozen --no-dev

# Run through uv so it uses the project's .venv without activating it manually
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]