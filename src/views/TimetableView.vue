<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Course } from '@/types'
import { usePlannerStore } from '@/stores/planner'
import TimetableGrid from '@/components/timetable/TimetableGrid.vue'
import TimetableListView from '@/components/timetable/TimetableListView.vue'
import SelectedCourseList from '@/components/timetable/SelectedCourseList.vue'
import CourseDetailModal from '@/components/courses/CourseDetailModal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const planner = usePlannerStore()
const detailCourse = ref<Course | null>(null)

const statCards = computed(() => [
  {
    label: '已选课程',
    value: `${planner.selected.length} 门`,
    icon: 'book',
    tone: 'primary',
  },
  {
    label: '总学分',
    value: `${planner.totalCredits} / 156`,
    icon: 'target',
    tone: 'success',
  },
  {
    label: '时间冲突',
    value: `${planner.conflictPairs.length} 处`,
    icon: 'alert',
    tone: planner.conflictPairs.length > 0 ? 'danger' : 'success',
  },
  {
    label: '前置课程提醒',
    value: `${planner.prereqWarnings.size} 门`,
    icon: 'clock',
    tone: planner.prereqWarnings.size > 0 ? 'warning' : 'success',
  },
])
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">模拟课表</h1>
        <p class="page-subtitle">
          以周课表网格查看已选课程。加入课程时系统会拦截时间冲突；手机端自动切换为按天列表视图。
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
        <div v-if="planner.courses.length === 0" class="tt-empty">
          <EmptyState
            icon="calendar"
            title="课表还是空的"
            hint="加入几门课程后，这里会生成你的周课表"
          >
            <RouterLink to="/courses" class="btn btn-primary btn-sm">浏览课程库</RouterLink>
          </EmptyState>
        </div>
        <template v-else>
          <TimetableGrid :courses="planner.courses" @select="detailCourse = $event" />
          <TimetableListView :courses="planner.courses" @select="detailCourse = $event" />
          <p v-if="planner.conflictPairs.length" class="tt-warning">
            <AppIcon name="alert" :size="14" />
            检测到 {{ planner.conflictPairs.length }} 处时间冲突（红色虚线框），请移除冲突课程。
          </p>
        </template>
      </section>

      <SelectedCourseList @select="detailCourse = $event" />
    </div>

    <CourseDetailModal :course="detailCourse" @close="detailCourse = null" />
  </div>
</template>

<style scoped>
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
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
  border-color: #bac8ff;
}
.stat-card.success {
  color: var(--c-success);
  background: var(--c-success-soft);
  border-color: #a6e9cc;
}
.stat-card.warning {
  color: var(--c-warning);
  background: var(--c-warning-soft);
  border-color: #ffd8a8;
}
.stat-card.danger {
  color: var(--c-danger);
  background: var(--c-danger-soft);
  border-color: #f6b3b0;
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
  grid-template-columns: minmax(0, 1fr) 320px;
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
