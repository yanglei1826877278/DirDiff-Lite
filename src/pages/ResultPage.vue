<script setup lang="ts">
import EmptyState from "../components/EmptyState.vue";
import AppTopbar from "../components/AppTopbar.vue";
import ResultTable from "../components/ResultTable.vue";
import StatCard from "../components/StatCard.vue";
import { useCompareStore } from "../stores/compareStore";
import type { ResultFilter } from "../types/diff";

const store = useCompareStore();

const filterItems: Array<{ key: ResultFilter; label: string; desc: string }> = [
  { key: "all", label: "全部变化", desc: "新增 / 删除 / 修改" },
  { key: "added", label: "新增文件", desc: "新目录独有" },
  { key: "deleted", label: "删除文件", desc: "旧目录独有" },
  { key: "modified", label: "修改文件", desc: "内容发生变化" },
];
</script>

<template>
  <section class="page-shell">
    <template v-if="!store.state.hasCompared">
      <EmptyState
        title="还没有比较结果"
        description="先去开始比较页选择两个文件夹，做一次本地扫描后，这里就会展示新增、删除和修改文件。"
        action-label="去开始比较"
        @action="store.setPage('compare')"
      />
    </template>

    <template v-else>
      <AppTopbar
        eyebrow="Diff result"
        title="比较结果"
        subtitle="查看新增、删除和修改文件。复制变更路径，或者导出简单 TXT 报告。"
      >
        <template #actions>
          <button class="btn" type="button" @click="store.setPage('compare')">重新比较</button>
          <button class="btn primary" type="button" @click="store.exportReport">导出 TXT</button>
        </template>
      </AppTopbar>

      <section class="stats">
        <StatCard label="新增文件" :count="store.resultCounts.value.added" tone="add" />
        <StatCard label="删除文件" :count="store.resultCounts.value.deleted" tone="del" />
        <StatCard label="修改文件" :count="store.resultCounts.value.modified" tone="mod" />
        <StatCard label="未变化文件" :count="store.resultCounts.value.unchanged" tone="plain" />
      </section>

      <section class="layout-wide">
        <aside class="panel">
          <div class="panel-header">
            <div class="panel-title">结果筛选</div>
            <div class="panel-desc">按状态或后缀缩小范围，方便复制发布清单。</div>
          </div>

          <div class="panel-body">
            <div class="filter-list">
              <button
                v-for="item in filterItems"
                :key="item.key"
                :class="['filter-item', { active: store.state.resultFilter === item.key }]"
                type="button"
                @click="store.state.resultFilter = item.key"
              >
                <div>
                  <strong>{{ item.label }}</strong>
                  <span>{{ item.desc }}</span>
                </div>
                <div class="count">{{ store.getFilterCount(item.key) }}</div>
              </button>
            </div>

            <div class="field field-space">
              <label>后缀过滤</label>
              <select v-model="store.state.extFilter">
                <option value="all">全部后缀</option>
                <option v-for="ext in store.availableExtensions.value" :key="ext" :value="ext">
                  {{ ext }}
                </option>
              </select>
            </div>

            <div class="summary">
              <div class="summary-title">快速操作</div>
              <div class="stack-actions">
                <button class="btn" type="button" @click="store.copyCurrentList">复制当前列表</button>
                <button class="btn" type="button" @click="store.copyAddedAndModified">
                  复制新增 + 修改
                </button>
                <button class="btn primary" type="button" @click="store.exportReport">导出 TXT 报告</button>
              </div>
            </div>
          </div>
        </aside>

        <section class="panel">
          <div class="panel-header">
            <div class="panel-title">变化文件</div>
            <div class="panel-desc">
              Old: {{ store.state.lastCompareOptions?.oldDir }}　New:
              {{ store.state.lastCompareOptions?.newDir }}
            </div>
          </div>

          <div class="panel-body">
            <div class="result-toolbar">
              <input
                v-model="store.state.searchQuery"
                placeholder="搜索路径，例如 UserService、order、.jsp"
              />
              <div class="action-row">
                <button class="btn" type="button" @click="store.setPage('compare')">重新比较</button>
                <button class="btn primary" type="button" @click="store.exportReport">导出清单</button>
              </div>
            </div>

            <ResultTable :files="store.filteredFiles.value" @copy="store.copyPath" />

            <div class="footer-line">
              <span>
                当前显示 {{ store.filteredFiles.value.length }} 个文件，共
                {{ store.resultCounts.value.total }} 个变化文件。
              </span>
              <span class="footer-hint">未变化文件仅统计，不进入列表。</span>
            </div>
          </div>
        </section>
      </section>
    </template>
  </section>
</template>
