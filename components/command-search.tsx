"use client";

import { FileText, Package, Search, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { InventoryService } from "@/lib/inventory-service";
import type {
  InventoryMovement,
  Product,
  ProductVariantWithProduct
} from "@/lib/types/database";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from "@/components/ui/command";

interface CommandSearchProps {
  children?: React.ReactNode;
}

export function CommandSearch({ children }: CommandSearchProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [variants, setVariants] = React.useState<ProductVariantWithProduct[]>(
    []
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setMovements] = React.useState<InventoryMovement[]>([]);

  // Fetch data when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchSearchData();
    }
  }, [open]);

  // Setup keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setOpen((open: boolean) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Function to open search dialog
  const openSearchDialog = () => {
    setOpen(true);
  };

  // Fetch products, variants, and movements
  const fetchSearchData = async () => {
    setLoading(true);
    try {
      const service = InventoryService.getInstance();
      await service.initialize();

      // Fetch products
      const productsData = await service.getAllProducts();
      setProducts(productsData);

      // Fetch variants (limiting to a reasonable number)
      const allVariants: ProductVariantWithProduct[] = [];
      for (const product of productsData.slice(0, 10)) {
        const productVariants = await service.getProductVariants(product.id);
        allVariants.push(...productVariants);
        if (allVariants.length > 50) break; // Limit the number of variants
      }
      setVariants(allVariants);

      // Fetch recent movements
      const movementsData = await service.getInventoryMovements(
        undefined,
        undefined,
        undefined
      );
      setMovements(movementsData.slice(0, 20)); // Limit to recent 20 movements
    } catch (error) {
      console.error("Error fetching search data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to product detail
  const handleProductSelect = (productId: number) => {
    router.push(`/p/detail?id=${productId}`);
    setOpen(false);
  };

  // Navigate to variant's product detail
  const handleVariantSelect = (productId: number) => {
    router.push(`/p/detail?id=${productId}`);
    setOpen(false);
  };

  // Navigate to movement type page
  const handleMovementTypeSelect = (type: string) => {
    router.push(`/p/${type.toLowerCase()}`);
    setOpen(false);
  };

  return (
    <>
      {children ? (
        <Button className="p-0 hover:bg-transparent" onClick={openSearchDialog}>
          {children}
        </Button>
      ) : (
        <Button
          size="icon"
          className="w-9 px-0"
          onClick={openSearchDialog}
          title="Search (⌘K)"
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Search (⌘K)</span>
        </Button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Cari produk, varian, atau catatan..." />
        <CommandList>
          <CommandEmpty>
            {loading ? "Memuat data..." : "Tidak ada hasil yang ditemukan."}
          </CommandEmpty>

          <CommandGroup heading="Produk">
            {products.map((product) => (
              <CommandItem
                key={`product-${product.id}`}
                onSelect={() => handleProductSelect(product.id)}
              >
                <Package className="mr-2 h-4 w-4" />
                <span>{product.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {products.length > 0 && variants.length > 0 && <CommandSeparator />}

          <CommandGroup heading="Varian">
            {variants.map((variant) => (
              <CommandItem
                key={`variant-${variant.id}`}
                onSelect={() => handleVariantSelect(variant.product_id)}
              >
                <Tag className="mr-2 h-4 w-4" />
                <span>
                  {variant.product_name} ({variant.handle})
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          {(products.length > 0 || variants.length > 0) && <CommandSeparator />}

          <CommandGroup heading="Operasi Produk">
            <CommandItem onSelect={() => handleMovementTypeSelect("in")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Produk Masuk</span>
              <CommandShortcut>/in</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleMovementTypeSelect("out")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Produk Keluar</span>
              <CommandShortcut>/out</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleMovementTypeSelect("return")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Produk Kembali</span>
              <CommandShortcut>/return</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
