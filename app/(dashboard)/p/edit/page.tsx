"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Category, InventoryService, Product } from "@/lib/inventory-service";
import { useProductStore } from "@/lib/store/product-store";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const productFormSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Nama harus diisi"),
  category_id: z.number().nullable(),
  selling_price: z.number().min(0, "Harga harus positif")
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Number(searchParams.get("id"));
  const { products, updateProduct } = useProductStore();
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      id: 0,
      name: "",
      category_id: null,
      selling_price: 0
    }
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const service = InventoryService.getInstance();
        const loadedCategories = await service.getAllCategories();
        setCategories(loadedCategories);
      } catch (error) {
        console.error("Gagal memuat kategori:", error);
        toast.error("Gagal memuat kategori");
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (id) {
      const product = products.find((p: Product) => p.id === id);
      if (product) {
        form.reset({
          id: product.id!,
          name: product.name,
          category_id: product.category_id,
          selling_price: product.selling_price
        });
      } else {
        router.push("/p");
      }
    } else {
      router.push("/p");
    }
  }, [id, products, form, router]);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      const productData = {
        ...values,
        category_id: values.category_id || null
      };
      await updateProduct(productData);
      toast.success("Produk berhasil diperbarui");
      router.push("/p");
    } catch (error) {
      toast.error("Gagal memperbarui produk");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Ubah Produk</h1>
          <Button
            variant="outline"
            onClick={() => router.push("/p")}
            className="flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-left"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Kembali
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Nama Produk</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan nama produk"
                          {...field}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Kategori</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(
                            value === "uncategorized" ? null : Number(value)
                          )
                        }
                        value={
                          field.value === null
                            ? "uncategorized"
                            : field.value?.toString()
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="uncategorized">
                            Tidak Berkategori
                          </SelectItem>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id?.toString() || ""}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="selling_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Harga Jual</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            Rp
                          </span>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className="h-11 pl-8"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 h-11">
                  Perbarui Produk
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/p")}
                  className="flex-1 h-11"
                >
                  Batal
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
