use crate::{
    comparator,
    config,
    models::{AppConfig, CompareOptions, CompareProgress, CompareResult, ExportReportRequest},
    report,
    scanner,
};
use std::path::Path;
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub async fn compare_folders(app: AppHandle, options: CompareOptions) -> Result<CompareResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let old_root = Path::new(&options.old_dir);
        let new_root = Path::new(&options.new_dir);

        emit_progress(&app, "preparing", 0, 0, "正在收集旧目录文件…");
        let old_candidates = scanner::collect_candidate_files(old_root, &options)?;

        emit_progress(
            &app,
            "scanning_old",
            0,
            old_candidates.len(),
            &format!("正在扫描旧目录，共 {} 个文件…", old_candidates.len()),
        );
        let old_files = scanner::build_file_map(old_root, &old_candidates, &options, |current, total| {
            emit_progress(&app, "scanning_old", current, total, "正在扫描旧目录…");
        })?;

        emit_progress(&app, "preparing", 0, 0, "正在收集新目录文件…");
        let new_candidates = scanner::collect_candidate_files(new_root, &options)?;

        emit_progress(
            &app,
            "scanning_new",
            0,
            new_candidates.len(),
            &format!("正在扫描新目录，共 {} 个文件…", new_candidates.len()),
        );
        let new_files = scanner::build_file_map(new_root, &new_candidates, &options, |current, total| {
            emit_progress(&app, "scanning_new", current, total, "正在扫描新目录…");
        })?;

        emit_progress(&app, "comparing", 0, 0, "正在比对文件差异…");
        let result = comparator::compare_maps(&old_files, &new_files, &options, |current, total| {
            emit_progress(&app, "comparing", current, total, "正在整理比较结果…");
        });

        emit_progress(&app, "finished", 1, 1, "比较完成。");
        Ok(result)
    })
    .await
    .map_err(|error| format!("比较任务执行失败: {}", error))?
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

fn emit_progress(app: &AppHandle, stage: &str, current: usize, total: usize, message: &str) {
    let percent = if total == 0 {
        0
    } else {
        ((current as f64 / total as f64) * 100.0).round() as u8
    };

    let payload = CompareProgress {
        stage: stage.to_string(),
        current,
        total,
        percent,
        message: message.to_string(),
    };

    let _ = app.emit("compare-progress", payload);
}
