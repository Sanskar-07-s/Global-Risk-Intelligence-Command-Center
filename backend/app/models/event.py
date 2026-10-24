import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, JSON, Boolean, Integer
from backend.app.core.database import Base

class NormalizedEventModel(Base):
    __tablename__ = "normalized_events"

    id = Column(String(128), primary_key=True, index=True) # e.g. "usgs:ak024d9f1", "cisa:CVE-2024-1234"
    source = Column(String(64), index=True, nullable=False) # "usgs", "eonet", "cisa", "open_meteo", "firms", "gdelt"
    source_id = Column(String(128), index=True, nullable=True)
    source_url = Column(Text, nullable=True)
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    domain = Column(String(64), index=True, nullable=False) # "natural_hazard", "geopolitical", "cybersecurity", "weather_extreme", "economic", "infrastructure"
    category = Column(String(64), index=True, nullable=True) # e.g. "earthquake", "wildfire", "cve", "storm"

    # Geospatial
    latitude = Column(Float, nullable=True, index=True)
    longitude = Column(Float, nullable=True, index=True)
    depth_or_elevation = Column(Float, nullable=True)
    country = Column(String(128), nullable=True, index=True)
    region = Column(String(256), nullable=True)

    # Risk & Analytical scoring
    severity = Column(String(32), default="low", index=True) # "critical", "high", "medium", "low", "info"
    calculated_risk_score = Column(Float, default=0.0, index=True) # 0 to 100
    confidence = Column(Float, default=0.8) # 0.0 to 1.0
    scoring_version = Column(String(16), default="1.0.0")
    score_breakdown = Column(JSON, default=dict) # breakdown of factors: severity, exposure, vulnerability, freshness

    # Temporal
    occurrence_time = Column(DateTime, nullable=True, index=True)
    observation_time = Column(DateTime, nullable=True)
    first_seen_time = Column(DateTime, default=datetime.datetime.utcnow)
    last_updated_time = Column(DateTime, default=datetime.datetime.utcnow)

    # Verification & Metadata
    verification_status = Column(String(32), default="verified") # "verified", "unconfirmed", "simulated", "inferred"
    raw_payload = Column(JSON, nullable=True)
    related_event_ids = Column(JSON, default=list)

class SourceHealthModel(Base):
    __tablename__ = "source_health"

    source_name = Column(String(64), primary_key=True)
    display_name = Column(String(128), nullable=False)
    domain = Column(String(64), nullable=False)
    status = Column(String(32), default="operational") # "operational", "degraded", "failing", "disabled"
    last_checked = Column(DateTime, default=datetime.datetime.utcnow)
    last_success = Column(DateTime, nullable=True)
    total_events_ingested = Column(Integer, default=0)
    latency_ms = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    is_enabled = Column(Boolean, default=True)

class CaseInvestigationModel(Base):
    __tablename__ = "case_investigations"

    id = Column(String(64), primary_key=True)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(32), default="open") # "open", "in_review", "closed"
    priority = Column(String(32), default="medium") # "low", "medium", "high", "critical"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    analyst_notes = Column(Text, nullable=True)
    pinned_event_ids = Column(JSON, default=list)
    tags = Column(JSON, default=list)
