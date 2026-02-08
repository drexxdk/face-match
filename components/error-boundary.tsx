'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { logError } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, `Error caught by boundary: ${errorInfo.componentStack}`);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="mx-auto mt-8 max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">An unexpected error occurred. Please try again.</p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="bg-muted max-h-32 overflow-auto rounded p-3 text-xs">{this.state.error.message}</pre>
            )}
            <div className="flex gap-2">
              <Button onClick={this.handleRetry} className="flex-1">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return <div className={this.props.className}>{this.props.children}</div>;
  }
}
