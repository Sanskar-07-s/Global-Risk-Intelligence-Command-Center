import { NormalizedEvent } from '../types';

export interface EventCluster {
  id: string;
  isCluster: boolean;
  latitude: number;
  longitude: number;
  highestSeverity: string;
  highestRiskScore: number;
  dominantDomain: string;
  events: NormalizedEvent[];
  clusterCount: number;
  primaryEvent: NormalizedEvent;
}

export function clusterEvents(
  events: NormalizedEvent[],
  thresholdDeg: number = 3.5
): EventCluster[] {
  if (!Array.isArray(events) || events.length === 0) return [];

  // Filter out any undefined, null, or malformed events, or events without coordinates
  const geoEvents = events.filter(
    (e): e is NormalizedEvent =>
      Boolean(
        e && typeof e === 'object' &&
        e.id &&
        e.latitude !== null && e.latitude !== undefined && !isNaN(Number(e.latitude)) &&
        e.longitude !== null && e.longitude !== undefined && !isNaN(Number(e.longitude))
      )
  );

  if (geoEvents.length === 0) return [];

  const clusters: EventCluster[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < geoEvents.length; i++) {
    const ev1 = geoEvents[i];
    if (!ev1 || visited.has(ev1.id)) continue;

    visited.add(ev1.id);
    const clusterMembers: NormalizedEvent[] = [ev1];

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

    // Determine highest severity
    let highestSeverity = ev1.severity || 'low';
    const severityRanks: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0
    };

    let maxScore = ev1.calculated_risk_score || 0;
    let primary: NormalizedEvent = ev1;

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

    // Compute centroid
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
