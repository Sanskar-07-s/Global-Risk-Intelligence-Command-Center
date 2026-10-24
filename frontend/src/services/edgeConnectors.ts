import { NormalizedEvent, RiskOverview, SourceHealth, RiskDomain, SeverityLevel } from '../types';

/**
 * Direct Edge Sensor Ingestion for Production Standalone Environments.
 * When the FastAPI backend container is not reachable (e.g. Firebase Hosting SPA mode),
 * this service directly connects to verified, CORS-enabled public feeds:
 * 1. USGS Earthquake Hazards Program (GeoJSON) - Open CORS
 * 2. NASA Earth Observatory Natural Event Tracker - EONET (v3) - Open CORS
 * 3. CISA Known Exploited Vulnerabilities Catalog (KEV JSON) - Served via same-origin /data/cisa_kev.json
 * 
 * Normalization formulas and risk weightings are 100% identical to backend connectors.
 */

// Strict runtime sanitizer to guarantee all properties are present and safe
export function sanitizeNormalizedEvent(raw: any): NormalizedEvent | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = String(raw.id || `ev_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const title = String(raw.title || 'Situational Incident');
  const domain = (raw.domain || 'natural_hazard') as RiskDomain;
  // Guarantee category is a non-empty string so downstream never crashes on .category
  const category = String(raw.category || 'uncategorized');
  const severity = (['critical', 'high', 'medium', 'low', 'info'].includes(raw.severity)
    ? raw.severity
    : 'low') as SeverityLevel;

  const score = typeof raw.calculated_risk_score === 'number' && !isNaN(raw.calculated_risk_score)
    ? Math.max(0, Math.min(100, Math.round(raw.calculated_risk_score * 10) / 10))
    : 25.0;

  let lat: number | null = null;
  let lon: number | null = null;
  if (raw.latitude !== null && raw.latitude !== undefined && !isNaN(Number(raw.latitude))) {
    lat = Number(raw.latitude);
  }
  if (raw.longitude !== null && raw.longitude !== undefined && !isNaN(Number(raw.longitude))) {
    lon = Number(raw.longitude);
  }

  let depth: number | null = null;
  if (raw.depth_or_elevation !== null && raw.depth_or_elevation !== undefined && !isNaN(Number(raw.depth_or_elevation))) {
    depth = Number(raw.depth_or_elevation);
  }

  return {
    id,
    source: String(raw.source || 'unknown'),
    source_id: raw.source_id ? String(raw.source_id) : undefined,
    source_url: raw.source_url ? String(raw.source_url) : undefined,
    title,
    description: raw.description ? String(raw.description) : undefined,
    domain,
    category,
    latitude: lat,
    longitude: lon,
    depth_or_elevation: depth,
    country: raw.country ? String(raw.country) : undefined,
    region: raw.region ? String(raw.region) : undefined,
    severity,
    calculated_risk_score: score,
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.85,
    scoring_version: String(raw.scoring_version || '1.0.0-edge'),
    score_breakdown: raw.score_breakdown || {
      severity_component: Math.round(score * 0.45 * 10) / 10,
      exposure_component: Math.round(score * 0.35 * 10) / 10,
      vulnerability_component: Math.round(score * 0.20 * 10) / 10
    },
    occurrence_time: raw.occurrence_time || new Date().toISOString(),
    observation_time: raw.observation_time || new Date().toISOString(),
    first_seen_time: raw.first_seen_time || new Date().toISOString(),
    last_updated_time: raw.last_updated_time || new Date().toISOString(),
    verification_status: raw.verification_status || 'verified',
    raw_payload: raw.raw_payload || {}
  };
}

// Helper to calculate composite risk overview safely
export function calculateRiskOverview(events: NormalizedEvent[]): RiskOverview {
  let criticalCount = 0;
  let highCount = 0;
  const domainBreakdown: Record<string, number> = {};
  const severityBreakdown: Record<string, number> = {};
  let totalScore = 0;

  const validEvents = (events || []).filter(e => Boolean(e && typeof e === 'object'));

  validEvents.forEach(ev => {
    const d = ev.domain || 'natural_hazard';
    const s = ev.severity || 'low';
    domainBreakdown[d] = (domainBreakdown[d] || 0) + 1;
    severityBreakdown[s] = (severityBreakdown[s] || 0) + 1;
    totalScore += (ev.calculated_risk_score || 0);

    if (s === 'critical') criticalCount++;
    if (s === 'high') highCount++;
  });

  const avgRisk = validEvents.length > 0 ? totalScore / validEvents.length : 0;
  let threatLevel = 'ELEVATED';
  if (avgRisk >= 75) threatLevel = 'CRITICAL';
  else if (avgRisk >= 50) threatLevel = 'ELEVATED';
  else if (avgRisk >= 25) threatLevel = 'GUARDED';
  else threatLevel = 'LOW';

  return {
    global_composite_risk: Math.round(avgRisk * 10) / 10,
    threat_level: threatLevel,
    total_incidents: validEvents.length,
    critical_count: criticalCount,
    high_count: highCount,
    domain_breakdown: domainBreakdown,
    severity_breakdown: severityBreakdown
  };
}

// 1. Direct USGS Earthquake Ingestion (Open CORS)
export async function fetchUSGSEvents(): Promise<{ events: NormalizedEvent[]; latency: number }> {
  const start = performance.now();
  const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
  const data = await res.json();
  const latency = Math.round(performance.now() - start);

  const features = data?.features || [];
  const events: NormalizedEvent[] = [];

  for (const feat of features) {
    if (!feat || typeof feat !== 'object') continue;
    const props = feat.properties || {};
    const geom = feat.geometry || {};
    const coords = geom.coordinates || [0, 0, 0];

    const lon = (coords[0] !== undefined && !isNaN(Number(coords[0]))) ? Number(coords[0]) : null;
    const lat = (coords[1] !== undefined && !isNaN(Number(coords[1]))) ? Number(coords[1]) : null;
    const depth = (coords[2] !== undefined && !isNaN(Number(coords[2]))) ? Number(coords[2]) : null;

    const mag = typeof props.mag === 'number' ? props.mag : 0.0;
    const place = props.place || 'Unknown Region';
    const timeMs = props.time;
    const occTime = timeMs ? new Date(timeMs).toISOString() : new Date().toISOString();
    const eventId = `usgs:${feat.id || Math.random().toString(36).substring(7)}`;

    let sev: 'critical' | 'high' | 'medium' | 'low' = 'low';
    let riskScore = 15.0;

    if (mag >= 6.8) {
      sev = 'critical';
      riskScore = Math.min(100.0, 75.0 + (mag - 6.8) * 15.0);
    } else if (mag >= 5.5) {
      sev = 'high';
      riskScore = 55.0 + (mag - 5.5) * 15.0;
    } else if (mag >= 4.0) {
      sev = 'medium';
      riskScore = 30.0 + (mag - 4.0) * 15.0;
    } else {
      sev = 'low';
      riskScore = Math.max(5.0, mag * 7.0);
    }

    if (depth !== null && depth < 30.0 && mag >= 5.0) {
      riskScore = Math.min(100.0, riskScore + 10.0);
    }

    const sanitized = sanitizeNormalizedEvent({
      id: eventId,
      source: 'usgs',
      source_id: feat.id,
      source_url: props.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${feat.id}`,
      title: `M${mag.toFixed(1)} Earthquake - ${place}`,
      description: `Magnitude ${mag.toFixed(1)} seismic event recorded at depth of ${depth ? depth.toFixed(1) : 0}km in ${place}. Alert level: ${props.alert || 'unassigned'}.`,
      domain: 'natural_hazard',
      category: 'earthquake',
      latitude: lat,
      longitude: lon,
      depth_or_elevation: depth,
      region: place,
      severity: sev,
      calculated_risk_score: Math.round(riskScore * 10) / 10,
      confidence: 0.95,
      scoring_version: '1.0.0-edge',
      score_breakdown: {
        severity_component: Math.round(riskScore * 0.45 * 10) / 10,
        exposure_component: Math.round(riskScore * 0.35 * 10) / 10,
        vulnerability_component: Math.round(riskScore * 0.20 * 10) / 10,
        magnitude: mag,
        depth_km: depth
      },
      occurrence_time: occTime,
      observation_time: new Date().toISOString(),
      first_seen_time: new Date().toISOString(),
      last_updated_time: new Date().toISOString(),
      verification_status: 'verified',
      raw_payload: props
    });

    if (sanitized) events.push(sanitized);
  }

  return { events, latency };
}

