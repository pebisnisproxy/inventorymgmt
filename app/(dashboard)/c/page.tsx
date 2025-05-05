"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Category, InventoryService, Product } from "@/lib/inventory-service";
import { formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

export default function CategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = Number(searchParams.get("id"));
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const service = InventoryService.getInstance();
        await service.initialize();

        if (!categoryId) {
          router.push("/p");
          return;
        }

        const [categoryData, productsData] = await Promise.all([
          service.getCategoryById(categoryId),
          service.getProductsByCategory(categoryId)
        ]);

        if (!categoryData) {
          toast.error("Kategori tidak ditemukan");
          router.push("/p");
          return;
        }

        setCategory(categoryData);
        setProducts(productsData);
      } catch (error) {
        console.error("Gagal memuat data:", error);
        toast.error("Gagal memuat data kategori");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [categoryId, router]);

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

  if (!category) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Kategori: {category.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {products.length} produk dalam kategori ini
            </p>
          </div>
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

        <div className="rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Belum ada produk dalam kategori ini
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.selling_price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/p/detail?id=${product.id}`)
                          }
                        >
                          Detail
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/p/edit?id=${product.id}`)
                          }
                        >
                          Ubah
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
