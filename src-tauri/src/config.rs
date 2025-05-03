use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub db_path: String,
}

impl AppConfig {
    pub fn new() -> Result<Self, String> {
        let cfg =
            envy::from_env::<AppConfig>().map_err(|e| format!("Failed to load config: {}", e))?;

        Ok(cfg)
    }
}
