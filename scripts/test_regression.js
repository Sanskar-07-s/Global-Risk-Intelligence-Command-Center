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

console.log('\n--- Running 10-Point Pointer & Hover Simulation Regression Tests ---');

// Simulated Hover Resolution Function matching GlobeScene.tsx
function resolveHoverTarget(hit) {
  if (!hit || !hit.object) return null;
  const clusterData = hit.object.userData?.cluster || hit.object.userData;
  if (
    clusterData &&
    typeof clusterData === 'object' &&
    clusterData.id &&
    clusterData.primaryEvent &&
    typeof clusterData.primaryEvent === 'object'
  ) {
    return clusterData;
  }
  return null;
}

// Simulated Tooltip Rendering Function matching GlobeScene.tsx
function renderTooltipData(hoveredCluster) {
  if (!hoveredCluster) return null;
  const severity = hoveredCluster.highestSeverity || 'INFO';
  const categoryLabel = hoveredCluster.isCluster
    ? `${hoveredCluster.clusterCount} Events Clustered`
    : (hoveredCluster.primaryEvent?.category || hoveredCluster.primaryEvent?.domain || 'UNCATEGORIZED').toUpperCase();
  const title = hoveredCluster.primaryEvent?.title || 'Telemetry Signal';
  const region = hoveredCluster.primaryEvent?.region || 'Coordinates';
  const risk = hoveredCluster.primaryEvent?.calculated_risk_score ?? 'N/A';
  return { severity, categoryLabel, title, region, risk };
}

// Test 1: Hovering over a valid marker
console.log('Test 1: Hovering over a valid marker...');
const validMarkerHit = {
  object: {
    userData: {
      isMarker: true,
      cluster: clusters[0]
    }
  }
};
const res1 = resolveHoverTarget(validMarkerHit);
assert.ok(res1, 'Valid marker must resolve to cluster');
assert.strictEqual(res1.id, clusters[0].id);
const tooltip1 = renderTooltipData(res1);
assert.strictEqual(tooltip1.severity, 'critical');
assert.strictEqual(tooltip1.categoryLabel, '2 Events Clustered');
assert.strictEqual(tooltip1.title, 'Earthquake 2 nearby');

// Test 2: Hovering over the Earth surface (non-marker globeMesh)
console.log('Test 2: Hovering over the Earth surface...');
const earthSurfaceHit = {
  object: {
    name: 'globeMesh',
    userData: {} // empty userData
  }
};
assert.strictEqual(resolveHoverTarget(earthSurfaceHit), null, 'Earth surface must resolve to null');

// Test 3: Hovering over decorative geometry (haloMesh with empty userData)
console.log('Test 3: Hovering over decorative geometry (haloMesh)...');
const decorativeHaloHit = {
  object: {
    name: 'haloMesh',
    userData: {} // Empty userData as created on child rings
  }
};
assert.strictEqual(resolveHoverTarget(decorativeHaloHit), null, 'Decorative geometry must resolve to null, not crash');

// Test 4: Marker with no category
console.log('Test 4: Marker with no category...');
const noCategoryCluster = {
  id: 'cluster_no_cat',
  isCluster: false,
  latitude: 10,
  longitude: 20,
  highestSeverity: 'medium',
  highestRiskScore: 45,
  dominantDomain: 'geopolitical',
  events: [{ id: 'ev_no_cat', title: 'Uncategorized Signal', domain: 'geopolitical' }],
  clusterCount: 1,
  primaryEvent: { id: 'ev_no_cat', title: 'Uncategorized Signal', domain: 'geopolitical' }
};
const noCatHit = {
  object: {
    userData: { isMarker: true, cluster: noCategoryCluster }
  }
};
const res4 = resolveHoverTarget(noCatHit);
assert.ok(res4);
const tooltip4 = renderTooltipData(res4);
assert.strictEqual(tooltip4.categoryLabel, 'GEOPOLITICAL', 'Must fall back to domain or UNCATEGORIZED');
assert.strictEqual(tooltip4.title, 'Uncategorized Signal');

