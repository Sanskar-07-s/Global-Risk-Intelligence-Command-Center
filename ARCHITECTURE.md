# GRICC Architecture & System Design

## 1. High-Level System Overview

```
                      +---------------------------------------+
                      |       GRICC Command Interface         |
                      |   (Vite + React + Three.js 3D Earth)  |
                      +-------------------+-------------------+
                                          |
                                          | REST / JSON
                                          v
                      +---------------------------------------+
                      |         FastAPI Intelligence Core      |
                      |          (Python 3.11+ Async)         |
                      +---+-------------------------------+---+
                          |                               |
             +------------+-----------+       +-----------+-----------+
             | Risk Engine & Scoring  |       |  Gemini AI Synthesis  |
             | Event Correlation      |       |  Source-Cited RAG     |
             | Anomaly Detection      |       |  Scenario Sim Engine  |
             +------------+-----------+       +-----------+-----------+
                          |                               |
                          +---------------+---------------+
                                          |
                                          v
                      +---------------------------------------+
                      |     SQLAlchemy / SQLite Data Layer    |
                      |    (Normalized Event & Source Cache)  |
                      +-------------------+-------------------+
                                          |
                 +------------------------+------------------------+
                 |                        |                        |
                 v                        v                        v
        +-----------------+      +-----------------+      +-----------------+
        | USGS Earthquakes|      |   NASA EONET    |      |  NASA FIRMS     |
        | GeoJSON Stream  |      | Natural Hazards |      | Wildfire Data   |
        +-----------------+      +-----------------+      +-----------------+
                 |                        |                        |
                 v                        v                        v
        +-----------------+      +-----------------+      +-----------------+
        |    CISA KEV     |      |   Open-Meteo    |      | GDELT & World   |
        | Cyber Threats   |      | Severe Weather  |      |      Bank       |
        +-----------------+      +-----------------+      +-----------------+
```

## 2. Core Subsystems

### A. Modular Data Connectors (`backend/app/connectors/`)
Each connector implements a standardized interface:
- `fetch_latest()`: Async HTTP polling with backoff and timeouts.
- `normalize()`: Converts raw payloads into the unified `NormalizedEvent` schema.
- `health_check()`: Verifies source accessibility and freshness.

### B. Normalized Intelligence Event Model (`backend/app/schemas/event.py`)
All events conform to a single schema featuring:
- `id`: Internal deterministic UUID (`source:external_id`).
- `source`: Source provider name.
- `domain`: `geopolitical`, `natural_hazard`, `weather_extreme`, `cybersecurity`, `economic`, `infrastructure`.
- `title`, `description`, `coordinates` (Lat, Lon, Depth/Elevation).
- `severity` & `calculated_risk_score` (0–100 explainable scale).
- `confidence`: Source reliability & completeness score.
- `timestamps`: `occurrence_time`, `observation_time`, `ingestion_time`.
- `attribution_url`: Direct source link for transparency.

### C. 3D Earth Visualization Engine (`frontend/src/scenes/`)
Built with Three.js / React Three Fiber:
- Procedural realistic Earth sphere with bump/specular shaders, day/night transitions.
- Volumetric atmospheric glow using custom GLSL shaders.
- Geospatial event projection: converting `(lat, lon)` to 3D Cartesian coordinates `(x, y, z)`.
- Interactive pulse rings, severity heat maps, and camera focus transitions with smooth slerp interpolation.

### D. AI Intelligence Desk (`backend/app/services/retrieval/` & `gemini.py`)
- Employs strict evidence grounding: queries extract relevant normalized events from the database first.
- Context injection includes explicit source attribution guidelines.
- Distinguishes between verified evidence, analytical inference, and scenario simulations.
