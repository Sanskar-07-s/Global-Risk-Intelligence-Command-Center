import React, { useState } from 'react';
import { NormalizedEvent } from '../../types';
import { 
  ShieldAlert, 
  Terminal, 
  Flame, 
  AlertOctagon, 
  Search, 
  ExternalLink,
  Cpu
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

  const threatEvents = events.filter(ev => {
    if (filterType === 'cyber' && ev.domain !== 'cybersecurity') return false;
    if (filterType === 'geopolitical' && ev.domain !== 'geopolitical') return false;
    if (filterType === 'all' && !['cybersecurity', 'geopolitical'].includes(ev.domain)) return false;
    if (search) {
      const q = search.toLowerCase();
      return ev.title.toLowerCase().includes(q) || ev.description?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="w-full h-[calc(100vh-4rem)] p-6 overflow-y-auto space-y-6 select-none">
      {/* Top Threat Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl glass-panel-glow border-cyber-amber/30">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-cyber-amber/15 border border-cyber-amber/40 text-cyber-amber">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-mono text-cyber-amber uppercase tracking-wider">
              THREAT INTELLIGENCE WORKSPACE // ACTIVE VECTORS
            </div>
            <h1 className="text-lg font-bold text-white">
              CISA KEV Weaponized Vulnerabilities & Kinetic Hostilities
            </h1>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
              filterType === 'all' ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan' : 'bg-obsidian-900 border-slate-700 text-slate-400'
            }`}
          >
            All Threats
          </button>
          <button
            onClick={() => setFilterType('cyber')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
              filterType === 'cyber' ? 'bg-cyber-amber/20 border-cyber-amber text-cyber-amber' : 'bg-obsidian-900 border-slate-700 text-slate-400'
            }`}
          >
            Cyber Exploits (CISA)
          </button>
          <button
            onClick={() => setFilterType('geopolitical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
              filterType === 'geopolitical' ? 'bg-cyber-red/20 border-cyber-red text-cyber-red' : 'bg-obsidian-900 border-slate-700 text-slate-400'
            }`}
          >
            Geopolitical (GDELT)
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter threats by CVE, targeted product, malware campaign, or actor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs font-mono bg-obsidian-900/90 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyber-cyan/60"
        />
      </div>

      {/* Threats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {threatEvents.map((threat) => (
          <div
            key={threat.id}
            onClick={() => onSelectEvent(threat)}
            className="p-4 rounded-xl glass-panel hover:glass-panel-glow border-slate-800 hover:border-cyber-cyan/40 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-950 border border-slate-700 text-cyber-cyan uppercase">
                  {threat.category || threat.domain}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  threat.severity === 'critical' ? 'bg-cyber-red/20 text-cyber-red border-cyber-red/50' : 'bg-cyber-amber/20 text-cyber-amber border-cyber-amber/50'
                }`}>
                  {threat.severity}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-white mt-2 line-clamp-2">
                {threat.title}
              </h3>

              <p className="text-xs text-slate-400 mt-2 line-clamp-3 font-sans leading-relaxed">
                {threat.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                SCORE: <strong className="text-cyber-cyan">{threat.calculated_risk_score}</strong>
              </span>
              <span className="text-slate-400">
                CONF: <strong className="text-cyber-green">{Math.round(threat.confidence * 100)}%</strong>
              </span>
              {threat.source_url && (
                <a
                  href={threat.source_url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-cyber-cyan hover:underline flex items-center space-x-1"
                >
                  <span>ADVISORY</span>
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
