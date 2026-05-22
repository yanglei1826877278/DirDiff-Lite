# DirDiff Lite 项目文档

## 1. 项目简介

**DirDiff Lite** 是一个本地运行的轻量级文件夹差异比较工具。

它用于比较两个文件夹之间的文件变化，主要解决开发者在维护项目、发布项目、检查新旧版本差异时的实际问题。

核心目标很简单：

> 选择旧文件夹和新文件夹，快速查看新增、删除、修改了哪些文件，并复制或导出变更清单。

本项目定位为 **自用优先、开源分享、简单克制** 的桌面工具，不做账号系统、不做云同步、不做复杂项目管理。

---

## 2. 项目定位

DirDiff Lite 不是一个复杂的 Git 替代品，也不是大型代码审查工具。

它更适合这些场景：

- 比较新旧两个项目目录
- 查看本次项目更新新增了哪些文件
- 查看本次项目更新删除了哪些文件
- 查看本次项目更新修改了哪些文件
- 生成简单的发布文件清单
- 比较 Java / JSP / Vue / 静态网站等项目目录
- 在没有 Git 或不方便用 Git 的老项目中检查差异

典型使用场景：

```text
旧项目目录：D:\workspace\erp-old
新项目目录：D:\workspace\erp-new

点击比较后输出：
- 新增文件
- 删除文件
- 修改文件
```

---

## 3. 设计原则

### 3.1 本地优先

所有文件扫描和比较都在本机完成。

不上传文件，不依赖服务端，不需要登录账号。

### 3.2 自用优先

功能优先围绕真实自用场景设计，不为了显得“完整”而堆功能。

第一版只做最常用、最必要的功能。

### 3.3 简单克制

界面保持清爽，功能保持直观。

用户打开工具后，只需要完成三件事：

1. 选择旧文件夹
2. 选择新文件夹
3. 开始比较

### 3.4 开源友好

代码结构要清楚，模块职责要简单，方便后续维护或别人参与。

---

## 4. 技术选型

### 4.1 桌面框架

使用：

```text
Tauri
```

原因：

- 桌面应用体积相对较小
- 性能好
- 适合本地文件系统工具
- 支持 Windows / macOS / Linux
- 比 Electron 更轻量

### 4.2 前端框架

使用：

```text
Vue 3 + TypeScript
```

原因：

- 写界面快
- 组件化清晰
- 适合构建桌面工具 UI
- 后续迁移和维护方便

### 4.3 后端逻辑

使用：

```text
Rust
```

Rust 负责：

- 读取本地文件夹
- 递归扫描文件
- 过滤指定后缀
- 忽略指定目录
- 计算文件 Hash
- 生成比较结果
- 导出 TXT 报告

### 4.4 推荐技术栈

```text
Tauri
Vue 3
TypeScript
Rust
Vite
```

---

## 5. 核心功能

### 5.1 选择旧文件夹

用户选择一个旧项目目录作为比较基准。

示例：

```text
D:\workspace\erp-old
```

### 5.2 选择新文件夹

用户选择一个新项目目录作为目标目录。

示例：

```text
D:\workspace\erp-new
```

### 5.3 按相对路径比较

比较时不关心两个根目录名称是否一致，只比较文件在各自目录下的相对路径。

例如：

```text
旧文件：
D:\workspace\erp-old\src\main\webapp\index.jsp

新文件：
D:\workspace\erp-new\src\main\webapp\index.jsp
```

它们的相对路径都是：

```text
src/main/webapp/index.jsp
```

所以认为它们是同一个文件。

---

## 6. 差异类型

DirDiff Lite 第一版只识别三种变化：

### 6.1 新增文件

新文件夹中存在，旧文件夹中不存在。

```text
旧目录：不存在
新目录：存在
结果：新增
```

### 6.2 删除文件

旧文件夹中存在，新文件夹中不存在。

```text
旧目录：存在
新目录：不存在
结果：删除
```

### 6.3 修改文件

旧文件夹和新文件夹中都存在同一个相对路径的文件，但是文件内容不同。

```text
旧目录：存在
新目录：存在
Hash 不一致
结果：修改
```

### 6.4 未变化文件

旧文件夹和新文件夹中都存在同一个相对路径的文件，并且文件内容一致。

第一版默认不展示未变化文件，只在统计中保留。

---

## 7. 比较规则

