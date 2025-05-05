"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Category, InventoryService } from "@/lib/inventory-service";
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
  name: z.string().min(1, "Nama harus diisi"),
  category_id: z.number().nullable(),
  selling_price: z.number().min(0, "Harga harus positif")
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function AddProductPage() {
  const router = useRouter();
  const { addProduct } = useProductStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Nama kategori harus diisi");
      return;
    }

    try {
      const service = InventoryService.getInstance();
      const categoryId = await service.createCategory({
        name: newCategoryName.trim()
      });

      if (categoryId) {
        const updatedCategories = await service.getAllCategories();
        setCategories(updatedCategories);
        form.setValue("category_id", categoryId);
        setIsCreatingCategory(false);
        setNewCategoryName("");
        toast.success("Kategori berhasil ditambahkan");
      }
    } catch (error) {
      console.error("Gagal membuat kategori:", error);
      toast.error("Gagal membuat kategori");
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    try {
      await addProduct(values);
      toast.success("Produk berhasil ditambahkan");
      router.push("/p");
    } catch (error) {
      toast.error("Gagal menambahkan produk");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Tambah Produk</h1>
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
                {isCreatingCategory ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Nama Kategori Baru"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button type="button" onClick={handleCreateCategory}>
                        Simpan Kategori
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreatingCategory(false);
                          setNewCategoryName("");
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreatingCategory(true)}
                    >
                      Buat Kategori Baru
                    </Button>
                  </div>
                )}
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
            <Button type="submit">Simpan Produk</Button>
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
