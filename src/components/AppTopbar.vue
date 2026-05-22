<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  subtitle: string;
  busy?: boolean;
  compact?: boolean;
}>();
</script>

<template>
  <header :class="['topbar', { compact }]">
    <div>
      <div class="eyebrow">{{ eyebrow }}</div>
      <h1>{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
      <div v-if="busy" class="mini-status">正在处理本地文件，请稍等…</div>
    </div>

    <div class="top-actions">
      <slot name="actions"></slot>
    </div>
  </header>
</template>
