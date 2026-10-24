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

export const App: React.FC = () => {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('operations');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);
  const [riskOverview, setRiskOverview] = useState<RiskOverview | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch initial telemetry
  const refreshTelemetry = async () => {
    setIsRefreshing(true);
    try {
      const [evList, rOverview] = await Promise.all([
        api.getEvents({ limit: 250 }),
        api.getRiskOverview()
      ]);
      setEvents(evList);
      setRiskOverview(rOverview);
      if (evList.length > 0 && !selectedEvent) {
        setSelectedEvent(evList[0]);
      }
    } catch (err) {
      console.warn("Telemetry refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshTelemetry();
    const interval = setInterval(refreshTelemetry, 30000); // 30s background sync
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut for AI Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setActiveWorkspace('ai-desk');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  return (
    <div className="flex flex-col h-screen w-screen bg-obsidian-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Operations Command Header */}
      <Header
        riskOverview={riskOverview}
        onRefresh={refreshTelemetry}
        isRefreshing={isRefreshing}
        onOpenSearch={() => setActiveWorkspace('ai-desk')}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Navigation Sidebar */}
        <Sidebar
          activeWorkspace={activeWorkspace}
          onSelectWorkspace={(ws) => setActiveWorkspace(ws)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Dynamic Workspace Container */}
        <main className="flex-1 h-full overflow-hidden relative">
          {activeWorkspace === 'operations' && (
            <OperationsCenter
              events={events}
              selectedEvent={selectedEvent}
              onSelectEvent={(ev) => setSelectedEvent(ev)}
              onPinEventToCase={handlePinEventToCase}
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
        </main>
      </div>
    </div>
  );
};

export default App;
