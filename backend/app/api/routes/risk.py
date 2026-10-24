from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db
from backend.app.models.event import NormalizedEventModel
from backend.app.services.risk_engine.scoring import RiskScoringEngine

router = APIRouter(prefix="/risk", tags=["Risk Analytics"])

@router.get("/overview")
def get_risk_overview(db: Session = Depends(get_db)):
    events = db.query(NormalizedEventModel).all()
    total = len(events)
    if total == 0:
        return {
            "global_composite_risk": 25.0,
            "threat_level": "ELEVATED_MONITORING",
            "total_incidents": 0,
            "critical_count": 0,
            "high_count": 0,
            "domain_breakdown": {},
            "severity_breakdown": {"critical": 0, "high": 0, "medium": 0, "low": 0}
        }

    scores = [e.calculated_risk_score for e in events]
    avg_score = round(sum(scores) / total, 1)

    domain_counts = {}
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}

    for ev in events:
        domain_counts[ev.domain] = domain_counts.get(ev.domain, 0) + 1
        sev = ev.severity.lower() if ev.severity else "low"
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    return {
        "global_composite_risk": avg_score,
        "threat_level": "CRITICAL" if avg_score >= 75 else ("HIGH" if avg_score >= 55 else "MODERATE"),
        "total_incidents": total,
        "critical_count": severity_counts["critical"],
        "high_count": severity_counts["high"],
        "domain_breakdown": domain_counts,
        "severity_breakdown": severity_counts
    }

@router.get("/methodology")
def get_methodology():
    return {
        "version": RiskScoringEngine.VERSION,
        "weights": {
            "severity_magnitude": RiskScoringEngine.WEIGHT_SEVERITY,
            "geographic_exposure": RiskScoringEngine.WEIGHT_EXPOSURE,
            "infrastructure_vulnerability": RiskScoringEngine.WEIGHT_VULNERABILITY,
            "temporal_freshness": RiskScoringEngine.WEIGHT_FRESHNESS
        },
        "description": "Composite explainable risk scoring normalizing intrinsic magnitude, population/infrastructure exposure, socioeconomic resilience, and 7-day recency decay."
    }
