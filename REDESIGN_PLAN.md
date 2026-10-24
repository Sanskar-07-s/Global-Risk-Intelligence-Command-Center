# GRICC 2.0 — Immersive Sci-Fi Redesign Plan
**Lead Product Designer, Creative Director & Visualization Architect**

---

## 1. Baseline Audit & Design Critique

### Current 1.0 State
- **Layout:** Standard admin dashboard with rigid top header (64px) and left sidebar (256px), boxing the 3D globe into a constrained container.
- **Visuals:** Generic cyan neon borders, heavy glassmorphic overlays, busy tactical grid lines, repetitive card grids across all sub-workspaces.
- **Cognitive Load:** Simultaneous display of dozens of metrics, all-caps technical jargon, and cluttered badges.
- **3D Visualization:** Procedural dot-matrix Earth with basic Phong material; lacks realistic atmospheric scatter, depth shading, event clustering, and cinematic camera controls.

---

## 2. Redesign Architecture & Principles

### A. The Cinematic Command Environment (Home / Operations)
1. **Unconstrained Planetary Canvas:** Full-viewport 3D Earth using Three.js with deep space background (`#05070B`), high-definition continents, volumetric Rayleigh-like atmospheric limb glow, and orbital starfield.
2. **Integrated Spatial Command Interface:** A floating, minimalist natural-language intelligence bar (`cmd + k`) floating over the upper planetary field, accepting plain-language intelligence queries and providing instant contextual feedback.
3. **Spatial Event Pins & Clustered Hotspots:** Restrained glowing nodes with depth attenuation, subtle pulsing rings, and hover tooltips showing title, magnitude/risk, and domain.
4. **Contextual Intelligence Surface (Progressive Disclosure):**
   - Level 1: What happened? Where and when? (Headline, location, timestamp)
   - Level 2: Operational significance & why it matters (Impact summary)
   - Level 3: Evidence provenance & sensor source (USGS, EONET, CISA, Open-Meteo)
   - Level 4: Stated uncertainty & next actionable moves (Pin to case, simulate cascade, deep dive with AI)
   - Level 5: Expandable technical score breakdown & raw payload.
5. **Minimal Floating Command Rail:** Ultra-slim floating dock (48px) with subtle active indicators, tooltips, and zero wasted screen real estate.

### B. Color & Typography Tokens
- **Background / Space:** `#05070B`
- **Raised Surfaces:** `#0B1018` (alpha 0.85 with subtle blur)
- **Secondary Surfaces:** `#111925`
- **Separators:** `rgba(255, 255, 255, 0.07)`
- **Primary Typography:** `#F2F5FA` (Inter / System Sans)
- **Secondary Typography:** `#8D9AAA`
- **Intelligence Cyan:** `#72DDFB` (used sparingly for active selection)
- **Signal Amber:** `#FFBD69` (elevated threats)
- **Critical Red:** `#FF626B` (critical incidents)
- **Verified Green:** `#80D7A2` (operational telemetry)
- **Technical Font:** JetBrains Mono strictly for coordinates, hashes, and timestamps.

### C. Cohesive Workspaces Redesign
- **Threat Intelligence:** Spatial threat landscape with timeline scrubber, CISA KEV exploitation feed, and severity hierarchy.
- **Knowledge Graph:** Modern interactive force topology with subtle links, entity clustering, and clear distinction between sourced and inferred links.
- **Risk Analytics:** Executive-grade ECharts analytics on dark obsidian canvas with zero visual clutter.
- **Scenario Laboratory:** Interactive cascading timeline simulator with clear assumptions and non-predictive disclaimers.
- **AI Intelligence Desk:** Clean research workbench with grounded citation badges, comparative briefs, and follow-up prompts.
- **Data Health:** Real sensor telemetry with honest latency, zero fake green, and manual refresh controls.
- **Cases & Reports:** Clean intelligence binder with reading-first typography, pinned event nodes, and JSON export.

---

## 3. Implementation Phases
- [x] Phase A: Baseline audit & plan creation
- [ ] Phase B: Core Design System & Tailwind tokens (`tailwind.config.js`, `index.css`)
- [ ] Phase C: Cinematic 3D Globe with realistic textures, atmosphere shader, and event clustering (`GlobeScene.tsx`)
- [ ] Phase D: Floating Command Shell & Minimal Navigation Dock (`Header.tsx`, `Sidebar.tsx`, `App.tsx`)
- [ ] Phase E: Progressive Disclosure Operations Center (`OperationsCenter.tsx`)
- [ ] Phase F: Redesign all 7 secondary workspaces (Threats, Graph, Analytics, Scenarios, AI Desk, Data Health, Cases)
- [ ] Phase G: Build, Typecheck, End-to-End Verification, and Documentation
