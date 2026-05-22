<script setup lang="ts">
import type { CompareMode } from "../types/diff";

defineProps<{
  includeExtInput: string;
  ignoreDirInput: string;
  compareMode: CompareMode;
  comparing: boolean;
  compareDisabled?: boolean;
}>();

const emit = defineEmits<{
  "update:includeExtInput": [value: string];
  "update:ignoreDirInput": [value: string];
  "update:compareMode": [mode: CompareMode];
  compare: [];
  saveDefaults: [];
}>();
</script>

<template>
  <section class="panel rules">
    <div class="panel-header">
      <div class="panel-title">比较规则</div>
      <div class="panel-desc">第一版只保留真正会用到的规则：后缀、忽略目录、比较方式。</div>
    </div>

    <div class="panel-body">
      <div class="form-grid">
        <div class="field">
          <label>只比较这些后缀</label>
          <input
            :value="includeExtInput"
            @input="emit('update:includeExtInput', ($event.target as HTMLInputElement).value)"
          />
          <div class="hint">留空表示比较全部文件。用英文逗号分隔。</div>
        </div>

        <div class="field">
          <label>忽略目录</label>
          <input
            :value="ignoreDirInput"
            @input="emit('update:ignoreDirInput', ($event.target as HTMLInputElement).value)"
          />
          <div class="hint">这些目录不会进入扫描结果。</div>
        </div>
      </div>

      <div class="mode-row">
        <button
          :class="['mode-card', { active: compareMode === 'fast' }]"
          type="button"
          @click="emit('update:compareMode', 'fast')"
        >
          <strong>快速比较</strong>
          <span>比较文件大小和修改时间，速度快，但不如 Hash 稳。</span>
        </button>

        <button
          :class="['mode-card', { active: compareMode === 'hash' }]"
          type="button"
          @click="emit('update:compareMode', 'hash')"
        >
          <strong>精确 Hash</strong>
          <span>读取文件内容计算 Hash，自用发布前检查更可靠。</span>
        </button>
      </div>

      <div class="submit-row">
        <button class="btn" type="button" @click="emit('saveDefaults')">保存为默认</button>
        <button
          class="btn primary"
          type="button"
          :disabled="comparing || compareDisabled"
          @click="emit('compare')"
        >
          {{ comparing ? "比较中..." : "开始比较" }}
        </button>
      </div>
    </div>
  </section>
</template>
