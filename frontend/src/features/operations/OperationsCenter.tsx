import React, { useState } from 'react';
import { NormalizedEvent } from '../../types';
import { GlobeScene } from '../../scenes/GlobeScene';
import { 
  X, 
  ExternalLink, 
  BookmarkPlus, 
  GitFork, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  Layers,
  Filter
} from 'lucide-react';

interface OperationsCenterProps {
  events: NormalizedEvent[];
  selectedEvent: NormalizedEvent | null;
  onSelectEvent: (event: NormalizedEvent | null) => void;
  onPinEventToCase: (event: NormalizedEvent) => void;
  onLaunchScenario: (event: NormalizedEvent) => void;
  onAskAI: (query: string) => void;
}

export const OperationsCenter: React.FC<OperationsCenterProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onPinEventToCase,
  onLaunchScenario,
  onAskAI
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter events
  const filteredEvents = events.filter(ev => {
    if (selectedDomain !== 'all' && ev.domain !== selectedDomain) return false;
    return true;
  });

  const domains = [
    { id: 'all', label: 'All Domains' },
    { id: 'natural_hazard', label: 'Natural Hazards' },
    { id: 'geopolitical', label: 'Geopolitical' },
    { id: 'cybersecurity', label: 'Cybersecurity' },
    { id: 'weather_extreme', label: 'Weather Extreme' },
    { id: 'economic', label: 'Economic' }
  ];

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-space">
      {/* 1. Fullscreen Primary 3D Earth Scene */}
      <div className="absolute inset-0">
        <GlobeScene
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onSelectEvent={(ev) => onSelectEvent(ev)}
          onResetView={() => onSelectEvent(null)}
        />
      </div>

      {/* 2. Top-Right Domain Filter Pills (Restrained) */}
      <div className="absolute top-20 right-6 z-30 flex items-center space-x-2">
        <div className="command-surface-elevated p-1 rounded-xl flex items-center space-x-1 shadow-subtle-surface">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-2.5 py-1 rounded-lg text-xs font-mono text-content-secondary hover:text-content-primary flex items-center space-x-1.5 transition-colors"
          >
            <Filter className="w-3.5 h-3.5 text-signal-cyan" />
            <span className="capitalize">{selectedDomain.replace('_', ' ')}</span>
            <span className="text-[10px] text-content-muted">({filteredEvents.length})</span>
          </button>

          {showFilters && (
            <div className="absolute top-full right-0 mt-2 command-surface-elevated rounded-xl p-1.5 min-w-[180px] space-y-0.5 z-40 shadow-subtle-surface">
              {domains.map(d => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDomain(d.id);
                    setShowFilters(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                    selectedDomain === d.id ? 'bg-signal-cyan/20 text-signal-cyan' : 'text-content-secondary hover:bg-surface-subtle hover:text-content-primary'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Floating Incident Scrubber (Compact Recent Signals) */}
      {!selectedEvent && (
        <div className="absolute bottom-6 left-24 right-28 z-30 pointer-events-none">
          <div className="command-surface-elevated p-2 rounded-2xl flex items-center space-x-3 pointer-events-auto overflow-x-auto shadow-subtle-surface">
            <div className="px-3 text-[10px] font-mono text-content-muted uppercase tracking-wider flex-shrink-0">
              NOTABLE INCIDENTS:
            </div>
            {filteredEvents.slice(0, 6).map((ev) => (
              <button
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl hover:bg-surface-subtle text-left transition-colors flex-shrink-0 max-w-[240px]"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  ev.severity === 'critical' ? 'bg-signal-red' :
                  ev.severity === 'high' ? 'bg-signal-amber' : 'bg-signal-cyan'
                }`} />
                <span className="text-xs font-medium text-content-primary truncate">
                  {ev.title}
                </span>
                <span className="text-[10px] font-mono text-content-muted flex-shrink-0">
                  {ev.calculated_risk_score}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Contextual Intelligence Surface (Progressive Disclosure Slide-over) */}
      {selectedEvent && (
        <div className="absolute top-20 right-6 bottom-6 w-96 z-40 command-surface-elevated rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-subtle-surface transition-all duration-300">
          {/* Scrollable Intelligence Body */}
          <div className="overflow-y-auto pr-1 space-y-4">
            {/* Header: What & Where */}
            <div className="flex items-start justify-between border-b border-surface-border pb-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                    selectedEvent.severity === 'critical' ? 'bg-signal-red/20 text-signal-red' :
                    selectedEvent.severity === 'high' ? 'bg-signal-amber/20 text-signal-amber' : 'bg-signal-cyan/20 text-signal-cyan'
                  }`}>
                    {selectedEvent.severity}
                  </span>
                  <span className="text-[10px] font-mono text-content-muted uppercase">
                    {selectedEvent.domain.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-sm font-semibold text-content-primary leading-snug">
                  {selectedEvent.title}
                </h2>
              </div>
              <button
                onClick={() => onSelectEvent(null)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-subtle transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Level 1 & 2: Synopsis & Operational Significance */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-content-muted uppercase tracking-wider">
                OPERATIONAL ASSESSMENT
              </div>
              <p className="text-xs font-sans text-content-secondary leading-relaxed">
                {selectedEvent.description || 'Continuous monitoring active across regional sensors.'}
              </p>
            </div>

            {/* Level 3: Spatiotemporal Telemetry */}
            <div className="p-3 rounded-xl bg-space/60 border border-surface-border space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-content-secondary">
                <span className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-signal-cyan" />
                  <span>Location</span>
                </span>
                <span className="text-content-primary">{selectedEvent.region || 'Coordinates Only'}</span>
              </div>
              {selectedEvent.latitude !== null && selectedEvent.latitude !== undefined && (
                <div className="flex items-center justify-between text-content-secondary">
                  <span>Coordinates</span>
                  <span className="text-content-primary">
                    {selectedEvent.latitude.toFixed(3)}°N, {selectedEvent.longitude?.toFixed(3)}°E
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-content-secondary">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-content-muted" />
                  <span>Occurrence</span>
                </span>
                <span className="text-content-primary">
                  {selectedEvent.occurrence_time ? new Date(selectedEvent.occurrence_time).toLocaleTimeString() : 'Recent'}
                </span>
              </div>
              <div className="flex items-center justify-between text-content-secondary">
                <span>Composite Risk</span>
                <span className="text-signal-cyan font-bold">
                  {selectedEvent.calculated_risk_score} / 100
                </span>
              </div>
            </div>

            {/* Level 4: Expandable Technical Scoring & Raw Payload */}
            <div>
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full flex items-center justify-between py-2 text-xs font-mono text-content-muted hover:text-content-secondary transition-colors"
              >
                <span>EXPLAINABLE RISK METADATA</span>
                {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showTechnicalDetails && selectedEvent.score_breakdown && (
                <div className="p-3 rounded-xl bg-space/80 border border-surface-border text-[11px] font-mono space-y-1.5 mt-1">
                  <div className="flex justify-between text-content-secondary">
                    <span>Severity Component (40%):</span>
                    <span className="text-content-primary">{selectedEvent.score_breakdown.severity_component || 0}</span>
                  </div>
                  <div className="flex justify-between text-content-secondary">
                    <span>Exposure Component (30%):</span>
                    <span className="text-content-primary">{selectedEvent.score_breakdown.exposure_component || 0}</span>
                  </div>
                  <div className="flex justify-between text-content-secondary">
                    <span>Vulnerability Component (20%):</span>
                    <span className="text-content-primary">{selectedEvent.score_breakdown.vulnerability_component || 0}</span>
                  </div>
                  <div className="flex justify-between text-content-secondary">
                    <span>Sensor Confidence:</span>
                    <span className="text-signal-green">{Math.round((selectedEvent.confidence || 0.8) * 100)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Level 5: Next Actionable Operations */}
          <div className="pt-3 border-t border-surface-border space-y-2">
            <button
              onClick={() => onPinEventToCase(selectedEvent)}
              className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-surface-subtle hover:bg-surface-elevated border border-surface-border text-xs font-medium text-content-primary transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-signal-cyan" />
              <span>Pin to Investigation Binder</span>
            </button>

            <button
              onClick={() => onLaunchScenario(selectedEvent)}
              className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-surface-subtle hover:bg-surface-elevated border border-surface-border text-xs font-medium text-content-primary transition-colors"
            >
              <GitFork className="w-3.5 h-3.5 text-signal-amber" />
              <span>Simulate Cascading Impact</span>
            </button>

            {selectedEvent.source_url && (
              <a
                href={selectedEvent.source_url}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center space-x-2 py-2 text-xs font-mono text-content-muted hover:text-signal-cyan transition-colors"
              >
                <span>Raw Advisory ({selectedEvent.source.toUpperCase()})</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
