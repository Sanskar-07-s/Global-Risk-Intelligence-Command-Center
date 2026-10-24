import React, { useState } from 'react';
import { NormalizedEvent } from '../../types';
import { 
  Flame, 
  Search, 
  ExternalLink, 
  ShieldAlert, 
  Radio, 
  Terminal,
  Filter
} from 'lucide-react';

interface ThreatIntelligenceProps {
  events: NormalizedEvent[];
  onSelectEvent: (ev: NormalizedEvent) => void;
}

export const ThreatIntelligence: React.FC<ThreatIntelligenceProps> = ({
  events,
  onSelectEvent
}) => {
  const [filterType, setFilterType] = useState<'all' | 'cyber' | 'geopolitical'>('all');
  const [search, setSearch] = useState('');

  const threatEvents = (events || []).filter(ev => {
    if (!ev || typeof ev !== 'object') return false;
    if (filterType === 'cyber' && ev.domain !== 'cybersecurity') return false;
    if (filterType === 'geopolitical' && ev.domain !== 'geopolitical') return false;
    if (filterType === 'all' && !['cybersecurity', 'geopolitical'].includes(ev.domain)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (ev.title || '').toLowerCase().includes(q) || (ev.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="w-full h-full p-8 pt-24 pl-24 overflow-y-auto space-y-6 select-none bg-space">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono text-signal-amber uppercase tracking-wider">
            THREAT VECTORS // CYBER & KINETIC
          </div>
          <h1 className="text-xl font-semibold text-content-primary mt-1">
            CISA KEV Weaponized Vulnerabilities & Geopolitical Instability
          </h1>
        </div>

        {/* Filter Pills */}
        <div className="command-surface-elevated p-1 rounded-xl flex items-center space-x-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              filterType === 'all' ? 'bg-signal-cyan/20 text-signal-cyan' : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            All Threat Vectors ({threatEvents.length})
          </button>
          <button
            onClick={() => setFilterType('cyber')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              filterType === 'cyber' ? 'bg-signal-amber/20 text-signal-amber' : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            Active CVEs (CISA)
          </button>
          <button
            onClick={() => setFilterType('geopolitical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              filterType === 'geopolitical' ? 'bg-signal-red/20 text-signal-red' : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            Geopolitical (GDELT)
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-xl">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
        <input
          type="text"
          placeholder="Filter by CVE, software vendor, exploit campaign, or regional hotspot..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full command-surface text-xs font-mono rounded-xl pl-10 pr-4 py-2.5 text-content-primary placeholder-content-muted focus:outline-none focus:border-surface-border-active"
        />
      </div>

      {/* Threat Stream Feed (Minimalist Row List) */}
      <div className="space-y-2.5">
        {threatEvents.map((threat) => (
          <div
            key={threat.id}
            onClick={() => onSelectEvent(threat)}
            className="command-surface hover:command-surface-elevated p-4 rounded-xl flex items-start justify-between gap-4 cursor-pointer transition-all duration-150"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center space-x-2 text-[10px] font-mono">
                <span className={`px-2 py-0.5 rounded uppercase font-semibold ${
                  threat.severity === 'critical' ? 'bg-signal-red/20 text-signal-red' : 'bg-signal-amber/20 text-signal-amber'
                }`}>
                  {threat.severity}
                </span>
                <span className="text-content-muted uppercase">
                  {threat.source?.toUpperCase() || 'TELEMETRY'} // {threat.category || threat.domain || 'THREAT'}
                </span>
                <span className="text-content-muted">•</span>
                <span className="text-content-secondary">
                  {threat.occurrence_time ? new Date(threat.occurrence_time).toLocaleDateString() : 'Active'}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-content-primary">
                {threat.title}
              </h3>

              <p className="text-xs font-sans text-content-secondary line-clamp-2 leading-relaxed">
                {threat.description}
              </p>
            </div>

            <div className="flex flex-col items-end space-y-2 flex-shrink-0 text-right">
              <div className="text-xs font-mono">
                <span className="text-content-muted">RISK: </span>
                <strong className="text-signal-cyan">{threat.calculated_risk_score}</strong>
              </div>

              {threat.source_url && (
                <a
                  href={threat.source_url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-mono text-content-muted hover:text-signal-cyan flex items-center space-x-1"
                >
                  <span>Advisory</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
