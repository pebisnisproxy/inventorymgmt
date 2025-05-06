"use client";

import { Boxes, Package, PackageOpen, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { InventoryService } from "@/lib/inventory-service";
import { Product } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";

import { StatsCard } from "@/components/stats-card";

interface ChartData {
  name: string;
  value: number;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const service = InventoryService.getInstance();
        await service.initialize();
        const productsData = await service.getAllProducts();
        setProducts(productsData);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Hitung statistik
  const totalProducts = products.length;
  const totalValue = products.reduce(
    (sum, product) => sum + product.selling_price,
    0
  );
  const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;

  // Data untuk grafik
  const chartData: ChartData[] = products.map((product) => ({
    name: product.name,
    value: product.selling_price
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Produk"
          value={totalProducts}
          description="Jumlah produk dalam inventory"
          icon={<Boxes className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Total Nilai"
          value={formatCurrency(totalValue)}
          description="Total nilai inventory"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Rata-rata Harga"
          value={formatCurrency(averagePrice)}
          description="Harga rata-rata per produk"
          icon={<PackageOpen className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Produk Tertinggi"
          value={
            products.length > 0
              ? formatCurrency(
                  Math.max(...products.map((p) => p.selling_price))
                )
              : 0
          }
          description="Harga produk tertinggi"
          icon={<Undo2 className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium mb-4">Distribusi Harga Produk</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label: string) => `Produk: ${label}`}
                />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium mb-4">Ringkasan</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Produk</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Total Nilai Inventory
              </p>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rata-rata Harga</p>
              <p className="text-2xl font-bold">
                {formatCurrency(averagePrice)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
