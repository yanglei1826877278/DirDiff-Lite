<script setup lang="ts">
import { openUrl } from "@tauri-apps/plugin-opener";
import AppTopbar from "../components/AppTopbar.vue";
import { useCompareStore } from "../stores/compareStore";

const store = useCompareStore();

async function openGithub(): Promise<void> {
  try {
    await openUrl("https://github.com/");
  } catch (error) {
    store.notify("error", `打开 GitHub 失败：${error instanceof Error ? error.message : "未知错误"}`);
  }
}
</script>

<template>
  <section class="page-shell">
    <AppTopbar
      eyebrow="About project"
      title="关于项目"
      subtitle="一个本地优先、轻量克制、专门用来比较项目目录差异的小工具。"
    >
      <template #actions>
        <button class="btn" type="button" @click="openGithub">GitHub</button>
        <button class="btn primary" type="button" @click="store.openReadme">查看 README</button>
      </template>
    </AppTopbar>

    <section class="about-hero">
      <div class="eyebrow">Local first / Open source</div>
      <h2>DirDiff Lite</h2>
      <p>
        DirDiff Lite 是一个本地运行的轻量级文件夹差异比较工具。
        它主要面向真实的项目维护和发布场景：选择旧目录和新目录，快速看清新增、删除、修改了哪些文件，
        然后复制路径或导出简单报告。它不做账号系统、不做云同步，也不试图替代 Git，
        只把“目录差异核对”这件事做得足够直接、足够顺手。
      </p>

      <div class="about-badges">
        <span class="about-badge">Tauri</span>
        <span class="about-badge">Vue</span>
        <span class="about-badge">Rust</span>
        <span class="about-badge">Local First</span>
        <span class="about-badge">Release Check</span>
      </div>
    </section>

    <section class="feature-grid">
      <div class="feature-card">
        <h3>比较新旧项目目录</h3>
        <p>按相对路径识别同一个文件，快速找出新增、删除和修改内容。</p>
      </div>
      <div class="feature-card">
        <h3>只看你关心的文件</h3>
        <p>支持按后缀过滤和忽略目录，聚焦代码、页面、脚本和配置文件。</p>
      </div>
      <div class="feature-card">
        <h3>适合老项目发布检查</h3>
        <p>复制变化路径、导出 TXT 报告，方便发布前确认变更清单。</p>
      </div>
    </section>

    <section class="panel panel-gap">
      <div class="panel-header">
        <div class="panel-title">v0.1 不做什么</div>
        <div class="panel-desc">
          第一版坚持小而实用：不做账号系统、不做云同步、不做复杂 Diff 编辑器、不做臃肿的平台化功能。
          重点始终是把目录比较、路径复制和 TXT 导出做好。
        </div>
      </div>
      <div class="panel-body">
        <div class="summary-list">
          <div><span>账号登录</span><span class="value">不做</span></div>
          <div><span>在线同步</span><span class="value">不做</span></div>
          <div><span>复杂项目管理</span><span class="value">不做</span></div>
          <div><span>Monaco 代码 Diff</span><span class="value">后续再考虑</span></div>
        </div>
      </div>
    </section>
  </section>
</template>
