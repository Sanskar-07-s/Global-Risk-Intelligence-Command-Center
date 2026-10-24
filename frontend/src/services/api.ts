import { 
  NormalizedEvent, 
  RiskOverview, 
  SourceHealth, 
  AICitedBrief, 
  ScenarioSimulationRequest, 
  ScenarioSimulationResult, 
  CaseInvestigation,
  CorrelationLink
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const res = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText || res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetchJson<{ status: string; total_normalized_events: number; sources_operational: number }>('/api/health/'),

  // Events
  getEvents: (params?: { domain?: string; severity?: string; min_risk_score?: number; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.domain) query.append('domain', params.domain);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.min_risk_score !== undefined) query.append('min_risk_score', params.min_risk_score.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', params.limit.toString());
    const qs = query.toString();
    return fetchJson<NormalizedEvent[]>(`/api/events/${qs ? `?${qs}` : ''}`);
  },

  getEventById: (id: string) => fetchJson<NormalizedEvent>(`/api/events/${id}`),

  getCorrelations: () => fetchJson<{ links: CorrelationLink[]; total_edges: number }>('/api/events/correlations'),

  // Risk
  getRiskOverview: () => fetchJson<RiskOverview>('/api/risk/overview'),

  // Sources
  getSources: () => fetchJson<SourceHealth[]>('/api/sources/'),

  refreshSource: (sourceName?: string) => 
    fetchJson<{ source?: string; result?: any; refreshed_all?: boolean }>(
      `/api/sources/refresh${sourceName ? `?source_name=${sourceName}` : ''}`, 
      { method: 'POST' }
    ),

  // Intelligence AI Desk
  queryIntelligence: (question: string, region?: string, domain?: string) => 
    fetchJson<AICitedBrief>('/api/intelligence/query', {
      method: 'POST',
      body: JSON.stringify({ question, region, domain })
    }),

  // Scenarios
  runSimulation: (req: ScenarioSimulationRequest) => 
    fetchJson<ScenarioSimulationResult>('/api/scenarios/simulate', {
      method: 'POST',
      body: JSON.stringify(req)
    }),

  // Cases & Reports
  getCases: () => fetchJson<CaseInvestigation[]>('/api/reports/cases'),

  createCase: (caseData: Partial<CaseInvestigation>) => 
    fetchJson<CaseInvestigation>('/api/reports/cases', {
      method: 'POST',
      body: JSON.stringify(caseData)
    }),

  deleteCase: (caseId: string) => 
    fetchJson<{ deleted: boolean; id: string }>(`/api/reports/cases/${caseId}`, {
      method: 'DELETE'
    })
};
