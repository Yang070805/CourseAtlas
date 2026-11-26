<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  page: number
  totalPages: number
  totalItems: number
}>()

const emit = defineEmits<{ change: [page: number] }>()

/** 页码窗口：最多展示 5 个页码 */
const pages = computed<number[]>(() => {
  const list: number[] = []
  const start = Math.max(1, Math.min(props.page - 2, props.totalPages - 4))
  const end = Math.min(props.totalPages, start + 4)
  for (let i = start; i <= end; i++) list.push(i)
  return list
})
</script>

<template>
  <nav v-if="totalPages > 1 || totalItems > 0" class="pagination" aria-label="分页">
    <button
      class="page-btn"
      :disabled="page <= 1"
      aria-label="上一页"
      @click="emit('change', page - 1)"
    >
      <AppIcon name="chevronLeft" :size="16" />
    </button>
    <button
      v-for="p in pages"
      :key="p"
      class="page-btn"
      :class="{ active: p === page }"
      @click="emit('change', p)"
    >
      {{ p }}
    </button>
    <button
      class="page-btn"
      :disabled="page >= totalPages"
      aria-label="下一页"
      @click="emit('change', page + 1)"
    >
      <AppIcon name="chevronRight" :size="16" />
    </button>
    <span class="page-info">共 {{ totalItems }} 门 · {{ page }}/{{ totalPages }} 页</span>
  </nav>
</template>
