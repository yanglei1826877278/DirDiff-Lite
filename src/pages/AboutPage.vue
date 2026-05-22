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
      subtitle="一个本地优先、简单克制的开源文件夹差异比较工具。"
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
        一个自用优先的开源桌面工具，用来比较两个文件夹之间的新增、删除、修改文件。
        它不追求功能大全，只追求发布前看得清、复制路径方便、报告够用。
      </p>

      <div class="about-badges">
        <span class="about-badge">Tauri</span>
        <span class="about-badge">Vue</span>
        <span class="about-badge">Rust</span>
        <span class="about-badge">Local First</span>
        <span class="about-badge">No Account</span>
      </div>
    </section>

    <section class="feature-grid">
      <div class="feature-card">
        <h3>比较两个目录</h3>
        <p>通过相对路径识别同一个文件，找出新增、删除和修改。</p>
      </div>
      <div class="feature-card">
        <h3>自定义后缀</h3>
        <p>只看 .java、.jsp、.js、.css、.xml、.sql 等你关心的文件。</p>
      </div>
      <div class="feature-card">
        <h3>复制发布清单</h3>
        <p>一键复制新增 + 修改文件路径，适合老项目发布前检查。</p>
      </div>
    </section>

    <section class="panel panel-gap">
      <div class="panel-header">
        <div class="panel-title">v0.1 不做什么</div>
        <div class="panel-desc">
          不做账号系统、不做云同步、不做复杂项目管理、不做商业化功能。第一版只把核心比较体验做好。
        </div>
      </div>
      <div class="panel-body">
        <div class="summary-list">
          <div><span>账号登录</span><span class="value">不做</span></div>
          <div><span>在线同步</span><span class="value">不做</span></div>
          <div><span>复杂 Diff 编辑器</span><span class="value">后续再考虑</span></div>
          <div><span>插件系统</span><span class="value">不做</span></div>
        </div>
      </div>
    </section>
  </section>
</template>
