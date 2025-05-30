/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { InventoryManager } from "@/lib/inventory-manager";
import inventoryService from "@/lib/inventory-service";
import type {
  InventoryMovement,
  InventoryMovementItem,
  ProductVariantWithProduct,
  ProductWithCategory
} from "@/lib/types/database";
import { formatDateTime } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import { useDateFilter } from "../layout";

interface MovementWithItems extends InventoryMovement {
  items: Array<
    InventoryMovementItem & {
      product_name: string;
      handle: string;
      barcode: string | null;
    }
  >;
}

export default function ProductReturnPage() {
  const searchParams = useSearchParams();
  const variantIdFromUrl = searchParams.get("variantId");
  const router = useRouter();
  const { startDate, endDate, setRefreshData } = useDateFilter();

  const [movements, setMovements] = useState<MovementWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [variants, setVariants] = useState<ProductVariantWithProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await InventoryManager.initialize();
      const movementList = await inventoryService.getInventoryMovements(
        "RETURN",
        startDate,
        endDate
      );
      const detailedMovements: MovementWithItems[] = [];
      for (let i = 0; i < movementList.length; i++) {
        const movement = movementList[i];
        const items = await inventoryService.getDetailedMovementItems(
          movement.id
        );
        detailedMovements.push({ ...movement, items });
      }
      setMovements(detailedMovements);
    } catch (error) {
      console.error("Gagal memuat data:", error);
      toast.error("Gagal memuat data produk return", {
        description: "Silakan coba lagi atau refresh halaman"
      });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  const loadProducts = useCallback(async () => {
    try {
      await InventoryManager.initialize();
      const productList = await inventoryService.getAllProducts();
      setProducts(productList);
    } catch {
      toast.error("Gagal memuat produk");
    }
  }, []);

  const loadVariants = useCallback(async (productId: number) => {
    try {
      await InventoryManager.initialize();
      const variantList = await inventoryService.getProductVariants(productId);
      setVariants(variantList);
    } catch {
      toast.error("Gagal memuat varian produk");
    }
  }, []);

  const loadVariantFromUrl = useCallback(
    async (variantId: number) => {
      try {
        await InventoryManager.initialize();

        // Get the variant details
        const variant = await inventoryService.getVariantById(variantId);
        if (!variant) {
          toast.error("Variant tidak ditemukan");
          return;
        }

        // Set the product ID
        setSelectedProductId(variant.product_id);

        // Load all variants for this product
        await loadVariants(variant.product_id);

        // Set the selected variant
        setSelectedVariantId(variantId);

        // Get the product to set the default price
        const productVariants = await inventoryService.getProductVariants(
          variant.product_id
        );
        const variantWithProduct = productVariants.find(
          (v) => v.id === variantId
        );
        if (variantWithProduct) {
          setPricePerUnit(variantWithProduct.selling_price);
        }

        // Ensure quantity is set to 1
        setQuantity(1);

        // Set focus to quantity field
        const quantityInput = document.getElementById(
          "quantity"
        ) as HTMLInputElement;
        if (quantityInput) {
          quantityInput.focus();
        }
      } catch (error) {
        console.error("Error loading variant from URL:", error);
        toast.error("Gagal memuat data produk");
      }
    },
    [loadVariants]
  );

  function handleProductChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const productId = Number(event.target.value);
    setSelectedProductId(productId);
    setSelectedVariantId(null);
    setVariants([]);
    if (productId) {
      loadVariants(productId);
    }
  }

  function handleVariantChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const variantId = Number(event.target.value);
    setSelectedVariantId(variantId);

    // Automatically set the price per unit from the selected variant
    if (variantId) {
      const selectedVariant = variants.find((v) => v.id === variantId);
      if (selectedVariant) {
        setPricePerUnit(selectedVariant.selling_price);
      }
    }
  }

  function handleQuantityChange(event: React.ChangeEvent<HTMLInputElement>) {
    setQuantity(Number(event.target.value));
  }

  function handleNotesChange(event: React.ChangeEvent<HTMLInputElement>) {
    setNotes(event.target.value);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedVariantId || quantity <= 0 || pricePerUnit <= 0) {
      toast.error("Lengkapi data produk, varian, dan jumlah.");
      return;
    }
    setIsSubmitting(true);
    try {
      await InventoryManager.recordReturn(
        [
          {
            variantId: selectedVariantId,
            quantity: quantity,
            pricePerUnit: pricePerUnit
          }
        ],
        notes
      );
      toast.success("Transaksi produk return berhasil direkam.");
      setSelectedProductId(null);
      setSelectedVariantId(null);
      setQuantity(1);
      setPricePerUnit(0);
      setNotes("");
      setVariants([]);
      await loadData();
    } catch {
      toast.error("Gagal merekam transaksi produk return.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    setRefreshData(loadData);

    return () => {
      setRefreshData(() => {});
    };
  }, [loadData, setRefreshData]);

  useEffect(() => {
    loadData();
    loadProducts();

    if (variantIdFromUrl) {
      const variantId = Number.parseInt(variantIdFromUrl, 10);
      if (!Number.isNaN(variantId)) {
        loadVariantFromUrl(variantId);
      }
    }
  }, [variantIdFromUrl, loadData, loadProducts, loadVariantFromUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          <p className="mt-2">Memuat data produk return...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-lg">Histori Produk Return</h1>
      </div>
      <form className="mb-8 space-y-4" onSubmit={handleSubmit}>
        <div className="flex gap-4">
          <select
            className="border rounded px-2 py-1"
            value={selectedProductId || ""}
            onChange={handleProductChange}
            required
          >
            <option value="">Pilih Produk</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-1"
            value={selectedVariantId || ""}
            onChange={handleVariantChange}
            required
            disabled={!selectedProductId}
          >
            <option value="">Pilih Varian</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.handle}{" "}
                {variant.barcode_code ? `(${variant.barcode_code})` : ""}
              </option>
            ))}
          </select>
          <input
            id="quantity"
            type="number"
            className="border rounded px-2 py-1 w-24"
            min={1}
            value={quantity}
            onChange={handleQuantityChange}
            placeholder="Jumlah"
            required
          />
          <input
            type="text"
            className="border rounded px-2 py-1 flex-1"
            value={notes}
            onChange={handleNotesChange}
            placeholder="Catatan (opsional)"
          />
          <button
            type="submit"
            className="bg-yellow-600 text-white px-4 py-1 rounded disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Rekam Return"}
          </button>
        </div>
      </form>
      <Table>
        <TableCaption>Histori barang yang di retur.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Tanggal</TableHead>
            <TableHead>Invoice ID</TableHead>
            <TableHead>Catatan</TableHead>
            <TableHead>Produk</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Harga Satuan</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements?.map((movement) =>
            movement?.items?.map((item, idx) => (
              <TableRow key={`${movement.id}-${idx}`}>
                <TableCell>
                  {formatDateTime(new Date(movement.movement_date))}
                </TableCell>
                <TableCell>{movement.id}</TableCell>
                <TableCell>{movement.notes}</TableCell>
                <TableCell>
                  {item.product_name} ({item.handle})
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.price_per_unit}</TableCell>
                <TableCell>{item.total_price}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        // Get the variant first
                        const variant = await inventoryService.getVariantById(
                          item.product_variant_id
                        );
                        if (variant) {
                          router.push(`/p/detail?id=${variant.product_id}`);
                        }
                      } catch {
                        toast.error("Failed to navigate to product details");
                      }
                    }}
                  >
                    Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={6}>Total Transaksi</TableCell>
            <TableCell className="text-right">{movements.length}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
