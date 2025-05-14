// Import the Tauri SQL plugin
import Database from "@tauri-apps/plugin-sql";

import type {
  InventoryMovement,
  InventoryMovementItem,
  InventoryValuation,
  MovementHistory,
  MovementWithItems,
  Product,
  ProductVariant,
  ProductVariantWithProduct,
  StockLevel
} from "./types/database";

/**
 * The main service class for inventory management
 */
export class InventoryService {
  private static instance: InventoryService | null = null;
  private db: Database | null = null;

  private constructor() {}

  /**
   * Get the singleton instance of InventoryService
   */
  public static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  /**
   * Initialize the database connection
   */
  public async initialize(dbPath = "sqlite:inventorymgmt.db"): Promise<void> {
    try {
      this.db = await Database.load(dbPath);
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    try {
      if (this.db) {
        await this.db.close();
        this.db = null;
        console.log("Database connection closed");
      }
    } catch (error) {
      console.error("Failed to close database:", error);
      throw error;
    }
  }

  // Product CRUD operations
  /**
   * Get all products
   */
  public async getAllProducts(): Promise<Product[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select<Product[]>(
      "SELECT * FROM products ORDER BY name"
    );
  }

  /**
   * Get a product by ID
   */
  public async getProductById(id: number): Promise<Product | null> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const products = await this.db.select<Product[]>(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );
      return products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error(`Failed to get product with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new product
   */
  public async createProduct(
    product: Omit<Product, "id" | "created_at" | "updated_at">
  ): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.execute(
      "INSERT INTO products (name, image_path, selling_price) VALUES (?, ?, ?) RETURNING id",
      [product.name, product.image_path, product.selling_price]
    );
    if (!result.lastInsertId) throw new Error("Failed to create product");
    return result.lastInsertId;
  }

  /**
   * Update an existing product
   */
  public async updateProduct(
    product: Omit<Product, "created_at" | "updated_at">
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    if (!product.id) throw new Error("Product ID is required");

    try {
      await this.db.execute(
        "UPDATE products SET name = ?, image_path = ?, selling_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [product.name, product.image_path, product.selling_price, product.id]
      );
    } catch (error) {
      console.error(`Failed to update product with ID ${product.id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a product
   */
  public async deleteProduct(id: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      // First, get all variants for this product to find barcode files
      const variants = await this.getProductVariants(id);

      // Import dynamically to avoid initialization issues
      const { deleteFile } = await import("./utils/file-utils");

      // Delete barcode files for each variant
      for (const variant of variants) {
        if (variant.barcode_path) {
          // Delete barcode file asynchronously (don't wait for completion)
          deleteFile(variant.barcode_path).catch((err) => {
            console.error(
              `Failed to delete barcode file for variant ${variant?.id ?? "unknown"}:`,
              err
            );
          });
        }
      }

      // Then delete the product (cascades to variants in the database)
      await this.db.execute("DELETE FROM products WHERE id = ?", [id]);
    } catch (error) {
      console.error(`Failed to delete product with ID ${id}:`, error);
      throw error;
    }
  }

  // Product Variant operations
  /**
   * Get variants for a product
   */
  public async getProductVariants(
    productId: number
  ): Promise<ProductVariantWithProduct[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select<ProductVariantWithProduct[]>(
      `
      SELECT v.*, p.name as product_name, p.selling_price
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.product_id = ?
    `,
      [productId]
    );
  }

  /**
   * Get a variant by ID
   */
  public async getVariantById(id: number): Promise<ProductVariant | null> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const variants = await this.db.select<ProductVariant[]>(
        "SELECT * FROM product_variants WHERE id = ?",
        [id]
      );
      return variants.length > 0 ? variants[0] : null;
    } catch (error) {
      console.error(`Failed to get variant with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new product variant
   */
  public async createProductVariant(
    variant: Omit<ProductVariant, "id" | "created_at" | "updated_at">
  ): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.execute(
      "INSERT INTO product_variants (product_id, handle, barcode_code, barcode, barcode_path) VALUES (?, ?, ?, ?, ?) RETURNING id",
      [
        variant.product_id,
        variant.handle,
        variant.barcode_code,
        variant.barcode,
        variant.barcode_path
      ]
    );
    if (!result.lastInsertId)
      throw new Error("Failed to create product variant");
    return result.lastInsertId;
  }

  /**
   * Update a product variant
   */
  public async updateProductVariant(variant: ProductVariant): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    if (!variant.id) throw new Error("Variant ID is required");

    try {
      await this.db.execute(
        "UPDATE product_variants SET handle = ?, barcode_code = ?, barcode = ?, barcode_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [
          variant.handle,
          variant.barcode_code,
          variant.barcode,
          variant.barcode_path,
          variant.id
        ]
      );
    } catch (error) {
      console.error(`Failed to update variant with ID ${variant.id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a product variant
   */
  public async deleteProductVariant(id: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      // First get the variant to find its barcode file
      const variant = await this.getVariantById(id);

      // Delete the variant from the database
      await this.db.execute("DELETE FROM product_variants WHERE id = ?", [id]);

      // Delete the barcode file if it exists
      if (variant?.barcode_path) {
        // Import dynamically to avoid initialization issues
        const { deleteFile } = await import("./utils/file-utils");

        // Delete the file asynchronously (don't wait for completion)
        deleteFile(variant.barcode_path).catch((err) => {
          console.error(
            `Failed to delete barcode file for variant ${variant?.id ?? "unknown"}:`,
            err
          );
        });
      }
    } catch (error) {
      console.error(`Failed to delete variant with ID ${id}:`, error);
      throw error;
    }
  }

  // Inventory Movement operations
  /**
   * Record a new inventory movement with its items
   */
  public async createInventoryMovement(
    movement: Omit<InventoryMovement, "id" | "movement_date">,
    items: Omit<InventoryMovementItem, "id" | "movement_id" | "created_at">[]
  ): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execute("BEGIN TRANSACTION");
    try {
      // Use current date-time string in ISO format
      const now = new Date().toISOString();

      const movementResult = await this.db.execute(
        "INSERT INTO inventory_movements (movement_type, notes, movement_date) VALUES (?, ?, ?) RETURNING id",
        [movement.movement_type, movement.notes, now]
      );
      if (!movementResult.lastInsertId)
        throw new Error("Failed to create inventory movement");
      const movementId = movementResult.lastInsertId;

      for (const item of items) {
        await this.db.execute(
          "INSERT INTO inventory_movement_items (movement_id, product_variant_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)",
          [
            movementId,
            item.product_variant_id,
            item.quantity,
            item.price_per_unit,
            item.total_price
          ]
        );
      }

      await this.db.execute("COMMIT");
      return movementId;
    } catch (error) {
      await this.db.execute("ROLLBACK");
      throw error;
    }
  }

  /**
   * Get inventory movements with optional filtering
   */
  public async getInventoryMovements(
    type?: "IN" | "OUT" | "RETURN",
    startDate?: string,
    endDate?: string
  ): Promise<InventoryMovement[]> {
    if (!this.db) throw new Error("Database not initialized");
    let query = "SELECT * FROM inventory_movements";
    const params: (string | number)[] = [];

    if (type || startDate || endDate) {
      query += " WHERE";
      const conditions: string[] = [];

      if (type) {
        conditions.push(" movement_type = ?");
        params.push(type);
      }

      if (startDate) {
        conditions.push(" date(movement_date) >= date(?)");
        params.push(startDate);
      }

      if (endDate) {
        // Add one day to include the entire end date (up to 23:59:59)
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        conditions.push(" date(movement_date) < date(?)");
        params.push(nextDay.toISOString().split("T")[0]);
      }

      query += conditions.join(" AND");
    }

    query += " ORDER BY movement_date DESC";
    return await this.db.select<InventoryMovement[]>(query, params);
  }

  /**
   * Get items for a specific movement
   */
  public async getMovementItems(
    movementId: number
  ): Promise<InventoryMovementItem[]> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.select<InventoryMovementItem[]>(
        "SELECT * FROM inventory_movement_items WHERE movement_id = ?",
        [movementId]
      );
    } catch (error) {
      console.error(
        `Failed to get items for movement ID ${movementId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get detailed movement items with product information
   */
  public async getDetailedMovementItems(movementId: number): Promise<
    Array<
      InventoryMovementItem & {
        product_name: string;
        handle: string;
        barcode: string | null;
      }
    >
  > {
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.select<
        Array<
          InventoryMovementItem & {
            product_name: string;
            handle: string;
            barcode: string | null;
          }
        >
      >(
        `
        SELECT 
          i.*,
          p.name as product_name,
          v.handle,
          v.barcode
        FROM inventory_movement_items i
        JOIN product_variants v ON i.product_variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE i.movement_id = ?
      `,
        [movementId]
      );
    } catch (error) {
      console.error(
        `Failed to get detailed items for movement ID ${movementId}:`,
        error
      );
      throw error;
    }
  }

  public async getMovementWithItems(
    movementId: number
  ): Promise<MovementWithItems | null> {
    if (!this.db) throw new Error("Database not initialized");
    const movements = await this.db.select<MovementWithItems[]>(
      `
      SELECT 
        m.*,
        json_group_array(json_object(
          'id', i.id,
          'movement_id', i.movement_id,
          'product_variant_id', i.product_variant_id,
          'quantity', i.quantity,
          'price_per_unit', i.price_per_unit,
          'total_price', i.total_price,
          'created_at', i.created_at,
          'product_name', p.name,
          'handle', v.handle,
          'barcode', v.barcode
        )) as items
      FROM inventory_movements m
      LEFT JOIN inventory_movement_items i ON m.id = i.movement_id
      LEFT JOIN product_variants v ON i.product_variant_id = v.id
      LEFT JOIN products p ON v.product_id = p.id
      WHERE m.id = ?
      GROUP BY m.id
    `,
      [movementId]
    );
    return movements[0] || null;
  }

  // Stock levels operations
  /**
   * Get current stock levels for all product variants
   */
  public async getAllStockLevels(): Promise<StockLevel[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select<StockLevel[]>(`
      SELECT 
        s.product_variant_id,
        s.quantity,
        s.last_updated,
        p.name as product_name,
        v.handle,
        v.barcode
      FROM inventory_stock s
      JOIN product_variants v ON s.product_variant_id = v.id
      JOIN products p ON v.product_id = p.id
      ORDER BY p.name, v.handle
    `);
  }

  /**
   * Get stock level for a specific product variant
   */
  public async getStockLevelForVariant(
    variantId: number
  ): Promise<StockLevel | null> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const stocks = await this.db.select<StockLevel[]>(
        `
        SELECT
          s.product_variant_id,
          s.quantity,
          s.last_updated,
          p.name as product_name,
          v.handle,
          v.barcode
        FROM inventory_stock s
        JOIN product_variants v ON s.product_variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE s.product_variant_id = ?
      `,
        [variantId]
      );

      return stocks.length > 0 ? stocks[0] : null;
    } catch (error) {
      console.error(
        `Failed to get stock level for variant ID ${variantId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get stock levels for a specific product (all variants)
   */
  public async getStockLevelsForProduct(
    productId: number
  ): Promise<StockLevel[]> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.select<StockLevel[]>(
        `
        SELECT
          s.product_variant_id,
          s.quantity,
          s.last_updated,
          p.name as product_name,
          v.handle,
          v.barcode
        FROM inventory_stock s
        JOIN product_variants v ON s.product_variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE p.id = ?
        ORDER BY v.handle
      `,
        [productId]
      );
    } catch (error) {
      console.error(
        `Failed to get stock levels for product ID ${productId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get low stock items (below threshold)
   */
  public async getLowStockItems(threshold = 10): Promise<StockLevel[]> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.select<StockLevel[]>(
        `
        SELECT
          s.product_variant_id,
          s.quantity,
          s.last_updated,
          p.name as product_name,
          v.handle,
          v.barcode
        FROM inventory_stock s
        JOIN product_variants v ON s.product_variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE s.quantity <= ?
        ORDER BY s.quantity ASC, p.name
      `,
        [threshold]
      );
    } catch (error) {
      console.error(
        `Failed to get low stock items (threshold: ${threshold}):`,
        error
      );
      throw error;
    }
  }

  /**
   * Manually update stock level for a product variant
   * This should be used only for stock corrections, normal stock changes should use the movement system
   */
  public async updateStockLevel(
    variantId: number,
    newQuantity: number
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.execute(
        "UPDATE inventory_stock SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE product_variant_id = ?",
        [newQuantity, variantId]
      );
    } catch (error) {
      console.error(
        `Failed to update stock level for variant ID ${variantId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Generate inventory valuation report
   */
  public async getInventoryValuation(): Promise<InventoryValuation[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select<InventoryValuation[]>(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        v.id as variant_id,
        v.handle,
        v.barcode,
        s.quantity,
        p.selling_price,
        (s.quantity * p.selling_price) as total_value
      FROM inventory_stock s
      JOIN product_variants v ON s.product_variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE s.quantity > 0
      ORDER BY total_value DESC
    `);
  }

  /**
   * Generate movement history report for a specific product variant
   */
  public async getVariantMovementHistory(
    variantId: number
  ): Promise<MovementHistory[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select<MovementHistory[]>(
      `
      SELECT 
        m.movement_type,
        m.movement_date,
        i.quantity,
        i.price_per_unit,
        i.total_price,
        m.notes
      FROM inventory_movement_items i
      JOIN inventory_movements m ON i.movement_id = m.id
      WHERE i.product_variant_id = ?
      ORDER BY m.movement_date DESC
    `,
      [variantId]
    );
  }

  /**
   * Find a product variant by barcode
   */
  public async findProductVariantByBarcode(
    barcode: string
  ): Promise<ProductVariantWithProduct | null> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      // First check if barcode matches the barcode_code field (priority search)
      let variants = await this.db.select<ProductVariantWithProduct[]>(
        `
        SELECT 
          v.*,
          p.name as product_name,
          p.selling_price
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.barcode_code = ?
        LIMIT 1
        `,
        [barcode]
      );

      if (variants.length > 0) {
        return variants[0];
      }

      // If not found by barcode_code, try the barcode_path
      variants = await this.db.select<ProductVariantWithProduct[]>(
        `
        SELECT 
          v.*,
          p.name as product_name,
          p.selling_price
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.barcode_path = ?
        LIMIT 1
        `,
        [barcode]
      );

      if (variants.length > 0) {
        return variants[0];
      }

      // Then try to find by matching the barcode data content
      // This is more complex since barcode is a JSONB field
      variants = await this.db.select<ProductVariantWithProduct[]>(
        `
        SELECT 
          v.*,
          p.name as product_name,
          p.selling_price
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.barcode IS NOT NULL
        LIMIT 50
        `
      );

      // Return null if no matching variant found
      return null;
    } catch (error) {
      console.error("Error finding product variant by barcode:", error);
      throw error;
    }
  }
}

// Export a default instance
export default InventoryService.getInstance();
