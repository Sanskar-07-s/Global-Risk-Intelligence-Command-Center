import React, { useRef, useState } from 'react';
import { NormalizedEvent } from '../../types';
import { 
  ShieldAlert, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  CloudLightning, 
  Radio, 
  Globe,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface IntelligenceTickerProps {
  events: NormalizedEvent[];
  selectedEvent: NormalizedEvent | null;
  onSelectEvent: (event: NormalizedEvent) => void;
  isDetailOpen: boolean;
}

export const IntelligenceTicker: React.FC<IntelligenceTickerProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  isDetailOpen
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filterDomain, setFilterDomain] = useState<'all' | 'cyber' | 'seismic' | 'hazards'>('all');

  const filtered = events.filter(ev => {
    if (filterDomain === 'cyber') {
      return ev.domain === 'cybersecurity' || ev.source === 'cisa_kev' || ev.id.startsWith('cisa:');
    }
    if (filterDomain === 'seismic') {
      return ev.category === 'earthquake' || ev.source === 'usgs';
    }
    if (filterDomain === 'hazards') {
      return ev.domain === 'natural_hazard' || ev.domain === 'weather_extreme';
    }
    return true;
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const getEventBadge = (ev: NormalizedEvent) => {
    const isCyber = ev.domain === 'cybersecurity' || ev.source === 'cisa_kev' || ev.id.startsWith('cisa:');
    const isQuake = ev.category === 'earthquake' || ev.source === 'usgs';
    const isHazard = ev.domain === 'natural_hazard' || ev.domain === 'weather_extreme';

    if (isCyber) {
      const cveMatch = ev.title.match(/CVE-\d{4}-\d+/i) || ev.id.match(/CVE-\d{4}-\d+/i);
      const cveLabel = cveMatch ? cveMatch[0] : 'CVE';
      return {
        icon: <ShieldAlert className="w-3 h-3 text-signal-amber flex-shrink-0" />,
        label: cveLabel,
        color: 'text-signal-amber bg-signal-amber/15 border-signal-amber/30'
      };
    }

    if (isQuake) {
      const magMatch = ev.title.match(/M\d+\.\d+/i);
      return {
        icon: <Activity className="w-3 h-3 text-signal-cyan flex-shrink-0" />,
        label: magMatch ? magMatch[0] : 'QUAKE',
        color: 'text-signal-cyan bg-signal-cyan/15 border-signal-cyan/30'
      };
    }

    if (isHazard) {
      return {
        icon: <Flame className="w-3 h-3 text-signal-red flex-shrink-0" />,
        label: ev.category ? ev.category.toUpperCase().slice(0, 8) : 'HAZARD',
        color: 'text-signal-red bg-signal-red/15 border-signal-red/30'
      };
    }

    return {
      icon: <Radio className="w-3 h-3 text-content-secondary flex-shrink-0" />,
      label: 'SIGNAL',
      color: 'text-content-secondary bg-surface-subtle border-surface-border'
    };
  };

  // Helper to extract clean concise headline for display
  const formatHeadline = (ev: NormalizedEvent) => {
    const isCyber = ev.domain === 'cybersecurity' || ev.source === 'cisa_kev';
    if (isCyber) {
      const vendor = ev.raw_payload?.vendor || ev.score_breakdown?.vendor;
      const product = ev.raw_payload?.product || ev.score_breakdown?.product;
      if (vendor && product) {
        return `${vendor} ${product}`;
      }
    }
    return ev.title;
  };

  return (
    <div 
      className={`absolute bottom-5 left-20 md:left-24 z-30 transition-all duration-300 pointer-events-none ${
        isDetailOpen ? 'right-6 lg:right-[425px]' : 'right-6 md:right-10'
      }`}
    >
      <div className="command-surface-elevated p-2 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-2 pointer-events-auto shadow-subtle-surface border border-surface-border">
        
        {/* Controls & Filter Bar */}
        <div className="flex items-center justify-between md:justify-start space-x-2 px-2 flex-shrink-0 border-b md:border-b-0 md:border-r border-surface-border pb-1.5 md:pb-0 md:pr-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-signal-cyan animate-pulse" />
            <span className="text-[10px] font-mono font-semibold text-content-primary tracking-wider uppercase">
              LIVE SIGNALS
            </span>
            <span className="text-[10px] font-mono text-content-muted">
              ({filtered.length})
            </span>
          </div>

          {/* Quick Domain Filters */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setFilterDomain('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                filterDomain === 'all' 
                  ? 'bg-signal-cyan/20 text-signal-cyan font-medium' 
                  : 'text-content-muted hover:text-content-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterDomain('cyber')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                filterDomain === 'cyber' 
                  ? 'bg-signal-amber/20 text-signal-amber font-medium' 
                  : 'text-content-muted hover:text-content-primary'
              }`}
            >
              CVEs
            </button>
            <button
              onClick={() => setFilterDomain('seismic')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                filterDomain === 'seismic' 
                  ? 'bg-signal-cyan/20 text-signal-cyan font-medium' 
                  : 'text-content-muted hover:text-content-primary'
              }`}
            >
              Seismic
            </button>
            <button
              onClick={() => setFilterDomain('hazards')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                filterDomain === 'hazards' 
                  ? 'bg-signal-red/20 text-signal-red font-medium' 
                  : 'text-content-muted hover:text-content-primary'
              }`}
            >
              Hazards
            </button>
          </div>

          {/* Scroll Nav Buttons */}
          <div className="hidden sm:flex items-center space-x-1 pl-1">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll signals left"
              className="p-1 rounded text-content-muted hover:text-content-primary hover:bg-surface-subtle transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll signals right"
              className="p-1 rounded text-content-muted hover:text-content-primary hover:bg-surface-subtle transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Horizontal Ticker Scroll Area */}
        <div 
          ref={scrollRef}
          className="flex items-center space-x-2 overflow-x-auto py-0.5 px-1 scroll-smooth focus:outline-none"
          tabIndex={0}
          aria-label="Intelligence signals stream"
        >
          {filtered.length === 0 ? (
            <div className="text-xs font-mono text-content-muted px-4 py-1">
              No incidents matching current stream filter.
            </div>
          ) : (
            filtered.map((ev) => {
              const badge = getEventBadge(ev);
              const isSelected = selectedEvent?.id === ev.id;
              const headline = formatHeadline(ev);

              return (
                <button
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectEvent(ev);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl text-left transition-all flex-shrink-0 max-w-[280px] border ${
                    isSelected
                      ? 'bg-surface-elevated border-signal-cyan ring-1 ring-signal-cyan/50 shadow-sm'
                      : 'border-surface-border/60 hover:border-surface-border-active hover:bg-surface-subtle'
                  }`}
                  title={`${ev.title}\nSeverity: ${ev.severity.toUpperCase()} | Risk: ${ev.calculated_risk_score}/100`}
                >
                  {/* Category Pill */}
                  <span className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${badge.color}`}>
                    {badge.icon}
                    <span className="font-semibold">{badge.label}</span>
                  </span>

                  {/* Headline & Location */}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-content-primary truncate leading-tight">
                      {headline}
                    </div>
                    <div className="text-[10px] font-mono text-content-muted truncate flex items-center space-x-1">
                      <span>{ev.region || ev.source.toUpperCase()}</span>
                      {ev.occurrence_time && (
                        <>
                          <span>•</span>
                          <span>{new Date(ev.occurrence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Risk Score Pill */}
                  <div className="flex flex-col items-end flex-shrink-0 pl-1">
                    <span className={`text-[10px] font-mono font-bold ${
                      ev.severity === 'critical' ? 'text-signal-red' :
                      ev.severity === 'high' ? 'text-signal-amber' : 'text-signal-cyan'
                    }`}>
                      {ev.calculated_risk_score.toFixed(0)}
                    </span>
                    <span className="text-[8px] font-mono text-content-muted uppercase">
                      RISK
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