// 2. Direct NASA EONET Natural Hazard Ingestion (Open CORS)
export async function fetchEONETEvents(): Promise<{ events: NormalizedEvent[]; latency: number }> {
  const start = performance.now();
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=40';
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`EONET HTTP ${res.status}`);
  const data = await res.json();
  const latency = Math.round(performance.now() - start);

  const rawEvents = data?.events || [];
  const events: NormalizedEvent[] = [];

  for (const item of rawEvents) {
    if (!item || typeof item !== 'object') continue;
    const evId = item.id || 'unknown';
    const title = item.title || 'Natural Event';
    const categories = Array.isArray(item.categories) ? item.categories : [];
    const catName = categories[0]?.title || 'Hazard';
    const catSlug = (catName || 'Hazard').toLowerCase().replace(/\s+/g, '_');

    const geometry = Array.isArray(item.geometry) ? item.geometry : [];
    let lat: number | null = null;
    let lon: number | null = null;
    let occTime = new Date().toISOString();

    if (geometry.length > 0) {
      const latest = geometry[geometry.length - 1];
      const coords = latest?.coordinates || [];
      if (coords.length >= 2 && !isNaN(Number(coords[0])) && !isNaN(Number(coords[1]))) {
        lon = Number(coords[0]);
        lat = Number(coords[1]);
      }
      if (latest?.date) {
        occTime = new Date(latest.date).toISOString();
      }
    }

    let sev: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    let riskScore = 48.0;

    const tLower = title.toLowerCase();
    if (tLower.includes('severe') || catSlug.includes('wildfire') || catSlug.includes('volcano')) {
      sev = 'high';
      riskScore = 72.0;
    } else if (catSlug.includes('flood') || catSlug.includes('cyclone') || catSlug.includes('typhoon')) {
      sev = 'critical';
      riskScore = 85.0;
    }

    const sources = Array.isArray(item.sources) ? item.sources : [];
    const sourceUrl = sources[0]?.url || `https://eonet.gsfc.nasa.gov/`;

    const sanitized = sanitizeNormalizedEvent({
      id: `eonet:${evId}`,
      source: 'eonet',
      source_id: evId,
      source_url: sourceUrl,
      title: title,
      description: `NASA EONET active ${catName}: ${title}. Geometry tracking active.`,
      domain: catSlug.includes('storm') || catSlug.includes('cyclone') ? 'weather_extreme' : 'natural_hazard',
      category: catSlug || 'natural_hazard',
      latitude: lat,
      longitude: lon,
      region: catName,
      severity: sev,
      calculated_risk_score: riskScore,
      confidence: 0.90,
      scoring_version: '1.0.0-edge',
      score_breakdown: {
        severity_component: Math.round(riskScore * 0.5 * 10) / 10,
        exposure_component: Math.round(riskScore * 0.3 * 10) / 10,
        vulnerability_component: Math.round(riskScore * 0.2 * 10) / 10,
      },
      occurrence_time: occTime,
      observation_time: new Date().toISOString(),
      first_seen_time: new Date().toISOString(),
      last_updated_time: new Date().toISOString(),
      verification_status: 'verified',
      raw_payload: item
    });

    if (sanitized) events.push(sanitized);
  }

  return { events, latency };
}

