<script setup lang="ts">
import AppIcon from './AppIcon.vue'

withDefaults(
  defineProps<{
    icon?: string
    title: string
    hint?: string
  }>(),
  { icon: 'empty' },
)
</script>

<template>
  <div class="empty-state">
    <AppIcon :name="icon" :size="44" />
    <div class="title">{{ title }}</div>
    <div v-if="hint">{{ hint }}</div>
    <slot />
  </div>
</template>
