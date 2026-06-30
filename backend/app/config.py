"""
Central configuration for Community Hero backend.

Design note on the local/cloud switch:
- USE_FIREBASE=false (default) -> uses local SQLite via SQLModel. The app is
  fully functional with zero external credentials, which is what lets this
  run end-to-end in development or a sandbox right now.
- USE_FIREBASE=true -> the same service-layer functions (see services/
  firestore_service.py) instead talk to a real Firestore project, once you've
  filled in FIREBASE_SERVICE_ACCOUNT_JSON below.

- GEMINI_API_KEY unset/empty -> gemini_service.py falls back to a transparent,
  clearly-labeled rule-based image classifier so AI analysis still works.
- GEMINI_API_KEY set -> real calls to the Gemini API are used instead.

Nothing in the request/response shape changes when you flip either switch —
routers and the rest of the app never know which backend is in use.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # --- Data layer ---
    USE_FIREBASE: bool = False
    SQLITE_PATH: str = "community_hero.db"
    FIREBASE_SERVICE_ACCOUNT_JSON: Optional[str] = None

    # --- AI ---
    GEMINI_API_KEY: Optional[str] = None
    AI_PROCESSING_TIMEOUT_SECONDS: int = 30

    # --- Maps / dispatch ---
    GOOGLE_MAPS_API_KEY: Optional[str] = None

    # --- Auth ---
    JWT_SECRET: str = "dev-only-secret-change-me-before-prod-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    # --- Uploads ---
    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = "uploads"

    # --- CORS ---
    FRONTEND_ORIGIN: str = "http://localhost:3000"


settings = Settings()
