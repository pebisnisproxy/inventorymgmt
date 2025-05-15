// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: Apache-2.0

use anyhow::{Context, Result};
use barcoders::generators::image::*;
use barcoders::generators::json::*;
use barcoders::generators::svg::*;
use barcoders::sym::code39::Code39;
use image::{ImageBuffer, Rgb, RgbImage};
use imageproc::drawing::text_size;
use log::{debug, info};
use serde::{Deserialize, Serialize};
use tokio::fs::File;
use tokio::io::{AsyncWriteExt, BufWriter};

use crate::BASE_FONT;

/// The default barcode height in pixels
const DEFAULT_BARCODE_HEIGHT: u32 = 44;
/// Default padding in pixels
const DEFAULT_PADDING: u32 = 4;
/// Default font size
const DEFAULT_FONT_SIZE: f32 = 22.0;
/// Text padding below barcode
const TEXT_PADDING: u32 = 10;

#[derive(Debug, Serialize, Deserialize)]
pub struct Barcode {
    pub height: u32,
    pub xdim: u32,
    pub encoding: Vec<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BarcodeManager {
    pub product_name: String,
    pub product_handle: String,
    pub encoded: Vec<u8>,
}

impl BarcodeManager {
    /// Create a new BarcodeManager instance for the given product name
    pub fn new(product_name: &str, product_handle: &str) -> Result<Self> {
        let formatted_name = format!("{}-{}", product_name, product_handle);
        let barcode = Code39::new(formatted_name).context("Failed to create Code39 barcode")?;
        let encoded = barcode.encode();
        Ok(Self {
            product_name: product_name.to_string(),
            product_handle: product_handle.to_string(),
            encoded,
        })
    }

    /// Convert the barcode to JSON format
    pub fn to_json(&self) -> Result<Barcode> {
        let json_gen = JSON::new();
        let json_str = json_gen
            .generate(&self.encoded[..])
            .context("Failed to generate JSON from barcode")?;
        let json: Barcode =
            serde_json::from_str(&json_str).context("Failed to parse JSON into Barcode struct")?;
        Ok(json)
    }

    /// Save the barcode as an SVG file
    pub async fn save_as_svg(&self, path: &str) -> Result<()> {
        info!("Saving barcode as SVG to: {}", path);

        // Create SVG generator with height parameter
        let svg = SVG::new(DEFAULT_BARCODE_HEIGHT);

        // Generate SVG data
        let data = svg
            .generate(&self.encoded)
            .context("Failed to generate SVG data")?;

        // Create file and write SVG data
        let file = File::create(path)
            .await
            .context("Failed to create SVG file")?;

        let mut writer = BufWriter::new(file);
        writer
            .write_all(data.as_bytes())
            .await
            .context("Failed to write SVG data to file")?;

        writer
            .flush()
            .await
            .context("Failed to flush SVG file buffer")?;

        info!("Successfully saved barcode as SVG");
        Ok(())
    }

    /// Save the barcode as a PNG file with product information text
    pub fn save_as_png(&self, path: &str) -> Result<()> {
        info!("Saving barcode as PNG to: {}", path);

        // Generate barcode image
        let barcode_img = self
            .generate_barcode_image()
            .context("Failed to generate barcode image")?;

        // Load font
        let font = self.load_font().context("Failed to load font")?;

        // Create canvas with proper dimensions
        let (barcode_width, barcode_height) = (barcode_img.width(), barcode_img.height());
        let formatted_text = format!("{} ({})", self.product_name, self.product_handle);

        // Create and prepare the canvas
        let mut canvas = self
            .create_canvas(barcode_width, barcode_height)
            .context("Failed to create image canvas")?;

        // Draw barcode on canvas
        self.draw_barcode(&mut canvas, &barcode_img)
            .context("Failed to draw barcode on canvas")?;

        // Draw text on canvas
        self.draw_text(&mut canvas, &font, &formatted_text, barcode_height)
            .context("Failed to draw text on canvas")?;

        // Save the final image
        canvas
            .save(path)
            .context("Failed to save PNG image to file")?;

        info!("Successfully saved barcode as PNG");
        Ok(())
    }

