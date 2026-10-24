# GRICC Explainable Risk Scoring Methodology
**Version:** `1.0.0-multi-factor`

---

## 1. Overview & Doctrine
GRICC risk scoring is built upon strict transparency:
- Risk scores are indexed from **0.0 to 100.0**.
- Scores are **explainable**, meaning every score exposes its individual component contributions.
- Risk scores represent decision-support indices, never certainty.

---

## 2. Multi-Factor Formulation

The composite score $R$ is calculated as:

$$R = \min\left(100, \max\left(0, \left( w_s S + w_e E + w_v V + w_f F \right) \times C \right)\right)$$

Where:
- $S$: **Severity Magnitude (Weight: 40%)**
  Normalizes physical or cyber intensity. For earthquakes, magnitude Richter scale $\ge 6.8 \to 90+$. For CISA CVEs, weaponization in the wild $\to 90+$.
- $E$: **Geographic Exposure (Weight: 30%)**
  Evaluates population density, critical logistics straits, and transit hub proximity.
- $V$: **Infrastructure Vulnerability (Weight: 20%)**
  Socioeconomic resilience index and critical system dependencies.
- $F$: **Recency Decay Factor (Weight: 10%)**
  Exponential half-life decay function over 168 hours (7 days) for acute kinetic events.
- $C$: **Confidence Calibration Multiplier ($0.8 + 0.2 \times \text{Confidence}$)**

---

## 3. Severity Categorization Tiers
- **CRITICAL:** Score $\ge 80.0$ (Immediate command response required)
- **HIGH:** $60.0 \le \text{Score} < 80.0$ (Active operational watchlist)
- **MEDIUM:** $35.0 \le \text{Score} < 60.0$ (Standard surveillance)
- **LOW:** $\text{Score} < 35.0$ (Informational baseline)
