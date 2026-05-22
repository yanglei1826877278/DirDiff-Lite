<script setup lang="ts">
import CompareRules from "../components/CompareRules.vue";
import FolderPicker from "../components/FolderPicker.vue";
import AppTopbar from "../components/AppTopbar.vue";
import PresetPanel from "../components/PresetPanel.vue";
import { useCompareStore } from "../stores/compareStore";

const store = useCompareStore();
</script>

<template>
  <section class="page-shell">
    <AppTopbar
      eyebrow="Compare folders"
      title="比较两个项目目录"
      subtitle="用最简单的方式确认新旧项目之间的文件变化。所有比较都在本地完成，不上传文件，不做账号系统。"
      :busy="store.state.isComparing || store.state.isBooting"
    >
      <template #actions>
        <button class="btn" type="button" @click="store.clearCompareForm">清空</button>
        <button class="btn primary" type="button" :disabled="store.state.isComparing" @click="store.runCompare">
          {{ store.state.isComparing ? "比较中..." : "开始比较" }}
        </button>
      </template>
    </AppTopbar>

    <section class="layout">
      <div>
        <section class="panel">
          <div class="panel-header">
            <div class="panel-title">选择文件夹</div>
            <div class="panel-desc">
              旧文件夹作为基准，新文件夹作为目标。比较时使用相对路径判断文件是否对应。
            </div>
          </div>

          <div class="panel-body">
            <div class="folder-stack">
              <FolderPicker
                label="旧文件夹"
                tag="baseline"
                icon-text="旧"
                :value="store.state.compareForm.oldDir"
                placeholder="例如 D:\\workspace\\erp-old"
                hint="例如 D:\\workspace\\erp-old"
                @choose="store.pickFolder('oldDir')"
                @clear="store.clearFolder('oldDir')"
                @update:value="store.state.compareForm.oldDir = $event"
              />

              <FolderPicker
                label="新文件夹"
                tag="target"
                icon-text="新"
                :value="store.state.compareForm.newDir"
                placeholder="例如 D:\\workspace\\erp-new"
                hint="例如 D:\\workspace\\erp-new"
                @choose="store.pickFolder('newDir')"
                @clear="store.clearFolder('newDir')"
                @update:value="store.state.compareForm.newDir = $event"
              />
            </div>
          </div>
        </section>

        <CompareRules
          :include-ext-input="store.state.compareForm.includeExtInput"
          :ignore-dir-input="store.state.compareForm.ignoreDirInput"
          :compare-mode="store.state.compareForm.compareMode"
          :comparing="store.state.isComparing"
          @update:include-ext-input="store.state.compareForm.includeExtInput = $event"
          @update:ignore-dir-input="store.state.compareForm.ignoreDirInput = $event"
          @update:compare-mode="store.state.compareForm.compareMode = $event"
          @save-defaults="store.saveCurrentAsDefault"
          @compare="store.runCompare"
        />
      </div>

      <aside>
        <PresetPanel
          :presets="store.presets"
          :active-preset-id="store.state.activePresetId"
          :mode-label="store.currentModeLabel.value"
          :include-count="store.state.compareForm.includeExtInput ? store.state.compareForm.includeExtInput.split(',').filter(Boolean).length : 0"
          :ignore-count="store.state.compareForm.ignoreDirInput ? store.state.compareForm.ignoreDirInput.split(',').filter(Boolean).length : 0"
          @select="store.applyPreset"
        />
      </aside>
    </section>
  </section>
</template>
