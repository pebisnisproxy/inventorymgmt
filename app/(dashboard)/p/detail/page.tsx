"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { InventoryService } from "@/lib/inventory-service";
import { Category, Product } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export default function ProductDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = Number(searchParams.get("id"));
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
      </div>
    </div>
  );
}
