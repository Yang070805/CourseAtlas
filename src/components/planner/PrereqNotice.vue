<script setup lang="ts">
import { computed } from 'vue'
import { usePlannerStore } from '@/stores/planner'
import AppIcon from '@/components/common/AppIcon.vue'

const planner = usePlannerStore()

const warnings = computed(() => {
  const list: Array<{ courseName: string; missingNames: string[] }> = []
  for (const [courseId, missing] of planner.prereqWarnings) {
    const course = planner.courses.find((c) => c.id === courseId)
    if (!course) continue
    list.push({ courseName: course.name, missingNames: missing.map((m) => m.name) })
  }
  return list
})
</script>

<template>
  <section class="card" aria-label="前置课程提醒">
    <div class="card-title">
      <AppIcon name="alert" :size="16" />
      前置课程提醒
    </div>

    <p v-if="warnings.length === 0" class="ok">
      <AppIcon name="check" :size="14" />
      已选课程的前置要求均已满足
    </p>

    <ul v-else class="warn-list">
      <li v-for="w in warnings" :key="w.courseName">
        <span class="warn-course">{{ w.courseName }}</span>
        缺少前置课程：
        <strong>{{ w.missingNames.join('、') }}</strong>
        <RouterLink to="/courses" class="goto">去补选 →</RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.ok {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--c-success);
  font-size: 14px;
}

.warn-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13.5px;
  color: var(--c-text-secondary);
}

.warn-list li {
  background: var(--c-warning-soft);
  border: 1px solid #ffd8a8;
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  line-height: 1.6;
}

.warn-course {
  font-weight: 700;
  color: var(--c-text);
}

.goto {
  margin-left: 8px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
