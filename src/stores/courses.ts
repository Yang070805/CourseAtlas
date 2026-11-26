import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { CourseCategory, SortBy, SortOrder } from '@/types'
import { CATALOG } from '@/data/courses'

export const PAGE_SIZE = 9

export const useCourseStore = defineStore('courses', () => {
  // ---- 状态 ----
  const allCourses = ref(CATALOG)
  const keyword = ref('')
  const selectedColleges = ref<string[]>([])
  const selectedCategories = ref<CourseCategory[]>([])
  const sortBy = ref<SortBy>('semester')
  const sortOrder = ref<SortOrder>('asc')
  const page = ref(1)

  // ---- 派生 ----
  const colleges = computed(() => [...new Set(allCourses.value.map((c) => c.college))].sort())

  const filtered = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    return allCourses.value.filter((c) => {
      if (kw) {
        const hit =
          c.name.toLowerCase().includes(kw) ||
          c.code.toLowerCase().includes(kw) ||
          c.teacher.toLowerCase().includes(kw)
        if (!hit) return false
      }
      if (selectedColleges.value.length > 0 && !selectedColleges.value.includes(c.college))
        return false
      if (selectedCategories.value.length > 0 && !selectedCategories.value.includes(c.category)) {
        return false
      }
      return true
    })
  })

  const sorted = computed(() => {
    const arr = [...filtered.value]
    const dir = sortOrder.value === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      switch (sortBy.value) {
        case 'credit':
          return (a.credit - b.credit) * dir || a.semester - b.semester
        case 'hours':
          return (a.hours - b.hours) * dir || a.semester - b.semester
        case 'name':
          return a.name.localeCompare(b.name, 'zh-CN') * dir
        case 'semester':
        default:
          return (a.semester - b.semester) * dir || a.code.localeCompare(b.code)
      }
    })
    return arr
  })

  const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / PAGE_SIZE)))

  const paged = computed(() => {
    const start = (page.value - 1) * PAGE_SIZE
    return sorted.value.slice(start, start + PAGE_SIZE)
  })

  /** 关键词或筛选变化时回到第一页 */
  function resetPage() {
    page.value = 1
  }

  // ---- 动作 ----
  function setKeyword(value: string) {
    keyword.value = value
    resetPage()
  }

  function toggleCollege(college: string) {
    const i = selectedColleges.value.indexOf(college)
    if (i >= 0) selectedColleges.value.splice(i, 1)
    else selectedColleges.value.push(college)
    resetPage()
  }

  function toggleCategory(category: CourseCategory) {
    const i = selectedCategories.value.indexOf(category)
    if (i >= 0) selectedCategories.value.splice(i, 1)
    else selectedCategories.value.push(category)
    resetPage()
  }

  function setSort(by: SortBy, order: SortOrder) {
    sortBy.value = by
    sortOrder.value = order
    resetPage()
  }

  function setPage(p: number) {
    page.value = Math.min(Math.max(1, p), totalPages.value)
  }

  function resetFilters() {
    keyword.value = ''
    selectedColleges.value = []
    selectedCategories.value = []
    sortBy.value = 'semester'
    sortOrder.value = 'asc'
    resetPage()
  }

  return {
    allCourses,
    colleges,
    keyword,
    selectedColleges,
    selectedCategories,
    sortBy,
    sortOrder,
    page,
    filtered,
    sorted,
    totalPages,
    paged,
    setKeyword,
    toggleCollege,
    toggleCategory,
    setSort,
    setPage,
    resetFilters,
  }
})
