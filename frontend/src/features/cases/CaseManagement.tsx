import React, { useState, useEffect } from 'react';
import { 
  FolderArchive, 
  Plus, 
  Download, 
  Trash2, 
  Tag, 
  Clock, 
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';
import { CaseInvestigation, NormalizedEvent } from '../../types';

interface CaseManagementProps {
  events: NormalizedEvent[];
}

export const CaseManagement: React.FC<CaseManagementProps> = ({ events }) => {
  const [cases, setCases] = useState<CaseInvestigation[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseInvestigation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');

  const fetchCases = () => {
    api.getCases().then(data => {
      setCases(data);
      if (data.length > 0 && !selectedCase) {
        setSelectedCase(data[0]);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleCreateCase = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await api.createCase({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        status: 'open',
        pinned_event_ids: [],
        tags: ['analyst_binder']
      });
      setCases([res, ...cases]);
      setSelectedCase(res);
      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCase = async (id: string) => {
    try {
      await api.deleteCase(id);
      const updated = cases.filter(c => c.id !== id);
      setCases(updated);
      setSelectedCase(updated.length > 0 ? updated[0] : null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportJson = (c: CaseInvestigation) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(c, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `GRICC_CASE_${c.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] p-6 overflow-hidden flex gap-6 select-none">
      {/* Left Case List Panel */}
      <div className="w-80 lg:w-96 h-full glass-panel rounded-xl flex flex-col border-slate-800">
        <div className="p-4 border-b border-cyber-cyan/20 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyber-cyan uppercase">
            <FolderArchive className="w-4 h-4" />
            <span>INVESTIGATION BINDERS</span>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1.5 rounded-lg bg-cyber-cyan/15 hover:bg-cyber-cyan/25 border border-cyber-cyan/40 text-cyber-cyan transition-colors"
            title="Create New Investigation Case"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Case List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cases.map((c) => {
            const isSelected = selectedCase?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyber-cyan/15 border border-cyber-cyan/50 shadow-glow-cyan/20'
                    : 'bg-obsidian-900/60 hover:bg-obsidian-900 border border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-white line-clamp-1">
                    {c.title}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                    c.priority === 'critical' ? 'bg-cyber-red/20 text-cyber-red border-cyber-red/50' : 'bg-cyber-amber/20 text-cyber-amber border-cyber-amber/50'
                  }`}>
                    {c.priority}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-2 flex items-center justify-between">
                  <span>ID: {c.id}</span>
                  <span className="text-cyber-cyan uppercase">{c.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Case Detail & Report View */}
      <div className="flex-1 h-full glass-panel-glow rounded-xl p-6 border-cyber-cyan/20 overflow-y-auto space-y-6">
        {isCreating ? (
          <div className="max-w-xl space-y-4 text-xs font-mono">
            <div className="text-sm font-bold text-cyber-cyan uppercase">
              NEW CASE INVESTIGATION DOSSIER
            </div>
            <div>
              <label className="text-slate-400 block mb-1">CASE TITLE:</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Critical Strait Bottleneck Incident"
                className="w-full bg-obsidian-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyber-cyan"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">EXECUTIVE SUMMARY / SCOPE:</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={4}
                placeholder="Scope of multi-domain risk inquiry..."
                className="w-full bg-obsidian-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyber-cyan"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">PRIORITY TIER:</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full bg-obsidian-900 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyber-cyan"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleCreateCase}
                className="px-4 py-2 rounded-lg bg-cyber-cyan text-obsidian-950 font-bold"
              >
                SAVE CASE
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-lg bg-obsidian-900 text-slate-400"
              >
                CANCEL
              </button>
            </div>
          </div>
        ) : selectedCase ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-cyber-cyan/20 pb-4">
              <div>
                <div className="text-[10px] font-mono text-cyber-cyan tracking-widest uppercase">
                  CASE DOSSIER // {selectedCase.id}
                </div>
                <h1 className="text-xl font-bold text-white mt-1">
                  {selectedCase.title}
                </h1>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  Status: <strong className="text-cyber-green uppercase">{selectedCase.status}</strong> // Priority: <strong className="text-cyber-amber uppercase">{selectedCase.priority}</strong>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExportJson(selectedCase)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-obsidian-900 hover:bg-obsidian-850 border border-slate-700 text-xs font-mono text-slate-300 hover:text-cyber-cyan transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT DOSSIER (JSON)</span>
                </button>
                <button
                  onClick={() => handleDeleteCase(selectedCase.id)}
                  className="p-1.5 rounded-lg bg-obsidian-900 hover:bg-cyber-red/20 border border-slate-700 text-slate-400 hover:text-cyber-red transition-colors"
                  title="Archive Case"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-obsidian-900/60 border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-slate-400 uppercase">
                INVESTIGATION SCOPE & OBJECTIVE:
              </div>
              <p className="text-sm font-sans text-slate-200 leading-relaxed">
                {selectedCase.description || 'No formal briefing statement documented.'}
              </p>
            </div>

            {/* Analyst Operational Notes */}
            <div className="p-4 rounded-xl bg-obsidian-900/60 border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-cyber-cyan uppercase">
                ANALYST LOG & REASONING MEMO:
              </div>
              <p className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {selectedCase.analyst_notes || 'All current evidence cross-referenced against active USGS, NASA, and CISA feeds. Surveillance continuous.'}
              </p>
            </div>

            {/* Pinned Events Telemetry */}
            <div className="space-y-3">
              <div className="text-xs font-mono text-slate-400 uppercase">
                PINNED SENSOR TELEMETRY NODES ({selectedCase.pinned_event_ids?.length || 0})
              </div>
              {selectedCase.pinned_event_ids && selectedCase.pinned_event_ids.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCase.pinned_event_ids.map((id, i) => (
                    <div key={i} className="p-3 rounded-lg bg-obsidian-900 border border-slate-800 text-xs font-mono text-cyber-cyan">
                      Event Node: {id}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-obsidian-900/30 border border-dashed border-slate-800 text-xs font-mono text-slate-500 text-center">
                  No incident nodes pinned to this dossier yet. Select an incident in Global Operations and click "Pin to Case".
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
            Select an investigation case binder on the left.
          </div>
        )}
      </div>
    </div>
  );
};
