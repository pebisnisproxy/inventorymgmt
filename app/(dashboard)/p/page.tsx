"use client";

import {
  ArrowLeft,
  Boxes,
  Eye,
  ImageIcon,
  Package,
  PackageOpen,
  Pencil,
  RefreshCw,
  Undo2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { InventoryService } from "@/lib/inventory-service";
import type { Product, StockLevel } from "@/lib/types/database";
import { cn, formatCurrency } from "@/lib/utils";
import { getAssetUrl } from "@/lib/utils/file-utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Calculate all image URLs at once outside the render loop
  const productImageUrls = useMemo(() => {
    return products.reduce<Record<number, string | null>>((acc, product) => {
      if (product.id) {
        acc[product.id] = product.image_path
          ? getAssetUrl(product.image_path)
          : null;
      }
      return acc;
    }, {});
  }, [products]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadData = async () => {
    try {
      const service = InventoryService.getInstance();
      const [productsData, stockData] = await Promise.all([
        service.getAllProducts(),
        service.getAllStockLevels()
      ]);
      setProducts(productsData);
      setStockLevels(stockData);
    } catch (error) {
      console.error("Gagal memuat data:", error);
      toast.error("Gagal memuat data produk", {
        description: "Silakan coba lagi atau refresh halaman"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const getProductStock = (productId: number) => {
    const productStock = stockLevels.filter(
      (sl) => sl.product_variant_id === productId
    );
    return productStock.reduce((total, sl) => total + sl.quantity, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          <p className="mt-2">Memuat data produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Semua Produk</h1>
            <p className="text-muted-foreground">
              Daftar lengkap produk dalam inventaris
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            asChild
            disabled={isRefreshing}
          >
            <Link href="/p/in">
              <Package className={cn("mr-2 h-4 w-4", isMobile && "mr-0")} />
              {!isMobile && "Produk Masuk"}
            </Link>
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            asChild
            disabled={isRefreshing}
          >
            <Link href="/p/out">
              <PackageOpen className={cn("mr-2 h-4 w-4", isMobile && "mr-0")} />
              {!isMobile && "Produk Keluar"}
            </Link>
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            asChild
            disabled={isRefreshing}
          >
            <Link href="/p/return">
              <Undo2 className={cn("mr-2 h-4 w-4", isMobile && "mr-0")} />
              {!isMobile && "Produk Return"}
            </Link>
          </Button>
          <Button
            size={isMobile ? "sm" : "default"}
            asChild
            disabled={isRefreshing}
          >
            <Link href="/p/add">
              <Boxes className={cn("mr-2 h-4 w-4", isMobile && "mr-0")} />
              {!isMobile && "Tambah Produk"}
            </Link>
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <RefreshCw
                  className={cn(
                    "mr-2 h-4 w-4 animate-spin",
                    isMobile && "mr-0"
                  )}
                />
                {!isMobile && "Memuat..."}
              </>
            ) : (
              <>
                <RefreshCw className={cn("mr-2 h-4 w-4", isMobile && "mr-0")} />
                {!isMobile && "Refresh"}
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
          <CardDescription>
            Total {products.length} produk dalam inventaris
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {products.map((product) => {
              const imageUrl = product.id ? productImageUrls[product.id] : null;

              return (
                <Card
                  key={product.id}
                  className="overflow-hidden w-full max-w-sm"
                >
                  <div className="flex sm:flex-row pl-5">
                    <div className="relative w-full sm:w-42 h-42 flex-shrink-0 bg-secondary rounded-md overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-12 w-12" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col flex-grow">
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-base line-clamp-2">
                          {product.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pb-3 flex-grow">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">
                            Harga
                          </span>
                          <span className="font-medium text-sm">
                            {formatCurrency(product.selling_price)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">
                            Stok
                          </span>
                          <span className="font-medium text-sm">
                            {getProductStock(product.id || 0)}
                          </span>
                        </div>
                      </CardContent>
                      <div className="p-3 pt-0 flex justify-end gap-2 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          asChild
                        >
                          <Link href={`/p/detail?id=${product.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Detail
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          asChild
                        >
                          <Link href={`/p/edit?id=${product.id}`}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
