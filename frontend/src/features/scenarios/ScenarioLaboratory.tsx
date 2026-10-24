import React, { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  AlertTriangle, 
  Clock, 
  GitFork, 
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { ScenarioSimulationResult } from '../../types';

export const ScenarioLaboratory: React.FC = () => {
  const [scenarioName, setScenarioName] = useState('Taiwan Strait Maritime Disruption');
  const [triggerDomain, setTriggerDomain] = useState('geopolitical');
  const [triggerTitle, setTriggerTitle] = useState('Naval Exercise Corridors Closed');
  const [triggerSeverity, setTriggerSeverity] = useState('critical');
  const [targetRegion, setTargetRegion] = useState('East Asia / Global Chokepoint');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([
    'semiconductor_transit',
    'maritime_corridor',
    'energy_grid'
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<ScenarioSimulationResult | null>(null);

  const availableSectors = [
    { id: 'semiconductor_transit', label: 'Semiconductor Supply Chain' },
    { id: 'maritime_corridor', label: 'Maritime Shipping Lanes' },
    { id: 'energy_grid', label: 'Regional Energy Infrastructure' },
    { id: 'telecommunications', label: 'Subsea Fiber & Cloud Comms' },
    { id: 'critical_port', label: 'Deepwater Container Terminals' }
  ];

  const toggleSector = (secId: string) => {
    if (selectedSectors.includes(secId)) {
      setSelectedSectors(selectedSectors.filter(s => s !== secId));
    } else {
      setSelectedSectors([...selectedSectors, secId]);
    }
  };

  const handleRunSimulation = async () => {
    setIsLoading(true);
    try {
      const res = await api.runSimulation({
        name: scenarioName,
        trigger_domain: triggerDomain,
        trigger_event_title: triggerTitle,
        trigger_severity: triggerSeverity,
        target_region: targetRegion,
        cascading_sectors: selectedSectors
      });
      setSimulationResult(res);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] p-6 overflow-y-auto space-y-6 select-none">
      {/* Top Banner with Strict Disclaimer */}
      <div className="p-4 rounded-xl glass-panel-glow border-cyber-amber/40 flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-cyber-amber flex-shrink-0 mt-0.5" />
        <div className="text-xs font-mono">
          <div className="font-bold text-cyber-amber tracking-wider uppercase">
            SCENARIO LABORATORY // HYPOTHETICAL STRESS-TESTING SANDBOX
          </div>
          <div className="text-slate-300 font-sans mt-0.5 leading-relaxed">
            All models in this workspace are synthetic cascading simulations for strategic contingency planning. Outputs are explicit estimates based on input assumptions and must never be represented as verified predictive forecasts.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Parameter Construction Panel */}
        <div className="p-5 rounded-xl glass-panel border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono text-cyber-cyan uppercase font-semibold">
            <FlaskConical className="w-4 h-4" />
            <span>CONSTRUCT SIMULATION VECTOR</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">SCENARIO TITLE:</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full bg-obsidian-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyber-cyan"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">TRIGGER DOMAIN:</label>
              <select
                value={triggerDomain}
                onChange={(e) => setTriggerDomain(e.target.value)}
                className="w-full bg-obsidian-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyber-cyan"
              >
                <option value="geopolitical">Geopolitical Conflict</option>
                <option value="cybersecurity">Grid/Critical Infrastructure Cyberattack</option>
                <option value="natural_hazard">Major Catastrophic Hazard</option>
                <option value="weather_extreme">Extreme Meteorological Bottleneck</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">TRIGGER EVENT HYPOTHESIS:</label>
              <input
                type="text"
                value={triggerTitle}
                onChange={(e) => setTriggerTitle(e.target.value)}
                className="w-full bg-obsidian-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyber-cyan"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">INITIAL TRIGGER SEVERITY:</label>
              <select
                value={triggerSeverity}
                onChange={(e) => setTriggerSeverity(e.target.value)}
                className="w-full bg-obsidian-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyber-cyan"
              >
                <option value="critical">Critical (Max Shock Wave)</option>
                <option value="high">High (Substantial Shock)</option>
                <option value="medium">Medium (Localized Bottleneck)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">CASCADING SECTORS AT RISK:</label>
              <div className="space-y-1.5 pt-1">
                {availableSectors.map((sec) => (
                  <label
                    key={sec.id}
                    className="flex items-center space-x-2 text-slate-300 cursor-pointer p-1.5 rounded hover:bg-obsidian-900/60"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSectors.includes(sec.id)}
                      onChange={() => toggleSector(sec.id)}
                      className="rounded border-slate-700 bg-obsidian-950 text-cyber-cyan focus:ring-0"
                    />
                    <span className="text-[11px]">{sec.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isLoading || selectedSectors.length === 0}
              className="w-full mt-4 flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-cyber-cyan hover:bg-cyber-cyan/80 text-obsidian-950 font-bold tracking-wider transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isLoading ? 'CALCULATING CASCADE...' : 'EXECUTE SIMULATION'}</span>
            </button>
          </div>
        </div>

        {/* Right Simulation Results & Cascading Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {simulationResult ? (
            <div className="p-5 rounded-xl glass-panel-glow border-cyber-cyan/30 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-amber/20 text-cyber-amber border border-cyber-amber/30 uppercase">
                    SIMULATION ID: {simulationResult.simulation_id}
                  </span>
                  <h2 className="text-base font-bold text-white mt-1.5">
                    {simulationResult.title}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400">PROJECTED RISK INDEX</div>
                  <div className="text-2xl font-bold font-display text-cyber-red">
                    {simulationResult.risk_score_projection} / 100
                  </div>
                </div>
              </div>

              {/* Affected Sectors Breakdown */}
              <div>
                <div className="text-xs font-mono text-cyber-cyan mb-2 uppercase flex items-center space-x-1.5">
                  <GitFork className="w-3.5 h-3.5" />
                  <span>SECTOR IMPACT COEFFICIENTS & DOWNSTREAM CASCADES</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {simulationResult.affected_sectors.map((sec, i) => (
                    <div key={i} className="p-3 rounded-lg bg-obsidian-900 border border-slate-800 space-y-1">
                      <div className="text-xs font-semibold text-slate-200 capitalize">
                        {sec.sector.replace('_', ' ')}
                      </div>
                      <div className="text-xs font-mono text-cyber-red font-bold">
                        {sec.projected_disruption_index}% STRESS
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Buffer: {sec.resilience_buffer_days} days
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cascading Timeline */}
              <div>
                <div className="text-xs font-mono text-cyber-cyan mb-2 uppercase flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>TEMPORAL CASCADE PROGRESSION (DAY 1 - DAY 14)</span>
                </div>
                <div className="space-y-2">
                  {simulationResult.cascading_timeline.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-obsidian-900/80 border border-slate-800 flex items-start space-x-3 text-xs"
                    >
                      <div className="px-2 py-1 rounded bg-cyber-cyan/15 border border-cyber-cyan/30 text-cyber-cyan font-mono font-bold flex-shrink-0">
                        DAY {step.day}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="font-semibold text-slate-200 font-mono">
                          {step.phase}
                        </div>
                        <p className="text-slate-300 font-sans text-[11px] leading-relaxed">
                          {step.milestone}
                        </p>
                      </div>
                      <div className="text-right font-mono text-cyber-amber text-[11px]">
                        Stress: {step.estimated_system_stress}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stated Assumptions */}
              <div className="p-3 rounded-lg bg-obsidian-950 border border-slate-800 space-y-1 text-[11px] font-mono text-slate-400">
                <div className="text-slate-300 font-semibold uppercase">EXPLICIT MODEL ASSUMPTIONS:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {simulationResult.assumptions.map((asm, i) => (
                    <li key={i}>{asm}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[360px] rounded-xl glass-panel border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <FlaskConical className="w-10 h-10 text-slate-600 animate-pulse" />
              <div className="text-sm font-semibold text-slate-300">
                Simulation Sandbox Ready
              </div>
              <p className="text-xs font-mono text-slate-500 max-w-md">
                Configure the hypothetical shock event parameters on the left and trigger execution to evaluate multi-sector cascading disruptions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
