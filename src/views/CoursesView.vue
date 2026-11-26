<script setup lang="ts">
import { ref } from 'vue'
import type { Course } from '@/types'
import { useCourseStore } from '@/stores/courses'
import { usePlannerStore } from '@/stores/planner'
import { useToast } from '@/composables/useToast'
import CourseFilters from '@/components/courses/CourseFilters.vue'
import CourseCard from '@/components/courses/CourseCard.vue'
import CourseDetailModal from '@/components/courses/CourseDetailModal.vue'
import PaginationBar from '@/components/common/PaginationBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const courseStore = useCourseStore()
const planner = usePlannerStore()
const toast = useToast()

const detailCourse = ref<Course | null>(null)

const categories: Course['category'][] = [
  '通识必修',
  '通识选修',
  '学科基础',
  '专业必修',
  '专业选修',
  '实践环节',
]

function openDetail(course: Course) {
  detailCourse.value = course
}

function handleAdd(course: Course) {
  const result = planner.addCourse(course)
  if (result.ok) {
    toast.push('success', `已加入模拟课表：${course.name}`)
    const missing = course.prerequisites.filter((id) => !planner.courses.some((c) => c.id === id))
    if (missing.length > 0) {
      toast.push(
        'warning',
        `提示：《${course.name}》有 ${missing.length} 门前置课程尚未加入课表，详见学分规划页`,
      )
    }
  } else if (result.reason === 'duplicate') {
    toast.push('warning', `《${course.name}》已在模拟课表中`)
  } else if (result.reason === 'conflict') {
    toast.push('error', `无法加入：《${course.name}》与《${result.conflictName}》上课时间冲突`)
  } else {
    toast.push(
      'error',
      `无法加入：第${result.detail?.semester}学期学分将超过上限 ${result.detail?.cap}（当前已选 ${result.detail?.selected}）`,
    )
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">课程库</h1>
        <p class="page-subtitle">
          浏览全校课程，点击「加入模拟课表」开始你的选课规划，系统会自动检测时间冲突与学分上限。
        </p>
      </div>
    </div>

    <CourseFilters
      :keyword="courseStore.keyword"
      :colleges="courseStore.colleges"
      :selected-colleges="courseStore.selectedColleges"
      :categories="categories"
      :selected-categories="courseStore.selectedCategories"
      :sort-by="courseStore.sortBy"
      :sort-order="courseStore.sortOrder"
      @update:keyword="courseStore.setKeyword"
      @toggle-college="courseStore.toggleCollege"
      @toggle-category="courseStore.toggleCategory"
      @update:sort-by="courseStore.setSort($event, courseStore.sortOrder)"
      @toggle-order="
        courseStore.setSort(courseStore.sortBy, courseStore.sortOrder === 'asc' ? 'desc' : 'asc')
      "
      @reset="courseStore.resetFilters"
    >
      <template #count>共 {{ courseStore.filtered.length }} 门课程</template>
    </CourseFilters>

    <div v-if="courseStore.paged.length" class="course-grid">
      <CourseCard
        v-for="course in courseStore.paged"
        :key="course.id"
        :course="course"
        :selected="planner.isSelected(course.id)"
        @view="openDetail(course)"
        @add="handleAdd(course)"
      />
    </div>

    <EmptyState v-else icon="search" title="没有找到匹配的课程" hint="试试调整关键词或清除筛选条件">
      <button class="btn btn-ghost btn-sm" @click="courseStore.resetFilters">清除全部筛选</button>
    </EmptyState>

    <PaginationBar
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
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .course-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
