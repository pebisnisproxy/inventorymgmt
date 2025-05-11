import { useState } from "react";
import { toast } from "sonner";

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

type BarcodeScannerDialogProps = {
  type: "in" | "out" | "return";
  trigger: React.ReactNode;
  onProductFound?: (variant: ProductVariantWithProduct) => void;
};

export function BarcodeScannerDialog({
  type,
  trigger,
  onProductFound
}: BarcodeScannerDialogProps) {
  const [barcode, setBarcode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [foundProduct, setFoundProduct] =
    useState<ProductVariantWithProduct | null>(null);
  const [open, setOpen] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  };

  const handleBarcodeKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      await searchBarcode();
    }
  };

  const searchBarcode = async () => {
    if (!barcode.trim()) {
      toast.error("Masukkan kode barcode terlebih dahulu");
      return;
    }

    setIsLoading(true);
    setSearchStatus("Mencari produk...");

    try {
      const service = InventoryService.getInstance();
      await service.initialize();

      setSearchStatus("Mencari dengan barcode code...");

      // The barcode input could be a path or the actual barcode data
      const variant = await service.findProductVariantByBarcode(barcode);

      if (!variant) {
        setSearchStatus("Produk tidak ditemukan");
        toast.error("Produk tidak ditemukan dengan barcode tersebut");
        return;
      }

      setSearchStatus("Produk ditemukan!");
      setFoundProduct(variant);
      if (onProductFound) {
        onProductFound(variant);
      }
    } catch (error) {
      console.error("Error searching for barcode:", error);
      setSearchStatus("Terjadi kesalahan saat mencari");
      toast.error("Gagal mencari produk");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    if (foundProduct) {
      setOpen(false);
      resetForm();
    } else {
      toast.error("Produk belum ditemukan");
    }
  };

  const resetForm = () => {
    setBarcode("");
    setFoundProduct(null);
    setSearchStatus(null);
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
            Scan barcode atau masukkan kode barcode produk
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="font-medium block mb-1">Format Barcode:</span>
            Format barcode adalah{" "}
            <span className="font-medium">NAMA_PRODUK-VARIAN</span> tanpa spasi,
            misalnya:{" "}
            <span className="font-mono bg-slate-100 px-1 rounded">
              PRODUKSATU-XL
            </span>{" "}
            atau{" "}
            <span className="font-mono bg-slate-100 px-1 rounded">
              KEMEJA-HITAM
            </span>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="barcode" className="text-right">
              Barcode
            </Label>
            <div className="col-span-3 flex gap-2">
              <Input
                id="barcode"
                placeholder="Scan atau masukkan barcode"
                value={barcode}
                onChange={handleBarcodeChange}
                onKeyDown={handleBarcodeKeyDown}
                className="flex-1"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                onClick={searchBarcode}
                disabled={isLoading}
              >
                {isLoading ? "Mencari..." : "Cari"}
              </Button>
            </div>
          </div>

          {searchStatus && !foundProduct && (
            <div className="mt-2 text-sm">
              <Badge
                variant={isLoading ? "secondary" : "outline"}
                className="mb-2"
              >
                Status: {searchStatus}
              </Badge>
              <p className="text-muted-foreground text-xs mt-1">
                {isLoading
                  ? "Sedang mencari produk berdasarkan kode barcode..."
                  : searchStatus === "Produk tidak ditemukan"
                    ? "Pastikan kode barcode yang dimasukkan benar. Anda juga dapat mencoba scan ulang barcode."
                    : "Coba masukkan kode barcode yang tertera pada produk."}
              </p>
            </div>
          )}

          {foundProduct && (
            <div className="mt-4 border rounded p-4">
              <h3 className="font-medium text-lg">
                {foundProduct.product_name}
              </h3>
              <p className="text-sm text-gray-500">{foundProduct.handle}</p>
              <div className="mt-2 flex flex-col gap-2">
                <Badge variant="outline">
                  Harga:{" "}
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR"
                  }).format(foundProduct.selling_price)}
                </Badge>
                {foundProduct.barcode_code && (
                  <Badge variant="secondary" className="text-xs">
                    Kode Barcode: {foundProduct.barcode_code}
                  </Badge>
                )}
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
          <Button type="button" onClick={handleFinish} disabled={!foundProduct}>
            Lanjutkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
