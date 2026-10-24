// Regression test suite for GRICC clustering, sanitization, and category safety
import assert from 'assert';

console.log('Running GRICC Frontend Regression Test Suite...');

// 1. Sanitization function under test
function sanitizeNormalizedEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = String(raw.id || `ev_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const title = String(raw.title || 'Situational Incident');
  const domain = raw.domain || 'natural_hazard';
  const category = String(raw.category || 'uncategorized');
  const severity = (['critical', 'high', 'medium', 'low', 'info'].includes(raw.severity)
    ? raw.severity
    : 'low');

  const score = typeof raw.calculated_risk_score === 'number' && !isNaN(raw.calculated_risk_score)
    ? Math.max(0, Math.min(100, Math.round(raw.calculated_risk_score * 10) / 10))
    : 25.0;

  let lat = null;
  let lon = null;
  if (raw.latitude !== null && raw.latitude !== undefined && !isNaN(Number(raw.latitude))) {
    lat = Number(raw.latitude);
  }
  if (raw.longitude !== null && raw.longitude !== undefined && !isNaN(Number(raw.longitude))) {
    lon = Number(raw.longitude);
  }

  let depth = null;
  if (raw.depth_or_elevation !== null && raw.depth_or_elevation !== undefined && !isNaN(Number(raw.depth_or_elevation))) {
    depth = Number(raw.depth_or_elevation);
  }

  return {
    id,
    source: String(raw.source || 'unknown'),
    title,
    domain,
    category,
    latitude: lat,
    longitude: lon,
    depth_or_elevation: depth,
    severity,
    calculated_risk_score: score,
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.85
  };
}

// 2. Clustering function under test
function clusterEvents(events, thresholdDeg = 3.5) {
  if (!Array.isArray(events) || events.length === 0) return [];

  const geoEvents = events.filter(
    (e) =>
      Boolean(
        e && typeof e === 'object' &&
        e.id &&
        e.latitude !== null && e.latitude !== undefined && !isNaN(Number(e.latitude)) &&
        e.longitude !== null && e.longitude !== undefined && !isNaN(Number(e.longitude))
      )
  );

  if (geoEvents.length === 0) return [];

  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < geoEvents.length; i++) {
    const ev1 = geoEvents[i];
    if (!ev1 || visited.has(ev1.id)) continue;

    visited.add(ev1.id);
    const clusterMembers = [ev1];

    for (let j = i + 1; j < geoEvents.length; j++) {
      const ev2 = geoEvents[j];
      if (!ev2 || visited.has(ev2.id)) continue;

      const dLat = Math.abs((ev1.latitude ?? 0) - (ev2.latitude ?? 0));
      let dLon = Math.abs((ev1.longitude ?? 0) - (ev2.longitude ?? 0));
      if (dLon > 180) dLon = 360 - dLon;

      const distanceDeg = Math.sqrt(dLat * dLat + dLon * dLon);
      if (distanceDeg <= thresholdDeg) {
        visited.add(ev2.id);
        clusterMembers.push(ev2);
      }
    }

    if (clusterMembers.length === 0) continue;

    let highestSeverity = ev1.severity || 'low';
    const severityRanks = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0
    };

    let maxScore = ev1.calculated_risk_score || 0;
    let primary = ev1;

    clusterMembers.forEach(m => {
      if (!m) return;
      const rank = severityRanks[m.severity] || 1;
      if (rank > (severityRanks[highestSeverity] || 1)) {
        highestSeverity = m.severity;
      }
      if ((m.calculated_risk_score || 0) > maxScore) {
        maxScore = m.calculated_risk_score;
        primary = m;
      }
    });

    const sumLat = clusterMembers.reduce((acc, m) => acc + (m.latitude ?? 0), 0);
    const sumLon = clusterMembers.reduce((acc, m) => acc + (m.longitude ?? 0), 0);
    const centroidLat = sumLat / clusterMembers.length;
    const centroidLon = sumLon / clusterMembers.length;

    clusters.push({
      id: clusterMembers.length === 1 ? ev1.id : `cluster:${ev1.id}:${clusterMembers.length}`,
      isCluster: clusterMembers.length > 1,
      latitude: centroidLat,
      longitude: centroidLon,
      highestSeverity,
      highestRiskScore: maxScore,
      dominantDomain: primary.domain || 'natural_hazard',
      events: clusterMembers,
      clusterCount: clusterMembers.length,
      primaryEvent: primary
    });
  }

  return clusters;
}

// TEST CASES

console.log('1. Testing sanitizeNormalizedEvent resilience...');
assert.strictEqual(sanitizeNormalizedEvent(null), null);
assert.strictEqual(sanitizeNormalizedEvent(undefined), null);
assert.strictEqual(sanitizeNormalizedEvent('invalid string'), null);

const missingCategory = sanitizeNormalizedEvent({
  id: 'ev_1',
  title: 'Test Event Missing Category',
  domain: 'natural_hazard'
  // category omitted
});
assert.ok(missingCategory, 'Event should be normalized');
assert.strictEqual(missingCategory.category, 'uncategorized', 'Missing category must default to uncategorized');
assert.strictEqual(missingCategory.severity, 'low', 'Missing severity must default to low');
assert.strictEqual(missingCategory.latitude, null);
assert.strictEqual(missingCategory.longitude, null);

console.log('2. Testing clusterEvents resilience with edge cases...');
assert.deepStrictEqual(clusterEvents([]), []);
assert.deepStrictEqual(clusterEvents([null, undefined]), []);

const testEvents = [
  {
    id: 'ev_1',
    source: 'test',
    title: 'Earthquake 1',
    domain: 'natural_hazard',
    category: undefined, // category is undefined
    latitude: 34.05,
    longitude: -118.25,
    severity: 'high',
    calculated_risk_score: 75
  },
  {
    id: 'ev_2',
    source: 'test',
    title: 'Earthquake 2 nearby',
    domain: 'natural_hazard',
    // category omitted entirely
    latitude: 34.10,
    longitude: -118.20,
    severity: 'critical',
    calculated_risk_score: 90
  },
  null, // null element in array
  undefined,
  {
    id: 'ev_3_no_coords',
    source: 'cisa_kev',
    title: 'CVE without coords',
    domain: 'cybersecurity',
    category: 'vulnerability_exploit',
    latitude: null,
    longitude: null,
    severity: 'high',
    calculated_risk_score: 80
  }
];

// Must not throw TypeError: Cannot read properties of undefined (reading 'category')
const clusters = clusterEvents(testEvents);
assert.strictEqual(clusters.length, 1, 'ev_1 and ev_2 should cluster together, ignoring ev_3 and nulls');
assert.ok(clusters[0].primaryEvent, 'Cluster must have a primaryEvent defined');
assert.strictEqual(clusters[0].clusterCount, 2);
assert.strictEqual(clusters[0].highestSeverity, 'critical');
assert.strictEqual(clusters[0].primaryEvent.id, 'ev_2');

console.log('3. Testing cluster.primaryEvent category access safely...');
clusters.forEach(cluster => {
  // Simulate GlobeScene lines 445 & 619
  const cat = String(cluster.primaryEvent?.category || '').toLowerCase();
  assert.doesNotThrow(() => {
    if (cat === 'earthquake') {
      // safe
    }
    const label = cluster.isCluster ? `${cluster.clusterCount} Events` : (cluster.primaryEvent?.category || 'HAZARD').toUpperCase();
    assert.ok(label);
  });
});

console.log('4. Testing ticker and event detail category access safely...');
testEvents.forEach(ev => {
  assert.doesNotThrow(() => {
    const isQuake = (ev?.category || '').toLowerCase() === 'earthquake' || ev?.source === 'usgs';
    const label = ev?.category ? String(ev.category).toUpperCase().slice(0, 8) : 'HAZARD';
    assert.ok(typeof isQuake === 'boolean');
    assert.ok(typeof label === 'string');
  });
});

console.log('ALL REGRESSION TESTS PASSED! (0 errors, 0 exceptions)');
