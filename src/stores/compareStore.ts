import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { open, save } from "@tauri-apps/plugin-dialog";
import { computed, reactive } from "vue";
import { PRESETS, compareModeLabel, createDefaultConfig } from "../data/presets";
import type {
  AppConfig,
  BannerState,
  CompareForm,
  CompareOptions,
  DiffFile,
  DiffResult,
  ExportReportRequest,
  PageId,
  ResultFilter,
  SettingsDraft,
} from "../types/diff";

function normalizeExtension(value: string): string {
  const trimmed = value.trim().toLowerCase().replace(/^\.+/, "");
  return trimmed ? `.${trimmed}` : "";
}

function normalizeDirectory(value: string): string {
  return value.trim().replace(/[\\/]+$/, "").toLowerCase();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function parseCsvInput(value: string, mode: "ext" | "dir"): string[] {
  const normalized = value
    .split(",")
    .map((item) => (mode === "ext" ? normalizeExtension(item) : normalizeDirectory(item)))
    .filter(Boolean);

  return unique(normalized);
}

function formatCsvInput(values: string[]): string {
  return values.join(",");
}

function sanitizeConfig(config?: Partial<AppConfig> | null): AppConfig {
  const fallback = createDefaultConfig();

  return {
    defaultIncludeExts: Array.isArray(config?.defaultIncludeExts)
      ? parseCsvInput(config?.defaultIncludeExts.join(",") ?? "", "ext")
      : fallback.defaultIncludeExts,
    defaultIgnoreDirs: Array.isArray(config?.defaultIgnoreDirs)
      ? parseCsvInput(config?.defaultIgnoreDirs.join(",") ?? "", "dir")
      : fallback.defaultIgnoreDirs,
    defaultCompareMode:
      config?.defaultCompareMode === "fast" || config?.defaultCompareMode === "hash"
        ? config.defaultCompareMode
        : fallback.defaultCompareMode,
    defaultExportFileName:
      config?.defaultExportFileName?.trim() || fallback.defaultExportFileName,
  };
}

function createCompareForm(config: AppConfig): CompareForm {
  return {
    oldDir: "",
    newDir: "",
    includeExtInput: formatCsvInput(config.defaultIncludeExts),
    ignoreDirInput: formatCsvInput(config.defaultIgnoreDirs),
    compareMode: config.defaultCompareMode,
  };
}

function createSettingsDraft(config: AppConfig): SettingsDraft {
  return {
    includeExtInput: formatCsvInput(config.defaultIncludeExts),
    ignoreDirInput: formatCsvInput(config.defaultIgnoreDirs),
    compareMode: config.defaultCompareMode,
    exportFileName: config.defaultExportFileName,
  };
}

function sanitizeResult(result?: Partial<DiffResult> | null): DiffResult {
  return {
    added: result?.added ?? [],
    deleted: result?.deleted ?? [],
    modified: result?.modified ?? [],
    unchangedCount: result?.unchangedCount ?? 0,
  };
}

function toErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "发生了未知错误。";
}

const initialConfig = createDefaultConfig();
let bannerTimer: ReturnType<typeof setTimeout> | undefined;

const state = reactive({
  page: "compare" as PageId,
  initialized: false,
  isBooting: false,
  isComparing: false,
  isSavingSettings: false,
  banner: null as BannerState | null,
  config: initialConfig,
  compareForm: createCompareForm(initialConfig),
  settingsDraft: createSettingsDraft(initialConfig),
  activePresetId: PRESETS[0]?.id ?? "java-jsp",
  result: null as DiffResult | null,
  lastCompareOptions: null as CompareOptions | null,
  hasCompared: false,
  resultFilter: "all" as ResultFilter,
  extFilter: "all",
  searchQuery: "",
});

const allChanges = computed<DiffFile[]>(() => {
  if (!state.result) {
    return [];
  }

  return [...state.result.added, ...state.result.deleted, ...state.result.modified].sort(
    (left, right) => left.path.localeCompare(right.path, "zh-CN"),
  );
});

const filteredFiles = computed<DiffFile[]>(() => {
  const search = state.searchQuery.trim().toLowerCase();

  return allChanges.value.filter((file) => {
    const matchesStatus = state.resultFilter === "all" || file.status === state.resultFilter;
    const matchesExt = state.extFilter === "all" || file.ext === state.extFilter;
    const matchesSearch =
      search.length === 0 ||
      file.path.toLowerCase().includes(search) ||
      file.ext.toLowerCase().includes(search);

    return matchesStatus && matchesExt && matchesSearch;
  });
});

