"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Category, InventoryService } from "@/lib/inventory-service";
import { useProductStore } from "@/lib/store/product-store";
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

export default function ProductsPage() {
  const router = useRouter();
  const { products, isLoading, error, fetchProducts } = useProductStore();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchProducts();
    const loadCategories = async () => {
      try {
        const service = InventoryService.getInstance();
        const loadedCategories = await service.getAllCategories();
        setCategories(loadedCategories);
      } catch (error) {
        console.error("Gagal memuat kategori:", error);
      }
    };
    loadCategories();
  }, [fetchProducts]);

  if (isLoading) {
    return <div className="p-4">Memuat produk...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Gagal memuat produk: {error}
        <Button
          variant="outline"
          className="ml-4"
          onClick={() => fetchProducts()}
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "Tidak Berkategori";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Tidak Berkategori";
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daftar Produk</h1>
        <Button onClick={() => router.push("/p/add")}>Tambah Produk</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Harga Jual</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Belum ada produk. Tambahkan produk pertama Anda!
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{getCategoryName(product.category_id)}</TableCell>
                  <TableCell>{formatCurrency(product.selling_price)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/p/edit?id=${product.id}`)}
                      >
                        Ubah
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/p/delete?id=${product.id}`)
                        }
                      >
                        Hapus
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
  );
}
