"use client";

import { Mail } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
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
    this.setState({
      error,
      errorInfo
    });
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReportBug = () => {
    const { error, errorInfo } = this.state;
    const subject = encodeURIComponent("Bug Report - Inventory Management v2");
    const body = encodeURIComponent(`
Error Details:
${error?.message}

Stack Trace:
${error?.stack}

Component Stack:
${errorInfo?.componentStack}

Please describe what you were doing when this error occurred:
`);

    const mailtoLink = `mailto:developer@lichtlabs.com?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <h2 className="text-2xl font-bold text-destructive">
              Oops! Something went wrong
            </h2>
            <p className="text-muted-foreground">
              We encountered an unexpected error. Please help us improve by
              reporting this issue.
            </p>
            <div className="bg-muted p-4 rounded-lg text-left">
              <p className="text-sm font-medium">Error Details:</p>
              <pre className="text-xs mt-2 overflow-auto max-h-40">
                {this.state.error?.message}
              </pre>
            </div>
            <Button
              onClick={this.handleReportBug}
              className="w-full"
              variant="outline"
            >
              <Mail className="mr-2 h-4 w-4" />
              Report Bug
            </Button>
            <Button
              onClick={() => (window.location.pathname = "/")}
              className="w-full"
              variant="default"
            >
              Back Home
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              variant="default"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
