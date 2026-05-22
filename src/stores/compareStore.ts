import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ask, open, save } from "@tauri-apps/plugin-dialog";
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener";
import { computed, reactive } from "vue";
import { PRESETS, compareModeLabel, createDefaultConfig } from "../data/presets";
import type {
  AppConfig,
  BannerState,
  CompareForm,
  CompareProgressState,
  CompareOptions,
  DiffFile,
  DiffResult,
  ExportReportRequest,
  PageId,
  ResultFilter,
  FolderDropTarget,
  RecentComparison,
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
    recentComparisons: Array.isArray(config?.recentComparisons)
      ? config.recentComparisons
      : fallback.recentComparisons,
    customFilterExts: Array.isArray(config?.customFilterExts)
      ? parseCsvInput(config.customFilterExts.join(","), "ext")
      : fallback.customFilterExts,
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

function timestampLabel(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
let progressUnlisten: UnlistenFn | undefined;
const RESULT_PAGE_SIZE = 200;

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
  folderDropTarget: null as FolderDropTarget,
  result: null as DiffResult | null,
  lastCompareOptions: null as CompareOptions | null,
  compareProgress: {
    stage: "idle",
    current: 0,
    total: 0,
    percent: 0,
    message: "",
    visible: false,
  } as CompareProgressState,
  hasCompared: false,
  resultFilter: "all" as ResultFilter,
  selectedExtFilters: [] as string[],
  extPickerValue: "",
  customExtInput: "",
  searchQuery: "",
  resultPage: 1,
});

const allChanges = computed<DiffFile[]>(() => {
  if (!state.result) {
    return [];
  }

  return [...state.result.added, ...state.result.deleted, ...state.result.modified].sort(
    (left, right) => left.path.localeCompare(right.path, "zh-CN"),
  );
});

const canCompare = computed(() => {
  const oldDir = state.compareForm.oldDir.trim();
  const newDir = state.compareForm.newDir.trim();

  return oldDir.length > 0 && newDir.length > 0 && oldDir !== newDir;
});

const compareValidationMessage = computed(() => {
  const oldDir = state.compareForm.oldDir.trim();
  const newDir = state.compareForm.newDir.trim();

  if (!oldDir || !newDir) {
    return "先选择旧文件夹和新文件夹。";
  }

  if (oldDir === newDir) {
    return "旧文件夹和新文件夹不能是同一个目录。";
  }

  return "";
});

const filteredFiles = computed<DiffFile[]>(() => {
  const search = state.searchQuery.trim().toLowerCase();
  const matched = allChanges.value.filter((file) => {
    const matchesStatus = state.resultFilter === "all" || file.status === state.resultFilter;
    const matchesExt =
      state.selectedExtFilters.length === 0 || state.selectedExtFilters.includes(file.ext);
    const matchesSearch =
      search.length === 0 ||
      file.path.toLowerCase().includes(search) ||
      file.ext.toLowerCase().includes(search);

    return matchesStatus && matchesExt && matchesSearch;
  });

  return matched.sort((left, right) => left.path.localeCompare(right.path, "zh-CN"));
});

