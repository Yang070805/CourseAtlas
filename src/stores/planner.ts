import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { AddResult, Course, SelectedCourse } from '@/types'
import { SEMESTER_CREDIT_CAP, STORAGE_KEY } from '@/constants'
import {
  exceedsCreditCap,
  findConflict,
  missingPrerequisites,
  semesterCredits,
} from '@/utils/conflict'
import { creditsByCategory, creditsPerSemester, totalCredits } from '@/utils/credit'
import { loadJSON, removeKey, saveJSON } from '@/utils/storage'
import { useCourseStore } from './courses'

export const usePlannerStore = defineStore('planner', () => {
  // ---- 状态（从 localStorage 恢复，实现数据持久化）----
  const stored = loadJSON<SelectedCourse[]>(STORAGE_KEY)
  const selected = ref<SelectedCourse[]>(Array.isArray(stored) ? stored : [])

  // ---- 派生 ----
  const courses = computed<Course[]>(() => selected.value.map((s) => s.course))

  const totalCreditsValue = computed(() => totalCredits(courses.value))

  const creditsByCat = computed(() => creditsByCategory(courses.value))

  const perSemester = computed(() => creditsPerSemester(courses.value))

  const selectedIds = computed(() => new Set(selected.value.map((s) => s.id)))

  /** 已选课程之间的时间冲突对（正常添加流程会拦截，这里兜底展示） */
  const conflictPairs = computed(() => {
    const pairs: Array<{ a: Course; b: Course }> = []
    const list = courses.value
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (findConflict(list[i], [list[j]])) pairs.push({ a: list[i], b: list[j] })
      }
    }
    return pairs
  })

  /** 前置要求未满足的已选课程 */
  const prereqWarnings = computed(() => {
    const catalog = useCourseStore().allCourses
    return missingPrerequisites(courses.value, catalog)
  })

  // ---- 动作 ----
  function persist() {
    saveJSON(STORAGE_KEY, selected.value)
  }

  function addCourse(course: Course, source: 'catalog' | 'custom' = 'catalog'): AddResult {
    if (selectedIds.value.has(course.id)) {
      return { ok: false, reason: 'duplicate' }
    }
    const conflict = findConflict(course, courses.value)
    if (conflict) {
      return { ok: false, reason: 'conflict', conflictName: conflict.name }
    }
    if (exceedsCreditCap(course, courses.value)) {
      return {
        ok: false,
        reason: 'credit-cap',
        detail: {
          semester: course.semester,
          selected: semesterCredits(courses.value, course.semester),
          cap: SEMESTER_CREDIT_CAP,
        },
      }
    }
    selected.value.push({ id: course.id, course, source, addedAt: Date.now() })
    persist()
    return { ok: true }
  }

  function removeCourse(id: string) {
    const i = selected.value.findIndex((s) => s.id === id)
    if (i >= 0) {
      selected.value.splice(i, 1)
      persist()
    }
  }

  function clearAll() {
    selected.value = []
    removeKey(STORAGE_KEY)
  }

  function isSelected(id: string): boolean {
    return selectedIds.value.has(id)
  }

  return {
    selected,
    courses,
    totalCredits: totalCreditsValue,
    creditsByCategory: creditsByCat,
    perSemester,
    conflictPairs,
    prereqWarnings,
    addCourse,
    removeCourse,
    clearAll,
    isSelected,
  }
})
