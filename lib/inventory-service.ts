// Import the Tauri SQL plugin
import Database from "@tauri-apps/plugin-sql";

// Define types for database entities
export interface Category {
  id?: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id?: number;
  name: string;
  category_id: number | null;
  image_path?: string;
  selling_price: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariant {
  id?: number;
  product_id: number;
  handle: string;
  barcode?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryMovement {
  id?: number;
  movement_type: "IN" | "OUT" | "RETURN";
  movement_date?: string;
  notes?: string;
}

export interface InventoryMovementItem {
  id?: number;
  movement_id: number;
  product_variant_id: number;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  created_at?: string;
}

export interface StockLevel {
  product_variant_id: number;
  quantity: number;
  last_updated?: string;
  product_name?: string;
  handle?: string;
  barcode?: string;
}

/**
 * The main service class for inventory management
 */
export class InventoryService {
  private db: Database | null = null;
  private static instance: InventoryService | null = null;

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
  public async initialize(
    dbPath: string = "sqlite:inventory.db"
  ): Promise<void> {
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

  // Category CRUD operations
  /**
   * Get all categories
   */
  public async getAllCategories(): Promise<Category[]> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.select<Category[]>(
        "SELECT * FROM categories ORDER BY name"
      );
    } catch (error) {
      console.error("Failed to get categories:", error);
      throw error;
    }
  }

  /**
   * Get a category by ID
   */
  public async getCategoryById(id: number): Promise<Category | null> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const categories = await this.db.select<Category[]>(
        "SELECT * FROM categories WHERE id = ?",
        [id]
      );
      return categories.length > 0 ? categories[0] : null;
    } catch (error) {
      console.error(`Failed to get category with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new category
   */
  public async createCategory(category: Category): Promise<number | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const result = await this.db.execute(
        "INSERT INTO categories (name) VALUES (?) RETURNING id",
        [category.name]
      );
      return result.lastInsertId;
    } catch (error) {
      console.error("Failed to create category:", error);
      throw error;
    }
  }

  /**
   * Update an existing category
   */
  public async updateCategory(category: Category): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    if (!category.id) throw new Error("Category ID is required");

    try {
      await this.db.execute(
        "UPDATE categories SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [category.name, category.id]
      );
    } catch (error) {
      console.error(`Failed to update category with ID ${category.id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a category
   */
  public async deleteCategory(id: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.execute("DELETE FROM categories WHERE id = ?", [id]);
    } catch (error) {
      console.error(`Failed to delete category with ID ${id}:`, error);
      throw error;
    }
  }

  // Product CRUD operations
  /**
   * Get all products
   */
  public async getAllProducts(): Promise<Product[]> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.select<Product[]>(`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.name
      `);
    } catch (error) {
      console.error("Failed to get products:", error);
      throw error;
    }
  }

