import uuid
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.event import CaseInvestigationModel
from backend.app.schemas.event import CaseInvestigation

router = APIRouter(prefix="/reports", tags=["Reports & Cases"])

@router.get("/cases", response_model=List[CaseInvestigation])
def list_cases(db: Session = Depends(get_db)):
    cases = db.query(CaseInvestigationModel).order_by(CaseInvestigationModel.updated_at.desc()).all()
    if not cases:
        # Seed an initial default investigation case
        initial_case = CaseInvestigationModel(
            id=f"case-{uuid.uuid4().hex[:6]}",
            title="Multi-Domain Maritime & Seismic Vulnerability Assessment",
            description="Monitoring compound risks in critical logistics channels across Malacca and Red Sea sectors.",
            status="open",
            priority="high",
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow(),
            analyst_notes="Initial analysis indicates compound pressures from seismic activity and weather anomalies.",
            pinned_event_ids=[],
            tags=["maritime", "supply_chain", "infrastructure"]
        )
        db.add(initial_case)
        db.commit()
        cases = [initial_case]
    return cases

@router.post("/cases", response_model=CaseInvestigation)
def create_case(case_in: CaseInvestigation, db: Session = Depends(get_db)):
    c_id = case_in.id or f"case-{uuid.uuid4().hex[:6]}"
    case_db = CaseInvestigationModel(
        id=c_id,
        title=case_in.title,
        description=case_in.description,
        status=case_in.status,
        priority=case_in.priority,
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow(),
        analyst_notes=case_in.analyst_notes,
        pinned_event_ids=case_in.pinned_event_ids,
        tags=case_in.tags
    )
    db.add(case_db)
    db.commit()
    db.refresh(case_db)
    return case_db

@router.delete("/cases/{case_id}")
def delete_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(CaseInvestigationModel).filter(CaseInvestigationModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()
    return {"deleted": True, "id": case_id}
