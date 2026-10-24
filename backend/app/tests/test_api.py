import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.risk_engine.scoring import RiskScoringEngine

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"

def test_health_endpoint():
    response = client.get("/api/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "total_normalized_events" in data

def test_risk_methodology():
    response = client.get("/api/risk/methodology")
    assert response.status_code == 200
    data = response.json()
    assert "weights" in data
    assert data["version"] == RiskScoringEngine.VERSION

def test_risk_scoring_engine():
    score, category, breakdown = RiskScoringEngine.calculate_score(
        severity_level="critical",
        intrinsic_magnitude=85.0,
        exposure_index=90.0,
        vulnerability_index=75.0,
        hours_since_occurrence=2.0
    )
    assert 0 <= score <= 100
    assert category in ["critical", "high"]
    assert "severity_component" in breakdown

def test_scenario_simulation():
    payload = {
        "name": "Strait of Malacca Disruption Test",
        "trigger_domain": "geopolitical",
        "trigger_event_title": "Maritime Chokepoint Blockade",
        "trigger_severity": "critical",
        "target_region": "Southeast Asia",
        "cascading_sectors": ["maritime_corridor", "energy_grid"]
    }
    response = client.post("/api/scenarios/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["disclaimer"] == "HYPOTHETICAL SIMULATION - NOT A VERIFIED PREDICTION. For analyst stress-testing only."
    assert len(data["affected_sectors"]) == 2
    assert len(data["cascading_timeline"]) == 4

def test_case_management():
    # Test listing cases
    response = client.get("/api/reports/cases")
    assert response.status_code == 200
    cases = response.json()
    assert isinstance(cases, list)

def test_cors_preflight_and_headers():
    # Test CORS preflight OPTIONS request from Firebase hosting origin
    headers = {
        "Origin": "https://g-r-i-c-c.web.app",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type"
    }
    response = client.options("/api/health/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://g-r-i-c-c.web.app"
    assert response.headers.get("access-control-allow-credentials") == "true"

def test_events_endpoint_with_null_and_missing_categories():
    response = client.get("/api/events/?limit=50")
    assert response.status_code == 200
    events = response.json()
    assert isinstance(events, list)
    for ev in events:
        assert "id" in ev
        assert "title" in ev
        assert "domain" in ev
        # Coordinates must be valid float or None (not undefined)
        if ev.get("latitude") is not None:
            assert isinstance(ev["latitude"], (int, float))
        if ev.get("longitude") is not None:
            assert isinstance(ev["longitude"], (int, float))

