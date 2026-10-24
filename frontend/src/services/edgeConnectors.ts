import { NormalizedEvent, RiskOverview, SourceHealth } from '../types';

/**
 * Direct Edge Sensor Ingestion for Production Standalone Environments.
 * When the FastAPI backend container is not reachable (e.g. Firebase Hosting SPA mode),
 * this service directly connects to verified, CORS-enabled public feeds:
 * 1. USGS Earthquake Hazards Program (GeoJSON)
 * 2. NASA Earth Observatory Natural Event Tracker - EONET (v3)
 * 3. CISA Known Exploited Vulnerabilities Catalog (KEV JSON)
 * 
 * Normalization formulas and risk weightings are 100% identical to backend connectors.
 */

// Helper to calculate composite risk overview
export function calculateRiskOverview(events: NormalizedEvent[]): RiskOverview {
  let criticalCount = 0;
  let highCount = 0;
  const domainBreakdown: Record<string, number> = {};
  const severityBreakdown: Record<string, number> = {};
  let totalScore = 0;

  events.forEach(ev => {
    domainBreakdown[ev.domain] = (domainBreakdown[ev.domain] || 0) + 1;
    severityBreakdown[ev.severity] = (severityBreakdown[ev.severity] || 0) + 1;
    totalScore += ev.calculated_risk_score;

    if (ev.severity === 'critical') criticalCount++;
    if (ev.severity === 'high') highCount++;
  });

  const avgRisk = events.length > 0 ? totalScore / events.length : 0;
  let threatLevel = 'ELEVATED';
  if (avgRisk >= 75) threatLevel = 'CRITICAL';
  else if (avgRisk >= 50) threatLevel = 'ELEVATED';
  else if (avgRisk >= 25) threatLevel = 'GUARDED';
  else threatLevel = 'LOW';

  return {
    global_composite_risk: Math.round(avgRisk * 10) / 10,
    threat_level: threatLevel,
    total_incidents: events.length,
    critical_count: criticalCount,
    high_count: highCount,
    domain_breakdown: domainBreakdown,
    severity_breakdown: severityBreakdown
  };
}

// 1. Direct USGS Earthquake Ingestion
export async function fetchUSGSEvents(): Promise<{ events: NormalizedEvent[]; latency: number }> {
  const start = performance.now();
  const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
  const data = await res.json();
  const latency = Math.round(performance.now() - start);

  const features = data.features || [];
  const events: NormalizedEvent[] = features.map((feat: any) => {
    const props = feat.properties || {};
    const geom = feat.geometry || {};
    const coords = geom.coordinates || [0, 0, 0];

    const lon = coords[0] !== undefined ? coords[0] : null;
    const lat = coords[1] !== undefined ? coords[1] : null;
    const depth = coords[2] !== undefined ? coords[2] : null;

    const mag = props.mag || 0.0;
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

    return {
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
    };
  });

  return { events, latency };
}

// 2. Direct NASA EONET Natural Hazard Ingestion
export async function fetchEONETEvents(): Promise<{ events: NormalizedEvent[]; latency: number }> {
  const start = performance.now();
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=40';
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`EONET HTTP ${res.status}`);
  const data = await res.json();
  const latency = Math.round(performance.now() - start);

  const rawEvents = data.events || [];
  const events: NormalizedEvent[] = [];

  for (const item of rawEvents) {
    const evId = item.id || 'unknown';
    const title = item.title || 'Natural Event';
    const categories = item.categories || [];
    const catName = categories[0]?.title || 'Hazard';
    const catSlug = catName.toLowerCase().replace(/\s+/g, '_');

    const geometry = item.geometry || [];
    let lat: number | null = null;
    let lon: number | null = null;
    let occTime = new Date().toISOString();

    if (geometry.length > 0) {
      const latest = geometry[geometry.length - 1];
      const coords = latest.coordinates || [];
      if (coords.length >= 2) {
        lon = Number(coords[0]);
        lat = Number(coords[1]);
      }
      if (latest.date) {
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

    const sources = item.sources || [];
    const sourceUrl = sources[0]?.url || `https://eonet.gsfc.nasa.gov/`;

    events.push({
      id: `eonet:${evId}`,
      source: 'eonet',
      source_id: evId,
      source_url: sourceUrl,
      title: title,
      description: `NASA EONET active ${catName}: ${title}. Geometry tracking active.`,
      domain: catSlug.includes('storm') || catSlug.includes('cyclone') ? 'weather_extreme' : 'natural_hazard',
      category: catSlug,
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
  }

  return { events, latency };
}

// 3. Direct CISA KEV Vulnerability Ingestion
export async function fetchCISAKEVEvents(): Promise<{ events: NormalizedEvent[]; latency: number }> {
  const start = performance.now();
  const url = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CISA HTTP ${res.status}`);
  const data = await res.json();
  const latency = Math.round(performance.now() - start);

  const vulns = data.vulnerabilities || [];
  // Take the most recent 35 weaponized vulnerabilities
  const recent = vulns.slice(-35);

  const events: NormalizedEvent[] = recent.map((item: any) => {
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

    return {
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
    };
  });

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