const availableExtensions = computed<string[]>(() =>
  unique(
    [...allChanges.value.map((file) => file.ext), ...state.config.customFilterExts]
      .filter((ext) => typeof ext === "string" && ext.trim().length > 0)
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
const totalResultPages = computed(() =>
  Math.max(1, Math.ceil(filteredFiles.value.length / RESULT_PAGE_SIZE)),
);
const recentComparisons = computed(() =>
  state.config.recentComparisons.slice(0, 10).map((item) => ({
    ...item,
    comparedAtLabel: timestampLabel(item.comparedAt),
  })),
);

const paginatedFiles = computed(() => {
  const start = (state.resultPage - 1) * RESULT_PAGE_SIZE;
  return filteredFiles.value.slice(start, start + RESULT_PAGE_SIZE);
});

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

function swapFolders(): void {
  const previousOld = state.compareForm.oldDir;
  state.compareForm.oldDir = state.compareForm.newDir;
  state.compareForm.newDir = previousOld;
  setBanner("info", "已交换旧文件夹和新文件夹。", 2200);
}

function chooseDropTarget(): Exclude<FolderDropTarget, null> {
  if (!state.compareForm.oldDir.trim()) {
    return "oldDir";
  }

  if (!state.compareForm.newDir.trim()) {
    return "newDir";
  }

  return "newDir";
}

function markFolderDropTarget(): void {
  state.folderDropTarget = chooseDropTarget();
}

async function handleFolderDrop(paths: string[]): Promise<void> {
  const folderPath = paths[0];
  state.folderDropTarget = chooseDropTarget();

  if (!folderPath) {
    return;
  }

  const target = state.folderDropTarget;
  state.compareForm[target] = folderPath;
  setBanner(
    "success",
    `${target === "oldDir" ? "旧文件夹" : "新文件夹"}已通过拖拽设置。`,
    2200,
  );
}

function cancelFolderDrop(): void {
  state.folderDropTarget = null;
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
    recentComparisons: state.config.recentComparisons,
    customFilterExts: state.config.customFilterExts,
  });
}

async function persistConfig(config: AppConfig): Promise<void> {
  await invoke("save_config", { config });
  state.config = config;
}

