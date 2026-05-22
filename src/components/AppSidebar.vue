<script setup lang="ts">
import type { PageId } from "../types/diff";

defineProps<{
  currentPage: PageId;
}>();

const emit = defineEmits<{
  select: [page: PageId];
}>();

const navItems: Array<{ id: PageId; label: string }> = [
  { id: "compare", label: "开始比较" },
  { id: "result", label: "比较结果" },
  { id: "settings", label: "默认设置" },
  { id: "about", label: "关于项目" },
];
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">
        <img class="brand-logo" src="/logo.png" alt="DirDiff Lite logo" />
      </div>
      <div>
        <div class="brand-title">DirDiff Lite</div>
        <div class="brand-subtitle">Local folder comparison</div>
      </div>
    </div>

    <nav class="nav">
      <div class="nav-title">Workspace</div>
      <button
        v-for="item in navItems"
        :key="item.id"
        :class="['nav-item', { active: currentPage === item.id }]"
        type="button"
        @click="emit('select', item.id)"
      >
        <span class="nav-dot"></span>
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="sidebar-note">
      <strong>v0.1 目标</strong>
      <p>只做一个顺手的小工具：选两个文件夹，看新增、删除、修改，复制路径，导出 TXT。</p>
    </div>
  </aside>
</template>
