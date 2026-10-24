# GRICC API Integrations Guide

This document describes all external data connectors integrated into the Global Risk Intelligence Command Center.

---

## 1. USGS Earthquake Hazards Program
- **Domain:** Natural Hazards / Seismic Activity
- **Endpoint:** `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson`
- **Authentication:** Public / None required
- **Update Frequency:** Real-time (refreshed every cycle)
- **Extracted Fields:** Magnitude, coordinates `(lat, lon, depth)`, place name, occurrence timestamp, tsunami alert flag.

---

## 2. NASA Earth Observatory Natural Event Tracker (EONET)
- **Domain:** Natural Hazards & Environmental Emergencies
- **Endpoint:** `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50`
- **Authentication:** Public (optional NASA API key in backend)
- **Categories:** Wildfires, Severe Storms, Volcanoes, Floods, Sea/Lake Ice.
- **Extracted Fields:** Event title, category, date, tracking geometry coordinates, source links.

---

## 3. CISA Known Exploited Vulnerabilities (KEV) Catalog
- **Domain:** Cybersecurity & Critical Infrastructure Threats
- **Endpoint:** `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
- **Authentication:** Public
- **Significance:** Catalogs software vulnerabilities actively weaponized in the wild.
- **Extracted Fields:** CVE ID, vendor/project, product, vulnerability description, required action, date added.

---

## 4. Open-Meteo Severe Weather & Atmospheric Anomalies
- **Domain:** Meteorological Extremes & Strategic Corridors
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Authentication:** Public
- **Key Monitoring Hotspots:**
  - Strait of Malacca (Lat: 1.43, Lon: 102.89)
  - Suez Canal / Red Sea (Lat: 29.97, Lon: 32.55)
  - Panama Canal (Lat: 9.10, Lon: -79.69)
  - Gulf of Mexico / Houston Hub (Lat: 29.30, Lon: -94.79)
  - Tokyo Bay Logistics Corridor (Lat: 35.68, Lon: 139.76)
- **Extracted Fields:** 2m Temperature, 10m Wind Speed, Precipitation, Weather Code.

---

## 5. NASA FIRMS (Fire Information for Resource Management System)
- **Domain:** Satellite Thermal Anomalies & Wildfires
- **Authentication:** NASA FIRMS Map Key
- **Sensors:** VIIRS & MODIS satellite constellations
- **Extracted Fields:** Latitude, Longitude, Fire Radiative Power (MW), Acquisition Date, Satellite Confidence.

---

## 6. GDELT Project (Global Database of Events, Language, and Tone)
- **Domain:** Geopolitical Conflict & Instability Monitoring
- **Endpoint:** `https://api.gdeltproject.org/api/v2/doc/doc`
- **Query Filters:** `conflict`, `sanctions`, `military`, `crisis`, `protest`
- **Extracted Fields:** News headline, media domain, article URL, publication timestamp, regional tags.

---

## 7. World Bank API
- **Domain:** Macroeconomic Fragility & Trade Vulnerability
- **Endpoint:** `https://api.worldbank.org/v2/country/.../indicator/FP.CPI.TOTL.ZG`
- **Extracted Fields:** Annual Consumer Price Index change, reporting period, country ISO code.

---

## 8. Google Gemini AI Analyst
- **Domain:** Evidence-Grounded Brief Synthesis & Natural Language Querying
- **Model:** `gemini-2.5-flash`
- **Grounding Mechanism:** Pre-filtered retrieved normalized event records are formatted as JSON evidence and injected into an isolated analysis prompt. Includes automated citations `[id]`.
