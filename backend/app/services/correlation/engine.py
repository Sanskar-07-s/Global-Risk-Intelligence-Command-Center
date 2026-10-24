import math
from typing import List, Dict, Any
from backend.app.schemas.event import NormalizedEvent

class CorrelationEngine:
    """
    Identifies relationships between multi-domain events based on geospatial proximity,
    temporal co-occurrence, and critical infrastructure dependencies.
    """
    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    @classmethod
    def correlate_events(cls, events: List[NormalizedEvent], max_distance_km: float = 650.0) -> List[Dict[str, Any]]:
        links = []
        n = len(events)
        for i in range(n):
            ev1 = events[i]
            for j in range(i + 1, n):
                ev2 = events[j]

                # 1. Geospatial correlation
                if ev1.latitude is not None and ev1.longitude is not None and ev2.latitude is not None and ev2.longitude is not None:
                    dist = cls.haversine_distance_km(ev1.latitude, ev1.longitude, ev2.latitude, ev2.longitude)
                    if dist <= max_distance_km:
                        # Determine relationship type
                        if ev1.domain == ev2.domain:
                            rel_type = "spatial_cluster"
                            conf = max(0.4, 1.0 - (dist / max_distance_km))
                        else:
                            rel_type = "cross_domain_compound_risk"
                            conf = max(0.5, 0.9 - (dist / max_distance_km))

                        links.append({
                            "source_id": ev1.id,
                            "target_id": ev2.id,
                            "relationship": rel_type,
                            "nature": "inferred", # strictly distinguish inferred vs confirmed
                            "distance_km": round(dist, 1),
                            "confidence": round(conf, 2),
                            "description": f"Compound geospatial proximity ({round(dist)}km) between {ev1.domain} and {ev2.domain} events."
                        })

                # 2. Entity / Sector correlation (e.g. both affect maritime chokepoints or cyber infrastructure)
                elif ev1.region and ev2.region and ev1.region.lower() == ev2.region.lower() and ev1.region != "Global Cyber Threat":
                    links.append({
                        "source_id": ev1.id,
                        "target_id": ev2.id,
                        "relationship": "shared_region_exposure",
                        "nature": "inferred",
                        "confidence": 0.75,
                        "description": f"Co-located in strategic region: {ev1.region}."
                    })
        return links
