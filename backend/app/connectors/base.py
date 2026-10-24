from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple
import datetime
import httpx
from backend.app.schemas.event import NormalizedEvent

class BaseConnector(ABC):
    def __init__(self, name: str, display_name: str, domain: str):
        self.name = name
        self.display_name = display_name
        self.domain = domain
        self.timeout = 15.0

    @abstractmethod
    async def fetch_raw_data(self) -> Any:
        """Fetch raw payload from external data source API."""
        pass

    @abstractmethod
    def normalize(self, raw_data: Any) -> List[NormalizedEvent]:
        """Transform raw external payload into standard NormalizedEvent list."""
        pass

    async def run(self) -> Tuple[List[NormalizedEvent], Dict[str, Any]]:
        """Executes fetch and normalization, returning events and health telemetry."""
        start_time = datetime.datetime.utcnow()
        try:
            raw = await self.fetch_raw_data()
            events = self.normalize(raw)
            duration_ms = (datetime.datetime.utcnow() - start_time).total_seconds() * 1000.0
            return events, {
                "status": "operational",
                "latency_ms": round(duration_ms, 2),
                "count": len(events),
                "error": None,
                "timestamp": datetime.datetime.utcnow()
            }
        except Exception as e:
            duration_ms = (datetime.datetime.utcnow() - start_time).total_seconds() * 1000.0
            return [], {
                "status": "failing",
                "latency_ms": round(duration_ms, 2),
                "count": 0,
                "error": str(e),
                "timestamp": datetime.datetime.utcnow()
            }
