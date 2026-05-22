use crate::models::{DiffFile, ExportReportRequest};
use std::{fmt::Write, fs, path::Path};

pub fn export_report(request: &ExportReportRequest) -> Result<(), String> {
    let path = Path::new(&request.path);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("创建报告目录失败 {}: {}", parent.display(), error))?;
    }

    fs::write(path, build_report(request))
        .map_err(|error| format!("写入报告失败 {}: {}", path.display(), error))
}

fn build_report(request: &ExportReportRequest) -> String {
    let mut output = String::new();
    let _ = writeln!(output, "DirDiff Lite Report");
    let _ = writeln!(output);
    let _ = writeln!(output, "Old Folder:");
    let _ = writeln!(output, "{}", request.old_dir);
    let _ = writeln!(output);
    let _ = writeln!(output, "New Folder:");
    let _ = writeln!(output, "{}", request.new_dir);
    let _ = writeln!(output);
    let _ = writeln!(output, "Summary:");
    let _ = writeln!(output, "Added: {}", request.result.added.len());
    let _ = writeln!(output, "Deleted: {}", request.result.deleted.len());
    let _ = writeln!(output, "Modified: {}", request.result.modified.len());
    let _ = writeln!(output, "Unchanged: {}", request.result.unchanged_count);
    let _ = writeln!(output);
    write_section(&mut output, "Added", &request.result.added);
    write_section(&mut output, "Deleted", &request.result.deleted);
    write_section(&mut output, "Modified", &request.result.modified);
    output
}

fn write_section(output: &mut String, title: &str, files: &[DiffFile]) {
    let _ = writeln!(output, "[{}]", title);

    if files.is_empty() {
        let _ = writeln!(output, "(none)");
    } else {
        for file in files {
            let _ = writeln!(output, "{}", file.path);
        }
    }

    let _ = writeln!(output);
}
