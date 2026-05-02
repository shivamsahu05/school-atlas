import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full card p-8 text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle size={32} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-800">Something went wrong</h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                The application encountered an unexpected error. Don't worry, your data is safe. 
                Please try refreshing the page or return to the dashboard.
              </p>
            </div>

            <div className="p-4 bg-slate-100 rounded-xl text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Error Trace</p>
              <p className="text-xs font-mono text-rose-500 overflow-hidden line-clamp-3">
                {this.state.error?.message || "Unknown error"}
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Refresh Page
              </button>
              <button 
                onClick={this.handleReset}
                className="btn-secondary px-6"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
