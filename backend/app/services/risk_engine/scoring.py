from typing import Dict, Any, Tuple
import datetime

class RiskScoringEngine:
    VERSION = "1.0.0-multi-factor"

    # Explainable dimensional weights (documented, non-arbitrary baseline)
    WEIGHT_SEVERITY = 0.40       # Intrinsic physical or technical magnitude
    WEIGHT_EXPOSURE = 0.30       # Population, critical infrastructure, supply chain density
    WEIGHT_VULNERABILITY = 0.20   # Socioeconomic resilience, infrastructure fragility
    WEIGHT_FRESHNESS = 0.10      # Temporal recency decay

    @classmethod
    def calculate_score(
        cls,
        severity_level: str,
        intrinsic_magnitude: float = 50.0, # 0-100 normalized
        exposure_index: float = 50.0,      # 0-100 normalized
        vulnerability_index: float = 50.0, # 0-100 normalized
        hours_since_occurrence: float = 1.0,
        confidence: float = 0.85
    ) -> Tuple[float, str, Dict[str, Any]]:
        """
        Calculates a transparent, explainable 0-100 risk score with explicit component breakdown.
        """
        # 1. Severity component
        sev_map = {
            "critical": 90.0,
            "high": 70.0,
            "medium": 45.0,
            "low": 20.0,
            "info": 10.0
        }
        base_sev = sev_map.get(severity_level.lower(), 40.0)
        sev_component = 0.6 * base_sev + 0.4 * min(100.0, max(0.0, intrinsic_magnitude))

        # 2. Exposure component (0-100)
        exp_component = min(100.0, max(0.0, exposure_index))

        # 3. Vulnerability component (0-100)
        vuln_component = min(100.0, max(0.0, vulnerability_index))

        # 4. Freshness penalty (exponential half-life decay of 72 hours for acute impact)
        freshness_factor = max(0.3, 1.0 - (hours_since_occurrence / 168.0)) # 7 days decay floor
        freshness_component = 100.0 * freshness_factor

        # Raw composite calculation
        raw_composite = (
            cls.WEIGHT_SEVERITY * sev_component +
            cls.WEIGHT_EXPOSURE * exp_component +
            cls.WEIGHT_VULNERABILITY * vuln_component +
            cls.WEIGHT_FRESHNESS * freshness_component
        )

        # Confidence calibration: scales composite closer to baseline if confidence is low
        final_score = round(raw_composite * (0.8 + 0.2 * min(1.0, max(0.2, confidence))), 1)
        final_score = min(100.0, max(0.0, final_score))

        # Category determination
        if final_score >= 80.0:
            category = "critical"
        elif final_score >= 60.0:
            category = "high"
        elif final_score >= 35.0:
            category = "medium"
        else:
            category = "low"

        breakdown = {
            "version": cls.VERSION,
            "severity_component": round(sev_component * cls.WEIGHT_SEVERITY, 1),
            "exposure_component": round(exp_component * cls.WEIGHT_EXPOSURE, 1),
            "vulnerability_component": round(vuln_component * cls.WEIGHT_VULNERABILITY, 1),
            "freshness_component": round(freshness_component * cls.WEIGHT_FRESHNESS, 1),
            "confidence_multiplier": round(0.8 + 0.2 * confidence, 2),
            "weights": {
                "severity": cls.WEIGHT_SEVERITY,
                "exposure": cls.WEIGHT_EXPOSURE,
                "vulnerability": cls.WEIGHT_VULNERABILITY,
                "freshness": cls.WEIGHT_FRESHNESS
            },
            "explanation": f"Score {final_score} ({category}) derived from Severity contribution ({round(sev_component * cls.WEIGHT_SEVERITY, 1)}), Exposure ({round(exp_component * cls.WEIGHT_EXPOSURE, 1)}), Vulnerability ({round(vuln_component * cls.WEIGHT_VULNERABILITY, 1)}), and Recency factor ({round(freshness_component * cls.WEIGHT_FRESHNESS, 1)})."
        }

        return final_score, category, breakdown
