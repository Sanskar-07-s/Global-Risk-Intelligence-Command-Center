# GRICC Troubleshooting & Diagnostics

## Common Issues & Resolutions

### 1. External API Connectivity Failures
- **Symptom:** Source status displays `FAILING` or `DEGRADED` in Data Fusion & Health.
- **Diagnostic:** Run `python scripts/dev_check.py`.
- **Cause:** Network timeout or provider rate-limiting.
- **Resolution:** The system automatically maintains cached records and fallback synthesis so the application remains fully functional during outages.

### 2. 3D Globe Rendering in Headless or Low-End Environments
- **Symptom:** Globe canvas is black or slow.
- **Resolution:** Ensure WebGL 2.0 is enabled in browser flags. A 2D list fallback view is always available in the left telemetry drawer.

### 3. Port Conflicts
- **Symptom:** `error: address already in use: 8000` or `5173`.
- **Resolution:** Configure alternative ports in `backend/.env` (`PORT=8001`) and `frontend/vite.config.ts`.
