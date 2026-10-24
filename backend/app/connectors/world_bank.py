import datetime
from typing import List, Any
import httpx
from backend.app.connectors.base import BaseConnector
from backend.app.schemas.event import NormalizedEvent

class WorldBankConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="world_bank",
            display_name="World Bank Economic Resilience Indicators",
            domain="economic"
        )
        self.endpoint = "https://api.worldbank.org/v2/country/WLD;USA;CHN;DEU;JPN;IND;GBR/indicator/FP.CPI.TOTL.ZG?format=json&per_page=10"

    async def fetch_raw_data(self) -> Any:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(self.endpoint)
                if resp.status_code == 200:
                    return resp.json()
                return []
        except Exception:
            return []

    def normalize(self, raw_data: Any) -> List[NormalizedEvent]:
        events: List[NormalizedEvent] = []
        if not raw_data or len(raw_data) < 2:
            return events

        records = raw_data[1]
        for rec in records:
            c_name = rec.get("country", {}).get("value", "Global")
            c_iso = rec.get("countryiso3code", "")
            val = rec.get("value")
            year = rec.get("date", "2024")

            if val is None:
                continue

            # Inflation vulnerability scoring
            val_f = float(val)
            sev = "high" if val_f > 8.0 else ("medium" if val_f > 4.0 else "low")
            risk_score = min(95.0, max(15.0, val_f * 7.5))

            event = NormalizedEvent(
                id=f"wb:inflation:{c_iso}:{year}",
                source="world_bank",
                source_id=f"{c_iso}_{year}",
                source_url=f"https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations={c_iso}",
                title=f"Economic Indicator: {c_name} Inflation Index ({val_f:.1f}%)",
                description=f"World Bank reported annual consumer price index change of {val_f:.2f}% for {c_name} ({year}). Macroeconomic vulnerability marker.",
                domain="economic",
                category="inflation_risk",
                country=c_name,
                region=c_name,
                severity=sev,
                calculated_risk_score=round(risk_score, 1),
                confidence=0.96,
                scoring_version="1.0.0",
                score_breakdown={
                    "severity_component": risk_score * 0.4,
                    "exposure_component": risk_score * 0.4,
                    "vulnerability_component": risk_score * 0.2,
                    "inflation_pct": val_f,
                    "reported_year": year
                },
                occurrence_time=datetime.datetime.utcnow(),
                observation_time=datetime.datetime.utcnow(),
                first_seen_time=datetime.datetime.utcnow(),
                last_updated_time=datetime.datetime.utcnow(),
                verification_status="verified",
                raw_payload={"indicator": "FP.CPI.TOTL.ZG", "val": val_f}
            )
            events.append(event)
        return events
