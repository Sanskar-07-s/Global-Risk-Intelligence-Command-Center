# GRICC Data Dictionary

This document defines the schema of the Normalized Event Model used throughout GRICC.

---

## 1. Normalized Event (`NormalizedEventModel` / `NormalizedEvent`)

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | `String` (PK) | Unique composite ID (`source:external_id`) | `usgs:us7000m8y2` |
| `source` | `String` | Originating data provider | `usgs`, `eonet`, `cisa_kev` |
| `source_id` | `String` | Raw identifier within originating system | `CVE-2024-21413` |
| `source_url` | `String` | Direct link to official advisory or source | `https://earthquake.usgs.gov/...` |
| `title` | `String` | Standardized descriptive headline | `M6.2 Earthquake - Northern Sumatra` |
| `description`| `Text` | Narrative summary of the event | Depth, alert level, remediation actions |
| `domain` | `String` | Operational risk domain | `natural_hazard`, `cybersecurity` |
| `category` | `String` | Specific event type | `earthquake`, `wildfire`, `exploit` |
| `latitude` | `Float` | WGS84 latitude coordinate | `-1.234` |
| `longitude`| `Float` | WGS84 longitude coordinate | `102.567` |
| `depth_or_elevation` | `Float` | Depth in km or elevation in meters | `10.0` |
| `region` | `String` | Human-readable region or corridor | `Strait of Malacca` |
| `severity` | `String` | Tier: `critical`, `high`, `medium`, `low` | `critical` |
| `calculated_risk_score` | `Float` | Composite explainable index (0–100) | `84.5` |
| `confidence` | `Float` | Reliability score (0.0 to 1.0) | `0.95` |
| `scoring_version` | `String` | Scoring engine version | `1.0.0-multi-factor` |
| `score_breakdown` | `JSON` | Contributing component factors | `{ severity: 40, exposure: 30 }` |
| `occurrence_time` | `DateTime` | Real-world incident time (UTC) | `2026-10-24T06:12:00Z` |
| `verification_status` | `String` | `verified`, `unconfirmed`, `inferred` | `verified` |

---

## 2. Source Health (`SourceHealthModel`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `source_name` | `String` (PK) | Machine name of connector (`usgs`, `cisa_kev`) |
| `display_name` | `String` | Human-readable provider title |
| `status` | `String` | `operational`, `degraded`, `failing`, `pending` |
| `latency_ms` | `Float` | HTTP round-trip and processing time |
| `total_events_ingested` | `Integer` | Lifetime records ingested |
| `last_checked` | `DateTime` | Timestamp of last poll |
| `error_message` | `Text` | Detailed diagnostic trace if failure occurred |
