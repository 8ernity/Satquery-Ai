"""Integration tests for FastAPI endpoints using modern httpx ASGI transport."""

import pytest
import httpx

from app.main import app


@pytest.mark.asyncio
async def test_root():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["product"] == "BHUVISION"
        assert data["agents"] == 9
        assert data["team"] == "BANKAI"


@pytest.mark.asyncio
async def test_health():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["agents_available"] == 9


@pytest.mark.asyncio
async def test_scenarios():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/scenarios")
        assert response.status_code == 200
        scenarios = response.json()
        assert len(scenarios) >= 3
        assert any(s["category"] == "construction" for s in scenarios)
        assert any(s["category"] == "flood" for s in scenarios)


@pytest.mark.asyncio
async def test_investigate_demo():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "question": "Where has construction increased between these two dates?",
            "imagery_ids": ["demo-construction-before", "demo-construction-after"],
            "mode": "auto"
        }
        response = await client.post("/api/investigate", json=payload)
        assert response.status_code == 200
        res = response.json()
        assert res["status"] == "complete"
        assert res["plan"]["task_type"] == "change_detection"
        assert len(res["trace"]["events"]) > 0
        assert res["confidence"] is not None
        assert res["confidence"]["is_fabricated"] is False

