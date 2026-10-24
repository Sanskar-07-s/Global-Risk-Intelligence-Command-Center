from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class ScoreBreakdown(BaseModel):
    severity_component: float = Field(default=0.0, ge=0.0, le=100.0)
    exposure_component: float = Field(default=0.0, ge=0.0, le=100.0)
    vulnerability_component: float = Field(default=0.0, ge=0.0, le=100.0)
    freshness_penalty: float = Field(default=0.0, ge=0.0, le=100.0)
    explanation: str = ""

class NormalizedEvent(BaseModel):
    id: str
    source: str
    source_id: Optional[str] = None
    source_url: Optional[str] = None
    title: str
    description: Optional[str] = None
    domain: str
    category: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    depth_or_elevation: Optional[float] = None
    country: Optional[str] = None
    region: Optional[str] = None

    severity: str = "low"
    calculated_risk_score: float = 0.0
    confidence: float = 0.8
    scoring_version: str = "1.0.0"
    score_breakdown: Optional[Dict[str, Any]] = None

    occurrence_time: Optional[datetime] = None
    observation_time: Optional[datetime] = None
    first_seen_time: Optional[datetime] = None
    last_updated_time: Optional[datetime] = None

    verification_status: str = "verified"
    raw_payload: Optional[Dict[str, Any]] = None
    related_event_ids: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class EventQueryFilter(BaseModel):
    domain: Optional[str] = None
    severity: Optional[str] = None
    country: Optional[str] = None
    min_risk_score: Optional[float] = None
    search: Optional[str] = None
    limit: int = 100
    offset: int = 0

class SourceHealth(BaseModel):
    source_name: str
    display_name: str
    domain: str
    status: str
    last_checked: Optional[datetime] = None
    last_success: Optional[datetime] = None
    total_events_ingested: int = 0
    latency_ms: float = 0.0
    error_message: Optional[str] = None
    is_enabled: bool = True

    model_config = ConfigDict(from_attributes=True)

class AIQueryRequest(BaseModel):
    question: str
    region: Optional[str] = None
    domain: Optional[str] = None
    event_ids: Optional[List[str]] = None

class AICitedBrief(BaseModel):
    summary: str
    key_findings: List[str]
    risk_assessment: str
    recommended_actions: List[str]
    citations: List[Dict[str, Any]]
    confidence_level: str
    missing_evidence: List[str]

class ScenarioSimulationRequest(BaseModel):
    name: str
    trigger_domain: str
    trigger_event_title: str
    trigger_severity: str
    target_region: str
    cascading_sectors: List[str]
    hypothetical_duration_days: int = 14

class ScenarioSimulationResult(BaseModel):
    simulation_id: str
    title: str
    risk_score_projection: float
    affected_sectors: List[Dict[str, Any]]
    cascading_timeline: List[Dict[str, Any]]
    assumptions: List[str]
    disclaimer: str = "HYPOTHETICAL SIMULATION - NOT A VERIFIED PREDICTION"

class CaseInvestigation(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str = "open"
    priority: str = "medium"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    analyst_notes: Optional[str] = None
    pinned_event_ids: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
