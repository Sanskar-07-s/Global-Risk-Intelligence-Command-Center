import datetime
from typing import List, Any
import httpx
from backend.app.connectors.base import BaseConnector
from backend.app.schemas.event import NormalizedEvent

class CISAKEVConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="cisa_kev",
            display_name="CISA Known Exploited Vulnerabilities (KEV)",
            domain="cybersecurity"
        )
        self.endpoint = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

    async def fetch_raw_data(self) -> Any:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(self.endpoint)
            resp.raise_for_status()
            return resp.json()

    def normalize(self, raw_data: Any) -> List[NormalizedEvent]:
        events: List[NormalizedEvent] = []
        vulns = raw_data.get("vulnerabilities", [])

        # Limit to the most recent 40 vulnerabilities
        for item in vulns[-40:]:
            cve_id = item.get("cveID", "CVE-UNKNOWN")
            vendor = item.get("vendorProject", "Unknown Vendor")
            product = item.get("product", "Unknown Product")
            vuln_name = item.get("vulnerabilityName", "Exploited Vulnerability")
            desc = item.get("shortDescription", "")
            action = item.get("requiredAction", "")
            date_added = item.get("dateAdded")

            occ_time = datetime.datetime.utcnow()
            if date_added:
                try:
                    occ_time = datetime.datetime.fromisoformat(date_added)
                except Exception:
                    occ_time = datetime.datetime.utcnow()

            # Active KEV vulnerabilities are actively weaponized in the wild -> High or Critical
            is_critical = "remote code execution" in desc.lower() or "privilege escalation" in desc.lower() or "ransomware" in str(item.get("knownRansomwareCampaignUse", "")).lower()
            risk_score = 92.0 if is_critical else 78.0
            sev = "critical" if is_critical else "high"

            event = NormalizedEvent(
                id=f"cisa:{cve_id}",
                source="cisa_kev",
                source_id=cve_id,
                source_url=f"https://nvd.nist.gov/vuln/detail/{cve_id}",
                title=f"{cve_id} - {vendor} {product}",
                description=f"{vuln_name}. {desc} Required remediation: {action}",
                domain="cybersecurity",
                category="vulnerability_exploit",
                latitude=None, # Global/Cyber entity
                longitude=None,
                region="Global Cyber Threat",
                severity=sev,
                calculated_risk_score=risk_score,
                confidence=0.98,
                scoring_version="1.0.0",
                score_breakdown={
                    "severity_component": 45.0 if is_critical else 35.0,
                    "exposure_component": 30.0,
                    "vulnerability_component": 20.0,
                    "freshness_penalty": 0.0,
                    "active_exploitation": True,
                    "vendor": vendor,
                    "product": product
                },
                occurrence_time=occ_time,
                observation_time=datetime.datetime.utcnow(),
                first_seen_time=datetime.datetime.utcnow(),
                last_updated_time=datetime.datetime.utcnow(),
                verification_status="verified",
                raw_payload={"vendor": vendor, "product": product, "action": action}
            )
            events.append(event)

        return events
