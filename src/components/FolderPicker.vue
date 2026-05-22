<script setup lang="ts">
defineProps<{
  label: string;
  tag: string;
  iconText: string;
  value: string;
  placeholder: string;
  hint: string;
  isDropActive?: boolean;
}>();

const emit = defineEmits<{
  choose: [];
  clear: [];
  "update:value": [value: string];
}>();
</script>

<template>
  <div :class="['folder-box', { 'is-filled': value.trim().length > 0, 'is-drop-active': isDropActive }]">
    <div class="folder-head">
      <div class="folder-label">{{ label }}</div>
      <div class="folder-tag">{{ tag }}</div>
    </div>

    <button class="drop" type="button" @click="emit('choose')">
      <div class="drop-icon">{{ iconText }}</div>
      <div class="drop-copy">
        <div class="drop-title">拖入{{ label }}，或手动选择</div>
        <div class="drop-tip">{{ hint }}</div>
      </div>
      <span class="btn ghost drop-action">选择</span>
    </button>

    <div class="path-row">
      <input
        :value="value"
        :placeholder="placeholder"
        @input="emit('update:value', ($event.target as HTMLInputElement).value)"
      />
      <button class="btn" type="button" @click="emit('clear')">清除</button>
    </div>
  </div>
</template>
