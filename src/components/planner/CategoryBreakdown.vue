<script setup lang="ts">
import { computed } from 'vue'
import type { CourseCategory } from '@/types'
import { usePlannerStore } from '@/stores/planner'
import { semesterLabel } from '@/utils/credit'
import BaseTag from '@/components/common/BaseTag.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const planner = usePlannerStore()

const categories: CourseCategory[] = [
  '通识必修',
  '通识选修',
  '学科基础',
  '专业必修',
  '专业选修',
  '实践环节',
]

const grouped = computed(() =>
  categories.map((cat) => ({
    category: cat,
    items: planner.courses
      .filter((c) => c.category === cat)
      .sort((a, b) => a.semester - b.semester),
  })),
)

const totalRows = computed(() => grouped.value.reduce((n, g) => n + g.items.length, 0))
</script>

<template>
  <section class="card" aria-label="已选课程分类明细">
    <div class="card-title">
      <AppIcon name="book" :size="16" />
      已选课程明细（{{ totalRows }} 门）
    </div>

    <div v-if="totalRows === 0" class="none">
      还没有已选课程，去课程库挑几门吧。
      <RouterLink to="/courses" class="goto">去选课 →</RouterLink>
    </div>

    <div v-for="group in grouped" :key="group.category" class="cat-group">
      <template v-if="group.items.length">
        <div class="cat-group-head">
          <BaseTag :category="group.category" />
          <span class="cat-group-credits">
            {{ group.items.reduce((s, c) => s + c.credit, 0) }} 学分
          </span>
        </div>
        <ul class="detail-list">
          <li v-for="c in group.items" :key="c.id">
            <span class="d-name">{{ c.name }}</span>
            <span class="d-sem">{{ semesterLabel(c.semester) }}</span>
            <span class="d-credit">{{ c.credit }} 学分</span>
          </li>
        </ul>
      </template>
    </div>
  </section>
</template>

<style scoped>
.none {
  color: var(--c-muted);
  font-size: 14px;
}

.goto {
  font-weight: 600;
}

.cat-group {
  margin-bottom: 14px;
}

.cat-group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.cat-group-credits {
  font-size: 12.5px;
  color: var(--c-muted);
}

.detail-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.detail-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  font-size: 13.5px;
  border-bottom: 1px solid var(--c-border);
}

.detail-list li:last-child {
  border-bottom: none;
}

.d-name {
  flex: 1;
  font-weight: 500;
}

.d-sem {
  color: var(--c-muted);
  font-size: 12.5px;
}

.d-credit {
  font-weight: 700;
  color: var(--c-primary);
  white-space: nowrap;
}
</style>
