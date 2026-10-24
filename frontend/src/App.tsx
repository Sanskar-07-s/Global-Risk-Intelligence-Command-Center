import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, WorkspaceId } from './components/layout/Sidebar';
import { OperationsCenter } from './features/operations/OperationsCenter';
import { ThreatIntelligence } from './features/threats/ThreatIntelligence';
import { KnowledgeGraph } from './features/knowledge-graph/KnowledgeGraph';
import { RiskAnalytics } from './features/analytics/RiskAnalytics';
import { ScenarioLaboratory } from './features/scenarios/ScenarioLaboratory';
import { AIDesk } from './features/ai-desk/AIDesk';
import { DataHealth } from './features/data-health/DataHealth';
import { CaseManagement } from './features/cases/CaseManagement';
import { api } from './services/api';
import { NormalizedEvent, RiskOverview } from './types';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export const App: React.FC = () => {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('operations');
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);
  const [riskOverview, setRiskOverview] = useState<RiskOverview | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshTelemetry = async () => {
    setIsRefreshing(true);
    try {
      const [evList, rOverview] = await Promise.all([
        api.getEvents({ limit: 250 }),
        api.getRiskOverview()
      ]);
      setEvents(evList);
      setRiskOverview(rOverview);
    } catch (err) {
      console.warn("Telemetry refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshTelemetry();
    const interval = setInterval(refreshTelemetry, 30000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut for Command Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (inputEl) inputEl.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExecuteCommand = (query: string) => {
    // If query matches a specific domain or region, filter or navigate
    const qLower = query.toLowerCase();
    const matchingEv = events.find(e => 
      e.title.toLowerCase().includes(qLower) || 
      e.region?.toLowerCase().includes(qLower) || 
      e.domain.toLowerCase().includes(qLower)
    );

    if (matchingEv) {
      setSelectedEvent(matchingEv);
      setActiveWorkspace('operations');
    } else {
      // Direct query to AI Intelligence Desk
      setActiveWorkspace('ai-desk');
    }
  };

  const handlePinEventToCase = async (ev: NormalizedEvent) => {
    try {
      await api.createCase({
        title: `Investigation: ${ev.title}`,
        description: `Automated investigation dossier opened for event ${ev.id}. Severity: ${ev.severity}.`,
        priority: ev.severity === 'critical' ? 'critical' : 'high',
        pinned_event_ids: [ev.id],
        tags: [ev.domain, 'incident_pin']
      });
      setActiveWorkspace('cases');
    } catch (e) {
      console.error(e);
    }
  };

  const handleLaunchScenario = (ev: NormalizedEvent) => {
    setActiveWorkspace('scenarios');
  };

  return (
    <div className="relative h-screen w-screen bg-space text-content-primary overflow-hidden font-sans select-none">
      {/* 1. Floating Natural Language Command Prompt Header */}
      <Header
        riskOverview={riskOverview}
        onRefresh={refreshTelemetry}
        isRefreshing={isRefreshing}
        onExecuteCommand={handleExecuteCommand}
      />

      {/* 2. Floating Minimalist Navigation Dock */}
      <Sidebar
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={(ws) => setActiveWorkspace(ws)}
      />

      {/* 3. Primary Full-Viewport Spatial Workspace Container */}
      <main className="w-full h-full relative overflow-hidden">
        <ErrorBoundary fallbackTitle="Active Intelligence Workspace Anomaly" onReset={refreshTelemetry}>
          {activeWorkspace === 'operations' && (
            <OperationsCenter
              events={events}
              selectedEvent={selectedEvent}
              onSelectEvent={(ev) => setSelectedEvent(ev)}
              onPinEventToCase={handlePinEventToCase}
              onLaunchScenario={handleLaunchScenario}
              onAskAI={(q) => {
                handleExecuteCommand(q);
                setActiveWorkspace('ai-desk');
              }}
            />
          )}

          {activeWorkspace === 'threats' && (
            <ThreatIntelligence
              events={events}
              onSelectEvent={(ev) => {
                setSelectedEvent(ev);
                setActiveWorkspace('operations');
              }}
            />
          )}

          {activeWorkspace === 'knowledge-graph' && (
            <KnowledgeGraph
              events={events}
              onSelectEvent={(ev) => {
                setSelectedEvent(ev);
                setActiveWorkspace('operations');
              }}
            />
          )}

          {activeWorkspace === 'analytics' && (
            <RiskAnalytics
              events={events}
              riskOverview={riskOverview}
            />
          )}

          {activeWorkspace === 'scenarios' && (
            <ScenarioLaboratory />
          )}

          {activeWorkspace === 'ai-desk' && (
            <AIDesk />
          )}

          {activeWorkspace === 'data-health' && (
            <DataHealth />
          )}

          {activeWorkspace === 'cases' && (
            <CaseManagement events={events} />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
