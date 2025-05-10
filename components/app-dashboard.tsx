"use client";

import {
  Boxes,
  Home,
  Package,
  PackageOpen,
  PlusCircle,
  RefreshCw,
  Search,
  Undo2
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { InventoryService } from "@/lib/inventory-service";
import { useProductStore } from "@/lib/store/product-store";
import { Category, Product } from "@/lib/types/database";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const navigations = [
  {
    name: "Beranda",
    href: "/",
    icon: <Home className="h-4 w-4" />
  },
  {
    name: "Produk",
    icon: <Boxes className="h-4 w-4" />,
    children: true
  },
  {
    name: "Produk Masuk",
    href: "/p/in",
    icon: <Package className="h-4 w-4" />
  },
  {
    name: "Produk Keluar",
    href: "/p/out",
    icon: <PackageOpen className="h-4 w-4" />
  },
  {
    name: "Produk Return",
    href: "/p/return",
    icon: <Undo2 className="h-4 w-4" />
  }
];

export default function AppDashboard({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>("");

  const { products, fetchProducts } = useProductStore();

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

      // Coba inisialisasi database
      try {
        await service.initialize();
      } catch (initError) {
        console.error("Gagal menginisialisasi database:", initError);
        throw new Error("Gagal menginisialisasi database");
      }

      // Tunggu sebentar untuk memastikan database siap
      await new Promise((resolve) => setTimeout(resolve, 100));
      const categoriesData = await service.getAllCategories();
      fetchProducts();
      setCategories(categoriesData);
      setError(null);
    } catch (error) {
      console.error("Gagal memuat data:", error);
      setError("Gagal memuat data. Silakan refresh halaman.");
      toast.error("Gagal memuat data", {
        description: "Silakan coba lagi atau refresh halaman"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Reset select value when URL changes
  useEffect(() => {
    setSelectedValue("");
  }, [pathname]);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    if (value.startsWith("navigate:")) {
      const path = value.replace("navigate:", "");
      router.push(`/p/${path}`);
    } else if (value.startsWith("product:")) {
      const id = value.replace("product:", "");
      router.push(`/p/detail?id=${id}`);
    } else if (value.startsWith("category:")) {
      const id = value.replace("category:", "");
      router.push(`/c?id=${id}`);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Memuat...
              </>
            ) : (
              "Refresh Halaman"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="w-full">
      <ResizablePanel
        defaultSize={isMobile ? 8 : 22}
        minSize={isMobile ? 8 : 22}
        maxSize={isMobile ? 8 : 32}
        className={cn("p-4", isMobile && "p-2")}
      >
        <div className="flex h-full flex-col gap-4">
          <div
            className={cn(
              "flex items-center gap-2",
              isMobile && "justify-center"
            )}
          >
            <Boxes className="h-6 w-6" />
            {!isMobile && (
              <span className="font-bold">Inventory Management</span>
            )}
          </div>

          <ul className={cn("space-y-4", isMobile && "space-y-2")}>
            {navigations.map((navigation) =>
              navigation.children ? (
                <li key={navigation.name}>
                  <Select value={selectedValue} onValueChange={handleSelect}>
                    <SelectTrigger
                      className={cn("w-full font-bold", isMobile && "h-8")}
                    >
                      <SelectValue
                        placeholder={isMobile ? navigation.icon : "Aksi Cepat"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Navigasi</SelectLabel>
                        <SelectItem value="navigate:">
                          <Boxes className="mr-2 h-4 w-4 inline" /> Semua Produk
                        </SelectItem>
                        <SelectItem value="navigate:add">
                          <PlusCircle className="mr-2 h-4 w-4 inline" /> Tambah
                          Produk
                        </SelectItem>

                        <SelectLabel>Produk</SelectLabel>
                        {products.map((product) => (
                          <SelectItem
                            key={product.id}
                            value={`product:${product.id}`}
                          >
                            {product.name}
                          </SelectItem>
                        ))}

                        <SelectLabel>Kategori</SelectLabel>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={`category:${category.id}`}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </li>
              ) : (
                <li key={navigation.name}>
                  <Button
                    className={cn(
                      "w-full justify-start",
                      isMobile && "justify-center h-8"
                    )}
                    variant={
                      pathname === navigation.href ? "default" : "outline"
                    }
                    asChild
                    title={navigation.name}
                  >
                    <Link href={navigation.href ?? "#"}>
                      {navigation.icon}
                      {!isMobile && (
                        <span className="ml-2">{navigation.name}</span>
                      )}
                    </Link>
                  </Button>
                </li>
              )
            )}
          </ul>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <header
          className={cn(
            "flex items-center justify-between p-2 border-b",
            isMobile && "p-2"
          )}
        >
          <h1 className={cn("font-bold ml-2", isMobile && "ml-1 text-sm")}>
            {"> ivmv2"}
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className={cn(isMobile && "h-8 w-8")}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(isMobile && "h-8 w-8")}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </header>
        <main className={cn("p-4 overflow-y-scroll h-max", isMobile && "p-2")}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                <p className="mt-2">Memuat data...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
