import React, { useState } from 'react';
import { NormalizedEvent } from '../../types';
import { GlobeScene } from '../../scenes/GlobeScene';
import { IntelligenceTicker } from './IntelligenceTicker';
import { EventDetailPanel } from './EventDetailPanel';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { Filter } from 'lucide-react';

interface OperationsCenterProps {
  events: NormalizedEvent[];
  selectedEvent: NormalizedEvent | null;
  onSelectEvent: (event: NormalizedEvent | null) => void;
  onPinEventToCase: (event: NormalizedEvent) => void;
  onLaunchScenario: (event: NormalizedEvent) => void;
  onAskAI: (query: string) => void;
}

export const OperationsCenter: React.FC<OperationsCenterProps> = ({
  events = [],
  selectedEvent,
  onSelectEvent,
  onPinEventToCase,
  onLaunchScenario,
  onAskAI
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter events by domain if requested safely (memoized to prevent child rerenders)
  const filteredEvents = React.useMemo(() => {
    return (events || []).filter(ev => {
      if (!ev || typeof ev !== 'object') return false;
      if (selectedDomain !== 'all' && ev.domain !== selectedDomain) return false;
      return true;
    });
  }, [events, selectedDomain]);

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
      {/* 1. Fullscreen Primary 3D Earth Scene (Guarded by ErrorBoundary) */}
      <div className="absolute inset-0">
        <ErrorBoundary fallbackTitle="Planetary Earth Subsystem Anomaly">
          <GlobeScene
            events={filteredEvents}
            selectedEvent={selectedEvent}
            onSelectEvent={(ev) => onSelectEvent(ev)}
            onResetView={() => onSelectEvent(null)}
          />
        </ErrorBoundary>
      </div>

      {/* 2. Top-Right Domain Filter Pills (Restrained) */}
      <div className="absolute top-20 right-6 z-30 flex items-center space-x-2">
        <div className="command-surface-elevated p-1 rounded-xl flex items-center space-x-1 shadow-subtle-surface">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-2.5 py-1 rounded-lg text-xs font-mono text-content-secondary hover:text-content-primary flex items-center space-x-1.5 transition-colors"
            aria-expanded={showFilters}
            aria-label="Filter events by domain"
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
                    selectedDomain === d.id 
                      ? 'bg-signal-cyan/20 text-signal-cyan font-semibold' 
                      : 'text-content-secondary hover:bg-surface-subtle hover:text-content-primary'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Persistent Bottom Intelligence Stream & Ticker (Never unmounts upon selection) */}
      <IntelligenceTicker
        events={filteredEvents}
        selectedEvent={selectedEvent}
        onSelectEvent={(ev) => onSelectEvent(ev)}
        isDetailOpen={Boolean(selectedEvent)}
      />

      {/* 4. Contextual Intelligence Surface (Progressive Disclosure Slide-over) */}
      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          onClose={() => onSelectEvent(null)}
          onPinToCase={onPinEventToCase}
          onLaunchScenario={onLaunchScenario}
          onAskAI={onAskAI}
        />
      )}
    </div>
  );
};
