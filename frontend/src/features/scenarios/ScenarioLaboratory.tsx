import React, { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  AlertTriangle, 
  Clock, 
  GitFork
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
    <div className="w-full h-full p-8 pt-24 pl-24 overflow-y-auto space-y-6 select-none bg-space">
      {/* Top Banner with Strict Disclaimer */}
      <div className="command-surface p-4 rounded-xl flex items-start space-x-3 border-l-2 border-l-signal-amber">
        <AlertTriangle className="w-4 h-4 text-signal-amber flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <div className="font-mono text-signal-amber uppercase tracking-wider font-semibold">
            SCENARIO LABORATORY // SYNTHETIC CONTINGENCY SANDBOX
          </div>
          <p className="text-content-secondary font-sans leading-relaxed">
            All models in this workspace are synthetic cascading simulations for strategic stress-testing. Outputs represent analytical estimations based on input assumptions and must never be portrayed as verified predictions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Parameter Panel */}
        <div className="command-surface p-5 rounded-xl space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono text-content-primary font-semibold">
            <FlaskConical className="w-4 h-4 text-signal-cyan" />
            <span>HYPOTHETICAL SHOCK VECTOR</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-content-muted block mb-1">SCENARIO TITLE</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full bg-space border border-surface-border rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:border-surface-border-active"
              />
            </div>

            <div>
              <label className="text-content-muted block mb-1">TRIGGER DOMAIN</label>
              <select
                value={triggerDomain}
                onChange={(e) => setTriggerDomain(e.target.value)}
                className="w-full bg-space border border-surface-border rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:border-surface-border-active"
              >
                <option value="geopolitical">Geopolitical Conflict</option>
                <option value="cybersecurity">Critical Infrastructure Cyberattack</option>
                <option value="natural_hazard">Major Catastrophic Hazard</option>
                <option value="weather_extreme">Extreme Meteorological Bottleneck</option>
              </select>
            </div>

            <div>
              <label className="text-content-muted block mb-1">TRIGGER EVENT HYPOTHESIS</label>
              <input
                type="text"
                value={triggerTitle}
                onChange={(e) => setTriggerTitle(e.target.value)}
                className="w-full bg-space border border-surface-border rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:border-surface-border-active"
              />
            </div>

            <div>
              <label className="text-content-muted block mb-1">SHOCK SEVERITY</label>
              <select
                value={triggerSeverity}
                onChange={(e) => setTriggerSeverity(e.target.value)}
                className="w-full bg-space border border-surface-border rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:border-surface-border-active"
              >
                <option value="critical">Critical (Max Shock Wave)</option>
                <option value="high">High (Substantial Shock)</option>
                <option value="medium">Medium (Localized Bottleneck)</option>
              </select>
            </div>

            <div>
              <label className="text-content-muted block mb-1.5">CASCADING SECTORS AT RISK</label>
              <div className="space-y-1">
                {availableSectors.map((sec) => (
                  <label
                    key={sec.id}
                    className="flex items-center space-x-2 text-content-secondary cursor-pointer p-1.5 rounded-lg hover:bg-space"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSectors.includes(sec.id)}
                      onChange={() => toggleSector(sec.id)}
                      className="rounded border-surface-border bg-space text-signal-cyan focus:ring-0"
                    />
                    <span className="text-[11px] font-sans text-content-primary">{sec.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isLoading || selectedSectors.length === 0}
              className="w-full mt-3 flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-signal-cyan/20 hover:bg-signal-cyan/30 text-signal-cyan font-semibold border border-signal-cyan/40 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isLoading ? 'CALCULATING CASCADE...' : 'EXECUTE SIMULATION'}</span>
            </button>
          </div>
        </div>

        {/* Right Simulation Results */}
        <div className="lg:col-span-2 space-y-4">
          {simulationResult ? (
            <div className="command-surface p-5 rounded-xl space-y-5">
              <div className="flex items-start justify-between border-b border-surface-border pb-3">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-signal-amber/20 text-signal-amber uppercase font-semibold">
                    SIMULATION // {simulationResult.simulation_id}
                  </span>
                  <h2 className="text-base font-semibold text-content-primary mt-1.5">
                    {simulationResult.title}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-content-muted">PROJECTED PEAK STRESS</div>
                  <div className="text-2xl font-bold font-mono text-signal-red">
                    {simulationResult.risk_score_projection} / 100
                  </div>
                </div>
              </div>

              {/* Sector Stress Coefficients */}
              <div>
                <div className="text-xs font-mono text-content-muted mb-2 uppercase flex items-center space-x-1.5">
                  <GitFork className="w-3.5 h-3.5 text-signal-cyan" />
                  <span>SECTOR IMPACT COEFFICIENTS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {simulationResult.affected_sectors.map((sec, i) => (
                    <div key={i} className="p-3 rounded-lg bg-space border border-surface-border space-y-1">
                      <div className="text-xs font-medium text-content-primary capitalize">
                        {sec.sector.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs font-mono text-signal-red font-semibold">
                        {sec.projected_disruption_index}% Disruption
                      </div>
                      <div className="text-[10px] font-mono text-content-muted">
                        Buffer: {sec.resilience_buffer_days} days
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Temporal Cascading Timeline */}
              <div>
                <div className="text-xs font-mono text-content-muted mb-2 uppercase flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-signal-cyan" />
                  <span>TEMPORAL CASCADE SEQUENCE (DAY 1 - DAY 14)</span>
                </div>
                <div className="space-y-2">
                  {simulationResult.cascading_timeline.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-space border border-surface-border flex items-start space-x-3 text-xs"
                    >
                      <div className="px-2 py-1 rounded bg-surface-subtle text-signal-cyan font-mono font-bold flex-shrink-0 text-[11px]">
                        DAY {step.day}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="font-semibold text-content-primary">
                          {step.phase}
                        </div>
                        <p className="text-content-secondary font-sans text-[11px] leading-relaxed">
                          {step.milestone}
                        </p>
                      </div>
                      <div className="text-right font-mono text-signal-amber text-[11px] flex-shrink-0">
                        Stress: {step.estimated_system_stress}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explicit Assumptions */}
              <div className="p-3 rounded-xl bg-space border border-surface-border space-y-1 text-[11px] font-mono text-content-muted">
                <div className="text-content-secondary font-semibold uppercase">DOCUMENTED MODEL ASSUMPTIONS:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {simulationResult.assumptions.map((asm, i) => (
                    <li key={i}>{asm}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[380px] rounded-xl command-surface flex flex-col items-center justify-center text-center p-8 space-y-2">
              <FlaskConical className="w-8 h-8 text-content-muted mb-2" />
              <div className="text-sm font-medium text-content-primary">
                Simulation Sandbox Ready
              </div>
              <p className="text-xs text-content-secondary max-w-sm">
                Select your hypothetical shock parameters on the left to evaluate cross-sector cascading consequences.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
