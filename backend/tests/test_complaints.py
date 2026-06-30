"""
Basic smoke tests for the core complaint flow.
Run with: pytest tests/ -v
Uses a separate test SQLite file so it never touches your dev data.
"""
import os
os.environ["SQLITE_PATH"] = "test_community_hero.db"

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    # Import after env var is set so config picks up the test DB path
    from app.main import app
    from app.database import init_db
    init_db()
    with TestClient(app) as c:
        yield c
    if os.path.exists("test_community_hero.db"):
        os.remove("test_community_hero.db")


def _register_citizen(client, email="test.citizen@example.com"):
    resp = client.post("/v1/auth/register", json={
        "name": "Test Citizen",
        "email": email,
        "password": "Password123",
        "phone": "9876543299",
        "ward": "Test Ward",
    })
    assert resp.status_code == 200, resp.text
    return resp.json()["data"]["access_token"]


def test_register_and_login(client):
    token = _register_citizen(client, "flow1@example.com")
    assert token

    resp = client.post("/v1/auth/login", json={"email": "flow1@example.com", "password": "Password123"})
    assert resp.status_code == 200
    assert resp.json()["data"]["user"]["email"] == "flow1@example.com"


def test_duplicate_registration_rejected(client):
    _register_citizen(client, "dupe@example.com")
    resp = client.post("/v1/auth/register", json={
        "name": "Dupe", "email": "dupe@example.com", "password": "Password123",
        "phone": "9876543200", "ward": "Test Ward",
    })
    assert resp.status_code == 409


def test_submit_complaint_runs_ai_and_routes(client):
    token = _register_citizen(client, "flow2@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/v1/complaints", json={
        "title": "Severe pothole causing accidents on test road",
        "description": "A large dangerous pothole has caused two accidents this week and needs urgent repair.",
        "category": "pothole",
        "severity": "critical",
        "location": {"lat": 18.52, "lng": 73.85, "address": "Test Road, Pune"},
        "media_urls": [],
    }, headers=headers)

    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["status"] in ("assigned", "routed")
    assert data["ai_analysis"] is not None
    assert data["ai_analysis"]["category"] == "pothole"
    assert data["ai_analysis"]["source"] == "rule_based_fallback"  # no Gemini key in test env
    assert "xp_awarded" in data
    assert data["xp_awarded"]["xp_earned"] > 0
    assert len(data["timeline"]) >= 3  # submitted, ai_complete, routed (+assigned if worker found)


def test_unauthenticated_request_rejected(client):
    resp = client.get("/v1/complaints")
    assert resp.status_code == 401


def test_invalid_login_rejected(client):
    resp = client.post("/v1/auth/login", json={"email": "nobody@example.com", "password": "wrongpass"})
    assert resp.status_code == 401
