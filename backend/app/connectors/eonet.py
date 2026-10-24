import datetime
from typing import List, Any
import httpx
from backend.app.connectors.base import BaseConnector
from backend.app.schemas.event import NormalizedEvent

class EONETConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="eonet",
            display_name="NASA Earth Observatory Natural Event Tracker (EONET)",
            domain="natural_hazard"
        )
        self.endpoint = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50"

    async def fetch_raw_data(self) -> Any:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(self.endpoint)
            resp.raise_for_status()
            return resp.json()

    def normalize(self, raw_data: Any) -> List[NormalizedEvent]:
        events: List[NormalizedEvent] = []
        raw_events = raw_data.get("events", [])

        for item in raw_events:
            ev_id = item.get("id", "unknown")
            title = item.get("title", "Natural Event")
            categories = item.get("categories", [])
            cat_name = categories[0].get("title", "Hazard") if categories else "Hazard"
            cat_slug = cat_name.lower().replace(" ", "_")

            geometry = item.get("geometry", [])
            lat, lon = None, None
            occ_time = datetime.datetime.utcnow()

            if geometry:
                # Latest geometry coordinate point
                latest_geom = geometry[-1]
                coords = latest_geom.get("coordinates", [])
                if len(coords) >= 2:
                    # In GeoJSON format coords are [lon, lat]
                    lon = float(coords[0])
                    lat = float(coords[1])
                date_str = latest_geom.get("date")
                if date_str:
                    try:
                        occ_time = datetime.datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    except Exception:
                        occ_time = datetime.datetime.utcnow()

            # Severity mapping
            if "severe" in title.lower() or "wildfire" in cat_slug or "volcano" in cat_slug:
                sev = "high"
                risk_score = 72.0
            elif "flood" in cat_slug or "cyclone" in cat_slug or "typhoon" in cat_slug:
                sev = "critical"
                risk_score = 85.0
            else:
                sev = "medium"
                risk_score = 48.0

            sources = item.get("sources", [])
            source_url = sources[0].get("url") if sources else None

            event = NormalizedEvent(
                id=f"eonet:{ev_id}",
                source="eonet",
                source_id=ev_id,
                source_url=source_url,
                title=title,
                description=f"NASA EONET active {cat_name}: {title}. Geometry tracking active.",
                domain="natural_hazard",
                category=cat_slug,
                latitude=lat,
                longitude=lon,
                region=cat_name,
                severity=sev,
                calculated_risk_score=risk_score,
                confidence=0.9,
                scoring_version="1.0.0",
                score_breakdown={
                    "severity_component": risk_score * 0.5,
                    "exposure_component": risk_score * 0.3,
                    "vulnerability_component": risk_score * 0.2,
                    "category": cat_name
                },
                occurrence_time=occ_time,
                observation_time=datetime.datetime.utcnow(),
                first_seen_time=datetime.datetime.utcnow(),
                last_updated_time=datetime.datetime.utcnow(),
                verification_status="verified",
                raw_payload={"categories": [c.get("title") for c in categories]}
            )
            events.append(event)

        return events
