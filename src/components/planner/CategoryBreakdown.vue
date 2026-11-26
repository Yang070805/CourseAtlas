<script setup lang="ts">
import { computed } from 'vue'
import type { CourseCategory } from '@/types'
import { ALL_CATEGORIES } from '@/constants'
import { usePlannerStore } from '@/stores/planner'
import { useTermStore } from '@/stores/term'
import BaseTag from '@/components/common/BaseTag.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const planner = usePlannerStore()
const termStore = useTermStore()

const grouped = computed(() =>
  ALL_CATEGORIES.map((category: CourseCategory) => {
    const items = planner.selected.filter((s) => s.course.category === category)
    return {
      category,
      items: [...items].sort(
        (a, b) =>
          a.termId.localeCompare(b.termId) || a.course.name.localeCompare(b.course.name, 'zh-CN'),
      ),
      entered: Math.round(items.reduce((sum, i) => sum + (i.credit ?? 0), 0) * 10) / 10,
    }
  }).filter((g) => g.items.length > 0),
)

const totalCount = computed(() => planner.selected.length)

function termLabel(termId: string) {
  return termStore.terms.find((t) => t.id === termId)?.season === '秋' ? '秋' : '春'
}
</script>

<template>
  <section class="card" aria-label="已选课程分类明细">
    <div class="card-title">
      <AppIcon name="layers" :size="16" />
      已选课程明细（全部学期 {{ totalCount }} 门）
    </div>

    <div v-if="totalCount === 0" class="none">
      还没有选课记录。
      <RouterLink to="/courses" class="goto">去课程库选课 →</RouterLink>
    </div>

    <div v-for="group in grouped" :key="group.category" class="cat-group">
      <div class="cat-group-head">
        <BaseTag :category="group.category" />
        <span class="cat-group-credits">
          {{ group.items.length }} 门 · 已录 {{ group.entered }} 学分
        </span>
      </div>
      <ul class="detail-list">
        <li v-for="item in group.items" :key="item.id">
          <span class="d-term">{{ termLabel(item.termId) }}</span>
          <span class="d-name">{{ item.course.name }}</span>
          <span class="d-teacher">{{ item.course.teacher || '待定' }}</span>
          <span class="d-credit" :class="{ missing: item.credit === null }">
            {{ item.credit === null ? '待补' : `${item.credit} 学分` }}
          </span>
        </li>
      </ul>
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

.d-term {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--c-primary-soft);
  color: var(--c-primary);
  font-size: 11.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.d-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.d-teacher {
  color: var(--c-muted);
  font-size: 12.5px;
  white-space: nowrap;
}

.d-credit {
  font-weight: 700;
  color: var(--c-primary);
  white-space: nowrap;
  font-size: 12.5px;
}

.d-credit.missing {
  color: var(--c-muted);
  font-weight: 500;
}

@media (max-width: 768px) {
  .d-teacher {
    display: none;
  }
}
</style>
