from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.event import NormalizedEventModel
from backend.app.schemas.event import AIQueryRequest, AICitedBrief, NormalizedEvent
from backend.app.services.retrieval.gemini import ai_analyst

router = APIRouter(prefix="/intelligence", tags=["AI Intelligence Desk"])

@router.post("/query", response_model=AICitedBrief)
async def query_intelligence(req: AIQueryRequest, db: Session = Depends(get_db)):
    query = db.query(NormalizedEventModel)

    if req.domain:
        query = query.filter(NormalizedEventModel.domain == req.domain)
    if req.region:
        query = query.filter(NormalizedEventModel.region.ilike(f"%{req.region}%"))

    # Order by highest risk score
    event_models = query.order_by(NormalizedEventModel.calculated_risk_score.desc()).limit(20).all()
    events = [NormalizedEvent.model_validate(em) for em in event_models]

    brief = await ai_analyst.generate_brief(
        question=req.question,
        retrieved_events=events,
        region=req.region
    )
    return brief
