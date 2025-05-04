use anyhow::Result;
use barcoders::generators::svg::*;
use barcoders::generators::image::*;
use barcoders::generators::json::*;
use barcoders::sym::code39::Code39;
use serde::{Deserialize, Serialize};
use tokio::fs::File;
use tokio::io::{AsyncWriteExt, BufWriter};

#[derive(Debug, Serialize, Deserialize)]
pub struct Barcode {
    pub height: u32,    // Changed from u8 to u32 for larger height values
    pub xdim: u32,      // Changed from u8 to u32
    pub encoding: Vec<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BarcodeManager {
    pub encoded: Vec<u8>,
}

impl BarcodeManager {
    pub fn new(product_name: &str) -> Result<Self> {
        let barcode = Code39::new(product_name)?;
        let encoded = barcode.encode();
        Ok(Self { encoded })
    }

    pub fn to_json(&self) -> anyhow::Result<Barcode> {
        let json_gen = JSON::new();
        let json: Barcode = serde_json::from_str(&json_gen.generate(&self.encoded[..])?)?;
        Ok(json)
    }

    pub async fn save_as_svg(&self, path: &str) -> Result<()> {
        // Create SVG generator with height parameter
        let svg = SVG::new(44);

        // Generate SVG data
        let data = svg.generate(&self.encoded)?;

        // Create file and write SVG data
        let file = File::create(path).await?;
        let mut writer = BufWriter::new(file);
        writer.write_all(data.as_bytes()).await?;
        writer.flush().await?;

        Ok(())
    }

    pub async fn save_as_png(&self, path: &str) -> Result<()> {
        // Create PNG generator with height parameter
        let png = Image::png(44);

        // Generate PNG data
        let data = png.generate(&self.encoded)?;

        // Create file and write PNG data
        let file = File::create(path).await?;
        let mut writer = BufWriter::new(file);
        writer.write_all(&data[..]).await?;
        writer.flush().await?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_barcode_save_as_svg() {
        let bm = BarcodeManager::new("PRODUCTONE").unwrap();
        bm.save_as_svg("test.svg").await.unwrap();
    }

    #[tokio::test]
    async fn test_barcode_save_as_png() {
        let bm = BarcodeManager::new("PRODUCTONE").unwrap();
        bm.save_as_png("test.png").await.unwrap();
    }

    #[test]
    fn test_barcode_to_json() {
        let bm = BarcodeManager::new("PRODUCTONE").unwrap();
        assert!(bm.to_json().is_ok());
    }
}