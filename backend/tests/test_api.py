"""Integration tests for FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["product"] == "BHUVISION"
    assert data["agents"] == 9
    assert data["team"] == "BANKAI"


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["agents_available"] == 9


def test_scenarios():
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) >= 3
    assert any(s["category"] == "construction" for s in scenarios)
    assert any(s["category"] == "flood" for s in scenarios)


def test_investigate_demo():
    payload = {
        "question": "Where has construction increased between these two dates?",
        "imagery_ids": ["demo-construction-before", "demo-construction-after"],
        "mode": "auto"
    }
    response = client.post("/api/investigate", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "complete"
    assert res["plan"]["task_type"] == "change_detection"
    assert len(res["trace"]["events"]) > 0
    assert res["confidence"] is not None
    assert res["confidence"]["is_fabricated"] is False
