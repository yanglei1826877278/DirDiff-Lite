export type PageId = "compare" | "result" | "settings" | "about";
export type CompareMode = "fast" | "hash";
export type DiffStatus = "added" | "deleted" | "modified";
export type ResultFilter = "all" | DiffStatus;
export type BannerTone = "info" | "success" | "error";
export type ResultSort = "path-asc" | "path-desc" | "status" | "ext";
export type FolderDropTarget = "oldDir" | "newDir" | null;

export interface DiffFile {
  path: string;
  ext: string;
  oldSize?: number | null;
  newSize?: number | null;
  status: DiffStatus;
}

export interface DiffResult {
  added: DiffFile[];
  deleted: DiffFile[];
  modified: DiffFile[];
  unchangedCount: number;
}

export interface CompareOptions {
  oldDir: string;
  newDir: string;
  includeExts: string[];
  ignoreDirs: string[];
  compareMode: CompareMode;
  showUnchanged: boolean;
}

export interface AppConfig {
  defaultIncludeExts: string[];
  defaultIgnoreDirs: string[];
  defaultCompareMode: CompareMode;
  defaultExportFileName: string;
}

export interface Preset {
  id: string;
  label: string;
  summary: string;
  description: string;
  includeExts: string[];
  ignoreDirs?: string[];
}

export interface CompareForm {
  oldDir: string;
  newDir: string;
  includeExtInput: string;
  ignoreDirInput: string;
  compareMode: CompareMode;
}

export interface SettingsDraft {
  includeExtInput: string;
  ignoreDirInput: string;
  compareMode: CompareMode;
  exportFileName: string;
}

export interface ExportReportRequest {
  path: string;
  oldDir: string;
  newDir: string;
  result: DiffResult;
}

export interface BannerState {
  tone: BannerTone;
  text: string;
}
