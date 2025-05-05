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
  name: z.string().min(1, "Name is required"),
  category_id: z.number().nullable(),
  new_category: z.string().optional(),
  selling_price: z.number().min(0, "Price must be positive")
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function AddProductPage() {
  const router = useRouter();
  const { addProduct } = useProductStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      category_id: null,
      new_category: "",
      selling_price: 0
    }
  });

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const service = InventoryService.getInstance();
        const loadedCategories = await service.getAllCategories();
        setCategories(loadedCategories);
      } catch (error) {
        console.error("Failed to load categories:", error);
        toast.error("Failed to load categories");
      }
    };
    loadCategories();
  }, []);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      let categoryId = values.category_id;

      // If creating a new category
      if (isCreatingCategory && values.new_category) {
        const service = InventoryService.getInstance();
        const newCategory = await service.createCategory({
          name: values.new_category
        });
        if (newCategory) {
          categoryId = newCategory;
        }
      }

      await addProduct({
        ...values,
        category_id: categoryId
      });
      toast.success("Product added successfully");
      router.push("/p");
    } catch (error) {
      toast.error("Failed to add product");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Add Product</h1>
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
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant={isCreatingCategory ? "default" : "outline"}
                onClick={() => setIsCreatingCategory(false)}
              >
                Select Category
              </Button>
              <Button
                type="button"
                variant={isCreatingCategory ? "outline" : "default"}
                onClick={() => setIsCreatingCategory(true)}
              >
                Create New Category
              </Button>
            </div>
            {isCreatingCategory ? (
              <FormField
                control={form.control}
                name="new_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter new category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
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
                        {/* <SelectItem value="">Uncategorized</SelectItem> */}
                        {categories.map(
                          (category) =>
                            category.id && (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                {category.name}
                              </SelectItem>
                            )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
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
            <Button type="submit">Add Product</Button>
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
