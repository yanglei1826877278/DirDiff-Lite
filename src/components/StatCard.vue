<script setup lang="ts">
defineProps<{
  label: string;
  count: number;
  tone?: "add" | "del" | "mod" | "plain";
}>();
</script>

<template>
  <div :class="['stat-card', tone ?? 'plain']">
    <div class="stat-num">{{ count }}</div>
    <div class="stat-label">{{ label }}</div>
  </div>
</template>
