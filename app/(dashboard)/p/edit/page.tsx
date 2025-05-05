"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Product } from "@/lib/inventory-service";
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
  name: z.string().min(1, "Name is required"),
  category_id: z.number().nullable(),
  selling_price: z.number().min(0, "Price must be positive")
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Number(searchParams.get("id"));
  const { products, updateProduct, fetchProducts } = useProductStore();

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
      await updateProduct(values);
      toast.success("Product updated successfully");
      router.push("/p");
    } catch (error) {
      toast.error("Failed to update product");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Product name" {...field} />
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
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value ? Number(value) : null)
                  }
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* <SelectItem value="uncategorized">Uncategorized</SelectItem> */}
                    {/* Categories will be loaded here */}
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
                <FormLabel>Selling Price</FormLabel>
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
            <Button type="submit">Update Product</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/p")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
