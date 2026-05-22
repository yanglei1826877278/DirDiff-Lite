<script setup lang="ts">
import { computed, onMounted, type Component } from "vue";
import AppSidebar from "./components/AppSidebar.vue";
import AboutPage from "./pages/AboutPage.vue";
import ComparePage from "./pages/ComparePage.vue";
import ResultPage from "./pages/ResultPage.vue";
import SettingsPage from "./pages/SettingsPage.vue";
import { useCompareStore } from "./stores/compareStore";
import type { PageId } from "./types/diff";

const store = useCompareStore();

const pageMap: Record<PageId, Component> = {
  compare: ComparePage,
  result: ResultPage,
  settings: SettingsPage,
  about: AboutPage,
};

const currentPageComponent = computed(() => pageMap[store.state.page]);

onMounted(() => {
  void store.initialize();
});
</script>

<template>
  <div class="app">
    <AppSidebar :current-page="store.state.page" @select="store.setPage" />

    <teleport to="body">
      <transition name="toast-fade">
        <div
          v-if="store.state.banner"
          :class="['toast-notice', `is-${store.state.banner.tone}`]"
          role="status"
          aria-live="polite"
        >
          <div class="toast-mark" aria-hidden="true"></div>
          <div class="toast-copy">
            <strong>
              {{
                store.state.banner.tone === "success"
                  ? "操作成功"
                  : store.state.banner.tone === "error"
                    ? "出现问题"
                    : "提示"
              }}
            </strong>
            <span>{{ store.state.banner.text }}</span>
          </div>
        </div>
      </transition>
    </teleport>

    <teleport to="body">
      <transition name="progress-fade">
        <div v-if="store.state.compareProgress.visible" class="progress-overlay" aria-live="polite">
          <div class="progress-card">
            <div class="progress-header">
              <strong>正在比较文件夹</strong>
              <span>{{ store.state.compareProgress.percent }}%</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: `${store.state.compareProgress.percent}%` }"
              ></div>
            </div>
            <div class="progress-copy">
              {{ store.state.compareProgress.message }}
              <template v-if="store.state.compareProgress.total > 0">
                （{{ store.state.compareProgress.current }} / {{ store.state.compareProgress.total }}）
              </template>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <main class="main">
      <component :is="currentPageComponent" />
    </main>
  </div>
</template>
