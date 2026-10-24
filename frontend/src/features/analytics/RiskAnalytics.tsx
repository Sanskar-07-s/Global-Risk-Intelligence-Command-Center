import React from 'react';
import ReactECharts from 'echarts-for-react';
import { NormalizedEvent, RiskOverview } from '../../types';
import { BarChart3, PieChart, Activity, Sliders, ShieldCheck } from 'lucide-react';

interface RiskAnalyticsProps {
  events: NormalizedEvent[];
  riskOverview: RiskOverview | null;
}

export const RiskAnalytics: React.FC<RiskAnalyticsProps> = ({
  events,
  riskOverview
}) => {
  // Domain Risk Matrix Options
  const domainCounts = riskOverview?.domain_breakdown || {};
  const domainChartOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: '15%', left: '5%', right: '5%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: Object.keys(domainCounts).map(d => d.replace('_', ' ').toUpperCase()),
      axisLine: { lineStyle: { color: 'rgba(0, 240, 255, 0.3)' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(0, 240, 255, 0.3)' } },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
      axisLabel: { color: '#94a3b8' }
    },
    series: [
      {
        name: 'Incidents Count',
        type: 'bar',
        data: Object.values(domainCounts),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#00f0ff' },
              { offset: 1, color: '#0077b6' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };

  // Severity Doughnut Options
  const severityCounts = riskOverview?.severity_breakdown || {};
  const severityChartOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: {
      bottom: '0%',
      textStyle: { color: '#94a3b8', fontSize: 10 }
    },
    series: [
      {
        name: 'Severity Tiers',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: [
          { value: severityCounts.critical || 0, name: 'Critical', itemStyle: { color: '#ff0054' } },
          { value: severityCounts.high || 0, name: 'High', itemStyle: { color: '#ffb703' } },
          { value: severityCounts.medium || 0, name: 'Medium', itemStyle: { color: '#00f0ff' } },
          { value: severityCounts.low || 0, name: 'Low', itemStyle: { color: '#70d6ff' } },
        ]
      }
    ]
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] p-6 overflow-y-auto space-y-6 select-none">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-panel border-cyber-cyan/30">
          <div className="text-[11px] font-mono text-slate-400 uppercase">
            GLOBAL COMPOSITE RISK
          </div>
          <div className="text-2xl font-bold font-display text-cyber-cyan mt-1">
            {riskOverview?.global_composite_risk || 0} / 100
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-2">
            METHODOLOGY v1.0.0-MULTI-FACTOR
          </div>
        </div>

        <div className="p-4 rounded-xl glass-panel border-cyber-red/30">
          <div className="text-[11px] font-mono text-slate-400 uppercase">
            CRITICAL INCIDENTS
          </div>
          <div className="text-2xl font-bold font-display text-cyber-red mt-1">
            {riskOverview?.critical_count || 0}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-2">
            IMMEDIATE ACTION PROTOCOL
          </div>
        </div>

        <div className="p-4 rounded-xl glass-panel border-cyber-amber/30">
          <div className="text-[11px] font-mono text-slate-400 uppercase">
            HIGH SEVERITY THREATS
          </div>
          <div className="text-2xl font-bold font-display text-cyber-amber mt-1">
            {riskOverview?.high_count || 0}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-2">
            ACTIVE WATCHLIST CORRIDORS
          </div>
        </div>

        <div className="p-4 rounded-xl glass-panel border-cyber-green/30">
          <div className="text-[11px] font-mono text-slate-400 uppercase">
            TOTAL FUSED SENSOR EVENTS
          </div>
          <div className="text-2xl font-bold font-display text-cyber-green mt-1">
            {riskOverview?.total_incidents || events.length}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-2">
            MULTI-DOMAIN REAL-TIME FEEDS
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl glass-panel border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-cyber-cyan uppercase">
            <BarChart3 className="w-4 h-4" />
            <span>INCIDENT DISTRIBUTION BY RISK DOMAIN</span>
          </div>
          <div className="h-64">
            <ReactECharts option={domainChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div className="p-4 rounded-xl glass-panel border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-cyber-cyan uppercase">
            <PieChart className="w-4 h-4" />
            <span>GLOBAL SEVERITY RATIO</span>
          </div>
          <div className="h-64">
            <ReactECharts option={severityChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Methodology & Dimensional Weights Breakdown */}
      <div className="p-6 rounded-xl glass-panel-glow border-cyber-cyan/30 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyber-cyan uppercase">
          <ShieldCheck className="w-4 h-4" />
          <span>EXPLAINABLE RISK SCORING METHODOLOGY (AUDIT SPECIFICATION)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-obsidian-900 border border-slate-800">
            <div className="text-cyber-cyan font-semibold">1. Severity Magnitude (40%)</div>
            <p className="text-slate-400 mt-1 text-[11px] font-sans">
              Normalizes earthquake Richter scale, flood flow, CISA exploit severity, and wildfire FRP.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-obsidian-900 border border-slate-800">
            <div className="text-cyber-cyan font-semibold">2. Geographic Exposure (30%)</div>
            <p className="text-slate-400 mt-1 text-[11px] font-sans">
              Evaluates proximity to high-density population centers, maritime straits, and shipping ports.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-obsidian-900 border border-slate-800">
            <div className="text-cyber-cyan font-semibold">3. System Fragility (20%)</div>
            <p className="text-slate-400 mt-1 text-[11px] font-sans">
              World Bank macroeconomic resilience index and critical infrastructure vulnerability factors.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-obsidian-900 border border-slate-800">
            <div className="text-cyber-cyan font-semibold">4. Recency Decay (10%)</div>
            <p className="text-slate-400 mt-1 text-[11px] font-sans">
              Temporal decay function with 72-hour half-life for acute kinetic events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