    /// Save the barcode as a PNG file with SKU on top, barcode in the middle, and product info below
    pub fn save_as_png_with_sku(&self, path: &str, sku: &str) -> Result<()> {
        info!("Saving barcode as PNG with SKU to: {}", path);

        // Generate barcode image
        let barcode_img = self
            .generate_barcode_image()
            .context("Failed to generate barcode image")?;

        // Load font
        let font = self.load_font().context("Failed to load font")?;
        use ab_glyph::{Font, PxScale};
        let scale = PxScale {
            x: DEFAULT_FONT_SIZE,
            y: DEFAULT_FONT_SIZE,
        };

        // Prepare text
        let sku_text = format!("SKU: {}", sku);
        let product_text = format!("{} ({})", self.product_name, self.product_handle);

        // Calculate text heights
        let text_height = DEFAULT_FONT_SIZE as u32 + (DEFAULT_PADDING * 2);
        let (barcode_width, barcode_height) = (barcode_img.width(), barcode_img.height());
        let total_height = text_height + barcode_height + text_height + TEXT_PADDING;

        // Create image with white background
        let mut canvas: RgbImage = ImageBuffer::new(barcode_width, total_height);
        for pixel in canvas.pixels_mut() {
            *pixel = Rgb([255, 255, 255]);
        }

        // --- Draw SKU text at the top, centered ---
        let (sku_text_width, sku_text_height) = text_size(scale, &font, &sku_text);
        let sku_x = ((barcode_width as i32 - sku_text_width as i32) / 2).max(0);
        let sku_y = DEFAULT_PADDING as i32;
        imageproc::drawing::draw_text_mut(
            &mut canvas,
            Rgb([0, 0, 0]),
            sku_x,
            sku_y,
            scale,
            &font,
            &sku_text,
        );

        // --- Draw barcode centered horizontally below SKU text ---
        let barcode_y = text_height;
        let barcode_x = ((barcode_width as i32 - barcode_img.width() as i32) / 2).max(0);
        let mut barcode_canvas = barcode_img.to_rgb8();
        image::imageops::overlay(
            &mut canvas,
            &barcode_canvas,
            barcode_x as i64,
            barcode_y as i64,
        );

        // --- Draw product info text below barcode, centered ---
        let (product_text_width, _product_text_height) = text_size(scale, &font, &product_text);
        let product_x = ((barcode_width as i32 - product_text_width as i32) / 2).max(0);
        let product_y = (barcode_y + barcode_height + TEXT_PADDING) as i32;
        imageproc::drawing::draw_text_mut(
            &mut canvas,
            Rgb([0, 0, 0]),
            product_x,
            product_y,
            scale,
            &font,
            &product_text,
        );

        // Save the final image
        canvas
            .save(path)
            .context("Failed to save PNG image to file")?;

        info!("Successfully saved barcode as PNG with SKU");
        Ok(())
    }

    /// Generate the barcode image from encoded data
    fn generate_barcode_image(&self) -> Result<image::DynamicImage> {
        debug!("Generating barcode image");

        // Create PNG generator
        let png_generator = Image::png(DEFAULT_BARCODE_HEIGHT);

        // Generate PNG data
        let png_data = png_generator
            .generate(&self.encoded)
            .context("Failed to generate PNG data")?;

        // Load the image from memory
        let img = image::load_from_memory(&png_data)
            .context("Failed to load barcode image from memory")?;

        debug!("Generated barcode image: {}x{}", img.width(), img.height());
        Ok(img)
    }

    /// Load the font for text rendering
    fn load_font(&self) -> Result<ab_glyph::FontRef> {
        debug!("Loading font");
        ab_glyph::FontRef::try_from_slice(BASE_FONT).context("Failed to load font from BASE_FONT")
    }

    /// Create a blank canvas for the barcode and text
    fn create_canvas(&self, barcode_width: u32, barcode_height: u32) -> Result<RgbImage> {
        debug!("Creating image canvas");

        // Calculate dimensions - allow more space for larger text
        let text_height = DEFAULT_FONT_SIZE as u32 + (DEFAULT_PADDING * 2);
        let total_height = barcode_height + text_height + TEXT_PADDING;

        debug!("Canvas dimensions: {}x{}", barcode_width, total_height);

        // Create image with white background
        let mut canvas: RgbImage = ImageBuffer::new(barcode_width, total_height);
        for pixel in canvas.pixels_mut() {
            *pixel = Rgb([255, 255, 255]);
        }

        Ok(canvas)
    }

    /// Draw the barcode on the canvas
    fn draw_barcode(&self, canvas: &mut RgbImage, barcode_img: &image::DynamicImage) -> Result<()> {
        debug!("Drawing barcode on canvas");
        let rgb8_img = barcode_img.to_rgb8();
        image::imageops::overlay(canvas, &rgb8_img, 0, 0);
        Ok(())
    }

