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
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Ubah Produk</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Produk" {...field} />
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
                <FormLabel>Kategori</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value ? Number(value) : null)
                  }
                  value={field.value?.toString() || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Tidak Berkategori</SelectItem>
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
                <FormLabel>Harga Jual</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            <Button type="submit">Perbarui Produk</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/p")}
            >
              Batal
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
