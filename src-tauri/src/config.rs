// Copyright (c) LichtLabs.
// SPDX-License-Identifier: Apache-2.0

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub db_path: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            db_path: "inventorymgmt.db".to_string(),
        }
    }
}

impl AppConfig {
    pub fn new() -> Self {
        envy::from_env::<AppConfig>().unwrap_or_default()
    }
}
