use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum DiffStatus {
    Added,
    Deleted,
    Modified,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffFile {
    pub path: String,
    pub ext: String,
    pub absolute_path: Option<String>,
    pub old_size: Option<u64>,
    pub new_size: Option<u64>,
    pub status: DiffStatus,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompareResult {
    pub added: Vec<DiffFile>,
    pub deleted: Vec<DiffFile>,
    pub modified: Vec<DiffFile>,
    pub unchanged_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CompareMode {
    Fast,
    Hash,
}

impl Default for CompareMode {
    fn default() -> Self {
        Self::Hash
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompareOptions {
    pub old_dir: String,
    pub new_dir: String,
    pub include_exts: Vec<String>,
    pub ignore_dirs: Vec<String>,
    pub compare_mode: CompareMode,
    pub show_unchanged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub relative_path: String,
    pub absolute_path: String,
    pub ext: String,
    pub size: u64,
    pub modified_time: Option<u64>,
    pub hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub default_include_exts: Vec<String>,
    pub default_ignore_dirs: Vec<String>,
    pub default_compare_mode: CompareMode,
    pub default_export_file_name: String,
    pub recent_comparisons: Vec<RecentComparison>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            default_include_exts: vec![
                ".java".into(),
                ".jsp".into(),
                ".html".into(),
                ".css".into(),
                ".js".into(),
                ".xml".into(),
                ".sql".into(),
                ".properties".into(),
            ],
            default_ignore_dirs: vec![
                ".git".into(),
                "target".into(),
                "node_modules".into(),
                "dist".into(),
                "build".into(),
                "out".into(),
                "bin".into(),
                ".idea".into(),
                ".vscode".into(),
            ],
            default_compare_mode: CompareMode::Hash,
            default_export_file_name: "dirdiff-report.txt".into(),
            recent_comparisons: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportReportRequest {
    pub path: String,
    pub old_dir: String,
    pub new_dir: String,
    pub result: CompareResult,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompareProgress {
    pub stage: String,
    pub current: usize,
    pub total: usize,
    pub percent: u8,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentComparison {
    pub old_dir: String,
    pub new_dir: String,
    pub compare_mode: CompareMode,
    pub include_exts: Vec<String>,
    pub ignore_dirs: Vec<String>,
    pub compared_at: String,
}
