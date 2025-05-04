use crate::utils::barcode::{Barcode, BarcodeManager};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Deserialize, Serialize)]
pub struct GenerateBarcodeData {
    pub file_path: String,
    pub barcode: Barcode,
}

#[tauri::command(async)]
pub async fn generate_barcode(product_name: String, app_handle: AppHandle) -> Result<GenerateBarcodeData, String> {
    let dir = app_handle.path().data_dir().map_err(|err| err.to_string())?;
    let save_path = dir.join(product_name.clone());

    let bm = BarcodeManager::new(&product_name).map_err(|err| err.to_string())?;
    let barcode = bm.to_json().map_err(|err| err.to_string())?;

    let data = GenerateBarcodeData {
        file_path: save_path.to_str().unwrap().to_string(),
        barcode
    };

    Ok(data)
}