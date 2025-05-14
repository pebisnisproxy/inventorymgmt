/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: number;
  name: string;
  image_path: string | null;
  selling_price: number;
  created_at: string;
  updated_at: string;
}

export interface BarcodeData {
  height: number;
  xdim: number;
  encoding: number[];
}

export interface ProductVariant {
  id: number;
  product_id: number;
  handle: string;
  barcode_code: string | null;
  barcode: BarcodeData | null;
  barcode_path: string | null;
  created_at: string;
  updated_at: string;
}

export type MovementType = "IN" | "OUT" | "RETURN";

export interface InventoryMovement {
  id: number;
  movement_type: MovementType;
  movement_date: string;
  notes: string | null;
}

export interface InventoryMovementItem {
  id: number;
  movement_id: number;
  product_variant_id: number;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  created_at: string;
}

export interface InventoryStock {
  product_variant_id: number;
  quantity: number;
  last_updated: string;
}

// Extended types for joins and views
export interface ProductVariantWithProduct extends ProductVariant {
  product_name: string;
  selling_price: number;
}

export interface StockLevel extends InventoryStock {
  product_name: string;
  handle: string;
  barcode: Buffer | null;
  barcode_path: string | null;
}

export interface MovementWithItems extends InventoryMovement {
  items: Array<
    InventoryMovementItem & {
      product_name: string;
      handle: string;
      barcode: Buffer | null;
      barcode_path: string | null;
    }
  >;
}

export interface InventoryValuation {
  product_id: number;
  product_name: string;
  variant_id: number;
  handle: string;
  barcode: Buffer | null;
  barcode_path: string | null;
  quantity: number;
  selling_price: number;
  total_value: number;
}

export interface MovementHistory {
  movement_type: MovementType;
  movement_date: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  notes: string | null;
}
