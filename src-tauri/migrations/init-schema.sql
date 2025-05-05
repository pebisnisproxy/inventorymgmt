/* Inventory Management Database Migration Script
   This script includes safety checks to ensure it can be run multiple times
   without causing errors if tables already exist.
*/

-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    image_path TEXT,
    selling_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    handle TEXT NOT NULL,  -- This appears to be the variant number/identifier (31, 32, 33, etc.)
    barcode TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Inventory movements table (common fields for all movement types)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movement_type TEXT NOT NULL,  -- 'IN', 'OUT', 'RETURN'
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Inventory movement items (detailed records for each product movement)
CREATE TABLE IF NOT EXISTS inventory_movement_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movement_id INTEGER NOT NULL,
    product_variant_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movement_id) REFERENCES inventory_movements(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
);

-- Current stock levels (this could be a view, but for performance it might be better as a table)
CREATE TABLE IF NOT EXISTS inventory_stock (
    product_variant_id INTEGER PRIMARY KEY,
    quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

-- Safely drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_stock_on_movement_insert;

-- Create trigger to update inventory stock when movement items are added
CREATE TRIGGER update_stock_on_movement_insert AFTER INSERT ON inventory_movement_items
BEGIN
    -- For incoming products (IN)
    INSERT INTO inventory_stock (product_variant_id, quantity)
    SELECT NEW.product_variant_id,
           CASE WHEN (SELECT movement_type FROM inventory_movements WHERE id = NEW.movement_id) = 'IN' THEN NEW.quantity
                WHEN (SELECT movement_type FROM inventory_movements WHERE id = NEW.movement_id) = 'RETURN' THEN NEW.quantity
                ELSE 0 END
    ON CONFLICT(product_variant_id) DO UPDATE SET
        quantity = quantity + (CASE WHEN (SELECT movement_type FROM inventory_movements WHERE id = NEW.movement_id) = 'IN'
                                    THEN NEW.quantity
                                    WHEN (SELECT movement_type FROM inventory_movements WHERE id = NEW.movement_id) = 'OUT'
                                    THEN -NEW.quantity
                                    WHEN (SELECT movement_type FROM inventory_movements WHERE id = NEW.movement_id) = 'RETURN'
                                    THEN NEW.quantity
                                    ELSE 0 END),
        last_updated = CURRENT_TIMESTAMP;
END;

-- Safely create indexes (create if not exists not supported for indexes in SQLite)
-- So we need to check if they exist first
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_movement_items_movement ON inventory_movement_items(movement_id);
CREATE INDEX IF NOT EXISTS idx_movement_items_variant ON inventory_movement_items(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_movements_type_date ON inventory_movements(movement_type, movement_date);

-- -- Initial data seeding (only if tables are empty)
-- INSERT INTO categories (name)
-- SELECT 'OUTXIDE'
-- WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);
