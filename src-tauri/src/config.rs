use crate::models::AppConfig;
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

const CONFIG_FILE_NAME: &str = "settings.json";

pub fn load_config(app: &AppHandle) -> Result<AppConfig, String> {
    let path = config_path(app)?;

    if !path.exists() {
        return Ok(AppConfig::default());
    }

    let content =
        fs::read_to_string(&path).map_err(|error| format!("读取配置失败 {}: {}", path.display(), error))?;

    serde_json::from_str(&content)
        .map_err(|error| format!("解析配置失败 {}: {}", path.display(), error))
}

pub fn save_config(app: &AppHandle, config: &AppConfig) -> Result<(), String> {
    let path = config_path(app)?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("创建配置目录失败 {}: {}", parent.display(), error))?;
    }

    let content = serde_json::to_string_pretty(config)
        .map_err(|error| format!("序列化配置失败: {}", error))?;

    fs::write(&path, content).map_err(|error| format!("写入配置失败 {}: {}", path.display(), error))
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("获取配置目录失败: {}", error))?;

    Ok(config_dir.join(CONFIG_FILE_NAME))
}
