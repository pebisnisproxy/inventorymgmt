"use client";

import { Barcode, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import type { ProductVariantWithProduct } from "@/lib/types/database";

import { BarcodeScannerDialog } from "@/components/barcode-scanner-dialog";
import { CommandSearch } from "@/components/command-search";
import { DatePicker } from "@/components/date-picker";
import { ProductDialog } from "@/components/product-dialog";
import { Button } from "@/components/ui/button";

export default function ProductOperationLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const type = pathname.split("/").pop() as "in" | "out" | "return";

  const handleProductFound = (variant: ProductVariantWithProduct) => {
    // Redirect to the form with the product variant information
    // We'll append the variant ID to the URL as a query parameter
    router.push(`${pathname}?variantId=${variant.id}`);
  };

  return (
    <div className="lg:p-4">
      <div className="w-max absolute right-4 lg:right-8 flex gap-2 items-center">
        <CommandSearch />
        <BarcodeScannerDialog
          type={type}
          onProductFound={handleProductFound}
          trigger={
            <Button size="icon" variant="outline">
              <Barcode />
            </Button>
          }
        />
        <ProductDialog
          type={type}
          trigger={
            <Button size="icon" variant="outline">
              <Plus />
            </Button>
          }
        />
        <DatePicker />
      </div>
      {children}
    </div>
  );
}
