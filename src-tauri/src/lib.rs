use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Manager, State};

struct AppState {
    current_file: Mutex<Option<PathBuf>>,
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
fn get_initial_file(state: State<AppState>) -> Option<String> {
    state
        .current_file
        .lock()
        .ok()
        .and_then(|guard| guard.as_ref().map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
fn open_file_dialog() -> Result<Option<String>, String> {
    use rfd::FileDialog;

    let file = FileDialog::new()
        .add_filter("Markdown", &["md", "markdown"])
        .add_filter("All Files", &["*"])
        .pick_file();

    Ok(file.map(|p| p.to_string_lossy().to_string()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            current_file: Mutex::new(None),
        })
        .setup(|app| {
            // Get CLI arguments (file passed via double-click or command line)
            let args: Vec<String> = std::env::args().collect();

            if args.len() > 1 {
                let file_path = PathBuf::from(&args[1]);
                if file_path.exists() && file_path.extension().map_or(false, |ext| {
                    ext == "md" || ext == "markdown"
                }) {
                    let state = app.state::<AppState>();
                    *state.current_file.lock().unwrap() = Some(file_path);
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![read_file, get_initial_file, open_file_dialog])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
