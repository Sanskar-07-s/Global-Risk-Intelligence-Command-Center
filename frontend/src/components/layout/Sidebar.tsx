import React from 'react';
import { 
  Globe, 
  Flame, 
  Share2, 
  BarChart3, 
  FlaskConical, 
  Bot, 
  Server, 
  FolderArchive 
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
}

interface NavItem {
  id: WorkspaceId;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeWorkspace,
  onSelectWorkspace
}) => {
  const navItems: NavItem[] = [
    { id: 'operations', label: 'Operations Command', icon: Globe },
    { id: 'threats', label: 'Threat Intelligence', icon: Flame, badge: 'Active' },
    { id: 'knowledge-graph', label: 'Knowledge Graph', icon: Share2 },
    { id: 'analytics', label: 'Risk Analytics', icon: BarChart3 },
    { id: 'scenarios', label: 'Scenario Laboratory', icon: FlaskConical },
    { id: 'ai-desk', label: 'AI Intelligence Desk', icon: Bot },
    { id: 'data-health', label: 'Data Fusion & Health', icon: Server },
    { id: 'cases', label: 'Case Management', icon: FolderArchive },
  ];

  return (
    <nav className="absolute left-6 top-1/2 -translate-y-1/2 z-40 pointer-events-auto select-none">
      <div className="command-surface-elevated p-1.5 rounded-2xl flex flex-col space-y-1.5 shadow-subtle-surface">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeWorkspace === item.id;

          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => onSelectWorkspace(item.id)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-signal-cyan/20 text-signal-cyan shadow-cyan-glow border border-signal-cyan/40'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-subtle'
                }`}
                aria-label={item.label}
              >
                <Icon className="w-4 h-4" />
              </button>

              {/* Minimalist Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg command-surface-elevated text-xs font-medium text-content-primary whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 flex items-center space-x-1.5 shadow-subtle-surface">
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1 rounded bg-signal-amber/20 text-signal-amber">
                    {item.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
};