const availableExtensions = computed<string[]>(() =>
  unique(
    allChanges.value
      .map((file) => file.ext)
      .filter((ext) => ext && ext.trim().length > 0)
      .sort((left, right) => left.localeCompare(right, "zh-CN")),
  ),
);

const resultCounts = computed(() => ({
  added: state.result?.added.length ?? 0,
  deleted: state.result?.deleted.length ?? 0,
  modified: state.result?.modified.length ?? 0,
  unchanged: state.result?.unchangedCount ?? 0,
  total: allChanges.value.length,
}));

const currentModeLabel = computed(() => compareModeLabel(state.compareForm.compareMode));

function setBanner(tone: BannerState["tone"], text: string, duration = 3600): void {
  state.banner = { tone, text };

  if (bannerTimer) {
    clearTimeout(bannerTimer);
  }

  bannerTimer = setTimeout(() => {
    state.banner = null;
  }, duration);
}

function setPage(page: PageId): void {
  if (page === "result" && !state.hasCompared) {
    state.page = "compare";
    return;
  }

  state.page = page;

  if (page === "settings") {
    state.settingsDraft = createSettingsDraft(state.config);
  }
}

function buildCompareOptions(): CompareOptions {
  return {
    oldDir: state.compareForm.oldDir.trim(),
    newDir: state.compareForm.newDir.trim(),
    includeExts: parseCsvInput(state.compareForm.includeExtInput, "ext"),
    ignoreDirs: parseCsvInput(state.compareForm.ignoreDirInput, "dir"),
    compareMode: state.compareForm.compareMode,
    showUnchanged: false,
  };
}

function buildConfigFromDraft(draft: SettingsDraft): AppConfig {
  return sanitizeConfig({
    defaultIncludeExts: parseCsvInput(draft.includeExtInput, "ext"),
    defaultIgnoreDirs: parseCsvInput(draft.ignoreDirInput, "dir"),
    defaultCompareMode: draft.compareMode,
    defaultExportFileName: draft.exportFileName.trim(),
  });
}

async function initialize(): Promise<void> {
  if (state.initialized) {
    return;
  }

  state.isBooting = true;

  try {
    const loaded = await invoke<AppConfig>("load_config");
    state.config = sanitizeConfig(loaded);
    state.compareForm = createCompareForm(state.config);
    state.settingsDraft = createSettingsDraft(state.config);
  } catch (error) {
    state.config = createDefaultConfig();
    state.compareForm = createCompareForm(state.config);
    state.settingsDraft = createSettingsDraft(state.config);
    setBanner("info", `未读取到本地设置，已使用默认配置。${toErrorMessage(error)}`);
  } finally {
    state.isBooting = false;
    state.initialized = true;
  }
}

function applyPreset(presetId: string): void {
  const preset = PRESETS.find((item) => item.id === presetId);

  if (!preset) {
    return;
  }

  state.activePresetId = presetId;
  state.compareForm.includeExtInput = formatCsvInput(preset.includeExts);
  state.compareForm.ignoreDirInput = formatCsvInput(preset.ignoreDirs ?? state.config.defaultIgnoreDirs);
  setBanner("info", `已应用预设：${preset.label}`);
}

async function pickFolder(target: "oldDir" | "newDir"): Promise<void> {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: state.compareForm[target] || undefined,
    });

    if (typeof selected === "string") {
      state.compareForm[target] = selected;
    }
  } catch (error) {
    setBanner("error", `选择文件夹失败：${toErrorMessage(error)}`);
  }
}

function clearFolder(target: "oldDir" | "newDir"): void {
  state.compareForm[target] = "";
}

function clearCompareForm(): void {
  state.compareForm = {
    ...createCompareForm(state.config),
    oldDir: "",
    newDir: "",
  };
  state.activePresetId = PRESETS[0]?.id ?? state.activePresetId;
  setBanner("info", "已清空本次比较表单。");
}

async function runCompare(): Promise<void> {
  const options = buildCompareOptions();

  if (!options.oldDir || !options.newDir) {
    setBanner("error", "请先选择旧文件夹和新文件夹。");
    return;
  }

  state.isComparing = true;

  try {
    const result = sanitizeResult(await invoke<DiffResult>("compare_folders", { options }));
    state.result = result;
    state.lastCompareOptions = options;
    state.hasCompared = true;
    state.resultFilter = "all";
    state.extFilter = "all";
    state.searchQuery = "";
    state.page = "result";
    const total = result.added.length + result.deleted.length + result.modified.length;
    setBanner("success", `比较完成，共发现 ${total} 个变化文件。`);
  } catch (error) {
    setBanner("error", `比较失败：${toErrorMessage(error)}`);
  } finally {
    state.isComparing = false;
  }
}