// 3. Direct CISA KEV Vulnerability Ingestion (CORS Safe via Same-Origin Catalog)
export async function fetchCISAKEVEvents(): Promise<{ events: NormalizedEvent[]; latency: number }> {
  const start = performance.now();
  
  // Browsers block direct cross-origin fetches to cisa.gov because cisa.gov does not send Access-Control headers.
  // We therefore load the same-origin verified catalog at /data/cisa_kev.json, with fallback to upstream.
  let res: Response;
  try {
    res = await fetch('/data/cisa_kev.json');
    if (!res.ok) throw new Error(`Local KEV catalog HTTP ${res.status}`);
  } catch {
    const upstreamUrl = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
    res = await fetch(upstreamUrl);
    if (!res.ok) throw new Error(`CISA HTTP ${res.status}`);
  }

  const data = await res.json();
  const latency = Math.round(performance.now() - start);

  const vulns = Array.isArray(data?.vulnerabilities) ? data.vulnerabilities : [];
  // Take the most recent 35 weaponized vulnerabilities
  const recent = vulns.slice(-35);

  const events: NormalizedEvent[] = [];

  for (const item of recent) {
    if (!item || typeof item !== 'object') continue;
    const cveId = item.cveID || 'CVE-UNKNOWN';
    const vendor = item.vendorProject || 'Unknown Vendor';
    const product = item.product || 'Unknown Product';
    const vulnName = item.vulnerabilityName || 'Exploited Vulnerability';
    const desc = item.shortDescription || '';
    const action = item.requiredAction || 'Apply vendor updates or remove component.';
    const dateAdded = item.dateAdded;

    let occTime = new Date().toISOString();
    if (dateAdded) {
      try {
        occTime = new Date(dateAdded).toISOString();
      } catch {
        occTime = new Date().toISOString();
      }
    }

    const isCritical = desc.toLowerCase().includes('remote code execution') || 
                       desc.toLowerCase().includes('privilege escalation') ||
                       String(item.knownRansomwareCampaignUse || '').toLowerCase().includes('known');
    
    const riskScore = isCritical ? 92.0 : 78.0;
    const sev: 'critical' | 'high' = isCritical ? 'critical' : 'high';

    const sanitized = sanitizeNormalizedEvent({
      id: `cisa:${cveId}`,
      source: 'cisa_kev',
      source_id: cveId,
      source_url: `https://nvd.nist.gov/vuln/detail/${cveId}`,
      title: `${cveId} - ${vendor} ${product}`,
      description: `${vulnName}. ${desc} Required remediation: ${action}`,
      domain: 'cybersecurity',
      category: 'vulnerability_exploit',
      latitude: null, // Global cyber entity
      longitude: null,
      region: 'Global Cyber Threat',
      severity: sev,
      calculated_risk_score: riskScore,
      confidence: 0.98,
      scoring_version: '1.0.0-edge',
      score_breakdown: {
        severity_component: isCritical ? 45.0 : 35.0,
        exposure_component: 30.0,
        vulnerability_component: 20.0,
        active_exploitation: true,
        vendor: vendor,
        product: product
      },
      occurrence_time: occTime,
      observation_time: new Date().toISOString(),
      first_seen_time: new Date().toISOString(),
      last_updated_time: new Date().toISOString(),
      verification_status: 'verified',
      raw_payload: { vendor, product, action, cveID: cveId, shortDescription: desc }
    });

    if (sanitized) events.push(sanitized);
  }

  return { events, latency };
}

