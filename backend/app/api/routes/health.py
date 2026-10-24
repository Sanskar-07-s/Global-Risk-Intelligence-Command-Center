import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.event import NormalizedEventModel, SourceHealthModel

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/")
def health_check(db: Session = Depends(get_db)):
    total_events = db.query(NormalizedEventModel).count()
    sources = db.query(SourceHealthModel).all()
    operational_sources = sum(1 for s in sources if s.status == "operational")

    return {
        "status": "healthy",
        "service": "GRICC Intelligence Core",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": "connected",
        "total_normalized_events": total_events,
        "sources_tracked": len(sources),
        "sources_operational": operational_sources
    }
