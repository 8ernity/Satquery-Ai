"""Investigation API — Handles agentic Earth intelligence queries."""

from __future__ import annotations

import uuid
from pathlib import Path

import numpy as np
from fastapi import APIRouter, HTTPException
from PIL import Image

from ..agents.orchestrator import InvestigationOrchestrator
from ..api.imagery import IMAGERY_REGISTRY
from ..core.config import settings
from ..geospatial.raster import extract_metadata
from ..models.base import VLMBackend
from ..models.demo_backend import DemoBackend
from ..models.gateway_backend import GatewayBackend
from ..schemas.imagery import ImageryInput, SensorType
from ..schemas.investigation import (
    InvestigationRequest,
    InvestigationResponse,
    InvestigationStatus,
)

router = APIRouter(prefix="/investigate", tags=["Investigation"])

# Persistent in-memory cache of investigations
INVESTIGATION_CACHE: dict[str, InvestigationResponse] = {}

# Active backend selection
def get_vlm_backend() -> VLMBackend:
    if settings.vlm_backend == "gateway":
        return GatewayBackend()
    return DemoBackend()


def _get_or_create_demo_image(name: str, sensor: SensorType) -> Path:
    """Generate or retrieve a verified demo image file on disk."""
    demo_dir = Path("./data/demo")
    demo_dir.mkdir(parents=True, exist_ok=True)
    file_path = demo_dir / f"{name}.png"
    if not file_path.exists():
        # Create a synthetic 512x512 satellite texture
        if sensor == SensorType.SAR:
            # Grainy radar speckle texture
            noise = np.random.gamma(shape=2.0, scale=30.0, size=(512, 512)).astype(np.uint8)
            # Add a dark specular water curve
            y, x = np.ogrid[:512, :512]
            river_mask = (y - 0.5 * x - 100 > -30) & (y - 0.5 * x - 100 < 30)
            noise[river_mask] = np.random.normal(loc=15, scale=5, size=np.sum(river_mask)).clip(0, 255).astype(np.uint8)
            img = Image.fromarray(noise)
        else:
            # Optical RGB composite with terrain and urban textures
            rgb = np.zeros((512, 512, 3), dtype=np.uint8)
            # Greenish agricultural background
            rgb[:, :, 1] = np.random.randint(90, 140, (512, 512), dtype=np.uint8)
            rgb[:, :, 0] = np.random.randint(60, 100, (512, 512), dtype=np.uint8)
            rgb[:, :, 2] = np.random.randint(30, 70, (512, 512), dtype=np.uint8)
            # Add urban geometric clusters
            if "after" in name:
                rgb[150:320, 200:400, 0] = 180  # Concrete bright returns
                rgb[150:320, 200:400, 1] = 180
                rgb[150:320, 200:400, 2] = 180
            img = Image.fromarray(rgb)
        img.save(file_path)
    return file_path


@router.post("", response_model=InvestigationResponse)
async def start_investigation(request: InvestigationRequest) -> InvestigationResponse:
    """Launch a 9-agent investigation on the specified question and satellite imagery."""
    investigation_id = f"inv-{uuid.uuid4().hex[:8]}"
    backend = get_vlm_backend()
    orchestrator = InvestigationOrchestrator(vlm_backend=backend)

    imagery_inputs: list[ImageryInput] = []

    # Map requested imagery IDs or create curated demo fallback imagery
    for idx, img_id in enumerate(request.imagery_ids):
        if img_id in IMAGERY_REGISTRY:
            meta = IMAGERY_REGISTRY[img_id]
            file_path = str(settings.upload_path / f"{meta.id}_{meta.filename}")
            role = "before" if idx == 0 and len(request.imagery_ids) > 1 else ("after" if idx == 1 else "primary")
            imagery_inputs.append(ImageryInput(id=img_id, path=file_path, metadata=meta, role=role))
        else:
            # Generate deterministic demo fixture
            sensor = SensorType.SAR if "sar" in img_id.lower() else SensorType.OPTICAL
            file_path = _get_or_create_demo_image(img_id, sensor)
            meta = extract_metadata(file_path, img_id)
            meta.sensor_type = sensor
            role = "before" if idx == 0 and len(request.imagery_ids) > 1 else ("after" if idx == 1 else "primary")
            imagery_inputs.append(ImageryInput(id=img_id, path=str(file_path), metadata=meta, role=role))

    # Execute orchestrator
    response = await orchestrator.run_investigation(
        request=request,
        imagery=imagery_inputs,
        investigation_id=investigation_id,
    )

    INVESTIGATION_CACHE[investigation_id] = response
    return response


@router.get("/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(investigation_id: str) -> InvestigationResponse:
    """Retrieve the full result, evidence, and audit trace for an investigation."""
    if investigation_id not in INVESTIGATION_CACHE:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return INVESTIGATION_CACHE[investigation_id]


@router.get("", response_model=list[InvestigationResponse])
async def list_investigations() -> list[InvestigationResponse]:
    """List all previous investigations."""
    return list(INVESTIGATION_CACHE.values())
