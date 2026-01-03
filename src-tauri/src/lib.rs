use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::SystemTime;
use tauri::{Manager, State};

struct AppState {
    current_file: Mutex<Option<PathBuf>>,
    last_modified: Mutex<Option<SystemTime>>,
}

fn get_file_mtime(path: &str) -> Option<SystemTime> {
    fs::metadata(path).ok()?.modified().ok()
}

#[tauri::command]
fn read_file(path: String, state: State<AppState>) -> Result<String, String> {
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;

    // Store the file path and modification time
    if let Ok(mut current) = state.current_file.lock() {
        *current = Some(PathBuf::from(&path));
    }
    if let Ok(mut mtime) = state.last_modified.lock() {
        *mtime = get_file_mtime(&path);
    }

    Ok(content)
}

#[tauri::command]
fn check_file_changed(state: State<AppState>) -> bool {
    let current_file = state.current_file.lock().ok();
    let last_modified = state.last_modified.lock().ok();

    match (current_file, last_modified) {
        (Some(file_guard), Some(mtime_guard)) => {
            if let (Some(path), Some(stored_mtime)) = (file_guard.as_ref(), mtime_guard.as_ref()) {
                if let Some(current_mtime) = get_file_mtime(&path.to_string_lossy()) {
                    return current_mtime != *stored_mtime;
                }
            }
            false
        }
        _ => false,
    }
}

#[tauri::command]
fn dismiss_file_change(state: State<AppState>) {
    // Update stored timestamp to current, so we don't ask again
    if let (Ok(file_guard), Ok(mut mtime_guard)) = (state.current_file.lock(), state.last_modified.lock()) {
        if let Some(path) = file_guard.as_ref() {
            *mtime_guard = get_file_mtime(&path.to_string_lossy());
        }
    }
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
            last_modified: Mutex::new(None),
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
        .invoke_handler(tauri::generate_handler![read_file, get_initial_file, open_file_dialog, check_file_changed, dismiss_file_change])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
