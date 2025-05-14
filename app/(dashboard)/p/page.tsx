"use client";

import {
  ArrowLeft,
  Boxes,
  Package,
  PackageOpen,
  RefreshCw,
  Undo2
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { InventoryService } from "@/lib/inventory-service";
import type { Product, StockLevel } from "@/lib/types/database";
import { cn, formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga Jual</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      {formatCurrency(product.selling_price)}
                    </TableCell>
                    <TableCell>{getProductStock(product.id || 0)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/p/detail?id=${product.id}`}>
                            {!isMobile ? (
                              "Detail"
                            ) : (
                              <ArrowLeft className="h-4 w-4" />
                            )}
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/p/edit?id=${product.id}`}>
                            {!isMobile ? "Edit" : <Boxes className="h-4 w-4" />}
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
