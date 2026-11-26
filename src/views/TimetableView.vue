<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Offering, SelectedCourse } from '@/types'
import { SEMESTER_CREDIT_CAP } from '@/constants'
import { usePlannerStore } from '@/stores/planner'
import { useTermStore } from '@/stores/term'
import TimetableGrid from '@/components/timetable/TimetableGrid.vue'
import TimetableListView from '@/components/timetable/TimetableListView.vue'
import SelectedCourseList from '@/components/timetable/SelectedCourseList.vue'
import CourseDetailModal from '@/components/courses/CourseDetailModal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const planner = usePlannerStore()
const termStore = useTermStore()

const detailCourse = ref<Offering | null>(null)

const items = computed<SelectedCourse[]>(() => planner.byTerm.get(termStore.currentTermId) ?? [])
const stats = computed(() => planner.termStats(termStore.currentTermId))
const conflicts = computed(() => planner.conflictsOfTerm(termStore.currentTermId))

const statCards = computed(() => [
  { label: '本学期已选', value: `${stats.value.count} 门`, icon: 'book', tone: 'primary' },
  {
    label: '已录学分',
    value: `${stats.value.entered} / ${SEMESTER_CREDIT_CAP}`,
    icon: 'target',
    tone: stats.value.overCap ? 'danger' : 'success',
  },
  {
    label: '待补学分',
    value: `${stats.value.pending} 门`,
    icon: 'edit',
    tone: stats.value.pending > 0 ? 'warning' : 'success',
  },
  {
    label: '时间冲突',
    value: `${conflicts.value.length} 处`,
    icon: 'alert',
    tone: conflicts.value.length > 0 ? 'danger' : 'success',
  },
])
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">模拟课表</h1>
        <p class="page-subtitle">
          {{ termStore.currentTerm.label }} · 周一至周日、1-14 节真实排课。加入课程时拦截时间冲突；
          学分需按本人培养方案在右侧录入。
        </p>
      </div>
      <RouterLink to="/courses" class="btn btn-primary">
        <AppIcon name="plus" :size="15" />
        去课程库选课
      </RouterLink>
    </div>

    <div class="stat-row">
      <div v-for="card in statCards" :key="card.label" class="stat-card card" :class="card.tone">
        <AppIcon :name="card.icon" :size="20" />
        <div>
          <div class="stat-value">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <div class="tt-layout">
      <section class="card tt-main-card" aria-label="周课表">
        <div v-if="items.length === 0" class="tt-empty">
          <EmptyState
            icon="calendar"
            :title="`${termStore.currentTerm.label}课表还是空的`"
            hint="加入几门课程后，这里会生成你的周课表"
          >
            <RouterLink to="/courses" class="btn btn-primary btn-sm">浏览课程库</RouterLink>
          </EmptyState>
        </div>
        <template v-else>
          <TimetableGrid :courses="items.map((i) => i.course)" @select="detailCourse = $event" />
          <TimetableListView :items="items" />
          <p v-if="conflicts.length" class="tt-warning">
            <AppIcon name="alert" :size="14" />
            检测到 {{ conflicts.length }} 处时间冲突（红色虚线框），请移除冲突课程。
          </p>
        </template>
      </section>

      <SelectedCourseList :items="items" @select="detailCourse = $event.course" />
    </div>

    <CourseDetailModal :course="detailCourse" @close="detailCourse = null" />
  </div>
</template>

<style scoped>
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.stat-card.primary {
  color: var(--c-primary);
  background: var(--c-primary-soft);
  border-color: #e3cbdb;
}
.stat-card.success {
  color: var(--c-success);
  background: var(--c-success-soft);
  border-color: #b3e3d2;
}
.stat-card.warning {
  color: #8a5a00;
  background: var(--c-warning-soft);
  border-color: #f0d4a8;
}
.stat-card.danger {
  color: var(--c-danger);
  background: var(--c-danger-soft);
  border-color: #f3b9b4;
}

.stat-value {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
}

.stat-label {
  font-size: 12.5px;
  opacity: 0.85;
}

.tt-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  align-items: start;
}

.tt-main-card {
  overflow-x: auto;
  padding: 16px;
}

.tt-empty {
  padding: 20px 0;
}

.tt-warning {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--c-danger);
  font-size: 13.5px;
  background: var(--c-danger-soft);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
}

@media (max-width: 1100px) {
  .tt-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