### 7.1 后缀过滤

用户可以指定只比较某些文件后缀。

示例：

```text
.java,.jsp,.html,.css,.js,.xml,.sql,.properties
```

规则：

- 使用英文逗号分隔
- 后缀可以带点，也可以后续兼容不带点
- 留空表示比较全部文件

推荐默认值：

```text
.java,.jsp,.html,.css,.js,.xml,.sql,.properties
```

### 7.2 忽略目录

用户可以指定扫描时忽略某些目录。

默认忽略：

```text
.git,target,node_modules,dist,build,out,bin,.idea,.vscode
```

这些目录不会进入扫描结果。

### 7.3 比较方式

第一版支持两种比较方式。

#### 快速比较

通过文件大小和修改时间判断是否变化。

优点：

- 速度快

缺点：

- 不够绝对准确

#### 精确 Hash

读取文件内容并计算 Hash。

优点：

- 结果更准确

缺点：

- 大项目扫描会稍慢

默认建议：

```text
精确 Hash
```

---

## 8. 页面设计

当前 UI 风格参考 Claude 官网方向：

- 暖白背景
- 黑灰文字
- 陶土橙作为强调色
- 小圆角
- 轻阴影
- 少渐变
- 克制、干净、不做蓝紫 AI 风

---

## 9. 页面结构

### 9.1 开始比较页

页面职责：

- 选择旧文件夹
- 选择新文件夹
- 选择比较预设
- 设置比较规则
- 开始比较

主要区域：

```text
开始比较页
├── 顶部标题区
├── 文件夹选择区
│   ├── 旧文件夹
│   └── 新文件夹
├── 比较预设区
│   ├── Java / JSP 项目
│   ├── Vue / 前端项目
│   ├── 文本和配置文件
│   └── 全部文件
└── 比较规则区
    ├── 只比较这些后缀
    ├── 忽略目录
    ├── 快速比较
    └── 精确 Hash
```

---

### 9.2 比较结果页

页面职责：

- 展示比较统计
- 展示变化文件列表
- 支持按状态筛选
- 支持按后缀筛选
- 支持搜索路径
- 支持复制路径
- 支持导出 TXT 报告

主要区域：

```text
比较结果页
├── 顶部标题区
├── 统计卡片
│   ├── 新增文件数量
│   ├── 删除文件数量
│   ├── 修改文件数量
│   └── 未变化文件数量
├── 结果筛选区
│   ├── 全部变化
│   ├── 新增文件
│   ├── 删除文件
│   └── 修改文件
└── 文件列表区
    ├── 搜索框
    ├── 后缀筛选
    ├── 表格
    └── 操作按钮
```

---

### 9.3 默认设置页

页面职责：

- 保存默认后缀
- 保存默认忽略目录
- 保存默认比较方式
- 保存默认导出文件名

主要区域：

```text
默认设置页
├── 默认后缀
├── 忽略目录
├── 比较方式
├── 默认导出文件名
└── 保存设置
```

---

### 9.4 关于项目页

页面职责：

- 说明项目定位
- 说明技术栈
- 说明设计原则
- 说明第一版不做什么

主要区域：

```text
关于项目页
├── 项目介绍
├── 技术栈
├── 功能说明
└── v0.1 不做什么
```

---

## 10. 第一版功能清单

v0.1 只做以下功能：

```text
1. 选择旧文件夹
2. 选择新文件夹
3. 输入要比较的文件后缀
4. 输入要忽略的目录
5. 选择比较方式：快速比较 / 精确 Hash
6. 开始比较
7. 显示新增文件数量
8. 显示删除文件数量
9. 显示修改文件数量
10. 显示新增文件列表
11. 显示删除文件列表
12. 显示修改文件列表
13. 搜索文件路径
14. 按状态筛选结果
15. 复制单个文件路径
16. 复制当前列表路径
17. 复制新增 + 修改文件路径
18. 导出 TXT 报告
19. 保存默认配置
```

---

## 11. v0.1 暂不实现的功能

以下功能第一版暂时不做：

```text
1. 账号系统
2. 云同步
3. 在线文件上传
4. 多人协作
5. 复杂项目管理
6. Monaco 代码 Diff
7. ZIP 包比较
8. 生成发布压缩包
9. HTML 报告
10. CSV 报告
11. Excel 报告
12. 自动更新
13. 插件系统
14. 国际化多语言
15. 忽略注释差异
16. 忽略空白差异
```

