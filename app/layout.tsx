import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ErrorBoundary } from "@/components/error-boundary";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Inventory Management",
  description: "Easily manage your inventory"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
      </body>
    </html>
  );
}
