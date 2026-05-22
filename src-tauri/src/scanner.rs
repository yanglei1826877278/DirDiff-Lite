use crate::hash::compute_file_hash;
use crate::models::{CompareMode, CompareOptions, FileInfo};
use std::{
    collections::{BTreeMap, HashSet},
    fs,
    path::{Path, PathBuf},
    time::UNIX_EPOCH,
};
use walkdir::{DirEntry, WalkDir};

pub fn collect_candidate_files(root: &Path, options: &CompareOptions) -> Result<Vec<PathBuf>, String> {
    if !root.exists() {
        return Err(format!("目录不存在: {}", root.display()));
    }

    if !root.is_dir() {
        return Err(format!("路径不是文件夹: {}", root.display()));
    }

    let include_exts = normalize_extensions(&options.include_exts);
    let ignore_dirs = normalize_dir_names(&options.ignore_dirs);
    let mut files = Vec::new();

    for entry in WalkDir::new(root)
        .into_iter()
        .filter_entry(|entry| should_visit(entry, &ignore_dirs))
    {
        let entry = entry.map_err(|error| format!("扫描目录 {} 失败: {}", root.display(), error))?;

        if !entry.file_type().is_file() {
            continue;
        }

        let absolute_path = entry.path().to_path_buf();
        let ext = normalize_extension(
            absolute_path
                .extension()
                .and_then(|value| value.to_str())
                .unwrap_or_default(),
        );

        if !include_exts.is_empty() && !include_exts.contains(&ext) {
            continue;
        }

        files.push(absolute_path);
    }

    Ok(files)
}

pub fn build_file_map<F>(
    root: &Path,
    files: &[PathBuf],
    options: &CompareOptions,
    mut on_progress: F,
) -> Result<BTreeMap<String, FileInfo>, String>
where
    F: FnMut(usize, usize),
{
    let should_hash = matches!(options.compare_mode, CompareMode::Hash);
    let total = files.len();
    let mut result = BTreeMap::new();

    for (index, absolute_path) in files.iter().enumerate() {
        let metadata = fs::metadata(absolute_path)
            .map_err(|error| format!("读取文件信息失败 {}: {}", absolute_path.display(), error))?;
        let ext = normalize_extension(
            absolute_path
                .extension()
                .and_then(|value| value.to_str())
                .unwrap_or_default(),
        );

        let relative_path = normalize_relative_path(
            absolute_path
                .strip_prefix(root)
                .map_err(|error| format!("生成相对路径失败 {}: {}", absolute_path.display(), error))?,
        );

        let modified_time = metadata
            .modified()
            .ok()
            .and_then(|timestamp| timestamp.duration_since(UNIX_EPOCH).ok())
            .map(|duration| duration.as_secs());

        let hash = if should_hash {
            Some(compute_file_hash(absolute_path)?)
        } else {
            None
        };

        result.insert(
            relative_path.clone(),
            FileInfo {
                relative_path,
                absolute_path: absolute_path.to_string_lossy().into_owned(),
                ext,
                size: metadata.len(),
                modified_time,
                hash,
            },
        );

        on_progress(index + 1, total);
    }

    Ok(result)
}

fn should_visit(entry: &DirEntry, ignore_dirs: &HashSet<String>) -> bool {
    if entry.depth() == 0 {
        return true;
    }

    if entry.file_type().is_dir() {
        let name = entry.file_name().to_string_lossy().to_lowercase();
        return !ignore_dirs.contains(&name);
    }

    true
}

fn normalize_extensions(values: &[String]) -> HashSet<String> {
    values
        .iter()
        .map(|value| normalize_extension(value))
        .filter(|value| !value.is_empty())
        .collect()
}

fn normalize_dir_names(values: &[String]) -> HashSet<String> {
    values
        .iter()
        .map(|value| value.trim().trim_matches(['\\', '/']).to_lowercase())
        .filter(|value| !value.is_empty())
        .collect()
}

fn normalize_extension(value: &str) -> String {
    let trimmed = value.trim().trim_start_matches('.').to_lowercase();

    if trimmed.is_empty() {
        String::new()
    } else {
        format!(".{}", trimmed)
    }
}

fn normalize_relative_path(path: &Path) -> String {
    path.components()
        .map(|component| component.as_os_str().to_string_lossy().into_owned())
        .collect::<Vec<_>>()
        .join("/")
}
