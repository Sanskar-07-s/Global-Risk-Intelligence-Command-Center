export type RiskDomain = 
  | 'natural_hazard'
  | 'geopolitical'
  | 'cybersecurity'
  | 'weather_extreme'
  | 'economic'
  | 'infrastructure';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface ScoreBreakdown {
  severity_component: number;
  exposure_component: number;
  vulnerability_component: number;
  freshness_component?: number;
  explanation?: string;
  [key: string]: any;
}

export interface NormalizedEvent {
  id: string;
  source: string;
  source_id?: string;
  source_url?: string;
  title: string;
  description?: string;
  domain: RiskDomain;
  category?: string;

  latitude?: number | null;
  longitude?: number | null;
  depth_or_elevation?: number | null;
  country?: string;
  region?: string;

  severity: SeverityLevel;
  calculated_risk_score: number;
  confidence: number;
  scoring_version: string;
  score_breakdown?: ScoreBreakdown;

  occurrence_time?: string;
  observation_time?: string;
  first_seen_time?: string;
  last_updated_time?: string;

  verification_status: 'verified' | 'unconfirmed' | 'simulated' | 'inferred';
  raw_payload?: Record<string, any>;
  related_event_ids?: string[];
}

export interface CorrelationLink {
  source_id: string;
  target_id: string;
  relationship: string;
  nature: 'inferred' | 'sourced' | 'hypothetical';
  distance_km?: number;
  confidence: number;
  description: string;
}

export interface SourceHealth {
  source_name: string;
  display_name: string;
  domain: string;
  status: 'operational' | 'degraded' | 'failing' | 'pending';
  last_checked?: string;
  last_success?: string;
  total_events_ingested: number;
  latency_ms: number;
  error_message?: string;
  is_enabled: boolean;
}

export interface RiskOverview {
  global_composite_risk: number;
  threat_level: string;
  total_incidents: number;
  critical_count: number;
  high_count: number;
  domain_breakdown: Record<string, number>;
  severity_breakdown: Record<string, number>;
}

export interface AICitedBrief {
  summary: string;
  key_findings: string[];
  risk_assessment: string;
  recommended_actions: string[];
  citations: Array<{
    citation_id: string;
    title: string;
    source: string;
    url?: string;
    domain: string;
    severity: string;
    risk_score: number;
  }>;
  confidence_level: string;
  missing_evidence: string[];
}

export interface ScenarioSimulationRequest {
  name: string;
  trigger_domain: string;
  trigger_event_title: string;
  trigger_severity: string;
  target_region: string;
  cascading_sectors: string[];
  hypothetical_duration_days?: number;
}

export interface ScenarioSimulationResult {
  simulation_id: string;
  title: string;
  risk_score_projection: number;
  affected_sectors: Array<{
    sector: string;
    projected_disruption_index: number;
    downstream_cascades: string[];
    resilience_buffer_days: number;
  }>;
  cascading_timeline: Array<{
    day: number;
    phase: string;
    milestone: string;
    estimated_system_stress: number;
  }>;
  assumptions: string[];
  disclaimer: string;
}

export interface CaseInvestigation {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_review' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at?: string;
  updated_at?: string;
  analyst_notes?: string;
  pinned_event_ids: string[];
  tags: string[];
}
