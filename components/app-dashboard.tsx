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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Category, InventoryService, Product } from "@/lib/inventory-service";

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
    icon: <Home className="mr-2 h-4 w-4" />
  },
  {
    name: "Produk",
    icon: <Boxes className="mr-2 h-4 w-4" />,
    children: true
  },
  {
    name: "Produk Masuk",
    href: "/p/in",
    icon: <Package className="mr-2 h-4 w-4" />
  },
  {
    name: "Produk Keluar",
    href: "/p/out",
    icon: <PackageOpen className="mr-2 h-4 w-4" />
  },
  {
    name: "Produk Return",
    href: "/p/return",
    icon: <Undo2 className="mr-2 h-4 w-4" />
  }
];

export default function AppDashboard({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const service = InventoryService.getInstance();
        await service.initialize();
        const [productsData, categoriesData] = await Promise.all([
          service.getAllProducts(),
          service.getAllCategories()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSelect = (value: string) => {
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

  return (
    <ResizablePanelGroup direction="horizontal" className="w-full min-h-screen">
      <ResizablePanel
        defaultSize={16}
        minSize={16}
        maxSize={32}
        className="p-4"
      >
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-center gap-2">
            <Boxes className="h-6 w-6" />
            <span className="font-bold">Inventory Management</span>
          </div>

          <ul className="space-y-4">
            {navigations.map((navigation) =>
              navigation.children ? (
                <li key={navigation.name}>
                  <Select onValueChange={handleSelect}>
                    <SelectTrigger className="w-full font-bold">
                      <SelectValue placeholder={navigation.name} />
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
                    className="w-full justify-start"
                    variant="outline"
                    asChild
                  >
                    <Link href={navigation.href ?? "#"}>
                      {navigation.icon}
                      {navigation.name}
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
        <header className="flex items-center justify-between p-2 border-b">
          <h1 className="font-bold ml-2">{"> ivmv2"}</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </header>
        <main className="p-4">{children}</main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
