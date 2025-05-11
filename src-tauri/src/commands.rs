use crate::utils::barcode::{Barcode, BarcodeManager};
use anyhow::Context;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Deserialize, Serialize)]
pub struct GenerateBarcodeData {
    pub file_path: String,
    pub barcode: Barcode,
}

#[tauri::command(async)]
pub async fn generate_barcode(
    product_name: String,
    variant_name: String,
    app_handle: AppHandle,
) -> Result<GenerateBarcodeData, String> {
    let product_name = product_name.trim().to_uppercase();
    let variant_name = variant_name.trim().to_uppercase();

    log::info!(
        "Starting barcode generation for: {} ({})",
        product_name,
        variant_name
    );

    // Create the barcode directories and get the save path
    let save_path = prepare_barcode_path(&app_handle, &product_name, &variant_name)
        .await
        .map_err(|e| e.to_string())?;

    // Create the barcode manager
    let bm = BarcodeManager::new(&product_name, &variant_name).map_err(|e| {
        log::error!("Failed to create barcode manager: {e}");
        e.to_string()
    })?;

    // Generate barcode JSON data
    let barcode = bm.to_json().map_err(|e| {
        log::error!("Failed to convert barcode to JSON: {e}");
        e.to_string()
    })?;

    // Prepare response data
    let data = GenerateBarcodeData {
        file_path: save_path.to_str().unwrap_or_default().to_string(),
        barcode,
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

    log::info!("Barcode generation process completed for: {product_name}");
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
