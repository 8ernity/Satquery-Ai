"""Health check endpoint for BHUVISION system status."""

from __future__ import annotations

from fastapi import APIRouter

from ..core.config import settings
from ..schemas.investigation import HealthResponse

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """Retrieve system health status, model serving status, and agent readiness."""
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        model_serving=settings.vlm_backend,
        demo_mode=settings.demo_mode,
        agents_available=9,
    )
