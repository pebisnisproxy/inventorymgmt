import { create } from "zustand";

import { InventoryManager } from "../inventory-manager";
import { InventoryService } from "../inventory-service";
import { Product } from "../types/database";

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  selectedProduct: Product | null;
  fetchProducts: () => Promise<void>;
  addProduct: (
    product: Omit<Product, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  updateProduct: (
    product: Omit<Product, "created_at" | "updated_at">
  ) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  setSelectedProduct: (product: Product | null) => void;
}

type SetState = (fn: (state: ProductState) => Partial<ProductState>) => void;
type GetState = () => ProductState;

export const useProductStore = create<ProductState>(
  (set: SetState, get: GetState) => ({
    products: [],
    isLoading: false,
    error: null,
    selectedProduct: null,

    fetchProducts: async () => {
      set((state) => ({ ...state, isLoading: true, error: null }));
      try {
        await InventoryManager.initialize();
        const service = InventoryService.getInstance();
        const products = await service.getAllProducts();
        set((state) => ({ ...state, products, isLoading: false }));
      } catch (error) {
        set((state) => ({
          ...state,
          error: "Failed to fetch products",
          isLoading: false
        }));
        console.error(error);
      }
    },

    addProduct: async (
      product: Omit<Product, "id" | "created_at" | "updated_at">
    ) => {
      set((state) => ({ ...state, isLoading: true, error: null }));
      try {
        await InventoryManager.initialize();
        const service = InventoryService.getInstance();
        await service.createProduct(product);
        await get().fetchProducts();
        set((state) => ({ ...state, isLoading: false }));
      } catch (error) {
        set((state) => ({
          ...state,
          error: "Failed to add product",
          isLoading: false
        }));
        console.error(error);
      }
    },

    updateProduct: async (
      product: Omit<Product, "created_at" | "updated_at">
    ) => {
      set((state) => ({ ...state, isLoading: true, error: null }));
      try {
        const service = InventoryService.getInstance();
        await service.updateProduct(product);
        await get().fetchProducts();
        set((state) => ({ ...state, isLoading: false }));
      } catch (error) {
        set((state) => ({
          ...state,
          error: "Failed to update product",
          isLoading: false
        }));
        console.error(error);
      }
    },

    deleteProduct: async (id: number) => {
      set((state) => ({ ...state, isLoading: true, error: null }));
      try {
        const service = InventoryService.getInstance();
        await service.deleteProduct(id);
        await get().fetchProducts();
        set((state) => ({ ...state, isLoading: false }));
      } catch (error) {
        set((state) => ({
          ...state,
          error: "Failed to delete product",
          isLoading: false
        }));
        console.error(error);
      }
    },

    setSelectedProduct: (product: Product | null) =>
      set((state) => ({ ...state, selectedProduct: product }))
  })
);
