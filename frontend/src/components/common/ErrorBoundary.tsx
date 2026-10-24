import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Compass } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GRICC ErrorBoundary intercepted runtime exception:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center p-6 bg-space select-none">
          <div className="command-surface-elevated max-w-md p-6 rounded-2xl border border-signal-red/30 shadow-subtle-surface space-y-4 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-signal-red/15 border border-signal-red/30 flex items-center justify-center mx-auto text-signal-red">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-content-primary">
                {this.props.fallbackTitle || 'Telemetry Visualization Anomaly'}
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed font-sans">
                A localized runtime exception was safely intercepted. The planetary engine remains operational.
              </p>
              {this.state.error?.message && (
                <div className="p-2.5 rounded-lg bg-space border border-surface-border text-[11px] font-mono text-signal-amber text-left truncate max-w-sm mx-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-center space-x-3">
              <button
                onClick={this.handleReset}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-signal-cyan/20 hover:bg-signal-cyan/30 border border-signal-cyan/40 text-signal-cyan text-xs font-mono font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recover Workspace</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