// Aggregated Direct Edge Telemetry
export async function fetchAllEdgeTelemetry(): Promise<{
  events: NormalizedEvent[];
  sources: SourceHealth[];
  overview: RiskOverview;
}> {
  const [usgsRes, eonetRes, cisaRes] = await Promise.allSettled([
    fetchUSGSEvents(),
    fetchEONETEvents(),
    fetchCISAKEVEvents()
  ]);

  const allEvents: NormalizedEvent[] = [];
  const sources: SourceHealth[] = [];

  // USGS
  if (usgsRes.status === 'fulfilled') {
    allEvents.push(...usgsRes.value.events);
    sources.push({
      source_name: 'usgs',
      display_name: 'USGS Earthquake Hazards Program',
      domain: 'natural_hazard',
      status: 'operational',
      total_events_ingested: usgsRes.value.events.length,
      latency_ms: usgsRes.value.latency,
      is_enabled: true,
      last_checked: new Date().toISOString()
    });
  } else {
    sources.push({
      source_name: 'usgs',
      display_name: 'USGS Earthquake Hazards Program',
      domain: 'natural_hazard',
      status: 'failing',
      total_events_ingested: 0,
      latency_ms: 0,
      error_message: String(usgsRes.reason?.message || 'Connection failed'),
      is_enabled: true
    });
  }

  // EONET
  if (eonetRes.status === 'fulfilled') {
    allEvents.push(...eonetRes.value.events);
    sources.push({
      source_name: 'eonet',
      display_name: 'NASA Earth Observatory Natural Event Tracker (EONET)',
      domain: 'natural_hazard',
      status: 'operational',
      total_events_ingested: eonetRes.value.events.length,
      latency_ms: eonetRes.value.latency,
      is_enabled: true,
      last_checked: new Date().toISOString()
    });
  } else {
    sources.push({
      source_name: 'eonet',
      display_name: 'NASA Earth Observatory Natural Event Tracker (EONET)',
      domain: 'natural_hazard',
      status: 'failing',
      total_events_ingested: 0,
      latency_ms: 0,
      error_message: String(eonetRes.reason?.message || 'Connection failed'),
      is_enabled: true
    });
  }

  // CISA KEV
  if (cisaRes.status === 'fulfilled') {
    allEvents.push(...cisaRes.value.events);
    sources.push({
      source_name: 'cisa_kev',
      display_name: 'CISA Known Exploited Vulnerabilities (KEV)',
      domain: 'cybersecurity',
      status: 'operational',
      total_events_ingested: cisaRes.value.events.length,
      latency_ms: cisaRes.value.latency,
      is_enabled: true,
      last_checked: new Date().toISOString()
    });
  } else {
    sources.push({
      source_name: 'cisa_kev',
      display_name: 'CISA Known Exploited Vulnerabilities (KEV)',
      domain: 'cybersecurity',
      status: 'failing',
      total_events_ingested: 0,
      latency_ms: 0,
      error_message: String(cisaRes.reason?.message || 'Connection failed'),
      is_enabled: true
    });
  }

  // Sort by calculated risk score descending
  allEvents.sort((a, b) => b.calculated_risk_score - a.calculated_risk_score);

  const overview = calculateRiskOverview(allEvents);

  return {
    events: allEvents,
    sources,
    overview
  };
}
