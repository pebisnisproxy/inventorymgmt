mod config;

use tauri_plugin_sql::Migration;

pub struct AppState {}
impl AppState {
    fn new() -> Self {
        AppState {}
    }
}

#[tauri::command(async)]
async fn example_command() {
    println!("I was invoked from JavaScript!");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenv::dotenv().ok();

    let cfg = config::AppConfig::new().expect("Failed to load config");

    let migrations: Vec<Migration> = vec![];
    let sql_plugin = tauri_plugin_sql::Builder::new()
        .add_migrations(&cfg.db_path, migrations)
        .build();

    tauri::Builder::default()
        .plugin(sql_plugin)
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            app.manage(AppState::new());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![example_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
