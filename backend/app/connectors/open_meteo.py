import datetime
from typing import List, Any
import httpx
from backend.app.connectors.base import BaseConnector
from backend.app.schemas.event import NormalizedEvent

class OpenMeteoConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="open_meteo",
            display_name="Open-Meteo Weather Anomalies",
            domain="weather_extreme"
        )
        # Strategic global monitoring points (chokepoints & population centers)
        self.monitoring_points = [
            {"name": "Strait of Malacca", "lat": 1.43, "lon": 102.89},
            {"name": "Suez Canal / Red Sea", "lat": 29.97, "lon": 32.55},
            {"name": "Panama Canal", "lat": 9.10, "lon": -79.69},
            {"name": "Gulf of Mexico / Houston Port", "lat": 29.30, "lon": -94.79},
            {"name": "Tokyo Bay Logistics Center", "lat": 35.68, "lon": 139.76},
            {"name": "Rotterdam Hub", "lat": 51.92, "lon": 4.47}
        ]

    async def fetch_raw_data(self) -> Any:
        results = []
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for pt in self.monitoring_points[:4]: # sample 4 key points per cycle
                url = f"https://api.open-meteo.com/v1/forecast?latitude={pt['lat']}&longitude={pt['lon']}&current=temperature_2m,wind_speed_10m,precipitation,weather_code&hourly=wind_gusts_10m"
                try:
                    r = await client.get(url)
                    if r.status_code == 200:
                        data = r.json()
                        data["location_meta"] = pt
                        results.append(data)
                except Exception:
                    continue
        return results

    def normalize(self, raw_data: Any) -> List[NormalizedEvent]:
        events: List[NormalizedEvent] = []
        for item in raw_data:
            meta = item.get("location_meta", {})
            current = item.get("current", {})
            temp = current.get("temperature_2m", 20.0)
            wind = current.get("wind_speed_10m", 0.0)
            precip = current.get("precipitation", 0.0)
            wcode = current.get("weather_code", 0)

            # Detect anomalies: wind > 50 km/h or precip > 15 mm/h or extreme heat/cold
            is_anomaly = wind >= 40.0 or precip >= 10.0 or temp >= 42.0 or temp <= -20.0
            sev = "high" if (wind >= 65.0 or precip >= 25.0) else ("medium" if is_anomaly else "low")
            risk_score = 65.0 if sev == "high" else (45.0 if sev == "medium" else 20.0)

            event = NormalizedEvent(
                id=f"meteo:{meta.get('name', '').lower().replace(' ', '_')}",
                source="open_meteo",
                source_id=meta.get("name"),
                source_url="https://open-meteo.com",
                title=f"Atmospheric Telemetry: {meta.get('name')}",
                description=f"Current readings: Temp {temp}C, Wind {wind} km/h, Precipitation {precip} mm. Conditions index code {wcode}.",
                domain="weather_extreme",
                category="atmospheric_anomaly",
                latitude=meta.get("lat"),
                longitude=meta.get("lon"),
                region=meta.get("name"),
                severity=sev,
                calculated_risk_score=risk_score,
                confidence=0.92,
                scoring_version="1.0.0",
                score_breakdown={
                    "severity_component": risk_score * 0.4,
                    "exposure_component": risk_score * 0.4,
                    "vulnerability_component": risk_score * 0.2,
                    "wind_speed_kmh": wind,
                    "temperature_c": temp
                },
                occurrence_time=datetime.datetime.utcnow(),
                observation_time=datetime.datetime.utcnow(),
                first_seen_time=datetime.datetime.utcnow(),
                last_updated_time=datetime.datetime.utcnow(),
                verification_status="verified",
                raw_payload={"temp": temp, "wind": wind, "precip": precip}
            )
            events.append(event)
        return events
