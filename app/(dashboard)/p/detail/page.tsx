/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { invoke } from "@tauri-apps/api/core";
import { InfoIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { InventoryService } from "@/lib/inventory-service";
import type { GenerateBarcodeData } from "@/lib/types/common";
import type { Product, ProductVariantWithProduct } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";

import BarcodeDisplay from "@/components/barcode-display";
import ImagePicker from "@/components/image-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */

export default function ProductDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = Number(searchParams.get("id"));
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [variants, setVariants] = useState<ProductVariantWithProduct[]>([]);
  const [stockLevels, setStockLevels] = useState<Map<number, number>>(
    new Map()
  );
  const [variantLoading, setVariantLoading] = useState(true);
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [editingVariant, setEditingVariant] =
    useState<ProductVariantWithProduct | null>(null);
  const [deletingVariant, setDeletingVariant] =
    useState<ProductVariantWithProduct | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const service = InventoryService.getInstance();
        await service.initialize();

        if (!productId) {
          router.push("/p");
          return;
        }

        const productData = await service.getProductById(productId);
        if (!productData) {
          toast.error("Produk tidak ditemukan");
          router.push("/p");
          return;
        }

        setProduct(productData);
      } catch (error) {
        console.error("Gagal memuat data:", error);
        toast.error("Gagal memuat data produk");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productId, router]);

  useEffect(() => {
    if (!productId) return;
    loadVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function loadVariants() {
    setVariantLoading(true);
    try {
      const service = InventoryService.getInstance();
      await service.initialize();

      // Load variants
      const result = await service.getProductVariants(productId);
      setVariants(result);

      // Load stock levels for this product
      const stockData = await service.getStockLevelsForProduct(productId);

      // Create a map of variant ID to stock quantity
      const stockMap = new Map<number, number>();
      for (const stock of stockData) {
        stockMap.set(stock.product_variant_id, stock.quantity);
      }

      setStockLevels(stockMap);
    } catch {
      toast.error("Gagal memuat varian produk");
    } finally {
      setVariantLoading(false);
    }
  }

  function handleAddVariant() {
    setEditingVariant(null);
    setShowVariantDialog(true);
  }

  function handleEditVariant(variant: ProductVariantWithProduct) {
    setEditingVariant(variant);
    setShowVariantDialog(true);
  }

  function handleDeleteVariant(variant: ProductVariantWithProduct) {
    setDeletingVariant(variant);
  }

  async function confirmDeleteVariant() {
    if (!deletingVariant) return;
    setDeleteLoading(true);
    try {
      const service = InventoryService.getInstance();
      await service.initialize();
      await service.deleteProductVariant(deletingVariant.id);
      toast.success("Varian berhasil dihapus");
      setDeletingVariant(null);
      loadVariants();
    } catch {
      toast.error("Gagal menghapus varian");
    } finally {
      setDeleteLoading(false);
    }
  }

  // Variant form schema
  const variantFormSchema = z.object({
    variants: z.array(
      z.object({
        handle: z
          .string()
          .min(1, "Nama varian harus diisi")
          .refine((value) => !value.includes(" "), {
            message: "Nama varian harus satu kata tanpa spasi"
          })
      })
    )
  });
  type VariantFormValues = z.infer<typeof variantFormSchema>;

  const variantForm = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: {
      variants: editingVariant
        ? [{ handle: editingVariant.handle }]
        : [{ handle: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: variantForm.control,
    name: "variants"
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (editingVariant) {
      variantForm.reset({
        variants: [{ handle: editingVariant.handle }]
      });
    } else {
      variantForm.reset({ variants: [{ handle: "" }] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingVariant, showVariantDialog]);

  async function onSubmitVariant(values: VariantFormValues) {
    try {
      const service = InventoryService.getInstance();
      await service.initialize();

      if (editingVariant) {
        await service.updateProductVariant({
          id: editingVariant.id,
          product_id: productId,
          handle: values.variants[0].handle,
          barcode_code: editingVariant.barcode_code,
          barcode: editingVariant.barcode,
          barcode_path: editingVariant.barcode_path || null,
          created_at: editingVariant.created_at,
          updated_at: editingVariant.updated_at
        });
        toast.success("Varian berhasil diperbarui");
      } else {
        // Add multiple variants at once
        for (const variant of values.variants) {
          if (!variant.handle.trim()) continue; // Skip empty variants

          const generateBarcodeData = (await invoke("generate_barcode", {
            productName: product?.name || "",
            variantName: variant.handle
          })) as GenerateBarcodeData;

          let barcodeData = null;
          try {
            if (typeof generateBarcodeData.barcode === "string") {
              barcodeData = JSON.parse(generateBarcodeData.barcode);
            } else {
              barcodeData = generateBarcodeData.barcode;
            }
          } catch (e) {
            console.error("Failed to parse barcode data:", e);
          }

          await service.createProductVariant({
            product_id: productId,
            handle: variant.handle,
            barcode_code: generateBarcodeData.barcode_code,
            barcode: barcodeData,
            barcode_path: generateBarcodeData.file_path || null
          });
        }
        toast.success("Varian berhasil ditambahkan");
      }
      setShowVariantDialog(false);
      loadVariants();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan varian");
    }
  }

  async function handleImageSelected(imagePath: string) {
    if (!product || !productId) return;

    try {
      const service = InventoryService.getInstance();
      await service.initialize();

      await service.updateProduct({
        ...product,
        image_path: imagePath
      });

      // Update local state
      setProduct({
        ...product,
        image_path: imagePath
      });

      toast.success("Product image updated");
    } catch (error) {
      console.error("Failed to update product image:", error);
      toast.error("Failed to update product image");
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p>Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button
        variant="outline"
        onClick={() => router.push("/p")}
        className="mb-4"
      >
        ← Kembali ke Daftar Produk
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
          <CardDescription>
            Detail informasi untuk produk {product.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Informasi Produk</h3>
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <ImagePicker
                  productName={product.name}
                  productHandle="main"
                  initialImagePath={product.image_path}
                  onImageSelected={handleImageSelected}
                  width={200}
                  height={200}
                />
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Nama Produk:</span>{" "}
                    {product.name}
                  </div>
                  <div>
                    <span className="font-medium">Harga Jual:</span>{" "}
                    {formatCurrency(product.selling_price)}
                  </div>
                  <div>
                    <span className="font-medium">Tanggal Dibuat:</span>{" "}
                    {new Date(product.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Terakhir Diperbarui:</span>{" "}
                    {new Date(product.updated_at).toLocaleDateString()}
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                    <InfoIcon
                      className="text-blue-500 shrink-0 mt-0.5"
                      size={16}
                    />
                    <div className="text-xs text-blue-700">
                      <p className="font-medium mb-1">Catatan:</p>
                      <p>
                        Untuk masalah keamanan, nama file yang dihasilkan untuk
                        gambar dan barcode akan dimodifikasi: karakter khusus
                        diganti dengan tanda hubung, spasi diganti dengan garis
                        bawah, dan dikonversi ke huruf besar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Varian Produk</h3>
              <div className="mb-4">
                <Button onClick={handleAddVariant}>+ Tambah Varian</Button>
              </div>

              {variantLoading ? (
                <div className="flex items-center justify-center h-20">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                </div>
              ) : variants.length === 0 ? (
                <div className="text-muted-foreground">
                  Belum ada varian untuk produk ini
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Varian</TableHead>
                        <TableHead>Stok</TableHead>
                        <TableHead>Operasi</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell>{variant.handle}</TableCell>
                          <TableCell>
                            {stockLevels.has(variant.id)
                              ? stockLevels.get(variant.id)
                              : "0"}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                onClick={() =>
                                  router.push(`/p/in?variantId=${variant.id}`)
                                }
                              >
                                Masuk
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                onClick={() =>
                                  router.push(`/p/out?variantId=${variant.id}`)
                                }
                              >
                                Keluar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                                onClick={() =>
                                  router.push(
                                    `/p/return?variantId=${variant.id}`
                                  )
                                }
                              >
                                Return
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditVariant(variant)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteVariant(variant)}
                              >
                                Hapus
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {/* Add Barcode Display Section Here */}
          {variants.length > 0 && (
            <div className="mt-8 pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">Barcode Produk</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {variants.map((variant) =>
                  variant.barcode_path ? (
                    <div key={variant.id} className="border rounded-lg p-3">
                      <BarcodeDisplay
                        productName={product.name}
                        productHandle={variant.handle}
                        barcodePath={variant.barcode_path || ""}
                      />
                    </div>
                  ) : (
                    <div
                      key={variant.id}
                      className="border rounded-lg p-3 flex flex-col items-center justify-center h-[210px]"
                    >
                      <p className="text-sm text-gray-500 text-center">
                        Barcode tidak tersedia untuk varian{" "}
                        <span className="font-medium">{variant.handle}</span>
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={async () => {
                          try {
                            const generateBarcodeData = (await invoke(
                              "generate_barcode",
                              {
                                productName: product?.name || "",
                                variantName: variant.handle
                              }
                            )) as GenerateBarcodeData;

                            const service = InventoryService.getInstance();
                            await service.updateProductVariant({
                              ...variant,
                              barcode_code: generateBarcodeData.barcode_code,
                              barcode_path: generateBarcodeData.file_path
                            });

                            toast.success("Barcode berhasil dibuat");
                            loadVariants();
                          } catch (error) {
                            console.error(error);
                            toast.error("Gagal membuat barcode");
                          }
                        }}
                      >
                        Generate Barcode
                      </Button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Variant Dialog */}
      <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? "Ubah Varian" : "Tambah Varian"}
            </DialogTitle>
            <DialogDescription>
              {editingVariant
                ? "Edit detail varian produk."
                : "Tambah satu atau beberapa varian baru untuk produk ini."}
            </DialogDescription>
          </DialogHeader>
          <Form {...variantForm}>
            <form
              onSubmit={variantForm.handleSubmit(onSubmitVariant)}
              className="space-y-4"
            >
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
                    <FormField
                      control={variantForm.control}
                      name={`variants.${index}.handle`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Nama Varian {index + 1}</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama varian" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {!editingVariant && fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="mb-2"
                        onClick={() => remove(index)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {!editingVariant && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => append({ handle: "" })}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Tambah Varian Lainnya
                </Button>
              )}

              {!editingVariant && (
                <p className="text-xs text-muted-foreground mt-1">
                  Gunakan satu kata tanpa spasi (seperti: S, XL, Merah, Hitam).
                  Ini digunakan untuk kode barcode dan identifikasi.
                </p>
              )}

              <DialogFooter>
                <Button type="submit">
                  {editingVariant ? "Simpan Perubahan" : "Tambah Varian"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowVariantDialog(false);
                  }}
                >
                  Batal
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingVariant}
        onOpenChange={(open) => {
          if (!open) setDeletingVariant(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Varian</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus varian{" "}
              <b>{deletingVariant?.handle}</b>? Tindakan ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={confirmDeleteVariant}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Menghapus..." : "Hapus"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDeletingVariant(null);
              }}
              disabled={deleteLoading}
            >
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
