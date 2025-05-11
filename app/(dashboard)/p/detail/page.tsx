"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { invoke } from "@tauri-apps/api/core";
import { InfoIcon } from "lucide-react";
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
    handle: z
      .string()
      .min(1, "Nama varian harus diisi")
      .refine((value) => !value.includes(" "), {
        message: "Nama varian harus satu kata tanpa spasi"
      }),
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
          barcode_code: editingVariant.barcode_code,
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
          barcode_code: generateBarcodeData.barcode_code,
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
                    <span className="font-medium">Kategori:</span>{" "}
                    {category ? category.name : "Tidak ada kategori"}
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
                  <div>
                    <span className="font-medium">ID Kategori:</span>{" "}
                    {product.category_id || "Tidak ada kategori"}
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
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell>{variant.handle}</TableCell>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Gunakan satu kata tanpa spasi (seperti: S, XL, Merah,
                      Hitam). Ini digunakan untuk kode barcode dan identifikasi.
                    </p>
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
  );
}
