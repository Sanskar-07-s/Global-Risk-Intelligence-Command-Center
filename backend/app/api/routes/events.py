from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.event import NormalizedEventModel
from backend.app.schemas.event import NormalizedEvent
from backend.app.services.correlation.engine import CorrelationEngine

router = APIRouter(prefix="/events", tags=["Events"])

@router.get("/", response_model=List[NormalizedEvent])
def list_events(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    min_risk_score: Optional[float] = Query(None, description="Minimum risk score"),
    search: Optional[str] = Query(None, description="Keyword search"),
    limit: int = Query(250, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(NormalizedEventModel)

    if domain:
        query = query.filter(NormalizedEventModel.domain == domain)
    if severity:
        query = query.filter(NormalizedEventModel.severity == severity)
    if min_risk_score is not None:
        query = query.filter(NormalizedEventModel.calculated_risk_score >= min_risk_score)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (NormalizedEventModel.title.ilike(search_fmt)) |
            (NormalizedEventModel.description.ilike(search_fmt)) |
            (NormalizedEventModel.region.ilike(search_fmt))
        )

    # Order by highest risk score and recent occurrence
    query = query.order_by(NormalizedEventModel.calculated_risk_score.desc(), NormalizedEventModel.occurrence_time.desc())
    results = query.offset(offset).limit(limit).all()
    return results

@router.get("/correlations")
def get_correlations(db: Session = Depends(get_db)):
    # Retrieve top 100 events to compute spatial and cross-domain links
    events_models = db.query(NormalizedEventModel).order_by(NormalizedEventModel.calculated_risk_score.desc()).limit(100).all()
    events = [NormalizedEvent.model_validate(em) for em in events_models]
    links = CorrelationEngine.correlate_events(events)
    return {"links": links, "total_edges": len(links)}

@router.get("/{event_id}", response_model=NormalizedEvent)
def get_event(event_id: str, db: Session = Depends(get_db)):
    ev = db.query(NormalizedEventModel).filter(NormalizedEventModel.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev
