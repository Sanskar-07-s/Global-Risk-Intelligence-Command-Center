import React from 'react';
import { 
  Globe, 
  Flame, 
  Share2, 
  BarChart3, 
  FlaskConical, 
  Bot, 
  Server, 
  FolderArchive,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export type WorkspaceId = 
  | 'operations'
  | 'threats'
  | 'knowledge-graph'
  | 'analytics'
  | 'scenarios'
  | 'ai-desk'
  | 'data-health'
  | 'cases';

interface SidebarProps {
  activeWorkspace: WorkspaceId;
  onSelectWorkspace: (id: WorkspaceId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: WorkspaceId;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeWorkspace,
  onSelectWorkspace,
  collapsed,
  onToggleCollapse
}) => {
  const navItems: NavItem[] = [
    { id: 'operations', label: 'Global Operations', icon: Globe },
    { id: 'threats', label: 'Threat Intelligence', icon: Flame, badge: 'HOT' },
    { id: 'knowledge-graph', label: 'Knowledge Graph', icon: Share2 },
    { id: 'analytics', label: 'Risk Analytics', icon: BarChart3 },
    { id: 'scenarios', label: 'Scenario Laboratory', icon: FlaskConical },
    { id: 'ai-desk', label: 'AI Intelligence Desk', icon: Bot, badge: 'AI' },
    { id: 'data-health', label: 'Data Fusion & Health', icon: Server },
    { id: 'cases', label: 'Reports & Cases', icon: FolderArchive },
  ];

  return (
    <aside
      className={`relative border-r border-cyber-cyan/20 bg-obsidian-950/80 backdrop-blur-md flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation List */}
      <div className="py-4 space-y-1.5 px-2">
        <div className={`px-3 py-1 text-[10px] font-mono tracking-widest text-slate-400 uppercase ${collapsed ? 'hidden' : 'block'}`}>
          COMMAND WORKSPACES
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeWorkspace === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectWorkspace(item.id)}
              className={`w-full flex items-center rounded-lg py-2.5 px-3 transition-all group relative ${
                isActive
                  ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/40 shadow-glow-cyan/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-900 border border-transparent'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyber-cyan' : 'group-hover:text-cyber-cyan'} transition-colors`} />
              
              {!collapsed && (
                <div className="ml-3 flex items-center justify-between flex-grow text-left">
                  <span className="text-xs font-medium tracking-wide">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyber-cyan rounded-r shadow-glow-cyan" />
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div className="text-[10px] font-mono text-slate-400">
            DEFCON-3 // STANDBY
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg bg-obsidian-900 hover:bg-obsidian-850 text-slate-400 hover:text-cyber-cyan border border-slate-700 transition-colors mx-auto"
          title={collapsed ? "Expand Command Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
