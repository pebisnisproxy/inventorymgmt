use crate::utils::barcode::{Barcode, BarcodeManager};
use serde::{Deserialize, Serialize};
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
    let formatted = format!("{}-{}", product_name, variant_name);

    log::info!("Starting generate_barcode for product: {}", formatted);

    let dir = app_handle
        .path()
        .data_dir()
        .map_err(|err| {
            log::error!("Failed to get data directory: {}", err);
            err.to_string()
        })?
        .join("org.lichtlabs.inventorymgmt")
        .join("barcodes");

    // create dir if not exists
    if !dir.exists() {
        tokio::fs::create_dir_all(dir.clone())
            .await
            .map_err(|err| {
                log::error!("Failed to create data directory: {}", err);
                err.to_string()
            })?;
    }

    log::debug!("Data directory: {:?}", &dir);
    let save_path = dir
        .join(product_name.clone())
        .join(variant_name.clone())
        // TODO: handle this svg extension
        .join("barcode.svg");

    log::debug!("Save path: {:?}", save_path);

    log::info!("Creating barcode manager for product: {}", formatted);
    let bm = BarcodeManager::new(&formatted).map_err(|err| {
        log::error!("Failed to create BarcodeManager: {}", err);
        err.to_string()
    })?;

    log::debug!("Converting barcode to JSON");
    let barcode = bm.to_json().map_err(|err| {
        log::error!("Failed to convert barcode to JSON: {}", err);
        err.to_string()
    })?;

    let data = GenerateBarcodeData {
        file_path: save_path.to_str().unwrap().to_string(),
        barcode,
    };

    log::info!("Successfully generated barcode for product: {}", formatted);
    log::debug!("Generated barcode data: {:?}", data);

    bm.save_as_svg(&save_path.to_str().unwrap().to_string())
        .await
        .map_err(|err| {
            log::error!("Failed to save barcode as SVG: {}", err);
            err.to_string()
        })?;

    Ok(data)
}