    /// Draw the product text information below the barcode
    fn draw_text(
        &self,
        canvas: &mut RgbImage,
        font: &ab_glyph::FontRef,
        text: &str,
        y_offset: u32,
    ) -> Result<()> {
        use ab_glyph::PxScale;

        debug!("Drawing text: \"{}\" at y-offset: {}", text, y_offset);

        // Use slightly larger font size for better readability
        let scale = PxScale {
            x: DEFAULT_FONT_SIZE,
            y: DEFAULT_FONT_SIZE,
        };

        // Calculate text width for better centering
        let canvas_width = canvas.width() as f32;

        // Better approximation for text width based on character types
        // This accounts for wider and narrower characters
        let text_width: f32 = text
            .chars()
            .map(|c| {
                if c.is_uppercase() || c == 'W' || c == 'M' {
                    // Wider characters
                    DEFAULT_FONT_SIZE * 0.75
                } else if c.is_lowercase()
                    && (c == 'i' || c == 'l' || c == 'j' || c == 't' || c == 'f')
                {
                    // Narrower characters
                    DEFAULT_FONT_SIZE * 0.4
                } else if c == ' ' {
                    // Space character
                    DEFAULT_FONT_SIZE * 0.3
                } else if c == '(' || c == ')' {
                    // Parentheses
                    DEFAULT_FONT_SIZE * 0.35
                } else {
                    // Standard characters
                    DEFAULT_FONT_SIZE * 0.55
                }
            })
            .sum();

        // Calculate x position to center the text precisely
        let x_position = ((canvas_width - text_width) / 2.0).max(0.0) as i32;

        // Add more vertical space between barcode and text
        let y_position = y_offset as i32 + TEXT_PADDING as i32;

        // Draw text in black color
        imageproc::drawing::draw_text_mut(
            canvas,
            Rgb([0, 0, 0]), // Black text
            x_position,     // Centered X position
            y_position,     // Y position below barcode with padding
            scale,
            font,
            text,
        );

        Ok(())
    }

    /// Draw text at a specific y offset, centered
    fn draw_text_at(
        canvas: &mut RgbImage,
        font: &ab_glyph::FontRef,
        text: &str,
        y_offset: u32,
    ) -> Result<()> {
        use ab_glyph::PxScale;
        let scale = PxScale {
            x: DEFAULT_FONT_SIZE,
            y: DEFAULT_FONT_SIZE,
        };
        let canvas_width = canvas.width() as f32;
        let text_width: f32 = text
            .chars()
            .map(|c| {
                if c.is_uppercase() || c == 'W' || c == 'M' {
                    DEFAULT_FONT_SIZE * 0.75
                } else if c.is_lowercase()
                    && (c == 'i' || c == 'l' || c == 'j' || c == 't' || c == 'f')
                {
                    DEFAULT_FONT_SIZE * 0.4
                } else if c == ' ' {
                    DEFAULT_FONT_SIZE * 0.3
                } else if c == '(' || c == ')' {
                    DEFAULT_FONT_SIZE * 0.35
                } else {
                    DEFAULT_FONT_SIZE * 0.55
                }
            })
            .sum();
        let x_position = ((canvas_width - text_width) / 2.0).max(0.0) as i32;
        let y_position = y_offset as i32;
        imageproc::drawing::draw_text_mut(
            canvas,
            Rgb([0, 0, 0]),
            x_position,
            y_position,
            scale,
            font,
            text,
        );
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_barcode_save_as_svg() {
        let bm = BarcodeManager::new("PRODUCTONE", "XS").unwrap();
        bm.save_as_svg("test.svg").await.unwrap();
    }

    #[tokio::test]
    async fn test_barcode_save_as_png() {
        let bm = BarcodeManager::new("PRODUCTONE", "XS").unwrap();
        let result = tokio::task::spawn_blocking(move || {
            bm.save_as_png("test.png").unwrap();
        })
        .await
        .is_ok();
        assert!(result);
    }

    #[test]
    fn test_barcode_to_json() {
        let bm = BarcodeManager::new("PRODUCTONE", "XS").unwrap();
        assert!(bm.to_json().is_ok());
    }

    #[tokio::test]
    async fn test_barcode_save_as_png_with_sku() {
        let bm = BarcodeManager::new("PRODUCTONE", "XS").unwrap();
        let result = tokio::task::spawn_blocking(move || {
            bm.save_as_png_with_sku("test_with_sku.png", "SKU12345")
                .unwrap();
        })
        .await
        .is_ok();
        assert!(result);
    }
}
