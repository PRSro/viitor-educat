/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors and displays fallback UI.
 * Used for catching rendering errors in React components.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorDisplay } from './ErrorDisplay';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Fire-and-forget: send telemetry to backend (never exposes raw data to user)
    try {
      const token = localStorage.getItem('token');
      fetch('/api/admin/client-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(() => { /* best-effort */ });
    } catch {
      // Never let telemetry crash the error boundary itself
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <ErrorDisplay
          type="unknown"
          message={this.state.error?.message || 'Something went wrong'}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
