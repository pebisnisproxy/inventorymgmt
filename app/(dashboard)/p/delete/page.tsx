/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { useProductStore } from "@/lib/store/product-store";

import { Button } from "@/components/ui/button";

export default function DeleteProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Number(searchParams.get("id"));
  const { products, deleteProduct } = useProductStore();

  useEffect(() => {
    if (!id) {
      router.push("/p");
    }
  }, [id, router]);

  const handleDelete = async () => {
    try {
      await deleteProduct(id);
      toast.success("Produk berhasil dihapus");
      router.push("/p");
    } catch (error) {
      toast.error("Gagal menghapus produk", {
        description: "Silakan coba lagi atau refresh halaman"
      });
      console.error(error);
    }
  };

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Produk Tidak Ditemukan</h1>
          <p className="mb-4">Produk yang Anda cari tidak ditemukan.</p>
          <Button onClick={() => router.push("/p")}>
            Kembali ke Daftar Produk
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Hapus Produk</h1>
        <p className="mb-4">
          Apakah Anda yakin ingin menghapus produk &quot;{product.name}&quot;?
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="destructive" onClick={handleDelete}>
            Ya, Hapus
          </Button>
          <Button variant="outline" onClick={() => router.push("/p")}>
            Batal
          </Button>
        </div>
      </div>
    </div>
  );
}
