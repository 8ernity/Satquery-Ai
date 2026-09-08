"""Location search, geocoding, and satellite provider catalog API."""

from __future__ import annotations

from fastapi import APIRouter, Query

from ..core.config import settings
from ..geospatial.geocoding import HOTSPOT_REGISTRY, LocationResult, search_locations_sync

router = APIRouter(prefix="/locations", tags=["Locations & Geospatial"])


@router.get("/search", response_model=list[LocationResult])
async def search_locations(
    q: str = Query(..., min_length=1, description="Location name, city, landmark, or region"),
    limit: int = Query(6, ge=1, le=20),
) -> list[LocationResult]:
    """Search any location on Earth by name and return WGS84 bounding box and MGRS coordinates."""
    return search_locations_sync(query=q, limit=limit)


@router.get("/hotspots", response_model=list[LocationResult])
async def get_curated_hotspots() -> list[LocationResult]:
    """Retrieve strategic Indian and global remote sensing demonstration locations."""
    return HOTSPOT_REGISTRY


@router.get("/providers")
async def get_satellite_providers():
    """List operational satellite tile providers, live status, and configured credentials."""
    return {
        "providers": [
            {
                "id": "esri_world_imagery",
                "name": "ESRI World Imagery (ArcGIS)",
                "description": "Global high-resolution optical satellite & aerial imagery (0.3m to 15m resolution).",
                "status": "online",
                "auth_required": False,
                "resolution": "0.3m - 15m GSD",
                "update_cadence": "Continuous Mosaic",
                "tile_url_template": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            },
            {
                "id": "nasa_gibs",
                "name": "NASA GIBS (Worldview / EOSDIS)",
                "description": "Near-real-time true-color daily global satellite passes (MODIS Terra/Aqua & VIIRS).",
                "status": "online",
                "auth_required": False,
                "resolution": "250m - 500m GSD",
                "update_cadence": "Every 24 Hours (Daily)",
                "tile_url_template": "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
            },
            {
                "id": "sentinel_2_msi",
                "name": "Copernicus Sentinel-2 (MSI)",
                "description": "Multispectral 13-band optical imagery (10m VNIR bands).",
                "status": "configured" if settings.sentinel_hub_client_id else "emulated_ready",
                "auth_required": True,
                "resolution": "10m GSD",
                "update_cadence": "5-Day Global Revisit",
            },
            {
                "id": "sentinel_1_sar",
                "name": "Copernicus Sentinel-1 (C-Band SAR)",
                "description": "All-weather synthetic aperture radar with calibrated Sigma0 dB backscatter.",
                "status": "active_sar_engine",
                "auth_required": False,
                "resolution": "10m - 20m GSD",
                "update_cadence": "6-12 Day Revisit",
            },
            {
                "id": "google_maps",
                "name": "Google Maps Platform (Satellite)",
                "description": "Photorealistic 2D/3D Satellite Tiles and Places API.",
                "status": "configured" if settings.google_maps_api_key else "key_optional",
                "auth_required": True,
            },
            {
                "id": "mapbox_satellite",
                "name": "Mapbox Satellite",
                "description": "Global seamless raster satellite tiles and Geocoding v5.",
                "status": "configured" if settings.mapbox_access_token else "key_optional",
                "auth_required": True,
            },
        ],
        "active_primary": "esri_world_imagery",
        "active_nrt": "nasa_gibs",
    }
