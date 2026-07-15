import React from 'react';
import Button from './Button';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught rendering crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center text-left">
          <div className="max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-5">
            <div className="h-14 w-14 rounded-full bg-rose-55 text-rose-600 bg-rose-50 flex items-center justify-center mx-auto">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Workspace Error</h2>
            <p className="text-xs text-slate-400 leading-normal">
              An unexpected client-side component crash occurred. Reload the dashboard to clear the memory.
            </p>
            <div className="pt-2">
              <Button className="w-full" onClick={() => window.location.reload()}>
                Reload Dashboard
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
