"""Backend configuration.

All runtime configuration comes from environment variables (or a local .env
file for development). Secrets such as DATABASE_URL live only here, never in the
frontend bundle or in Git.
"""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

StorageMode = Literal["seed", "postgres", "fixture"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Which catalog source backs the API. "seed" loads committed JSON from
    # backend/data. "postgres" is the optional managed-database path.
    catalog_storage: StorageMode = "seed"

    # Version label surfaced in catalog metadata so the frontend/integration
    # can tell which dataset is live.
    catalog_version: str = "seed-dev-1"

    # Exact allowed browser origins. Parsed as a JSON array from the
    # CORS_ORIGINS env var, e.g. CORS_ORIGINS='["https://app.vercel.app"]'.
    cors_origins: List[str] = ["http://localhost:5173"]

    # Only used when catalog_storage == "postgres". Never logged.
    database_url: Optional[str] = None

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value):
        # pydantic-settings already JSON-decodes list env vars; this guards the
        # case where a plain comma-separated string is supplied instead.
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            if not stripped.startswith("["):
                return [item.strip() for item in stripped.split(",") if item.strip()]
        return value


_settings: Optional[Settings] = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
