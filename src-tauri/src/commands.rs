use crate::{
    comparator,
    config,
    models::{AppConfig, CompareOptions, CompareResult, ExportReportRequest},
    report,
    scanner,
};
use std::path::Path;
use tauri::AppHandle;

#[tauri::command]
pub fn compare_folders(options: CompareOptions) -> Result<CompareResult, String> {
    let old_root = Path::new(&options.old_dir);
    let new_root = Path::new(&options.new_dir);
    let old_files = scanner::scan_directory(old_root, &options)?;
    let new_files = scanner::scan_directory(new_root, &options)?;
    Ok(comparator::compare_maps(&old_files, &new_files, &options))
}

#[tauri::command]
pub fn export_txt_report(request: ExportReportRequest) -> Result<(), String> {
    report::export_report(&request)
}

#[tauri::command]
pub fn load_config(app: AppHandle) -> Result<AppConfig, String> {
    config::load_config(&app)
}

#[tauri::command]
pub fn save_config(app: AppHandle, config: AppConfig) -> Result<(), String> {
    config::save_config(&app, &config)
}
