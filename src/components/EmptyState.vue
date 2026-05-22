<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  actionLabel?: string;
}>();

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <section class="empty-state">
    <div class="empty-icon">D</div>
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <button v-if="actionLabel" class="btn primary" type="button" @click="emit('action')">
      {{ actionLabel }}
    </button>
  </section>
</template>