这些功能不是永远不做，而是等 v0.1 真正好用后，再根据实际需要决定是否增加。

---

## 12. 数据结构设计

### 12.1 前端 DiffResult

```ts
export interface DiffResult {
  added: DiffFile[];
  deleted: DiffFile[];
  modified: DiffFile[];
  unchangedCount: number;
}
```

### 12.2 DiffFile

```ts
export interface DiffFile {
  path: string;
  ext: string;
  oldSize?: number;
  newSize?: number;
  status: 'added' | 'deleted' | 'modified';
}
```

### 12.3 CompareOptions

```ts
export interface CompareOptions {
  oldDir: string;
  newDir: string;
  includeExts: string[];
  ignoreDirs: string[];
  compareMode: 'fast' | 'hash';
  showUnchanged: boolean;
}
```

---

## 13. Rust 侧数据结构建议

### 13.1 FileInfo

```rust
pub struct FileInfo {
    pub relative_path: String,
    pub absolute_path: String,
    pub ext: String,
    pub size: u64,
    pub modified_time: Option<u64>,
    pub hash: Option<String>,
}
```

### 13.2 CompareOptions

```rust
pub struct CompareOptions {
    pub old_dir: String,
    pub new_dir: String,
    pub include_exts: Vec<String>,
    pub ignore_dirs: Vec<String>,
    pub compare_mode: CompareMode,
    pub show_unchanged: bool,
}
```

### 13.3 CompareMode

```rust
pub enum CompareMode {
    Fast,
    Hash,
}
```

### 13.4 CompareResult

```rust
pub struct CompareResult {
    pub added: Vec<DiffFile>,
    pub deleted: Vec<DiffFile>,
    pub modified: Vec<DiffFile>,
    pub unchanged_count: usize,
}
```

---

## 14. 项目目录结构建议

```text
dirdiff-lite/
├── README.md
├── PROJECT.md
├── package.json
├── index.html
├── vite.config.ts
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── styles/
│   │   └── main.css
│   ├── types/
│   │   └── diff.ts
│   ├── components/
│   │   ├── AppSidebar.vue
│   │   ├── AppTopbar.vue
│   │   ├── FolderPicker.vue
│   │   ├── PresetPanel.vue
│   │   ├── CompareRules.vue
│   │   ├── StatCard.vue
│   │   ├── ResultTable.vue
│   │   └── EmptyState.vue
│   ├── pages/
│   │   ├── ComparePage.vue
│   │   ├── ResultPage.vue
│   │   ├── SettingsPage.vue
│   │   └── AboutPage.vue
│   └── stores/
│       └── compareStore.ts
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json
    └── src/
        ├── main.rs
        ├── commands.rs
        ├── scanner.rs
        ├── comparator.rs
        ├── hash.rs
        ├── report.rs
        └── config.rs
```

---

## 15. Rust 模块职责

### 15.1 commands.rs

Tauri 命令入口。

负责暴露给前端调用的方法：

```rust
compare_folders(options)
export_txt_report(result, path)
load_config()
save_config(config)
```

### 15.2 scanner.rs

负责扫描文件夹。

功能：

- 递归扫描目录
- 忽略指定目录
- 按后缀过滤文件
- 生成 FileInfo 列表

### 15.3 comparator.rs

负责比较两个文件列表。

功能：

- 根据相对路径建立 Map
- 判断新增文件
- 判断删除文件
- 判断修改文件
- 统计未变化文件

### 15.4 hash.rs

负责计算文件 Hash。

第一版可以使用：

```text
MD5 或 SHA-256
```

建议第一版用 SHA-256 或 Blake3。

如果想简单，MD5 也够用，因为这里不是安全场景。

### 15.5 report.rs

负责导出 TXT 报告。

报告包括：

```text
项目路径
统计结果
新增文件列表
删除文件列表
修改文件列表
```

### 15.6 config.rs

负责本地配置读写。

保存内容：

```text
默认后缀
默认忽略目录
默认比较方式
默认导出文件名
```

---

## 16. 比较流程

完整流程如下：

