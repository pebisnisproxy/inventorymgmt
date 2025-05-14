/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */
import inventoryService from "./inventory-service";
import type {
  InventoryMovementItem,
  InventoryValuation,
  MovementHistory,
  Product,
  ProductVariant,
  ProductVariantWithProduct,
  StockLevel
} from "./types/database";

/**
 * Higher-level business logic for inventory operations
 */

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class InventoryManager {
  /**
   * Initialize the inventory manager
   */
  public static async initialize(
    dbPath = "sqlite:inventorymgmt.db"
  ): Promise<void> {
    await inventoryService.initialize(dbPath);
  }

  /**
   * Record a product purchase (stock coming in)
   * @param items List of items being purchased
   * @param notes Optional notes about the purchase
   * @returns The ID of the created inventory movement
   */
  public static async recordPurchase(
    items: Array<{
      variantId: number;
      quantity: number;
      costPerUnit: number;
    }>,
    notes?: string
  ): Promise<number> {
    // Transform to movement items
    const movementItems: Omit<
      InventoryMovementItem,
      "id" | "movement_id" | "created_at"
    >[] = items.map((item) => ({
      product_variant_id: item.variantId,
      quantity: item.quantity,
      price_per_unit: item.costPerUnit,
      total_price: item.quantity * item.costPerUnit
    }));

    // Record the movement
    return await inventoryService.createInventoryMovement(
      {
        movement_type: "IN",
        notes: notes || "Stock purchase"
      },
      movementItems
    );
  }

  /**
   * Record a sale (stock going out)
   * @param items List of items being sold
   * @param notes Optional notes about the sale
   * @returns The ID of the created inventory movement
   */
  public static async recordSale(
    items: Array<{
      variantId: number;
      quantity: number;
      sellingPrice: number;
    }>,
    notes?: string
  ): Promise<number> {
    // Transform to movement items
    const movementItems: Omit<
      InventoryMovementItem,
      "id" | "movement_id" | "created_at"
    >[] = items.map((item) => ({
      product_variant_id: item.variantId,
      quantity: item.quantity,
      price_per_unit: item.sellingPrice,
      total_price: item.quantity * item.sellingPrice
    }));

    // Record the movement
    return await inventoryService.createInventoryMovement(
      {
        movement_type: "OUT",
        notes: notes || "Sale"
      },
      movementItems
    );
  }

  /**
   * Record a product return (stock coming back in)
   * @param items List of items being returned
   * @param notes Optional notes about the return
   * @returns The ID of the created inventory movement
   */
  public static async recordReturn(
    items: Array<{
      variantId: number;
      quantity: number;
      pricePerUnit: number;
    }>,
    notes?: string
  ): Promise<number> {
    // Transform to movement items
    const movementItems: Omit<
      InventoryMovementItem,
      "id" | "movement_id" | "created_at"
    >[] = items.map((item) => ({
      product_variant_id: item.variantId,
      quantity: item.quantity,
      price_per_unit: item.pricePerUnit,
      total_price: item.quantity * item.pricePerUnit
    }));

    // Record the movement
    return await inventoryService.createInventoryMovement(
      {
        movement_type: "RETURN",
        notes: notes || "Product return"
      },
      movementItems
    );
  }

  /**
   * Check if there's enough stock for a sale
   * @param items List of items to check
   * @returns Array of items with insufficient stock
   */
  public static async checkStockAvailability(
    items: Array<{
      variantId: number;
      quantity: number;
    }>
  ): Promise<
    Array<{
      variantId: number;
      requested: number;
      available: number;
      product_name?: string;
      handle?: string;
    }>
  > {
    // Check each item
    const insufficientItems = [];

    for (const item of items) {
      const stockLevel = await inventoryService.getStockLevelForVariant(
        item.variantId
      );

      if (!stockLevel || stockLevel.quantity < item.quantity) {
        insufficientItems.push({
          variantId: item.variantId,
          requested: item.quantity,
          available: stockLevel?.quantity || 0,
          product_name: stockLevel?.product_name,
          handle: stockLevel?.handle
        });
      }
    }

    return insufficientItems;
  }

  /**
   * Get products that need to be restocked (below specified threshold)
   * @param threshold Quantity threshold for considering an item low in stock
   * @returns List of items with low stock
   */
  public static async getLowStockItems(threshold = 10): Promise<StockLevel[]> {
    return await inventoryService.getLowStockItems(threshold);
  }

  /**
   * Generate inventory valuation report
   * @returns Inventory valuation report
   */
  public static async getInventoryValuation(): Promise<{
    items: InventoryValuation[];
    totalValue: number;
    itemCount: number;
    variantsCount: number;
  }> {
    const items = await inventoryService.getInventoryValuation();

    // Calculate totals
    const totalValue = items.reduce(
      (sum, item) => sum + Number(item.total_value),
      0
    );
    const itemCount = items.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    );
    const variantsCount = items.length;

    return {
      items,
      totalValue,
      itemCount,
      variantsCount
    };
  }

  /**
   * Create a new product with variants
   * @param product Product details
   * @param variants List of variants for the product
   * @returns The ID of the created product
   */
  public static async createProductWithVariants(
    product: Omit<Product, "id" | "created_at" | "updated_at">,
    variants: Array<
      Omit<ProductVariant, "id" | "product_id" | "created_at" | "updated_at">
    >
  ): Promise<number> {
    // Create the product
    const productId = await inventoryService.createProduct(product);

    if (!productId) {
      throw new Error("Failed to create product");
    }

    // Create variants
    for (const variant of variants) {
      await inventoryService.createProductVariant({
        product_id: productId,
        handle: variant.handle,
        barcode_code: variant.barcode_code,
        barcode: variant.barcode,
        barcode_path: variant.barcode_path
      });
    }

    return productId;
  }

  /**
   * Get product details with stock information
   * @param productId Product ID
   * @returns Product details with variant stock information
   */
  public static async getProductWithStock(productId: number): Promise<{
    product: Product;
    variants: Array<ProductVariantWithProduct & { stock: number }>;
  }> {
    // Get product info
    const product = await inventoryService.getProductById(productId);
    if (!product) {
      throw new Error(`Product not found with ID: ${productId}`);
    }

    // Get variants
    const variants = await inventoryService.getProductVariants(productId);

    // Get stock levels for each variant
    const variantsWithStock = [];
    for (const variant of variants) {
      const stock = await inventoryService.getStockLevelForVariant(variant.id);
      variantsWithStock.push({
        ...variant,
        stock: stock?.quantity || 0
      });
    }

    // Return combined info
    return {
      product,
      variants: variantsWithStock
    };
  }

  /**
   * Get variant details with movement history
   * @param variantId Variant ID
   * @returns Variant details with movement history
   */
  public static async getVariantWithHistory(variantId: number): Promise<{
    variant: ProductVariant;
    product: Product | null;
    stock: number;
    history: MovementHistory[];
  }> {
    // Get variant info
    const variant = await inventoryService.getVariantById(variantId);
    if (!variant) {
      throw new Error(`Variant not found with ID: ${variantId}`);
    }

    // Get product info
    const product = await inventoryService.getProductById(variant.product_id);

    // Get stock level
    const stock = await inventoryService.getStockLevelForVariant(variantId);

    // Get movement history
    const history = await inventoryService.getVariantMovementHistory(variantId);

    // Return combined info
    return {
      variant,
      product,
      stock: stock?.quantity || 0,
      history
    };
  }
}
