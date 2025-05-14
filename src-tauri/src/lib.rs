// Copyright (c) LichtLabs.
// SPDX-License-Identifier: Apache-2.0

mod commands;
mod config;
pub mod utils;

use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

pub const BASE_FONT: &[u8] = include_bytes!("../fonts/SF-Pro-Display-Regular.otf");

#[derive(Debug, Clone)]
pub struct AppState {
    pub db_path: String,
}

impl AppState {
    fn new(app: &tauri::App, config: &config::AppConfig) -> Self {
        let db_path = config.db_path.split(':').nth(1).unwrap_or_default();
        log::info!("Database path: {}", db_path);

        AppState {
            db_path: app
                .path()
                .data_dir()
                .unwrap()
                .join(db_path)
                .to_string_lossy()
                .to_string(),
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenv::dotenv().ok();
    let cfg = config::AppConfig::new();
    let cfg_clone = cfg.clone();

    let sql_plugin = tauri_plugin_sql::Builder::new()
        .add_migrations(
            "sqlite:inventorymgmt.db",
            vec![Migration {
                kind: MigrationKind::Up,
                description: "Initialize database schema",
                sql: include_str!("../migrations/init-schema.sql"),
                version: 1,
            }],
        )
        .build();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(sql_plugin)
        .setup(|app| {
            let cfg = cfg_clone;

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let state = AppState::new(&app, &cfg);
            app.manage(state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::generate_barcode])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
