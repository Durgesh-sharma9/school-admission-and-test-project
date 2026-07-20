import React from 'react';
import Button from './Button';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught rendering crash:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-5">
            <div className="h-14 w-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Workspace Error</h2>
            <p className="text-xs text-slate-500 leading-normal">
              An unexpected client-side component crash occurred.
            </p>
            {this.state.error && (
              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 text-left text-[11px] font-mono text-rose-700 max-h-40 overflow-y-auto break-all">
                {this.state.error.toString()}
              </div>
            )}
            <div className="pt-2 flex gap-3">
              <Button className="flex-1" variant="outline" onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button className="flex-1" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

