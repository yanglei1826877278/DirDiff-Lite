use crate::models::{CompareMode, CompareOptions, CompareResult, DiffFile, DiffStatus, FileInfo};
use std::collections::{BTreeMap, BTreeSet};

pub fn compare_maps(
    old_files: &BTreeMap<String, FileInfo>,
    new_files: &BTreeMap<String, FileInfo>,
    options: &CompareOptions,
) -> CompareResult {
    let mut result = CompareResult::default();
    let keys: BTreeSet<String> = old_files
        .keys()
        .chain(new_files.keys())
        .cloned()
        .collect();

    for path in keys {
        match (old_files.get(&path), new_files.get(&path)) {
            (None, Some(new_file)) => result.added.push(DiffFile {
                path,
                ext: new_file.ext.clone(),
                absolute_path: Some(new_file.absolute_path.clone()),
                old_size: None,
                new_size: Some(new_file.size),
                status: DiffStatus::Added,
            }),
            (Some(old_file), None) => result.deleted.push(DiffFile {
                path,
                ext: old_file.ext.clone(),
                absolute_path: Some(old_file.absolute_path.clone()),
                old_size: Some(old_file.size),
                new_size: None,
                status: DiffStatus::Deleted,
            }),
            (Some(old_file), Some(new_file)) => {
                if is_modified(old_file, new_file, &options.compare_mode) {
                    result.modified.push(DiffFile {
                        path,
                        ext: new_file.ext.clone(),
                        absolute_path: Some(new_file.absolute_path.clone()),
                        old_size: Some(old_file.size),
                        new_size: Some(new_file.size),
                        status: DiffStatus::Modified,
                    });
                } else {
                    result.unchanged_count += 1;
                }
            }
            (None, None) => {}
        }
    }

    result
}

fn is_modified(old_file: &FileInfo, new_file: &FileInfo, compare_mode: &CompareMode) -> bool {
    match compare_mode {
        CompareMode::Fast => {
            old_file.size != new_file.size || old_file.modified_time != new_file.modified_time
        }
        CompareMode::Hash => old_file.hash != new_file.hash,
    }
}
