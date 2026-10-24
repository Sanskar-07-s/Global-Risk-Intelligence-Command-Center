import React, { useState, useEffect } from 'react';
import { 
  FolderArchive, 
  Plus, 
  Download, 
  Trash2, 
  Bookmark, 
  Clock, 
  Tag 
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
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `GRICC_CASE_${c.id}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="w-full h-full p-8 pt-24 pl-24 overflow-hidden flex gap-6 select-none bg-space">
      {/* Left Case Index Panel */}
      <div className="w-80 lg:w-96 h-full command-surface rounded-2xl flex flex-col">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-content-primary">
            <FolderArchive className="w-4 h-4 text-signal-cyan" />
            <span>INVESTIGATION BINDERS</span>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1.5 rounded-lg bg-surface-subtle hover:bg-surface-elevated text-content-primary transition-colors"
            title="Create New Case Binder"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Case List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {cases.map((c) => {
            const isSelected = selectedCase?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'command-surface-active shadow-cyan-glow'
                    : 'hover:bg-surface-subtle'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-content-primary line-clamp-1">
                    {c.title}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                    c.priority === 'critical' ? 'bg-signal-red/20 text-signal-red' : 'bg-signal-amber/20 text-signal-amber'
                  }`}>
                    {c.priority}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-content-muted mt-2 flex items-center justify-between">
                  <span>{c.id}</span>
                  <span className="text-signal-cyan uppercase">{c.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Reading & Investigation Surface */}
      <div className="flex-1 h-full command-surface p-6 rounded-2xl overflow-y-auto space-y-6">
        {isCreating ? (
          <div className="max-w-xl space-y-4 text-xs font-mono">
            <h2 className="text-sm font-semibold text-content-primary uppercase">
              NEW CASE DOSSIER
            </h2>
            <div>
              <label className="text-content-muted block mb-1">CASE TITLE</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Critical Logistics Chokepoint Disruption"
                className="w-full bg-space border border-surface-border rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:border-surface-border-active"
              />
            </div>
            <div>
              <label className="text-content-muted block mb-1">EXECUTIVE SUMMARY / SCOPE</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={4}
                placeholder="Scope of investigation..."
                className="w-full bg-space border border-surface-border rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:border-surface-border-active font-sans"
              />
            </div>
            <div>
              <label className="text-content-muted block mb-1">PRIORITY TIER</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full bg-space border border-surface-border rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:border-surface-border-active"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleCreateCase}
                className="px-4 py-2 rounded-lg bg-signal-cyan/20 hover:bg-signal-cyan/30 text-signal-cyan font-semibold border border-signal-cyan/40"
              >
                Save Binder
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-lg text-content-muted hover:text-content-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : selectedCase ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-surface-border pb-4">
              <div>
                <div className="text-[10px] font-mono text-signal-cyan uppercase tracking-wider">
                  CASE DOSSIER // {selectedCase.id}
                </div>
                <h1 className="text-lg font-semibold text-content-primary mt-1">
                  {selectedCase.title}
                </h1>
                <div className="text-xs font-mono text-content-muted mt-1">
                  STATUS: <strong className="text-signal-green uppercase">{selectedCase.status}</strong> // PRIORITY: <strong className="text-signal-amber uppercase">{selectedCase.priority}</strong>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExportJson(selectedCase)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-elevated text-xs font-mono text-content-secondary hover:text-content-primary border border-surface-border transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={() => handleDeleteCase(selectedCase.id)}
                  className="p-1.5 rounded-lg text-content-muted hover:text-signal-red hover:bg-signal-red/10 transition-colors"
                  title="Archive Case"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-content-muted uppercase">
                INVESTIGATION SCOPE
              </div>
              <p className="text-xs font-sans text-content-secondary leading-relaxed bg-space p-3 rounded-xl border border-surface-border">
                {selectedCase.description || 'No formal briefing statement documented.'}
              </p>
            </div>

            {/* Analyst Notes */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-signal-cyan uppercase">
                ANALYST LOG & OBSERVATIONS
              </div>
              <p className="text-xs font-mono text-content-secondary leading-relaxed bg-space p-3 rounded-xl border border-surface-border">
                {selectedCase.analyst_notes || 'Continuous correlation active across multi-domain sensors.'}
              </p>
            </div>

            {/* Pinned Nodes */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-content-muted uppercase">
                PINNED SENSOR INCIDENT NODES ({selectedCase.pinned_event_ids?.length || 0})
              </div>
              {selectedCase.pinned_event_ids && selectedCase.pinned_event_ids.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCase.pinned_event_ids.map((id, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-space border border-surface-border text-xs font-mono text-signal-cyan">
                      Event Node: {id}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-space border border-dashed border-surface-border text-xs font-mono text-content-muted text-center">
                  No incident nodes pinned to this dossier. Select an incident in Operations Command and click "Pin to Investigation Binder".
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-xs font-mono text-content-muted">
            Select an investigation case binder on the left.
          </div>
        )}
      </div>
    </div>
  );
};
