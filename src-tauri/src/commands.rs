// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: Apache-2.0

use crate::utils::barcode::{Barcode, BarcodeManager};
use anyhow::Context;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Deserialize, Serialize)]
pub struct GenerateBarcodeData {
    pub file_path: String,
    pub barcode: Barcode,
    pub barcode_code: String,
}

/// Sanitizes a string for safe use in file paths
fn sanitize_for_path(input: &str) -> String {
    if input.is_empty() {
        return String::new();
    }

    // Initialize these regexes only once if this function is called frequently
    let unsafe_chars = Regex::new(r#"[/\\?%*:|"<>.,;=]"#).unwrap();
    let spaces = Regex::new(r"\s+").unwrap();
    let multiple_hyphens = Regex::new(r"-+").unwrap();
    let multiple_underscores = Regex::new(r"_+").unwrap();

    // Replace problematic characters
    let sanitized = unsafe_chars.replace_all(input.trim(), "-");
    let sanitized = spaces.replace_all(&sanitized, "_");
    let sanitized = multiple_hyphens.replace_all(&sanitized, "-");
    let sanitized = multiple_underscores.replace_all(&sanitized, "_");

    sanitized.to_uppercase().to_string()
}

/// Creates a barcode-safe string by removing spaces and ensuring it's a single word
fn sanitize_for_barcode(input: &str) -> String {
    // Remove spaces completely for a single word, and convert to uppercase
    input.trim().replace(' ', "").to_uppercase()
}

#[tauri::command(async)]
pub async fn generate_barcode(
    product_name: String,
    variant_name: String,
    app_handle: AppHandle,
) -> Result<GenerateBarcodeData, String> {
    // Sanitize the product and variant names for path safety but keep originals for barcode
    let sanitized_product_name = sanitize_for_path(&product_name);
    let sanitized_variant_name = sanitize_for_path(&variant_name);

    // Use sanitized versions specifically formatted for barcodes
    let product_name_for_barcode = sanitize_for_barcode(&product_name);
    let variant_name_for_barcode = sanitize_for_barcode(&variant_name);

    log::info!(
        "Starting barcode generation for: {} ({})",
        product_name_for_barcode,
        variant_name_for_barcode
    );

    // Create the barcode directories with sanitized names
    let save_path = prepare_barcode_path(
        &app_handle,
        &sanitized_product_name,
        &sanitized_variant_name,
    )
    .await
    .map_err(|e| e.to_string())?;

    // Create the barcode manager with barcode-safe names
    let bm =
        BarcodeManager::new(&product_name_for_barcode, &variant_name_for_barcode).map_err(|e| {
            log::error!("Failed to create barcode manager: {e}");
            e.to_string()
        })?;

    // Generate barcode JSON data
    let barcode = bm.to_json().map_err(|e| {
        log::error!("Failed to convert barcode to JSON: {e}");
        e.to_string()
    })?;

    // Create the barcode code string (what will be used for scanning)
    let barcode_code = format!("{}-{}", product_name_for_barcode, variant_name_for_barcode);

    // Prepare response data
    let data = GenerateBarcodeData {
        file_path: save_path.to_str().unwrap_or_default().to_string(),
        barcode,
        barcode_code,
    };

    log::debug!("Generated barcode data: {data:?}");

    // Save the barcode PNG in a blocking task
    let save_path_str = save_path.to_str().unwrap_or_default().to_string();
    tokio::task::spawn_blocking(move || {
        if let Err(e) = bm.save_as_png(&save_path_str) {
            log::error!("Failed to save barcode PNG: {e}");
            // We don't return the error because the task is already spawned
            // and the main function has already prepared the response
        } else {
            log::info!("Successfully saved barcode PNG at: {save_path_str}");
        }
    });

    log::info!(
        "Barcode generation process completed for: {}",
        product_name_for_barcode
    );
    Ok(data)
}

/// Prepares the directory structure and returns the save path for the barcode
async fn prepare_barcode_path(
    app_handle: &AppHandle,
    name: &str,
    handle: &str,
) -> anyhow::Result<PathBuf> {
    let base_dir = app_handle
        .path()
        .data_dir()
        .context("Failed to get data directory")?
        .join("org.lichtlabs.inventorymgmt")
        .join("barcodes");

    // Create path structure: /name/handle/barcode.png
    let save_dir = base_dir.join(name).join(handle);

    // Create directories if they don't exist
    if !save_dir.exists() {
        tokio::fs::create_dir_all(&save_dir)
            .await
            .context("Failed to create barcode directories")?;
        log::debug!("Created barcode directory: {save_dir:?}");
    }

    let save_path = save_dir.join("barcode.png");
    log::debug!("Barcode save path: {save_path:?}");

    Ok(save_path)
}
