use std::{fs::File, io::Read, path::Path};

pub fn compute_file_hash(path: &Path) -> Result<String, String> {
    let mut file =
        File::open(path).map_err(|error| format!("无法打开文件 {}: {}", path.display(), error))?;
    let mut hasher = blake3::Hasher::new();
    let mut buffer = [0_u8; 8192];

    loop {
        let bytes_read = file
            .read(&mut buffer)
            .map_err(|error| format!("读取文件 {} 失败: {}", path.display(), error))?;

        if bytes_read == 0 {
            break;
        }

        hasher.update(&buffer[..bytes_read]);
    }

    Ok(hasher.finalize().to_hex().to_string())
}
