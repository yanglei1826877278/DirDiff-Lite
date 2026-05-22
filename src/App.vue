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

    <main class="main">
      <transition name="banner-fade">
        <div
          v-if="store.state.banner"
          :class="['status-banner', `is-${store.state.banner.tone}`]"
        >
          {{ store.state.banner.text }}
        </div>
      </transition>

      <component :is="currentPageComponent" />
    </main>
  </div>
</template>
