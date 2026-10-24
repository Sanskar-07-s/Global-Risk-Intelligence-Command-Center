import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { AICitedBrief } from '../../types';

export const AIDesk: React.FC = () => {
  const [question, setQuestion] = useState('Provide an operational intelligence brief on recent severe seismic activities and weaponized cyber vulnerabilities.');
  const [region, setRegion] = useState('');
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [brief, setBrief] = useState<AICitedBrief | null>(null);

  const samplePrompts = [
    "Assess compound supply chain vulnerabilities in the Red Sea corridor.",
    "Summarize critical CISA KEV remote code execution vulnerabilities this week.",
    "Evaluate seismic hazard exposure in the Pacific Ring of Fire.",
    "Explain the risk drivers contributing to current global elevated status."
  ];

  const handleQuery = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.queryIntelligence(q, region || undefined, domain || undefined);
      setBrief(res);
    } catch (err) {
      console.error("AI Desk query error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] p-6 overflow-y-auto space-y-6 select-none">
      {/* Top Header */}
      <div className="p-4 rounded-xl glass-panel-glow border-cyber-cyan/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-mono text-cyber-cyan uppercase tracking-wider">
              AI INTELLIGENCE DESK // EVIDENCE-GROUNDED SYNTHESIS
            </div>
            <h1 className="text-lg font-bold text-white">
              Gemini Operational Intelligence Analyst & Cited Brief Generator
            </h1>
          </div>
        </div>
        <div className="text-right text-[11px] font-mono text-slate-400 hidden sm:block">
          <div>RAG PIPELINE: ACTIVE SENSOR FUSION</div>
          <div className="text-cyber-green">ZERO HALLUCINATION GUARDRAIL ACTIVE</div>
        </div>
      </div>

      {/* Query Bar */}
      <div className="p-4 rounded-xl glass-panel border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask an analytical intelligence question grounded in live sensor data..."
              className="w-full text-xs font-mono bg-obsidian-900 border border-slate-700 rounded-lg pl-3 pr-10 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-cyan"
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            />
          </div>
          <button
            onClick={() => handleQuery()}
            disabled={isLoading || !question.trim()}
            className="flex items-center justify-center space-x-2 px-5 py-3 rounded-lg bg-cyber-cyan hover:bg-cyber-cyan/80 text-obsidian-950 font-bold text-xs tracking-wider transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>{isLoading ? 'ANALYZING EVIDENCE...' : 'GENERATE BRIEF'}</span>
          </button>
        </div>

        {/* Suggested Prompts */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-mono text-slate-400">QUICK PROMPTS:</span>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(p);
                handleQuery(p);
              }}
              className="text-[10px] font-mono px-2.5 py-1 rounded bg-obsidian-900 hover:bg-obsidian-850 border border-slate-700 hover:border-cyber-cyan/50 text-slate-300 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Brief Output Area */}
      {brief && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="p-5 rounded-xl glass-panel-glow border-cyber-cyan/40 space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-cyan/20 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyber-cyan" />
                <span className="text-xs font-mono font-bold text-cyber-cyan uppercase tracking-wider">
                  GROUNDED INTELLIGENCE ASSESSMENT
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-green/20 text-cyber-green border border-cyber-green/40">
                CONFIDENCE: {brief.confidence_level}
              </span>
            </div>

            <p className="text-sm font-sans text-slate-200 leading-relaxed">
              {brief.summary}
            </p>

            {/* Key Findings */}
            <div>
              <div className="text-xs font-mono text-cyber-cyan mb-2 uppercase">
                VERIFIED KEY FINDINGS (SOURCE CITATIONS INCLUDED):
              </div>
              <ul className="space-y-1.5">
                {brief.key_findings.map((finding, idx) => (
                  <li key={idx} className="text-xs font-sans text-slate-300 flex items-start space-x-2">
                    <CheckCircle className="w-3.5 h-3.5 text-cyber-cyan flex-shrink-0 mt-0.5" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Operational Postures */}
            <div>
              <div className="text-xs font-mono text-cyber-amber mb-2 uppercase">
                RECOMMENDED OPERATIONAL ACTIONS:
              </div>
              <ul className="space-y-1.5">
                {brief.recommended_actions.map((act, idx) => (
                  <li key={idx} className="text-xs font-sans text-slate-300 flex items-start space-x-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyber-amber flex-shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Missing Evidence & Gaps */}
            {brief.missing_evidence.length > 0 && (
              <div className="p-3 rounded-lg bg-obsidian-950 border border-slate-800 text-xs font-mono space-y-1">
                <div className="text-slate-400 font-semibold uppercase flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>IDENTIFIED UNCERTAINTIES & EVIDENCE GAPS:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                  {brief.missing_evidence.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Citations Grid */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-slate-400 uppercase">
              ATTACHED SOURCE CITATIONS ({brief.citations.length} VERIFIED NODES)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {brief.citations.map((cite, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg glass-panel border-slate-800 text-xs font-mono space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-cyber-cyan font-bold">[{cite.citation_id}]</span>
                    <span className="text-slate-400">{cite.source.toUpperCase()}</span>
                  </div>
                  <div className="text-slate-200 font-sans text-[11px] line-clamp-2">
                    {cite.title}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Score: {cite.risk_score}</span>
                    {cite.url && (
                      <a
                        href={cite.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyber-cyan hover:underline flex items-center space-x-1"
                      >
                        <span>Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
