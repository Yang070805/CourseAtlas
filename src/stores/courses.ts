import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import type { CourseCategory, Offering, Review, SortBy, SortOrder } from '@/types'
import { REVIEWS_URL, TERM_DATA_URL } from '@/constants'
import { useTermStore } from './term'

interface TermPayload {
  term: string
  label: string
  source: string
  count: number
  courses: Offering[]
}

interface ReviewsPayload {
  term: string
  source: string
  count: number
  byName: Record<string, Review[]>
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

export const PAGE_SIZE = 12

export const useCourseStore = defineStore('courses', () => {
  const termStore = useTermStore()

  // ---- 学期数据缓存（按需懒加载）----
  const caches = ref<Record<string, Offering[]>>({})
  const loadStates = ref<Record<string, LoadState>>({})
  const loadErrors = ref<Record<string, string>>({})

  // ---- 评价数据（全局一份，来自枝上攻略）----
  const reviews = ref<ReviewsPayload | null>(null)
  const reviewState = ref<LoadState>('idle')

  // ---- 筛选与分页 ----
  const keyword = ref('')
  const unit = ref('')
  const categories = ref<CourseCategory[]>([])
  const module = ref('')
  const sortBy = ref<SortBy>('name')
  const sortOrder = ref<SortOrder>('asc')
  const page = ref(1)

  const currentTermId = computed(() => termStore.currentTermId)
  const termCourses = computed<Offering[]>(() => caches.value[currentTermId.value] ?? [])
  const loadState = computed<LoadState>(() => loadStates.value[currentTermId.value] ?? 'idle')
  const loadError = computed(() => loadErrors.value[currentTermId.value] ?? '')

  async function loadTerm(termId: string) {
    if (loadStates.value[termId] === 'loading' || caches.value[termId]) return
    loadStates.value = { ...loadStates.value, [termId]: 'loading' }
    try {
      const res = await fetch(TERM_DATA_URL(termId))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const payload = (await res.json()) as TermPayload
      caches.value = { ...caches.value, [termId]: payload.courses }
      loadStates.value = { ...loadStates.value, [termId]: 'ready' }
    } catch (e) {
      loadStates.value = { ...loadStates.value, [termId]: 'error' }
      loadErrors.value = {
        ...loadErrors.value,
        [termId]: e instanceof Error ? e.message : String(e),
      }
    }
  }

  function reloadTerm() {
    const id = currentTermId.value
    const next = { ...caches.value }
    delete next[id]
    caches.value = next
    loadStates.value = { ...loadStates.value, [id]: 'idle' }
    void loadTerm(id)
  }

  async function loadReviews() {
    if (reviewState.value === 'loading' || reviews.value) return
    reviewState.value = 'loading'
    try {
      const res = await fetch(REVIEWS_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      reviews.value = (await res.json()) as ReviewsPayload
      reviewState.value = 'ready'
    } catch {
      reviewState.value = 'error'
    }
  }

  /** 切换到学期时自动加载该学期数据 */
  watch(
    currentTermId,
    (id) => {
      page.value = 1
      keyword.value = ''
      unit.value = ''
      categories.value = []
      module.value = ''
      void loadTerm(id)
    },
    { immediate: true },
  )

  void loadReviews()

  // ---- 派生 ----
  const units = computed(() => [...new Set(termCourses.value.map((c) => c.unit))].sort())

  const filtered = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    return termCourses.value.filter((c) => {
      if (kw) {
        const hit =
          c.name.toLowerCase().includes(kw) ||
          c.code.toLowerCase().includes(kw) ||
          c.teacher.toLowerCase().includes(kw) ||
          c.room.toLowerCase().includes(kw)
        if (!hit) return false
      }
      if (unit.value && c.unit !== unit.value) return false
      if (categories.value.length > 0 && !categories.value.includes(c.category)) return false
      if (module.value && c.module !== module.value) return false
      return true
    })
  })

  const sorted = computed(() => {
    const arr = [...filtered.value]
    const dir = sortOrder.value === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      switch (sortBy.value) {
        case 'unit':
          return (
            a.unit.localeCompare(b.unit, 'zh-CN') * dir || a.name.localeCompare(b.name, 'zh-CN')
          )
        case 'capacity': {
          const av = a.capacity ?? a.crossCapacity ?? -1
          const bv = b.capacity ?? b.crossCapacity ?? -1
          return (av - bv) * dir
        }
        case 'name':
        default:
          return a.name.localeCompare(b.name, 'zh-CN') * dir || a.code.localeCompare(b.code)
      }
    })
    return arr
  })

  const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / PAGE_SIZE)))

  const paged = computed(() => {
    const start = (page.value - 1) * PAGE_SIZE
    return sorted.value.slice(start, start + PAGE_SIZE)
  })

  const reviewCountOf = computed(() => {
    const map = reviews.value?.byName ?? {}
    return (name: string) => map[name]?.length ?? 0
  })

  function reviewsFor(name: string): Review[] {
    return reviews.value?.byName[name] ?? []
  }

  // ---- 动作 ----
  function setKeyword(value: string) {
    keyword.value = value
    page.value = 1
  }
  function setUnit(value: string) {
    unit.value = value
    page.value = 1
  }
  function toggleCategory(category: CourseCategory) {
    const i = categories.value.indexOf(category)
    if (i >= 0) categories.value.splice(i, 1)
    else categories.value.push(category)
    page.value = 1
  }
  function setModule(value: string) {
    module.value = value
    page.value = 1
  }
  function setSort(by: SortBy, order: SortOrder) {
    sortBy.value = by
    sortOrder.value = order
    page.value = 1
  }
  function toggleOrder() {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    page.value = 1
  }
  function setPage(p: number) {
    page.value = Math.min(Math.max(1, p), totalPages.value)
  }
  function resetFilters() {
    keyword.value = ''
    unit.value = ''
    categories.value = []
    module.value = ''
    sortBy.value = 'name'
    sortOrder.value = 'asc'
    page.value = 1
  }

  return {
    caches,
    reviews,
    reviewState,
    keyword,
    unit,
    categories,
    module,
    sortBy,
    sortOrder,
    page,
    termCourses,
    loadState,
    loadError,
    units,
    filtered,
    sorted,
    totalPages,
    paged,
    reviewCountOf,
    reviewsFor,
    loadTerm,
    reloadTerm,
    loadReviews,
    setKeyword,
    setUnit,
    toggleCategory,
    setModule,
    setSort,
    toggleOrder,
    setPage,
    resetFilters,
  }
})
