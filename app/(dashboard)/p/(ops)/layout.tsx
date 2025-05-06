"use client";

import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";

import { DatePicker } from "@/components/date-picker";
import { ProductDialog } from "@/components/product-dialog";
import { Button } from "@/components/ui/button";

export default function ProductOperationLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const type = pathname.split("/").pop() as "in" | "out" | "return";
  return (
    <div className="lg:p-4">
      <div className="w-max absolute right-4 lg:right-8 flex gap-2 items-center">
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
