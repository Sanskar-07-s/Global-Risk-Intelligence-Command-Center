import datetime
from typing import List, Any
import httpx
from backend.app.connectors.base import BaseConnector
from backend.app.schemas.event import NormalizedEvent

class USGSConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="usgs",
            display_name="USGS Earthquake Hazards Program",
            domain="natural_hazard"
        )
        self.endpoint = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"

    async def fetch_raw_data(self) -> Any:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(self.endpoint)
            resp.raise_for_status()
            return resp.json()

    def normalize(self, raw_data: Any) -> List[NormalizedEvent]:
        events: List[NormalizedEvent] = []
        features = raw_data.get("features", [])

        for feat in features:
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [0, 0, 0])

            lon = coords[0] if len(coords) > 0 else None
            lat = coords[1] if len(coords) > 1 else None
            depth = coords[2] if len(coords) > 2 else None

            mag = props.get("mag") or 0.0
            place = props.get("place", "Unknown Location")
            time_ms = props.get("time")
            occ_time = datetime.datetime.utcfromtimestamp(time_ms / 1000.0) if time_ms else datetime.datetime.utcnow()
            event_id = f"usgs:{feat.get('id', str(hash(place + str(time_ms))))}"

            # Scoring heuristics:
            # Mag < 4: low, 4-5.5: medium, 5.5-6.8: high, > 6.8: critical
            if mag >= 6.8:
                sev = "critical"
                risk_score = min(100.0, 75.0 + (mag - 6.8) * 15.0)
            elif mag >= 5.5:
                sev = "high"
                risk_score = 55.0 + (mag - 5.5) * 15.0
            elif mag >= 4.0:
                sev = "medium"
                risk_score = 30.0 + (mag - 4.0) * 15.0
            else:
                sev = "low"
                risk_score = max(5.0, mag * 7.0)

            # Shallow earthquakes (< 30km) carry greater ground rupture impact
            if depth is not None and depth < 30.0 and mag >= 5.0:
                risk_score = min(100.0, risk_score + 10.0)

            event = NormalizedEvent(
                id=event_id,
                source="usgs",
                source_id=feat.get("id"),
                source_url=props.get("url"),
                title=f"M{mag:.1f} Earthquake - {place}",
                description=f"Magnitude {mag} seismic event recorded at depth of {depth}km in {place}. Alert level: {props.get('alert', 'unassigned')}.",
                domain="natural_hazard",
                category="earthquake",
                latitude=lat,
                longitude=lon,
                depth_or_elevation=depth,
                region=place,
                severity=sev,
                calculated_risk_score=round(risk_score, 1),
                confidence=0.95,
                scoring_version="1.0.0",
                score_breakdown={
                    "severity_component": round(risk_score * 0.5, 1),
                    "exposure_component": round(risk_score * 0.3, 1),
                    "vulnerability_component": round(risk_score * 0.2, 1),
                    "freshness_penalty": 0.0,
                    "magnitude": mag,
                    "depth_km": depth
                },
                occurrence_time=occ_time,
                observation_time=datetime.datetime.utcnow(),
                first_seen_time=datetime.datetime.utcnow(),
                last_updated_time=datetime.datetime.utcnow(),
                verification_status="verified",
                raw_payload={"mag": mag, "place": place, "tsunami": props.get("tsunami", 0)}
            )
            events.append(event)

        return events