async function saveCurrentAsDefault(): Promise<void> {
  const config = buildConfigFromDraft({
    includeExtInput: state.compareForm.includeExtInput,
    ignoreDirInput: state.compareForm.ignoreDirInput,
    compareMode: state.compareForm.compareMode,
    exportFileName: state.config.defaultExportFileName,
  });

  try {
    await invoke("save_config", { config });
    state.config = config;
    state.settingsDraft = createSettingsDraft(config);
    setBanner("success", "当前比较规则已保存为默认配置。");
  } catch (error) {
    setBanner("error", `保存默认配置失败：${toErrorMessage(error)}`);
  }
}

async function saveSettings(): Promise<void> {
  state.isSavingSettings = true;

  try {
    const config = buildConfigFromDraft(state.settingsDraft);
    await invoke("save_config", { config });
    state.config = config;
    state.compareForm = {
      ...state.compareForm,
      includeExtInput: formatCsvInput(config.defaultIncludeExts),
      ignoreDirInput: formatCsvInput(config.defaultIgnoreDirs),
      compareMode: config.defaultCompareMode,
    };
    state.settingsDraft = createSettingsDraft(config);
    setBanner("success", "默认设置已保存到本机。");
  } catch (error) {
    setBanner("error", `保存设置失败：${toErrorMessage(error)}`);
  } finally {
    state.isSavingSettings = false;
  }
}

function resetSettingsDraft(): void {
  state.settingsDraft = createSettingsDraft(createDefaultConfig());
  setBanner("info", "已恢复为内置默认值，记得点保存设置。");
}

async function exportReport(): Promise<void> {
  if (!state.result || !state.lastCompareOptions) {
    setBanner("error", "当前没有可导出的比较结果。");
    return;
  }

  try {
    const selected = await save({
      defaultPath: state.config.defaultExportFileName,
      filters: [{ name: "Text", extensions: ["txt"] }],
    });

    if (!selected || Array.isArray(selected)) {
      return;
    }

    const request: ExportReportRequest = {
      path: selected,
      oldDir: state.lastCompareOptions.oldDir,
      newDir: state.lastCompareOptions.newDir,
      result: state.result,
    };

    await invoke("export_txt_report", { request });
    setBanner("success", "TXT 报告已导出。");
  } catch (error) {
    setBanner("error", `导出报告失败：${toErrorMessage(error)}`);
  }
}

async function copyPath(path: string): Promise<void> {
  try {
    await writeText(path);
    setBanner("success", "文件路径已复制到剪贴板。", 2200);
  } catch (error) {
    setBanner("error", `复制失败：${toErrorMessage(error)}`);
  }
}

async function copyCurrentList(): Promise<void> {
  if (filteredFiles.value.length === 0) {
    setBanner("error", "当前列表没有可复制的路径。");
    return;
  }

  try {
    await writeText(filteredFiles.value.map((file) => file.path).join("\n"));
    setBanner("success", `已复制 ${filteredFiles.value.length} 条路径。`);
  } catch (error) {
    setBanner("error", `复制当前列表失败：${toErrorMessage(error)}`);
  }
}

async function copyAddedAndModified(): Promise<void> {
  if (!state.result) {
    setBanner("error", "当前没有可复制的比较结果。");
    return;
  }

  const files = [...state.result.added, ...state.result.modified].sort((left, right) =>
    left.path.localeCompare(right.path, "zh-CN"),
  );

  if (files.length === 0) {
    setBanner("error", "当前没有新增或修改文件。");
    return;
  }

  try {
    await writeText(files.map((file) => file.path).join("\n"));
    setBanner("success", `已复制 ${files.length} 条新增 + 修改路径。`);
  } catch (error) {
    setBanner("error", `复制新增 + 修改路径失败：${toErrorMessage(error)}`);
  }
}

function getFilterCount(filter: ResultFilter): number {
  if (!state.result) {
    return 0;
  }

  switch (filter) {
    case "added":
      return state.result.added.length;
    case "deleted":
      return state.result.deleted.length;
    case "modified":
      return state.result.modified.length;
    default:
      return resultCounts.value.total;
  }
}

const store = {
  state,
  presets: PRESETS,
  allChanges,
  filteredFiles,
  availableExtensions,
  resultCounts,
  currentModeLabel,
  initialize,
  setPage,
  applyPreset,
  pickFolder,
  clearFolder,
  clearCompareForm,
  runCompare,
  saveCurrentAsDefault,
  saveSettings,
  resetSettingsDraft,
  exportReport,
  copyPath,
  copyCurrentList,
  copyAddedAndModified,
  getFilterCount,
};

export function useCompareStore() {
  return store;
}
