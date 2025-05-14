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
import type {
  InventoryMovementItem,
  Product,
  ProductVariant
} from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";

import { DatePicker } from "@/components/date-picker";
import { StatsCard } from "@/components/stats-card";

interface ChartData {
  name: string;
  value: number;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [dateFilter, setDateFilter] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const service = InventoryService.getInstance();
        await service.initialize();
        const productsData = await service.getAllProducts();
        // Filter produk berdasarkan created_at dan dateFilter
        let filteredProducts = productsData;
        if (dateFilter.startDate || dateFilter.endDate) {
          function isProductInDateRange(product: Product) {
            const createdAt = new Date(product.created_at);
            if (
              dateFilter.startDate &&
              createdAt < new Date(dateFilter.startDate)
            ) {
              return false;
            }
            if (
              dateFilter.endDate &&
              createdAt > new Date(dateFilter.endDate)
            ) {
              return false;
            }
            return true;
          }
          filteredProducts = productsData.filter(isProductInDateRange);
        }
        setProducts(filteredProducts);

        // Fetch all product variants for mapping
        let allVariants: ProductVariant[] = [];
        for (const product of productsData) {
          const variants = await service.getProductVariants(product.id);
          allVariants = allVariants.concat(variants);
        }
        const variantToProduct: Record<number, number> = {};
        for (const variant of allVariants) {
          variantToProduct[variant.id] = variant.product_id;
        }

        // Fetch all OUT movements with date filter
        const outMovements = await service.getInventoryMovements(
          "OUT",
          dateFilter.startDate,
          dateFilter.endDate
        );
        let allItems: InventoryMovementItem[] = [];
        for (const movement of outMovements) {
          const items = await service.getMovementItems(movement.id);
          allItems = allItems.concat(items);
        }
        // Aggregate total quantity per product (not variant)
        const productTotals: Record<number, number> = {};
        for (const item of allItems) {
          const productId = variantToProduct[item.product_variant_id];
          if (!productId) continue;
          if (!productTotals[productId]) {
            productTotals[productId] = 0;
          }
          productTotals[productId] += item.quantity;
        }
        // Map to chart data (show top 10 by quantity)
        const chartArr: ChartData[] = Object.entries(productTotals)
          .map(([productId, qty]) => {
            const product = productsData.find(
              (p) => p.id === Number(productId)
            );
            return {
              name: product ? product.name : `Produk ${productId}`,
              value: qty
            };
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
        setChartData(chartArr);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dateFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Hitung statistik
  const totalProducts = products.length;
  function sumSellingPrice(sum: number, product: Product) {
    return sum + product.selling_price;
  }
  const totalValue = products.reduce(sumSellingPrice, 0);
  const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;

  return (
    <div className="space-y-6">
      <div className="flex-shrink-0">
        <DatePicker onDateChange={setDateFilter} />
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-1">
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium mb-4">
            Produk Paling Sering Keluar
          </h3>
          <div className="h-[300px]">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-4"
                >
                  <path d="M3 3v18h18" />
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                </svg>
                <p>Belum ada data produk keluar</p>
                <p className="text-sm">Belum ada transaksi produk keluar</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => value}
                    labelFormatter={(label: string) => `Produk: ${label}`}
                  />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
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