```text
用户选择旧文件夹
用户选择新文件夹
用户设置后缀过滤
用户设置忽略目录
用户选择比较方式
点击开始比较
前端调用 Tauri command
Rust 扫描旧文件夹
Rust 扫描新文件夹
Rust 按相对路径建立文件 Map
Rust 判断新增 / 删除 / 修改 / 未变化
Rust 返回 CompareResult
前端展示统计和文件列表
用户复制路径或导出 TXT
```

---

## 17. 比较算法

### 17.1 扫描阶段

扫描旧目录和新目录，得到两个 Map。

```text
oldMap: relativePath -> FileInfo
newMap: relativePath -> FileInfo
```

### 17.2 新增判断

遍历 newMap：

```text
如果 oldMap 中不存在该 relativePath
则为新增文件
```

### 17.3 删除判断

遍历 oldMap：

```text
如果 newMap 中不存在该 relativePath
则为删除文件
```

### 17.4 修改判断

遍历两个 Map 都存在的文件：

```text
如果 compareMode = fast：
    比较 size + modified_time

如果 compareMode = hash：
    比较 hash

如果不同：
    则为修改文件
否则：
    计入未变化
```

---

## 18. TXT 报告格式

导出的 TXT 报告建议格式：

```text
DirDiff Lite Report

Old Folder:
D:\workspace\erp-old

New Folder:
D:\workspace\erp-new

Summary:
Added: 12
Deleted: 3
Modified: 27
Unchanged: 156

[Added]
src/main/webapp/pages/user_add.jsp
src/main/resources/sql/update_20260521.sql

[Deleted]
src/main/webapp/pages/old_report.jsp

[Modified]
src/main/java/com/entsoft/customer/UserService.java
src/main/webapp/static/js/order-detail.js
```

---

## 19. README 简版文案

可以放在 README.md 开头：

```md
# DirDiff Lite

DirDiff Lite is a lightweight desktop tool for comparing two folders.

It helps you find added, deleted, and modified files between two project directories.

## Features

- Compare two folders
- Detect added, deleted, and modified files
- Filter files by extension
- Ignore specific directories
- Copy changed file paths
- Export a TXT report
- Local-first, no account, no upload

## Tech Stack

- Tauri
- Vue 3
- TypeScript
- Rust
```

中文版本：

```md
# DirDiff Lite

DirDiff Lite 是一个轻量级桌面文件夹差异比较工具。

它用于比较两个项目目录之间的文件变化，帮助你快速查看新增、删除和修改的文件。

## 功能

- 比较两个文件夹
- 识别新增、删除、修改文件
- 按文件后缀过滤
- 忽略指定目录
- 复制变化文件路径
- 导出 TXT 报告
- 本地运行，不登录，不上传
```

---

## 20. 开发优先级

### 第一阶段：静态界面

目标：

```text
完成开始比较页、比较结果页、默认设置页、关于页。
```

### 第二阶段：前端状态

目标：

```text
完成页面切换、表单状态、预设切换、假数据展示。
```

### 第三阶段：Rust 扫描逻辑

目标：

```text
完成目录扫描、后缀过滤、忽略目录。
```

### 第四阶段：比较逻辑

目标：

```text
完成新增、删除、修改、未变化统计。
```

### 第五阶段：导出和复制

目标：

```text
完成复制路径、复制新增 + 修改、导出 TXT。
```

### 第六阶段：配置持久化

目标：

```text
保存默认后缀、忽略目录、比较方式。
```

---

## 21. 后续可选功能

等 v0.1 稳定后，可以考虑：

```text
1. HTML 报告
2. CSV 报告
3. ZIP 包比较
4. 生成 release.zip 发布包
5. 文件内容 Diff
6. 忽略空白变化
7. 删除文件清单单独导出
8. 最近比较记录
```

但这些都不属于第一版必须功能。

---

## 22. 项目一句话介绍

中文：

```text
DirDiff Lite 是一个本地运行的轻量级文件夹差异比较工具，用于比较两个项目目录中的新增、删除和修改文件。
```

英文：

```text
DirDiff Lite is a lightweight local desktop tool for comparing two folders and listing added, deleted, and modified files.
```

---

## 23. 当前结论

DirDiff Lite 的第一版应该坚持以下方向：

```text
简单
本地
开源
无账号
无云同步
只做文件夹差异比较
重点做好新增 / 删除 / 修改文件展示
重点做好复制路径和导出 TXT 报告
```

只要第一版把这个流程做顺，它就是一个真正能用的自用开源小工具。
