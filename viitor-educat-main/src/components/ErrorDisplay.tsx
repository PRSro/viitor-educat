/**
 * Error Display Component
 * 
 * User-friendly error screens for different error types.
 * Shows appropriate message and retry button.
 */

import { AlertTriangle, WifiOff, ShieldX, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export type ErrorType = 'offline' | 'unauthorized' | 'forbidden' | 'server' | 'unknown';

interface ErrorDisplayProps {
  type: ErrorType;
  message?: string;
  onRetry?: () => void;
  showHome?: boolean;
}

const errorConfig: Record<ErrorType, { icon: typeof AlertTriangle; title: string; defaultMessage: string; color: string }> = {
  offline: {
    icon: WifiOff,
    title: 'Server Unavailable',
    defaultMessage: 'Unable to connect to the server. Please check your connection and try again.',
    color: 'text-orange-500',
  },
  unauthorized: {
    icon: ShieldX,
    title: 'Session Expired',
    defaultMessage: 'Your session has expired. Please log in again to continue.',
    color: 'text-yellow-500',
  },
  forbidden: {
    icon: ShieldX,
    title: 'Access Denied',
    defaultMessage: 'You do not have permission to access this resource.',
    color: 'text-destructive',
  },
  server: {
    icon: AlertTriangle,
    title: 'Server Error',
    defaultMessage: 'The server encountered an error. Our team has been notified.',
    color: 'text-destructive',
  },
  unknown: {
    icon: AlertTriangle,
    title: 'Something Went Wrong',
    defaultMessage: 'An unexpected error occurred. Please try again.',
    color: 'text-muted-foreground',
  },
};

export function ErrorDisplay({ type, message, onRetry, showHome = true }: ErrorDisplayProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className={`mx-auto mb-4 ${config.color}`}>
            <Icon className="w-16 h-16" />
          </div>
          <CardTitle className="text-xl">{config.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {message || config.defaultMessage}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {onRetry && (
            <Button onClick={onRetry} className="w-full" variant="default">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {showHome && (
            <Button asChild variant="outline" className="w-full">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
          )}
          {type === 'unauthorized' && (
            <Button asChild variant="default" className="w-full">
              <Link to="/login">Log In Again</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
