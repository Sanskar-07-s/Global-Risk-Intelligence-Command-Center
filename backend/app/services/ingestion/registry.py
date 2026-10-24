import datetime
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from backend.app.connectors.base import BaseConnector
from backend.app.connectors.usgs import USGSConnector
from backend.app.connectors.eonet import EONETConnector
from backend.app.connectors.cisa_kev import CISAKEVConnector
from backend.app.connectors.open_meteo import OpenMeteoConnector
from backend.app.connectors.firms import FIRMSConnector
from backend.app.connectors.gdelt import GDELTConnector
from backend.app.connectors.world_bank import WorldBankConnector
from backend.app.models.event import NormalizedEventModel, SourceHealthModel
from backend.app.schemas.event import NormalizedEvent
from backend.app.config import settings

class SourceRegistry:
    def __init__(self):
        self.connectors: Dict[str, BaseConnector] = {
            "usgs": USGSConnector(),
            "eonet": EONETConnector(),
            "cisa_kev": CISAKEVConnector(),
            "open_meteo": OpenMeteoConnector(),
            "firms": FIRMSConnector(),
            "gdelt": GDELTConnector(),
            "world_bank": WorldBankConnector()
        }

    def get_all_connectors(self) -> List[BaseConnector]:
        return list(self.connectors.values())

    async def refresh_source(self, source_name: str, db: Session) -> Dict[str, Any]:
        connector = self.connectors.get(source_name)
        if not connector:
            return {"error": f"Unknown connector: {source_name}"}

        events, telemetry = await connector.run()

        # Update or create health entry
        health = db.query(SourceHealthModel).filter(SourceHealthModel.source_name == source_name).first()
        if not health:
            health = SourceHealthModel(
                source_name=source_name,
                display_name=connector.display_name,
                domain=connector.domain
            )
            db.add(health)

        health.last_checked = telemetry["timestamp"]
        health.latency_ms = telemetry["latency_ms"]
        health.status = telemetry["status"]

        if telemetry["status"] == "operational":
            health.last_success = telemetry["timestamp"]
            health.error_message = None
            health.total_events_ingested = (health.total_events_ingested or 0) + len(events)
            # Upsert events into database
            for ev in events:
                existing = db.query(NormalizedEventModel).filter(NormalizedEventModel.id == ev.id).first()
                if not existing:
                    db_ev = NormalizedEventModel(
                        id=ev.id,
                        source=ev.source,
                        source_id=ev.source_id,
                        source_url=ev.source_url,
                        title=ev.title,
                        description=ev.description,
                        domain=ev.domain,
                        category=ev.category,
                        latitude=ev.latitude,
                        longitude=ev.longitude,
                        depth_or_elevation=ev.depth_or_elevation,
                        country=ev.country,
                        region=ev.region,
                        severity=ev.severity,
                        calculated_risk_score=ev.calculated_risk_score,
                        confidence=ev.confidence,
                        scoring_version=ev.scoring_version,
                        score_breakdown=ev.score_breakdown,
                        occurrence_time=ev.occurrence_time,
                        observation_time=ev.observation_time,
                        first_seen_time=ev.first_seen_time,
                        last_updated_time=ev.last_updated_time,
                        verification_status=ev.verification_status,
                        raw_payload=ev.raw_payload,
                        related_event_ids=ev.related_event_ids
                    )
                    db.add(db_ev)
                else:
                    existing.last_updated_time = datetime.datetime.utcnow()
                    existing.calculated_risk_score = ev.calculated_risk_score
                    existing.severity = ev.severity
            db.commit()
        else:
            health.error_message = telemetry["error"]
            db.commit()

        return telemetry

    async def refresh_all(self, db: Session) -> Dict[str, Any]:
        results = {}
        for name in self.connectors.keys():
            results[name] = await self.refresh_source(name, db)
        return results

source_registry = SourceRegistry()
