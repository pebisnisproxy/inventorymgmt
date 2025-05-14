"use client";

import { Barcode } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";

import type { ProductVariantWithProduct } from "@/lib/types/database";

import { BarcodeScannerDialog } from "@/components/barcode-scanner-dialog";
import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";

// Create a context to share date filter values between layout and pages
interface DateFilterContextType {
  startDate?: string;
  endDate?: string;
  setDateFilter: (dates: { startDate?: string; endDate?: string }) => void;
  refreshData?: () => void; // Add function to refresh data
  setRefreshData: (callback: () => void) => void; // Add function to set the refresh callback
}

export const DateFilterContext = createContext<DateFilterContextType>({
  startDate: undefined,
  endDate: undefined,
  setDateFilter: () => {},
  refreshData: undefined,
  setRefreshData: () => {}
});

// Hook to use the date filter
export const useDateFilter = () => useContext(DateFilterContext);

export default function ProductOperationLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const type = pathname.split("/").pop() as "in" | "out" | "return";

  // State for date filter
  const [dateFilter, setDateFilter] = useState<{
    startDate?: string;
    endDate?: string;
  }>({
    startDate: undefined,
    endDate: undefined
  });

  // State for data refresh callback
  const [refreshDataCallback, setRefreshDataCallback] = useState<
    (() => void | Promise<void>) | undefined
  >(undefined);

  // Create a wrapper function to handle the async callback safely
  const handleRefresh = refreshDataCallback
    ? () => {
        if (refreshDataCallback) {
          try {
            return refreshDataCallback();
          } catch (error) {
            console.error("Error refreshing data:", error);
          }
        }
      }
    : undefined;

  const handleProductFound = (variant: ProductVariantWithProduct) => {
    // Redirect to the form with the product variant information
    // We'll append the variant ID to the URL as a query parameter
    router.push(`${pathname}?variantId=${variant.id}`);
  };

  return (
    <DateFilterContext.Provider
      value={{
        ...dateFilter,
        setDateFilter,
        refreshData: refreshDataCallback,
        setRefreshData: setRefreshDataCallback
      }}
    >
      <div className="lg:p-4">
        <div className="w-max absolute right-4 lg:right-8 flex gap-2 items-center bg-primary p-1 rounded-md z-10">
          <BarcodeScannerDialog
            type={type}
            onProductFound={handleProductFound}
            onScanComplete={handleRefresh}
            trigger={
              <Button size="icon" className="invert">
                <Barcode />
              </Button>
            }
          />
          <DatePicker onDateChange={(dates) => setDateFilter(dates)} />
        </div>
        {children}
      </div>
    </DateFilterContext.Provider>
  );
}
