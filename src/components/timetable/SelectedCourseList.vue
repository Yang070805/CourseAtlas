<script setup lang="ts">
import { computed } from 'vue'
import type { SelectedCourse } from '@/types'
import { semesterLabel } from '@/utils/credit'
import { usePlannerStore } from '@/stores/planner'
import BaseTag from '@/components/common/BaseTag.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const planner = usePlannerStore()

const emit = defineEmits<{ select: [course: SelectedCourse['course']] }>()

const sorted = computed(() =>
  [...planner.selected].sort(
    (a, b) => a.course.semester - b.course.semester || a.addedAt - b.addedAt,
  ),
)
</script>

<template>
  <section class="card selected-panel" aria-label="已选课程清单">
    <div class="card-title">
      <AppIcon name="check" :size="17" />
      已选课程（{{ planner.selected.length }} 门 / {{ planner.totalCredits }} 学分）
    </div>

    <EmptyState
      v-if="planner.selected.length === 0"
      icon="empty"
      title="还没有选择课程"
      hint="到课程库挑几门课，构建你的模拟课表"
    />

    <ul v-else class="sel-list">
      <li v-for="item in sorted" :key="item.id" class="sel-item">
        <button class="sel-main" @click="emit('select', item.course)">
          <span class="sel-name">
            {{ item.course.name }}
            <span v-if="item.source === 'custom'" class="sel-custom">自定义</span>
          </span>
          <span class="sel-meta">
            <BaseTag :category="item.course.category" />
            {{ semesterLabel(item.course.semester) }} · {{ item.course.credit }} 学分
          </span>
        </button>
        <button
          class="sel-remove"
          :aria-label="`移除 ${item.course.name}`"
          title="从模拟课表移除"
          @click="planner.removeCourse(item.id)"
        >
          <AppIcon name="trash" :size="15" />
        </button>
      </li>
    </ul>

    <button
      v-if="planner.selected.length > 0"
      class="btn btn-danger btn-sm btn-block sel-clear"
      @click="planner.clearAll"
    >
      清空模拟课表
    </button>
  </section>
</template>

<style scoped>
.sel-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sel-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  transition: border-color 0.15s;
}

.sel-item:hover {
  border-color: var(--c-primary);
}

.sel-main {
  flex: 1;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sel-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--c-text);
}

.sel-custom {
  font-size: 11px;
  color: var(--c-warning);
  border: 1px solid var(--c-warning);
  border-radius: 999px;
  padding: 0 7px;
  margin-left: 4px;
}

.sel-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--c-muted);
}

.sel-remove {
  border: none;
  background: none;
  color: var(--c-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  flex-shrink: 0;
}

.sel-remove:hover {
  color: var(--c-danger);
  background: var(--c-danger-soft);
}

.sel-clear {
  margin-top: 12px;
}
</style>
