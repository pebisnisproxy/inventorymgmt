/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { openUrl } from "@tauri-apps/plugin-opener";
import { AlertTriangle, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Function to report the error via email
  const reportError = async () => {
    try {
      // Format error information
      const errorSubject = `Error Report: ${error.name}`;
      const errorBody = `
Hello Developer Team,

I encountered an error while using the application:

Error Type: ${error.name}
Error Message: ${error.message}
Error ID: ${error.digest || "Not available"}

Steps to reproduce:
1. [Please describe what you were doing when the error occurred]

Browser/Environment:
[Your browser and OS information]

Thank you for addressing this issue.
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

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full mx-auto text-center space-y-6">
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
                  <span className="font-semibold block">Kode Error:</span>
                  {error.digest || error.message || "Unknown error"}
                </p>
              </div>

              <p className="text-gray-600 mb-6">
                Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah
                diberitahu tentang masalah ini.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => reset()}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Coba Lagi
                </Button>

                <Button
                  onClick={reportError}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Laporkan Masalah
                </Button>

                <Button asChild variant="secondary">
                  <Link href="/">Kembali ke Beranda</Link>
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
              </a>{" "}
              atau{" "}
              <a
                href="https://instagram.com/lichtlabs"
                className="text-blue-600 hover:underline"
              >
                instagram.com/lichtlabs
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
