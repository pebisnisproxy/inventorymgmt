/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */
import AppDashboard from "@/components/app-dashboard";

export default function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppDashboard>{children}</AppDashboard>;
}
