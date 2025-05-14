/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";

/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */

export function ClientErrorBoundary({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      {children}
      <footer className="fixed bottom-0 right-0 p-2 text-xs">
        <Badge className="text-muted-foreground bg-secondary">
          inventorymgmt-v2.0.0-alpha.1 &copy; {new Date().getFullYear()}{" "}
          lichtlabs
        </Badge>
      </footer>
      <Toaster />
    </ErrorBoundary>
  );
}
