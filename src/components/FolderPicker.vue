<script setup lang="ts">
defineProps<{
  label: string;
  tag: string;
  iconText: string;
  value: string;
  placeholder: string;
  hint: string;
}>();

const emit = defineEmits<{
  choose: [];
  clear: [];
  "update:value": [value: string];
}>();
</script>

<template>
  <div :class="['folder-box', { 'is-filled': value.trim().length > 0 }]">
    <div class="folder-head">
      <div class="folder-label">{{ label }}</div>
      <div class="folder-tag">{{ tag }}</div>
    </div>

    <button class="drop" type="button" @click="emit('choose')">
      <div class="drop-icon">{{ iconText }}</div>
      <div class="drop-copy">
        <div class="drop-title">点击选择文件夹，或直接手动输入路径</div>
        <div class="drop-tip">{{ hint }}</div>
      </div>
      <span class="btn ghost">选择</span>
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
