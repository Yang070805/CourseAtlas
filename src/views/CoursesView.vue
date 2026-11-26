<script setup lang="ts">
import { ref } from 'vue'
import type { Offering } from '@/types'
import { ALL_CATEGORIES } from '@/constants'
import { useCourseStore } from '@/stores/courses'
import { usePlannerStore } from '@/stores/planner'
import { useTermStore } from '@/stores/term'
import { useToast } from '@/composables/useToast'
import CourseFilters from '@/components/courses/CourseFilters.vue'
import CourseCard from '@/components/courses/CourseCard.vue'
import CourseDetailModal from '@/components/courses/CourseDetailModal.vue'
import PaginationBar from '@/components/common/PaginationBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const courseStore = useCourseStore()
const planner = usePlannerStore()
const termStore = useTermStore()
const toast = useToast()

const detailCourse = ref<Offering | null>(null)

function handleAdd(course: Offering) {
  const result = planner.addCourse(course, termStore.currentTermId)
  if (result.ok) {
    toast.push('success', `已加入模拟课表：${course.name}`)
    toast.push('info', '提示：学分需在「模拟课表」页按本人培养方案录入')
  } else if (result.reason === 'duplicate') {
    toast.push('warning', `《${course.name}》已在模拟课表中`)
  } else {
    toast.push('error', `无法加入：《${course.name}》与《${result.conflictName}》上课时间冲突`)
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">课程库</h1>
        <p class="page-subtitle">
          {{ termStore.currentTerm.label }} ·
          数据来自教务部公开选课手册，教师、时间、教室为真实排课信息。 加入课表时自动检测时间冲突。
        </p>
      </div>
    </div>

    <CourseFilters
      :keyword="courseStore.keyword"
      :units="courseStore.units"
      :unit="courseStore.unit"
      :categories="ALL_CATEGORIES"
      :selected-categories="courseStore.categories"
      :module="courseStore.module"
      :sort-by="courseStore.sortBy"
      :sort-order="courseStore.sortOrder"
      :result-count="courseStore.filtered.length"
      :loading="courseStore.loadState === 'loading'"
      @update:keyword="courseStore.setKeyword"
      @update:unit="courseStore.setUnit"
      @update:module="courseStore.setModule"
      @toggle-category="courseStore.toggleCategory"
      @update:sort-by="courseStore.setSort($event, courseStore.sortOrder)"
      @toggle-order="courseStore.toggleOrder"
      @reset="courseStore.resetFilters"
    />

    <!-- 加载中 -->
    <div
      v-if="courseStore.loadState === 'loading' || courseStore.loadState === 'idle'"
      class="course-grid"
    >
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <div class="sk-line w40" />
        <div class="sk-line w80" />
        <div class="sk-line w60" />
        <div class="sk-line w80" />
        <div class="sk-line w40" />
      </div>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="courseStore.loadState === 'error'" class="load-error card">
      <AppIcon name="alert" :size="22" />
      <div>
        <div class="le-title">课程数据加载失败</div>
        <div class="le-hint">
          请确认网络与数据文件可用（{{ courseStore.loadError }}），然后重试。
        </div>
      </div>
      <button class="btn btn-primary btn-sm" @click="courseStore.reloadTerm()">重新加载</button>
    </div>

    <!-- 列表 -->
    <div v-else-if="courseStore.paged.length" class="course-grid">
      <CourseCard
        v-for="course in courseStore.paged"
        :key="course.id"
        :course="course"
        :selected="planner.isSelected(termStore.currentTermId, course.id)"
        :review-count="courseStore.reviewCountOf(course.name)"
        @view="detailCourse = course"
        @add="handleAdd(course)"
      />
    </div>

    <EmptyState v-else icon="search" title="没有找到匹配的课程" hint="试试调整关键词或清除筛选条件">
      <button class="btn btn-ghost btn-sm" @click="courseStore.resetFilters">清除全部筛选</button>
    </EmptyState>

    <PaginationBar
      v-if="courseStore.loadState === 'ready'"
      :page="courseStore.page"
      :total-pages="courseStore.totalPages"
      :total-items="courseStore.filtered.length"
      @change="courseStore.setPage"
    />

    <CourseDetailModal :course="detailCourse" @close="detailCourse = null" @add="handleAdd" />
  </div>
</template>

<style scoped>
.course-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 16px;
}

.load-error {
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--c-danger);
}

.le-title {
  font-weight: 700;
}

.le-hint {
  font-size: 13px;
  color: var(--c-text-secondary);
  margin-top: 2px;
  word-break: break-all;
}

.load-error .btn {
  margin-left: auto;
}

@media (max-width: 768px) {
  .course-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
