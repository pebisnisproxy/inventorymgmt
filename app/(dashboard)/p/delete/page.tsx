"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { Product } from "@/lib/inventory-service";
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
    if (!id) return;

    try {
      await deleteProduct(id);
      toast.success("Product deleted successfully");
      router.push("/p");
    } catch (error) {
      toast.error("Failed to delete product");
      console.error(error);
    }
  };

  const product = products.find((p: Product) => p.id === id);

  if (!product) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Delete Product</h1>
      <div className="bg-destructive/10 p-6 rounded-lg">
        <p className="mb-4">
          Are you sure you want to delete the product{" "}
          <span className="font-semibold">{product.name}</span>? This action
          cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete}>
            Delete Product
          </Button>
          <Button variant="outline" onClick={() => router.push("/p")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
