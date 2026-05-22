<script setup lang="ts">
import type { Preset } from "../types/diff";

defineProps<{
  presets: Preset[];
  activePresetId: string;
  modeLabel: string;
  includeCount: number;
  ignoreCount: number;
}>();

const emit = defineEmits<{
  select: [presetId: string];
}>();
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <div class="panel-title">比较预设</div>
      <div class="panel-desc">预设只负责填充后缀和忽略目录，你还可以继续手动改。</div>
    </div>

    <div class="panel-body">
      <div class="preset-list">
        <button
          v-for="preset in presets"
          :key="preset.id"
          :class="['preset', { active: activePresetId === preset.id }]"
          type="button"
          @click="emit('select', preset.id)"
        >
          <div>
            <strong>{{ preset.label }}</strong>
            <span>{{ preset.summary }}</span>
          </div>
          <div class="check"></div>
        </button>
      </div>

      <div class="summary">
        <div class="summary-title">当前规则摘要</div>
        <div class="summary-list">
          <div><span>比较方式</span><span class="value">{{ modeLabel }}</span></div>
          <div><span>后缀数量</span><span class="value">{{ includeCount || "全部文件" }}</span></div>
          <div><span>忽略目录</span><span class="value">{{ ignoreCount }}</span></div>
          <div><span>导出格式</span><span class="value">TXT</span></div>
        </div>
      </div>
    </div>
  </section>
</template>
