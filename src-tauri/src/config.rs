use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub db_path: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            db_path: "inventory-dev2.db".to_string(),
        }
    }
}

impl AppConfig {
    pub fn new() -> Self {
        envy::from_env::<AppConfig>().unwrap_or_default()
    }
}