  /**
   * Get products by category
   */
  public async getProductsByCategory(categoryId: number): Promise<Product[]> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.select<Product[]>(
        "SELECT * FROM products WHERE category_id = ? ORDER BY name",
        [categoryId]
      );
    } catch (error) {
      console.error(
        `Failed to get products for category ID ${categoryId}:`,
        error
      );
      throw error;
    }
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
  public async createProduct(product: Product): Promise<number | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const result = await this.db.execute(
        "INSERT INTO products (name, category_id, image_path, selling_price) VALUES (?, ?, ?, ?) RETURNING id",
        [
          product.name,
          product.category_id,
          product.image_path,
          product.selling_price
        ]
      );
      return result.lastInsertId;
    } catch (error) {
      console.error("Failed to create product:", error);
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  public async updateProduct(product: Product): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    if (!product.id) throw new Error("Product ID is required");

    try {
      await this.db.execute(
        "UPDATE products SET name = ?, category_id = ?, image_path = ?, selling_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [
          product.name,
          product.category_id,
          product.image_path,
          product.selling_price,
          product.id
        ]
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
  ): Promise<ProductVariant[]> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.select<ProductVariant[]>(
        "SELECT * FROM product_variants WHERE product_id = ?",
        [productId]
      );
    } catch (error) {
      console.error(
        `Failed to get variants for product ID ${productId}:`,
        error
      );
      throw error;
    }
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
    variant: ProductVariant
  ): Promise<number | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const result = await this.db.execute(
        "INSERT INTO product_variants (product_id, handle, barcode) VALUES (?, ?, ?) RETURNING id",
        [variant.product_id, variant.handle, variant.barcode]
      );
      return result.lastInsertId;
    } catch (error) {
      console.error("Failed to create product variant:", error);
      throw error;
    }
  }

  /**
   * Update a product variant
   */
  public async updateProductVariant(variant: ProductVariant): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    if (!variant.id) throw new Error("Variant ID is required");

    try {
      await this.db.execute(
        "UPDATE product_variants SET handle = ?, barcode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [variant.handle, variant.barcode, variant.id]
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
      await this.db.execute("DELETE FROM product_variants WHERE id = ?", [id]);
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
    movement: InventoryMovement,
    items: Omit<InventoryMovementItem, "id" | "movement_id" | "created_at">[]
  ): Promise<number | undefined> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      // Start a transaction
      await this.db.execute("BEGIN TRANSACTION");

      // Insert the movement record
      const movementResult = await this.db.execute(
        "INSERT INTO inventory_movements (movement_type, movement_date, notes) VALUES (?, ?, ?) RETURNING id",
        [movement.movement_type, movement.movement_date || null, movement.notes]
      );

      const movementId = movementResult.lastInsertId;

      // Insert all movement items
      for (const item of items) {
        // Calculate total price if not provided
        const totalPrice =
          item.total_price || item.price_per_unit * item.quantity;

        await this.db.execute(
          "INSERT INTO inventory_movement_items (movement_id, product_variant_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)",
          [
            movementId,
            item.product_variant_id,
            item.quantity,
            item.price_per_unit,
            totalPrice
          ]
        );
      }

      // Commit the transaction
      await this.db.execute("COMMIT");

      return movementId;
    } catch (error) {
      // Rollback the transaction on error
      if (this.db) {
        await this.db.execute("ROLLBACK");
      }
      console.error("Failed to create inventory movement:", error);
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

    try {
      let query = "SELECT * FROM inventory_movements WHERE 1=1";
      const params: any[] = [];

      if (type) {
        query += " AND movement_type = ?";
        params.push(type);
      }

      if (startDate) {
        query += " AND movement_date >= ?";
        params.push(startDate);
      }

      if (endDate) {
        query += " AND movement_date <= ?";
        params.push(endDate);
      }

      query += " ORDER BY movement_date DESC";

      return await this.db.select<InventoryMovement[]>(query, params);
    } catch (error) {
      console.error("Failed to get inventory movements:", error);
      throw error;
    }
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
  public async getDetailedMovementItems(movementId: number): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.select<any[]>(
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

  // Stock levels operations
  /**
   * Get current stock levels for all product variants
   */
  public async getAllStockLevels(): Promise<StockLevel[]> {
    if (!this.db) throw new Error("Database not initialized");
    try {
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
    } catch (error) {
      console.error("Failed to get stock levels:", error);
      throw error;
    }
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
  public async getLowStockItems(threshold: number = 10): Promise<StockLevel[]> {
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
        "INSERT INTO inventory_stock (product_variant_id, quantity) VALUES (?, ?) ON CONFLICT(product_variant_id) DO UPDATE SET quantity = ?, last_updated = CURRENT_TIMESTAMP",
        [variantId, newQuantity, newQuantity]
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
  public async getInventoryValuation(): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.select<any[]>(`
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
    } catch (error) {
      console.error("Failed to generate inventory valuation report:", error);
      throw error;
    }
  }

  /**
   * Generate movement history report for a specific product variant
   */
  public async getVariantMovementHistory(variantId: number): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.select<any[]>(
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
    } catch (error) {
      console.error(
        `Failed to get movement history for variant ID ${variantId}:`,
        error
      );
      throw error;
    }
  }
}

// Export a default instance
export default InventoryService.getInstance();