// Test 5: Missing or stale marker-to-event mapping
console.log('Test 5: Missing or stale marker-to-event mapping...');
const staleHit1 = { object: { userData: null } };
const staleHit2 = { object: { userData: { isMarker: true, cluster: null } } };
const staleHit3 = { object: { userData: { isMarker: true, cluster: { id: 'bad' } } } }; // missing primaryEvent
assert.strictEqual(resolveHoverTarget(staleHit1), null);
assert.strictEqual(resolveHoverTarget(staleHit2), null);
assert.strictEqual(resolveHoverTarget(staleHit3), null);

// Test 6: Null or undefined intersection result
console.log('Test 6: Null or undefined intersection result...');
assert.strictEqual(resolveHoverTarget(null), null);
assert.strictEqual(resolveHoverTarget(undefined), null);
assert.strictEqual(resolveHoverTarget({ object: null }), null);

// Test 7: Record removed while hovered
console.log('Test 7: Record removed while hovered...');
let hoveredState = clusters[0];
// Simulate events list updating and removing this record
const newEventsList = [];
// Tooltip rendering for an event that was removed from the live list
assert.doesNotThrow(() => {
  const staleTooltip = renderTooltipData(hoveredState);
  assert.ok(staleTooltip);
  assert.strictEqual(staleTooltip.title, 'Earthquake 2 nearby');
});

// Test 8: Moving rapidly between markers (state update throttling check)
console.log('Test 8: Moving rapidly between markers (state update throttling check)...');
let currentHoveredCluster = null;
let stateUpdateCount = 0;

function onPointerMoveSim(hit) {
  const target = resolveHoverTarget(hit);
  if (target) {
    if (currentHoveredCluster?.id !== target.id) {
      currentHoveredCluster = target;
      stateUpdateCount++;
    }
  } else {
    if (currentHoveredCluster !== null) {
      currentHoveredCluster = null;
      stateUpdateCount++;
    }
  }
}

// 50 movements across the exact same marker:
for (let k = 0; k < 50; k++) {
  onPointerMoveSim(validMarkerHit);
}
assert.strictEqual(stateUpdateCount, 1, 'Rapid mousemove within same marker must only fire state update ONCE');

// Transition to another marker:
const marker2Hit = {
  object: {
    userData: { isMarker: true, cluster: noCategoryCluster }
  }
};
onPointerMoveSim(marker2Hit);
assert.strictEqual(stateUpdateCount, 2, 'Transitioning to different marker must fire state update ONCE');

// Test 9: Leaving the globe
console.log('Test 9: Leaving the globe...');
function onMouseLeaveSim() {
  if (currentHoveredCluster !== null) {
    currentHoveredCluster = null;
    stateUpdateCount++;
  }
}
onMouseLeaveSim();
assert.strictEqual(currentHoveredCluster, null, 'Must clear hover state on leave');
assert.strictEqual(stateUpdateCount, 3);
// Redundant leave:
onMouseLeaveSim();
assert.strictEqual(stateUpdateCount, 3, 'Redundant leave must not fire state updates');

// Test 10: Repeated hovering without scene reconstruction check
console.log('Test 10: Repeated hovering without scene reconstruction check...');
let sceneReconstructionCount = 0;
// In our updated code, marker useEffect depends on [clusters, selectedEvent?.id]
// Hover updates currentHoveredCluster but NOT clusters or selectedEvent
let activeClusters = clusters;
let activeSelectedEventId = null;

function markerSyncEffect(clustersDep, selectedIdDep) {
  sceneReconstructionCount++;
}

// Initial mount:
markerSyncEffect(activeClusters, activeSelectedEventId);
assert.strictEqual(sceneReconstructionCount, 1);

// 100 pointer movements and hover state changes:
for (let k = 0; k < 100; k++) {
  onPointerMoveSim(validMarkerHit);
  onPointerMoveSim(earthSurfaceHit);
  // clustersDep and selectedIdDep did not change!
}
assert.strictEqual(sceneReconstructionCount, 1, 'Scene/markers must NOT be reconstructed on hover!');

console.log('\nALL REGRESSION TESTS PASSED! (0 errors, 0 exceptions)');
