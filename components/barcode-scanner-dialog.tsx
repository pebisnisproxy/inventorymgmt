import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { InventoryManager } from "@/lib/inventory-manager";
import { InventoryService } from "@/lib/inventory-service";
import type { ProductVariantWithProduct } from "@/lib/types/database";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Badge } from "./ui/badge";

type ProcessedProduct = {
  product: ProductVariantWithProduct;
  timestamp: number; // Store timestamp in milliseconds
};

type BarcodeScannerDialogProps = {
  type: "in" | "out" | "return";
  trigger: React.ReactNode;
  onProductFound?: (variant: ProductVariantWithProduct) => void;
  onScanComplete?: () => void;
};

export function BarcodeScannerDialog({
  type,
  trigger,
  onProductFound,
  onScanComplete
}: BarcodeScannerDialogProps) {
  const [barcode, setBarcode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [foundProduct, setFoundProduct] =
    useState<ProductVariantWithProduct | null>(null);
  const [open, setOpen] = useState(false);
  const [lastProcessedProducts, setLastProcessedProducts] = useState<
    ProcessedProduct[]
  >([]);
  const [forceUpdate, setForceUpdate] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Setup timer to update relative timestamps
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only set up interval if dialog is open and we have products
    if (open && lastProcessedProducts.length > 0) {
      intervalRef.current = setInterval(() => {
        setForceUpdate((prev) => prev + 1);
      }, 10000); // Update every 10 seconds
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open, lastProcessedProducts.length]);

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setBarcode(value);

    // Auto-process when input has content and ends with a carriage return or special character
    // This is common with barcode scanners that append a character at the end
    if (
      value &&
      (value.endsWith("\n") || value.endsWith("\r") || value.endsWith("\t"))
    ) {
      const cleanBarcode = value.replace(/[\n\r\t]/g, "");
      setBarcode(cleanBarcode);

      if (cleanBarcode.length > 1) {
        searchBarcode(cleanBarcode);
      }
    }
  };

  const handleBarcodeKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" && barcode.trim()) {
      e.preventDefault();
      await searchBarcode(barcode.trim());
    }
  };

  // Auto-focus the input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const searchBarcode = async (code: string) => {
    if (!code) return;

    if (isLoading || isProcessing) return;
    setIsLoading(true);

    try {
      const service = InventoryService.getInstance();
      await service.initialize();

      // The barcode input could be a path or the actual barcode data
      const variant = await service.findProductVariantByBarcode(code);

      if (!variant) {
        toast.error(`Produk dengan barcode ${code} tidak ditemukan`);
        return;
      }

      setFoundProduct(variant);

      // Automatically process the stock change
      await processStockChange(variant);

      if (onProductFound) {
        onProductFound(variant);
      }
    } catch (error) {
      console.error("Error searching for barcode:", error);
      toast.error("Gagal memproses barcode");
    } finally {
      setIsLoading(false);
      setBarcode("");

      // Refocus the input for the next scan
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const processStockChange = async (variant: ProductVariantWithProduct) => {
    setIsProcessing(true);
    try {
      await InventoryManager.initialize();

      const operationName =
        type === "in" ? "masuk" : type === "out" ? "keluar" : "return";

      // Process based on operation type
      if (type === "in") {
        await InventoryManager.recordPurchase(
          [
            {
              variantId: variant.id,
              quantity: 1,
              costPerUnit: variant.selling_price
            }
          ],
          `Quick scan: ${variant.product_name} - ${variant.handle}`
        );
      } else if (type === "out") {
        // Check stock availability first
        const insufficientItems = await InventoryManager.checkStockAvailability(
          [{ variantId: variant.id, quantity: 1 }]
        );

        if (insufficientItems.length > 0) {
          toast.error(
            `Stok ${variant.product_name} (${variant.handle}) tidak mencukupi`
          );
          return;
        }

        await InventoryManager.recordSale(
          [
            {
              variantId: variant.id,
              quantity: 1,
              sellingPrice: variant.selling_price
            }
          ],
          `Quick scan: ${variant.product_name} - ${variant.handle}`
        );
      } else if (type === "return") {
        await InventoryManager.recordReturn(
          [
            {
              variantId: variant.id,
              quantity: 1,
              pricePerUnit: variant.selling_price
            }
          ],
          `Quick scan: ${variant.product_name} - ${variant.handle}`
        );
      }

      // Add to processed products list with current timestamp
      setLastProcessedProducts((prev) => {
        const updated = [
          {
            product: variant,
            timestamp: Date.now()
          },
          ...prev
        ];
        return updated.slice(0, 5); // Keep only the 5 most recent
      });

      // Success toast
      toast.success(
        `${variant.product_name} (${variant.handle}) ${operationName}`
      );

      // Call the callback to refresh history data
      if (onScanComplete) {
        try {
          await Promise.resolve(onScanComplete());
        } catch (callbackError) {
          console.error("Error refreshing data after scan:", callbackError);
        }
      }
    } catch (error) {
      console.error(`Error processing ${type} for product:`, error);
      toast.error("Gagal memproses stok");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const resetForm = () => {
    setBarcode("");
    setFoundProduct(null);
    setLastProcessedProducts([]);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Scan Barcode{" "}
            {type === "in" ? "Masuk" : type === "out" ? "Keluar" : "Return"}
          </DialogTitle>
          <DialogDescription>
            Scan barcode untuk langsung memproses stok{" "}
            {type === "in" ? "masuk" : type === "out" ? "keluar" : "return"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="font-medium block mb-1">Cara Penggunaan:</span>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Arahkan scanner ke barcode produk</li>
              <li>Produk akan otomatis diproses setelah scan</li>
              <li>Lanjutkan scan produk berikutnya</li>
            </ol>
            <div className="mt-2 font-medium text-blue-600">
              Setiap scan langsung memproses 1 item
              {type === "in"
                ? " masuk"
                : type === "out"
                  ? " keluar"
                  : " return"}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="barcode" className="text-right">
              Barcode
            </Label>
            <div className="col-span-3">
              <Input
                id="barcode"
                ref={inputRef}
                placeholder="Scan barcode produk..."
                value={barcode}
                onChange={handleBarcodeChange}
                onKeyDown={handleBarcodeKeyDown}
                className="flex-1"
                autoFocus
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Last processed products */}
          {lastProcessedProducts.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">
                Produk terakhir diproses:
              </h3>
              <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                <ul className="divide-y">
                  {lastProcessedProducts.map((item, idx) => (
                    <li
                      key={`${item.product.id}-${idx}-${forceUpdate}`}
                      className="py-2 first:pt-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">
                            {item.product.product_name}
                          </p>
                          <div className="flex gap-2 items-center">
                            <p className="text-xs text-muted-foreground">
                              {item.product.handle}
                            </p>
                            <span className="text-xs text-slate-400">
                              {formatTimestamp(item.timestamp)}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            type === "in"
                              ? "bg-green-50 text-green-700"
                              : type === "out"
                                ? "bg-red-50 text-red-700"
                                : "bg-yellow-50 text-yellow-700"
                          }
                        >
                          {type === "in"
                            ? "Masuk"
                            : type === "out"
                              ? "Keluar"
                              : "Return"}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <Badge className="absolute left-4 bottom-4" variant="outline">
            {new Date().toLocaleDateString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </Badge>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => setOpen(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
