import React, { useState } from 'react';
import { 
  NormalizedEvent, 
  RiskDomain, 
  SeverityLevel 
} from '../../types';
import { GlobeScene } from '../../scenes/GlobeScene';
import { 
  Filter, 
  ExternalLink, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  Layers, 
  BookmarkPlus,
  Compass
} from 'lucide-react';

interface OperationsCenterProps {
  events: NormalizedEvent[];
  selectedEvent: NormalizedEvent | null;
  onSelectEvent: (event: NormalizedEvent) => void;
  onPinEventToCase: (event: NormalizedEvent) => void;
}

export const OperationsCenter: React.FC<OperationsCenterProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onPinEventToCase
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered Events
  const filteredEvents = events.filter(ev => {
    if (selectedDomain !== 'all' && ev.domain !== selectedDomain) return false;
    if (selectedSeverity !== 'all' && ev.severity !== selectedSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchRegion = ev.region?.toLowerCase().includes(q);
      const matchDesc = ev.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchRegion && !matchDesc) return false;
    }
    return true;
  });

  const getSeverityBadge = (sev: SeverityLevel) => {
    switch (sev) {
      case 'critical': return 'bg-cyber-red/20 text-cyber-red border-cyber-red/50';
      case 'high': return 'bg-cyber-amber/20 text-cyber-amber border-cyber-amber/50';
      case 'medium': return 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/50';
      default: return 'bg-cyber-ice/20 text-cyber-ice border-cyber-ice/50';
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden flex">
      {/* 1. Left Telemetry Stream Panel */}
      <div className="w-80 lg:w-96 h-full flex flex-col glass-panel border-r border-cyber-cyan/20 z-20 select-none">
        {/* Stream Filter Header */}
        <div className="p-3 border-b border-cyber-cyan/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyber-cyan" />
              <span className="font-mono text-xs font-semibold tracking-wider text-slate-200">
                LIVE INCIDENT STREAM
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-obsidian-900 border border-slate-700 text-cyber-cyan">
              {filteredEvents.length} Active
            </span>
          </div>

          {/* Quick Search */}
          <input
            type="text"
            placeholder="Search keywords, regions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-mono bg-obsidian-900/90 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyber-cyan/60"
          />

          {/* Domain & Severity Filters */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="text-[11px] font-mono bg-obsidian-900 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-cyber-cyan/60"
            >
              <option value="all">Domain: All</option>
              <option value="natural_hazard">Natural Hazards</option>
              <option value="geopolitical">Geopolitical</option>
              <option value="cybersecurity">Cybersecurity</option>
              <option value="weather_extreme">Weather Extreme</option>
              <option value="economic">Economic</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="text-[11px] font-mono bg-obsidian-900 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-cyber-cyan/60"
            >
              <option value="all">Severity: All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Scrollable Event Feed */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-400">
              No incidents matching the active filter parameters.
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isSelected = selectedEvent?.id === ev.id;
              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyber-cyan/15 border border-cyber-cyan/50 shadow-glow-cyan/30'
                      : 'hover:bg-obsidian-900/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-slate-200 line-clamp-2">
                      {ev.title}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase flex-shrink-0 ${getSeverityBadge(ev.severity)}`}>
                      {ev.severity}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-cyber-cyan" />
                      <span className="truncate max-w-[140px]">{ev.region || 'Global'}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-300">
                      <span>RISK:</span>
                      <strong className="text-cyber-cyan">{ev.calculated_risk_score}</strong>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>SRC: {ev.source.toUpperCase()}</span>
                    <span>{ev.occurrence_time ? new Date(ev.occurrence_time).toLocaleTimeString() : 'RECENT'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Center 3D Earth Globe Visualizer */}
      <div className="flex-1 h-full relative">
        <GlobeScene
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onSelectEvent={onSelectEvent}
        />
      </div>

      {/* 3. Right Incident Inspector Panel */}
      {selectedEvent && (
        <div className="w-80 lg:w-96 h-full flex flex-col glass-panel-glow border-l border-cyber-cyan/30 z-20 select-none overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-cyber-cyan/20 flex items-start justify-between">
            <div>
              <div className="text-[10px] font-mono text-cyber-cyan tracking-widest uppercase">
                INCIDENT DOSSIER
              </div>
              <h2 className="text-sm font-semibold text-white mt-1">
                {selectedEvent.title}
              </h2>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded border uppercase ${getSeverityBadge(selectedEvent.severity)}`}>
              {selectedEvent.severity}
            </span>
          </div>

          {/* Details Content */}
          <div className="p-4 space-y-4 text-xs font-mono">
            {/* Risk Score Card */}
            <div className="p-3 rounded-lg bg-obsidian-900 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">EXPLAINABLE RISK SCORE:</span>
                <span className="text-lg font-bold text-cyber-cyan">
                  {selectedEvent.calculated_risk_score} / 100
                </span>
              </div>
              {selectedEvent.score_breakdown && (
                <div className="space-y-1 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Severity Weight:</span>
                    <span className="text-slate-200">{selectedEvent.score_breakdown.severity_component || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exposure Index:</span>
                    <span className="text-slate-200">{selectedEvent.score_breakdown.exposure_component || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vulnerability Index:</span>
                    <span className="text-slate-200">{selectedEvent.score_breakdown.vulnerability_component || 0}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <span className="text-slate-400 block mb-1 text-[11px]">DESCRIPTION / SYNOPSIS:</span>
              <p className="text-slate-200 font-sans leading-relaxed bg-obsidian-900/60 p-2.5 rounded border border-slate-800">
                {selectedEvent.description || 'No additional narrative reported.'}
              </p>
            </div>

            {/* Geospatial Coordinates */}
            <div className="space-y-1.5 p-2.5 rounded bg-obsidian-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-300">
                <span>Domain:</span>
                <span className="text-cyber-cyan uppercase">{selectedEvent.domain}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Location:</span>
                <span className="text-slate-100">{selectedEvent.region || 'Coordinates Only'}</span>
              </div>
              {selectedEvent.latitude !== null && selectedEvent.latitude !== undefined && (
                <div className="flex items-center justify-between text-slate-300">
                  <span>Coordinates:</span>
                  <span className="text-slate-100">{selectedEvent.latitude.toFixed(3)}°N, {selectedEvent.longitude?.toFixed(3)}°E</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-300">
                <span>Confidence:</span>
                <span className="text-cyber-green">{Math.round((selectedEvent.confidence || 0.8) * 100)}%</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => onPinEventToCase(selectedEvent)}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-cyber-cyan/15 hover:bg-cyber-cyan/25 border border-cyber-cyan/40 text-cyber-cyan font-semibold transition-colors"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>PIN TO CASE INVESTIGATION</span>
              </button>

              {selectedEvent.source_url && (
                <a
                  href={selectedEvent.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-obsidian-900 hover:bg-obsidian-850 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-cyber-cyan" />
                  <span>VIEW RAW SOURCE DOSSIER</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
