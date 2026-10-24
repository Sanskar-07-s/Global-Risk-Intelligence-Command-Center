from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.event import SourceHealthModel
from backend.app.schemas.event import SourceHealth
from backend.app.services.ingestion.registry import source_registry

router = APIRouter(prefix="/sources", tags=["Sources"])

@router.get("/", response_model=List[SourceHealth])
def list_sources(db: Session = Depends(get_db)):
    sources = db.query(SourceHealthModel).all()
    # If table is empty, seed from registry
    if not sources:
        for c in source_registry.get_all_connectors():
            entry = SourceHealthModel(
                source_name=c.name,
                display_name=c.display_name,
                domain=c.domain,
                status="pending",
                total_events_ingested=0
            )
            db.add(entry)
        db.commit()
        sources = db.query(SourceHealthModel).all()
    return sources

@router.post("/refresh")
async def trigger_refresh(
    source_name: Optional[str] = Query(None, description="Specific connector name to refresh"),
    db: Session = Depends(get_db)
):
    if source_name:
        result = await source_registry.refresh_source(source_name, db)
        return {"source": source_name, "result": result}
    else:
        results = await source_registry.refresh_all(db)
        return {"refreshed_all": True, "results": results}