async function initialize(): Promise<void> {
  if (state.initialized) {
    return;
  }

  state.isBooting = true;

  try {
    if (!progressUnlisten) {
      progressUnlisten = await listen<CompareProgressState>("compare-progress", (event) => {
        state.compareProgress = {
          ...event.payload,
          visible: event.payload.stage !== "finished",
        };
      });
    }

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
  state.folderDropTarget = null;
  setBanner("info", "已清空本次比较表单。");
}

async function runCompare(): Promise<void> {
  const options = buildCompareOptions();

  if (!canCompare.value) {
    setBanner("error", compareValidationMessage.value || "当前比较条件不完整。");
    return;
  }

  state.isComparing = true;
  state.compareProgress = {
    stage: "starting",
    current: 0,
    total: 0,
    percent: 0,
    message: "正在准备比较任务…",
    visible: true,
  };

  try {
    const result = sanitizeResult(await invoke<DiffResult>("compare_folders", { options }));
    state.result = result;
    state.lastCompareOptions = options;
    state.hasCompared = true;
    state.resultFilter = "all";
    state.selectedExtFilters = [];
    state.extPickerValue = "";
    state.searchQuery = "";
    state.resultPage = 1;
    state.page = "result";
    await saveRecentComparison(options);
    const total = result.added.length + result.deleted.length + result.modified.length;
    setBanner("success", `比较完成，共发现 ${total} 个变化文件。`);
  } catch (error) {
    state.compareProgress.visible = false;
    setBanner("error", `比较失败：${toErrorMessage(error)}`);
  } finally {
    state.isComparing = false;
    state.compareProgress = {
      ...state.compareProgress,
      visible: false,
      stage: "finished",
      percent: 100,
      message: "比较完成。",
    };
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
    await persistConfig(config);
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
    await persistConfig(config);
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

async function copyFileWithChoice(file: DiffFile): Promise<void> {
  const useFullPath = await ask(
    `要复制这个文件的完整路径吗？\n\n选择“是”复制完整路径。\n选择“否”复制相对路径。`,
    {
      title: "复制路径",
      kind: "info",
      okLabel: "复制完整路径",
      cancelLabel: "复制相对路径",
    },
  );

  const targetPath =
    useFullPath && file.absolutePath?.trim().length ? file.absolutePath : file.path;

  await copyPath(targetPath);
}

async function revealFileInFolder(file: DiffFile): Promise<void> {
  if (!file.absolutePath?.trim()) {
    setBanner("error", "当前文件没有可用的绝对路径。");
    return;
  }

  try {
    await revealItemInDir(file.absolutePath);
  } catch (error) {
    setBanner("error", `在文件夹中显示失败：${toErrorMessage(error)}`);
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

function resetResultFilters(): void {
  state.resultFilter = "all";
  state.selectedExtFilters = [];
  state.extPickerValue = "";
  state.customExtInput = "";
  state.searchQuery = "";
  state.resultPage = 1;
}

async function addCustomFilterExt(): Promise<void> {
  const normalized = normalizeExtension(state.customExtInput);

  if (!normalized) {
    setBanner("error", "请输入有效的文件后缀，例如 .jsp 或 .vue。");
    return;
  }

  if (state.config.customFilterExts.includes(normalized)) {
    addSelectedExtFilter(normalized);
    setBanner("info", `后缀 ${normalized} 已存在，已直接选中。`, 2200);
    state.customExtInput = "";
    return;
  }

  const config = sanitizeConfig({
    ...state.config,
    customFilterExts: [...state.config.customFilterExts, normalized],
  });

  await persistConfig(config);
  addSelectedExtFilter(normalized);
  state.customExtInput = "";
  setBanner("success", `已添加并保存自定义后缀 ${normalized}。`, 2400);
}

function addSelectedExtFilter(input?: string): void {
  const normalized = normalizeExtension(input ?? state.extPickerValue);

  if (!normalized) {
    setBanner("error", "先选择一个后缀，或者输入自定义后缀。");
    return;
  }

  if (!state.selectedExtFilters.includes(normalized)) {
    state.selectedExtFilters = [...state.selectedExtFilters, normalized];
  }

  state.extPickerValue = "";
  state.resultPage = 1;
}

function removeSelectedExtFilter(ext: string): void {
  state.selectedExtFilters = state.selectedExtFilters.filter((item) => item !== ext);
  state.resultPage = 1;
}

function clearSelectedExtFilters(): void {
  state.selectedExtFilters = [];
  state.extPickerValue = "";
  state.resultPage = 1;
}

function previousResultPage(): void {
  if (state.resultPage > 1) {
    state.resultPage -= 1;
  }
}

function nextResultPage(): void {
  if (state.resultPage < totalResultPages.value) {
    state.resultPage += 1;
  }
}

async function saveRecentComparison(options: CompareOptions): Promise<void> {
  const record: RecentComparison = {
    oldDir: options.oldDir,
    newDir: options.newDir,
    compareMode: options.compareMode,
    includeExts: options.includeExts,
    ignoreDirs: options.ignoreDirs,
    comparedAt: new Date().toISOString(),
  };

  const uniqueRecords = state.config.recentComparisons.filter(
    (item) =>
      !(
        item.oldDir === record.oldDir &&
        item.newDir === record.newDir &&
        item.compareMode === record.compareMode
      ),
  );

  const config = sanitizeConfig({
    ...state.config,
    recentComparisons: [record, ...uniqueRecords].slice(0, 10),
  });

  await persistConfig(config);
}

function applyRecentComparison(record: RecentComparison): void {
  state.compareForm.oldDir = record.oldDir;
  state.compareForm.newDir = record.newDir;
  state.compareForm.compareMode = record.compareMode;
  state.compareForm.includeExtInput = formatCsvInput(record.includeExts);
  state.compareForm.ignoreDirInput = formatCsvInput(record.ignoreDirs);
  setBanner("info", "已回填最近一次比较记录。", 2200);
}

async function openReadme(): Promise<void> {
  try {
    await openPath("README.md");
  } catch (error) {
    setBanner("error", `打开 README 失败：${toErrorMessage(error)}`);
  }
}

const store = {
  state,
  presets: PRESETS,
  allChanges,
  canCompare,
  compareValidationMessage,
  filteredFiles,
  paginatedFiles,
  availableExtensions,
  resultCounts,
  currentModeLabel,
  totalResultPages,
  recentComparisons,
  notify: setBanner,
  initialize,
  setPage,
  swapFolders,
  markFolderDropTarget,
  handleFolderDrop,
  cancelFolderDrop,
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
  copyFileWithChoice,
  copyCurrentList,
  copyAddedAndModified,
  revealFileInFolder,
  getFilterCount,
  resetResultFilters,
  addCustomFilterExt,
  addSelectedExtFilter,
  removeSelectedExtFilter,
  clearSelectedExtFilters,
  previousResultPage,
  nextResultPage,
  applyRecentComparison,
  openReadme,
};

export function useCompareStore() {
  return store;
}
