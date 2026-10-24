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
  // Only cluster events that actually have valid coordinates
  const geoEvents = events.filter(
    e => e.latitude !== null && e.latitude !== undefined &&
         e.longitude !== null && e.longitude !== undefined
  );

  const clusters: EventCluster[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < geoEvents.length; i++) {
    const ev1 = geoEvents[i];
    if (visited.has(ev1.id)) continue;

    visited.add(ev1.id);
    const clusterMembers: NormalizedEvent[] = [ev1];

    for (let j = i + 1; j < geoEvents.length; j++) {
      const ev2 = geoEvents[j];
      if (visited.has(ev2.id)) continue;

      const dLat = Math.abs((ev1.latitude ?? 0) - (ev2.latitude ?? 0));
      let dLon = Math.abs((ev1.longitude ?? 0) - (ev2.longitude ?? 0));
      if (dLon > 180) dLon = 360 - dLon;

      const distanceDeg = Math.sqrt(dLat * dLat + dLon * dLon);
      if (distanceDeg <= thresholdDeg) {
        visited.add(ev2.id);
        clusterMembers.push(ev2);
      }
    }

    // Determine highest severity
    let highestSeverity = 'low';
    const severityRanks: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0
    };

    let maxScore = 0;
    let primary = clusterMembers[0];

    clusterMembers.forEach(m => {
      const rank = severityRanks[m.severity] || 1;
      if (rank > (severityRanks[highestSeverity] || 1)) {
        highestSeverity = m.severity;
      }
      if (m.calculated_risk_score > maxScore) {
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
      dominantDomain: primary.domain,
      events: clusterMembers,
      clusterCount: clusterMembers.length,
      primaryEvent: primary
    });
  }

  return clusters;
}
