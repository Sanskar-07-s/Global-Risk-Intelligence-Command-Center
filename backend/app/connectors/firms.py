import datetime
from typing import List, Any
import httpx
from backend.app.connectors.base import BaseConnector
from backend.app.schemas.event import NormalizedEvent
from backend.app.config import settings

class FIRMSConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="firms",
            display_name="NASA FIRMS Wildfire Telemetry",
            domain="natural_hazard"
        )
        self.map_key = settings.FIRMS_MAP_KEY

    async def fetch_raw_data(self) -> Any:
        # FIRMS provides CSV/JSON feeds for active fire detections
        # E.g. VIIRS or MODIS NRT feeds
        if not self.map_key:
            return []
        url = f"https://firms.modaps.eosdis.nasa.gov/api/country/csv/{self.map_key}/VIIRS_NOAA20_NRT/USA/1"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    lines = resp.text.strip().split("\n")
                    return lines[:25] # take top detections
                return []
        except Exception:
            return []

    def normalize(self, raw_data: Any) -> List[NormalizedEvent]:
        events: List[NormalizedEvent] = []
        if not raw_data or len(raw_data) <= 1:
            return events

        # Parse CSV lines
        header = [h.strip().lower() for h in raw_data[0].split(",")]
        for line in raw_data[1:]:
            parts = [p.strip() for p in line.split(",")]
            if len(parts) < len(header):
                continue
            row = dict(zip(header, parts))
            try:
                lat = float(row.get("latitude", 0))
                lon = float(row.get("longitude", 0))
                frp = float(row.get("frp", 0)) # Fire Radiative Power (MW)
                confidence = row.get("confidence", "nominal")
                acq_date = row.get("acq_date", datetime.date.today().isoformat())

                sev = "critical" if frp > 100 else ("high" if frp > 40 else "medium")
                risk_score = min(100.0, 30.0 + frp * 0.5)

                event = NormalizedEvent(
                    id=f"firms:{lat:.3f}:{lon:.3f}:{acq_date}",
                    source="firms",
                    source_id=f"{lat}:{lon}",
                    source_url="https://firms.modaps.eosdis.nasa.gov/",
                    title=f"Thermal Fire Anomaly (FRP: {frp:.1f} MW)",
                    description=f"Satellite detected high-intensity thermal anomaly with {confidence} confidence. Radiative power: {frp} MW.",
                    domain="natural_hazard",
                    category="wildfire",
                    latitude=lat,
                    longitude=lon,
                    region="Thermal Anomaly Cluster",
                    severity=sev,
                    calculated_risk_score=round(risk_score, 1),
                    confidence=0.88,
                    scoring_version="1.0.0",
                    score_breakdown={
                        "severity_component": risk_score * 0.5,
                        "exposure_component": risk_score * 0.3,
                        "vulnerability_component": risk_score * 0.2,
                        "frp_mw": frp
                    },
                    occurrence_time=datetime.datetime.utcnow(),
                    observation_time=datetime.datetime.utcnow(),
                    first_seen_time=datetime.datetime.utcnow(),
                    last_updated_time=datetime.datetime.utcnow(),
                    verification_status="verified",
                    raw_payload={"frp": frp, "confidence": confidence}
                )
                events.append(event)
            except Exception:
                continue
        return events
