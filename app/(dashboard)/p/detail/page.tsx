"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { invoke } from "@tauri-apps/api/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { InventoryService } from "@/lib/inventory-service";
import type { GenerateBarcodeData } from "@/lib/types/common";
import type {
  Category,
  Product,
  ProductVariantWithProduct
} from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";

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

export default function ProductDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = Number(searchParams.get("id"));
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [variants, setVariants] = useState<ProductVariantWithProduct[]>([]);
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

        if (productData.category_id) {
          const categoryData = await service.getCategoryById(
            productData.category_id
          );
          setCategory(categoryData);
        }
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
      const result = await service.getProductVariants(productId);
      setVariants(result);
    } catch (error) {
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
    } catch (error) {
      toast.error("Gagal menghapus varian");
    } finally {
      setDeleteLoading(false);
    }
  }

  // Variant form schema
  const variantFormSchema = z.object({
    handle: z.string().min(1, "Nama varian harus diisi"),
    barcode_path: z.string().optional().nullable()
  });
  type VariantFormValues = z.infer<typeof variantFormSchema>;

  const variantForm = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: {
      handle: editingVariant ? editingVariant.handle : "",
      barcode_path: editingVariant ? editingVariant.barcode_path : ""
    }
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (editingVariant) {
      variantForm.reset({
        handle: editingVariant.handle,
        barcode_path: editingVariant.barcode_path || ""
      });
    } else {
      variantForm.reset({ handle: "", barcode_path: "" });
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
          handle: values.handle,
          barcode: editingVariant.barcode,
          barcode_path: values.barcode_path || null,
          created_at: editingVariant.created_at,
          updated_at: editingVariant.updated_at
        });
        toast.success("Varian berhasil diperbarui");
      } else {
        const generateBarcodeData = (await invoke("generate_barcode", {
          productName: product?.name || "",
          variantName: values.handle
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
          handle: values.handle,
          barcode: barcodeData,
          barcode_path: generateBarcodeData.file_path || null
        });
        toast.success("Varian berhasil ditambahkan");
      }
      setShowVariantDialog(false);
      loadVariants();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan varian");
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
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Detail Produk</h1>
          <Button
            variant="outline"
            onClick={() => router.push("/p")}
            className="flex items-center gap-2"
          >
            {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-left"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Kembali
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{product.name}</CardTitle>
            <CardDescription>
              {category ? `Kategori: ${category.name}` : "Tidak Berkategori"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h3 className="font-medium">Harga Jual</h3>
                  <p className="text-muted-foreground">
                    Harga jual produk saat ini
                  </p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(product.selling_price)}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h3 className="font-medium">Tanggal Dibuat</h3>
                  <p className="text-muted-foreground">
                    Tanggal produk ditambahkan
                  </p>
                </div>
                <p className="text-lg">
                  {new Date(product.created_at || "").toLocaleDateString(
                    "id-ID",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    }
                  )}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h3 className="font-medium">Terakhir Diperbarui</h3>
                  <p className="text-muted-foreground">
                    Tanggal terakhir produk diubah
                  </p>
                </div>
                <p className="text-lg">
                  {new Date(product.updated_at || "").toLocaleDateString(
                    "id-ID",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    }
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => router.push(`/p/edit?id=${product.id}`)}
                className="flex-1"
              >
                Ubah Produk
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/p/delete?id=${product.id}`)}
                className="flex-1"
              >
                Hapus Produk
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Varian Produk</CardTitle>
            <CardDescription>Kelola varian untuk produk ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <Button onClick={handleAddVariant}>Tambah Varian</Button>
            </div>
            {variantLoading ? (
              <div className="text-center py-8">Memuat varian...</div>
            ) : variants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada varian
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Varian</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell>{variant.handle}</TableCell>
                      <TableCell>
                        {variant.barcode_path || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleEditVariant(variant);
                            }}
                          >
                            Ubah
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              handleDeleteVariant(variant);
                            }}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Variant Dialog */}
        <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingVariant ? "Ubah Varian" : "Tambah Varian"}
              </DialogTitle>
              <DialogDescription>
                {editingVariant
                  ? "Edit detail varian produk."
                  : "Tambah varian baru untuk produk ini."}
              </DialogDescription>
            </DialogHeader>
            <Form {...variantForm}>
              <form
                onSubmit={variantForm.handleSubmit(onSubmitVariant)}
                className="space-y-4"
              >
                <FormField
                  control={variantForm.control}
                  name="handle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Varian</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama varian" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={variantForm.control}
                  name="barcode_path"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode (auto generated)</FormLabel>
                      <FormControl>
                        <Input
                          disabled
                          placeholder="Barcode"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
    </div>
  );
}
