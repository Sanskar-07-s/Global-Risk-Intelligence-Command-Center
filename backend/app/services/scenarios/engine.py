import uuid
from typing import Dict, Any, List
from backend.app.schemas.event import ScenarioSimulationRequest, ScenarioSimulationResult

class ScenarioEngine:
    """
    Constructs multi-sector cascading risk simulations based on hypothetical triggers.
    All outputs are explicitly marked with disclaimers and assumptions.
    """
    SECTOR_DEPENDENCIES = {
        "energy_grid": ["telecommunications", "water_utilities", "financial_systems", "hospital_networks"],
        "maritime_corridor": ["manufacturing_supply_chain", "semiconductor_transit", "energy_shipping"],
        "telecommunications": ["cloud_infrastructure", "emergency_dispatch", "banking_clearing"],
        "semiconductor_transit": ["automotive_manufacturing", "consumer_electronics", "defense_avionics"],
        "critical_port": ["freight_railways", "grain_exports", "fuel_distribution"]
    }

    @classmethod
    def run_simulation(cls, req: ScenarioSimulationRequest) -> ScenarioSimulationResult:
        sim_id = f"sim-{uuid.uuid4().hex[:8]}"
        severity_multiplier = {
            "critical": 1.4,
            "high": 1.2,
            "medium": 1.0,
            "low": 0.7
        }.get(req.trigger_severity.lower(), 1.0)

        base_risk = 60.0 * severity_multiplier
        projected_risk = min(99.0, round(base_risk, 1))

        # Calculate cascading affected sectors
        affected_sectors = []
        for sec in req.cascading_sectors:
            downstream = cls.SECTOR_DEPENDENCIES.get(sec, ["general_commerce", "local_transport"])
            impact_pct = min(95.0, round(45.0 * severity_multiplier, 1))
            affected_sectors.append({
                "sector": sec,
                "projected_disruption_index": impact_pct,
                "downstream_cascades": downstream,
                "resilience_buffer_days": max(2, int(7 / severity_multiplier))
            })

        # Timeline generation (Day 1, Day 3, Day 7, Day 14)
        timeline = [
            {
                "day": 1,
                "phase": "Immediate Trigger Shock",
                "milestone": f"Direct physical/cyber impact of {req.trigger_event_title} in {req.target_region}.",
                "estimated_system_stress": min(100, int(projected_risk * 0.7))
            },
            {
                "day": 3,
                "phase": "First-Order Cascading Failures",
                "milestone": f"Supply buffers depleted in {', '.join(req.cascading_sectors[:2])}. Secondary logistical bottlenecks emerge.",
                "estimated_system_stress": min(100, int(projected_risk * 0.9))
            },
            {
                "day": 7,
                "phase": "Peak Compound Disruption",
                "milestone": "Cross-sector spillover affecting regional commerce and downstream manufacturing pipelines.",
                "estimated_system_stress": int(projected_risk)
            },
            {
                "day": 14,
                "phase": "Stabilization / Alternative Routing",
                "milestone": "Contingency rerouting and reserve activation gradually absorb localized variance.",
                "estimated_system_stress": max(20, int(projected_risk * 0.65))
            }
        ]

        assumptions = [
            f"Assumes target region {req.target_region} maintains standard 7-day reserve buffers.",
            f"Assumes no immediate emergency international intervention within the initial 48 hours.",
            "Cross-sector impact coefficients derived from input graph dependencies, not real-time telemetry."
        ]

        return ScenarioSimulationResult(
            simulation_id=sim_id,
            title=f"Cascading Analysis: {req.name}",
            risk_score_projection=projected_risk,
            affected_sectors=affected_sectors,
            cascading_timeline=timeline,
            assumptions=assumptions,
            disclaimer="HYPOTHETICAL SIMULATION - NOT A VERIFIED PREDICTION. For analyst stress-testing only."
        )
