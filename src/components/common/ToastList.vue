<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { items } = useToast()
</script>

<template>
  <div class="toast-host" aria-live="polite">
    <TransitionGroup name="toast-list">
      <div v-for="item in items" :key="item.id" class="toast" :class="item.type">
        <span class="dot" />
        <span>{{ item.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.25s ease;
}
.toast-list-enter-from,
.toast-list-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
