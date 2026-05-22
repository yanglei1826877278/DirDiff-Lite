#[cfg(target_os = "windows")]
use clipboard_win::{formats, raw, register_format, Clipboard, Setter};
use std::path::{Path, PathBuf};

const PREFERRED_DROP_EFFECT: &str = "Preferred DropEffect";

#[cfg(target_os = "windows")]
const DROPEFFECT_COPY: u32 = 1;

pub fn copy_file_to_clipboard(path: &str) -> Result<(), String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err("文件路径不能为空。".into());
    }

    let file_path = Path::new(trimmed);
    if !file_path.exists() {
        return Err("文件不存在，无法复制到剪贴板。".into());
    }

    if !file_path.is_file() {
        return Err("当前仅支持直接复制单个文件。".into());
    }

    let absolute_path = resolve_absolute_path(file_path)?;

    #[cfg(target_os = "windows")]
    {
        copy_file_windows(&absolute_path)
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = absolute_path;
        Err("当前平台暂不支持直接复制文件。".into())
    }
}

fn resolve_absolute_path(path: &Path) -> Result<PathBuf, String> {
    if path.is_absolute() {
        return Ok(path.to_path_buf());
    }

    std::env::current_dir()
        .map(|current_dir| current_dir.join(path))
        .map_err(|error| format!("读取当前工作目录失败：{error}"))
}

#[cfg(target_os = "windows")]
fn copy_file_windows(path: &Path) -> Result<(), String> {
    let path_string = path.to_string_lossy().into_owned();
    let preferred_drop_effect = register_format(PREFERRED_DROP_EFFECT)
        .ok_or_else(|| "注册 Windows 剪贴板文件格式失败。".to_string())?;
    let _clipboard = Clipboard::new_attempts(10).map_err(format_clipboard_error)?;

    raw::empty().map_err(format_clipboard_error)?;
    formats::FileList
        .write_clipboard(&[path_string.as_str()])
        .map_err(format_clipboard_error)?;
    raw::set_without_clear(preferred_drop_effect.get(), &DROPEFFECT_COPY.to_le_bytes())
        .map_err(format_clipboard_error)?;

    Ok(())
}

#[cfg(target_os = "windows")]
fn format_clipboard_error(error: clipboard_win::ErrorCode) -> String {
    format!("写入系统剪贴板失败：{error}")
}
