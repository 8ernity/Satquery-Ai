"""Application configuration — reads from environment and .env file."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """BHUVISION application settings."""

    # --- Application ---
    app_name: str = "BHUVISION"
    app_version: str = "0.1.0"
    debug: bool = False
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:3000"

    # --- AI Gateway ---
    openai_base_url: str = "http://localhost:3001/v1"
    openai_api_key: str = "sk-freellmapi-unified"

    # --- Model Configuration ---
    vlm_model_name: str = "llava-hf/llava-1.5-7b-hf"
    vlm_backend: Literal["gateway", "vllm", "demo"] = "demo"
    vllm_api_url: str = "http://localhost:8080/v1"

    # --- Demo Mode ---
    demo_mode: bool = False

    # --- Storage ---
    upload_dir: str = "./data/uploads"
    max_upload_size_mb: int = 100

    # --- Database (optional) ---
    database_url: str | None = None

    @property
    def upload_path(self) -> Path:
        p = Path(self.upload_dir)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


# Singleton
settings = Settings()
