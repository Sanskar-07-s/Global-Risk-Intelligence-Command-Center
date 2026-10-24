# GRICC Security Policy & Guidelines

## 1. Credential Management
- **Zero Secrets in Code:** All external API tokens, database connection strings, and cryptographic secrets are supplied via environment variables (`.env`).
- **Frontend Isolation:** Only public, client-safe variables (`VITE_` prefixed, e.g. Firebase public config, Cesium public token) are exposed in the client build. All LLM keys (Gemini), NASA FIRMS keys, and administrative tokens remain exclusively on the FastAPI backend.
- **Git Protection:** `.gitignore` explicitly prevents tracking of `.env`, `.env.*`, keys, certs, and credentials.

## 2. Input Validation & API Hardening
- All incoming requests in FastAPI are strictly validated using Pydantic v2 schemas.
- CORS policies enforce allowed origins strictly.
- Request rate limiting and payload size limits are enabled to mitigate denial of service.

## 3. Untrusted Data Handling & LLM Prompt Injection Defenses
- Intelligence reports and news feed content retrieved from external sources are treated as untrusted data.
- System prompts are structurally partitioned; external data is injected into bounded context delimiters to prevent prompt injection and model steering.
