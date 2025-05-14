"use client";

import { openUrl } from "@tauri-apps/plugin-opener";
import { AlertTriangle, ArrowLeft, Mail } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: (Error & { digest?: string }) | null;
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

  private handleReportBug = async () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    try {
      // Format error information with HTML for better readability
      const errorSubject = `Error Report: ${error.name}`;
      const errorBody = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; }
  h2 { color: #e11d48; }
  .section { margin-bottom: 20px; }
  .label { font-weight: bold; margin-bottom: 5px; }
  pre { background-color: #f1f5f9; padding: 10px; border-radius: 4px; overflow-x: auto; }
  code { font-family: monospace; }
</style>
</head>
<body>
  <h2>Error Report</h2>

  <br />

   <div class="section">
    <div class="label">Steps to Reproduce:</div>
    <p>[Please describe what you were doing when the error occurred]</p>
  </div>

  <br />
  
  <div class="section">
    <div class="label">Browser/Environment:</div>
    <p>[Your browser and OS information]</p>
  </div>

  <br />
  
  <div class="section">
    <div class="label">Error Type:</div>
    <pre><code>${error.name}</code></pre>
  </div>
  
  <div class="section">
    <div class="label">Error Message:</div>
    <pre><code>${error.message}</code></pre>
  </div>
  
  <div class="section">
    <div class="label">Error ID:</div>
    <pre><code>${error.digest || "Not available"}</code></pre>
  </div>
  
  <div class="section">
    <div class="label">Component Stack:</div>
    <pre><code>${errorInfo?.componentStack?.replace(/\n/g, "<br>") || "Not available"}</code></pre>
  </div>
  
  <p>Thank you for addressing this issue.</p>
</body>
</html>
      `.trim();

      // Open default email client with pre-filled content
      const mailtoUrl = `mailto:sena@lichtlabs.org?subject=${encodeURIComponent(errorSubject)}&body=${encodeURIComponent(errorBody)}`;

      // Use Tauri's opener plugin to open the mailto URL
      await openUrl(mailtoUrl);
    } catch (emailError) {
      console.error("Failed to open email client:", emailError);
      // Fallback: Copy error information to clipboard
      navigator.clipboard.writeText(
        `Error: ${error.message} (${error.digest || "No digest"})`
      );
      alert(
        "Email client could not be opened. Error details copied to clipboard."
      );
    }
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      const { error } = this.state;

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="max-w-lg w-full mx-auto text-center space-y-6">
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <AlertTriangle className="h-20 w-20 text-red-500 mx-auto mb-6" />

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Terjadi Kesalahan
              </h1>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Aplikasi Mengalami Masalah
              </h2>

              <div className="bg-red-50 border border-red-200 rounded p-3 mb-6">
                <p className="text-red-800 text-sm">
                  <span className="font-semibold block">Error Code:</span>
                  {error.digest || error.message || "Unknown error"}
                </p>
              </div>

              <p className="text-gray-600 mb-6">
                Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah
                diberitahu tentang masalah ini.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRefresh}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Coba Lagi
                </Button>

                <Button
                  onClick={this.handleReportBug}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Laporkan Masalah
                </Button>

                <Button onClick={this.handleGoHome} variant="secondary">
                  Kembali ke Beranda
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Jika masalah terus berlanjut, silakan hubungi administrator sistem
              di{" "}
              <a
                href="mailto:sena@lichtlabs.org"
                className="text-blue-600 hover:underline"
              >
                sena@lichtlabs.org
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
