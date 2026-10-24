import datetime
import hashlib
from typing import List, Any
import httpx
from backend.app.connectors.base import BaseConnector
from backend.app.schemas.event import NormalizedEvent

class GDELTConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="gdelt",
            display_name="GDELT Project Global Instability",
            domain="geopolitical"
        )
        self.endpoint = "https://api.gdeltproject.org/api/v2/doc/doc?query=(conflict+OR+sanctions+OR+crisis+OR+protest+OR+military)&mode=artlist&maxrecords=25&format=json"

    async def fetch_raw_data(self) -> Any:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(self.endpoint)
                if resp.status_code == 200:
                    return resp.json()
                return {}
        except Exception:
            return {}

    def normalize(self, raw_data: Any) -> List[NormalizedEvent]:
        events: List[NormalizedEvent] = []
        articles = raw_data.get("articles", [])

        # Strategic country / capital coordinate heuristics when not explicit
        region_coords = {
            "Ukraine": (48.37, 31.16),
            "Middle East": (31.76, 35.21),
            "Taiwan": (23.69, 120.96),
            "Red Sea": (20.0, 38.5),
            "South China Sea": (12.0, 113.0),
            "Baltic": (57.0, 20.0),
            "Sahel": (14.0, 2.0),
            "Sudan": (12.86, 30.21),
            "Korea": (37.56, 126.97)
        }

        for art in articles:
            url = art.get("url", "")
            title = art.get("title", "Geopolitical Development")
            seendate = art.get("seendate", "")
            domain_name = art.get("domain", "GDELT Source")

            # Clean ID
            h = hashlib.md5(url.encode()).hexdigest()[:12]
            ev_id = f"gdelt:{h}"

            # Detect matching strategic focus area
            lat, lon, region_name = None, None, "Global Geopolitical Corridor"
            for rname, coords in region_coords.items():
                if rname.lower() in title.lower():
                    lat, lon = coords
                    region_name = rname
                    break

            # Severity heuristic
            sev = "medium"
            risk_score = 55.0
            t_lower = title.lower()
            if any(k in t_lower for k in ["missile", "airstrike", "war", "invasion", "casualt"]):
                sev = "critical"
                risk_score = 88.0
            elif any(k in t_lower for k in ["sanction", "military", "blockade", "clash", "protest"]):
                sev = "high"
                risk_score = 70.0

            occ_time = datetime.datetime.utcnow()
            if seendate and len(seendate) >= 8:
                try:
                    occ_time = datetime.datetime.strptime(seendate[:14], "%Y%m%d%H%M%S")
                except Exception:
                    occ_time = datetime.datetime.utcnow()

            event = NormalizedEvent(
                id=ev_id,
                source="gdelt",
                source_id=h,
                source_url=url,
                title=title,
                description=f"GDELT reported event from {domain_name}. Geopolitical threat monitor active.",
                domain="geopolitical",
                category="geopolitical_conflict",
                latitude=lat,
                longitude=lon,
                region=region_name,
                severity=sev,
                calculated_risk_score=risk_score,
                confidence=0.85,
                scoring_version="1.0.0",
                score_breakdown={
                    "severity_component": risk_score * 0.5,
                    "exposure_component": risk_score * 0.3,
                    "vulnerability_component": risk_score * 0.2,
                    "media_source": domain_name
                },
                occurrence_time=occ_time,
                observation_time=datetime.datetime.utcnow(),
                first_seen_time=datetime.datetime.utcnow(),
                last_updated_time=datetime.datetime.utcnow(),
                verification_status="verified",
                raw_payload={"domain": domain_name, "url": url}
            )
            events.append(event)
        return events
