import type { AppConfig, CompareMode, Preset } from "../types/diff";

export const DEFAULT_INCLUDE_EXTS = [
  ".java",
  ".jsp",
  ".html",
  ".css",
  ".js",
  ".xml",
  ".sql",
  ".properties",
];

export const DEFAULT_IGNORE_DIRS = [
  ".git",
  "target",
  "node_modules",
  "dist",
  "build",
  "out",
  "bin",
  ".idea",
  ".vscode",
];

export const DEFAULT_EXPORT_FILE_NAME = "dirdiff-report.txt";

export const PRESETS: Preset[] = [
  {
    id: "java-jsp",
    label: "Java / JSP 项目",
    summary: ".java .jsp .html .css .js .xml .sql",
    description: "适合老项目发布前检查，默认覆盖常见页面、脚本和配置文件。",
    includeExts: [
      ".java",
      ".jsp",
      ".html",
      ".css",
      ".js",
      ".xml",
      ".sql",
      ".properties",
    ],
  },
  {
    id: "vue-frontend",
    label: "Vue / 前端项目",
    summary: ".vue .ts .js .scss .css .json",
    description: "前端工程常用源码与配置文件预设。",
    includeExts: [".vue", ".ts", ".js", ".tsx", ".scss", ".css", ".json", ".html"],
  },
  {
    id: "text-config",
    label: "文本和配置文件",
    summary: ".txt .md .json .xml .yml",
    description: "只关注说明文档、配置和脚本文件。",
    includeExts: [".txt", ".md", ".json", ".xml", ".yml", ".yaml", ".ini", ".conf"],
  },
  {
    id: "all-files",
    label: "全部文件",
    summary: "只忽略依赖、缓存和构建目录",
    description: "对所有文件做比较，只应用忽略目录规则。",
    includeExts: [],
  },
];

export function createDefaultConfig(): AppConfig {
  return {
    defaultIncludeExts: [...DEFAULT_INCLUDE_EXTS],
    defaultIgnoreDirs: [...DEFAULT_IGNORE_DIRS],
    defaultCompareMode: "hash",
    defaultExportFileName: DEFAULT_EXPORT_FILE_NAME,
    recentComparisons: [],
  };
}

export function compareModeLabel(mode: CompareMode): string {
  return mode === "hash" ? "精确 Hash" : "快速比较";
}
