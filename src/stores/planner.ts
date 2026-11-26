import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { AddResult, Offering, SelectedCourse } from '@/types'
import { SEMESTER_CREDIT_CAP, STORAGE_KEY_SELECTED } from '@/constants'
import { findConflict } from '@/utils/conflict'
import { countPendingCredits, creditsByCategory, sumEnteredCredits } from '@/utils/credit'
import { loadJSON, removeKey, saveJSON } from '@/utils/storage'

interface TermStats {
  count: number
  entered: number
  pending: number
  overCap: boolean
}

export const usePlannerStore = defineStore('planner', () => {
  // ---- 状态：全部学期的选课记录（localStorage 恢复）----
  const stored = loadJSON<SelectedCourse[]>(STORAGE_KEY_SELECTED)
  const selected = ref<SelectedCourse[]>(Array.isArray(stored) ? stored : [])

  function persist() {
    saveJSON(STORAGE_KEY_SELECTED, selected.value)
  }

  // ---- 派生 ----
  const byTerm = computed(() => {
    const map = new Map<string, SelectedCourse[]>()
    for (const item of selected.value) {
      const list = map.get(item.termId) ?? []
      list.push(item)
      map.set(item.termId, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.addedAt - b.addedAt)
    return map
  })

  function coursesOfTerm(termId: string): Offering[] {
    return (byTerm.value.get(termId) ?? []).map((s) => s.course)
  }

  function termStats(termId: string): TermStats {
    const list = byTerm.value.get(termId) ?? []
    const entered = sumEnteredCredits(list)
    return {
      count: list.length,
      entered,
      pending: countPendingCredits(list),
      overCap: entered > SEMESTER_CREDIT_CAP,
    }
  }

  /** 全部学期合计（按录入的学分统计，用于培养方案进度） */
  const allEnteredCredits = computed(() => sumEnteredCredits(selected.value))
  const allPendingCount = computed(() => countPendingCredits(selected.value))
  const creditsByCategoryAll = computed(() => creditsByCategory(selected.value))
  const pendingItems = computed(() => selected.value.filter((s) => s.credit === null))

  function conflictsOfTerm(termId: string): Array<{ a: Offering; b: Offering }> {
    const list = coursesOfTerm(termId)
    const pairs: Array<{ a: Offering; b: Offering }> = []
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (findConflict(list[i], [list[j]])) pairs.push({ a: list[i], b: list[j] })
      }
    }
    return pairs
  }

  // ---- 动作 ----
  function makeId(termId: string, courseId: string) {
    return `${termId}:${courseId}`
  }

  function isSelected(termId: string, courseId: string): boolean {
    const id = makeId(termId, courseId)
    return selected.value.some((s) => s.id === id)
  }

  function addCourse(course: Offering, termId: string): AddResult {
    const id = makeId(termId, course.id)
    if (selected.value.some((s) => s.id === id)) {
      return { ok: false, reason: 'duplicate' }
    }
    const conflict = findConflict(course, coursesOfTerm(termId))
    if (conflict) {
      return { ok: false, reason: 'conflict', conflictName: conflict.name }
    }
    selected.value.push({
      id,
      termId,
      course,
      credit: null,
      source: 'catalog',
      addedAt: Date.now(),
    })
    persist()
    return { ok: true }
  }

  /** 自定义课程（学分必填） */
  function addCustomCourse(course: Offering, termId: string, credit: number): AddResult {
    const conflict = findConflict(course, coursesOfTerm(termId))
    if (conflict) {
      return { ok: false, reason: 'conflict', conflictName: conflict.name }
    }
    selected.value.push({
      id: makeId(termId, course.id),
      termId,
      course,
      credit,
      source: 'custom',
      addedAt: Date.now(),
    })
    persist()
    return { ok: true }
  }

  function setCredit(id: string, credit: number | null) {
    const item = selected.value.find((s) => s.id === id)
    if (!item) return
    item.credit = credit
    persist()
  }

  function removeCourse(id: string) {
    const i = selected.value.findIndex((s) => s.id === id)
    if (i >= 0) {
      selected.value.splice(i, 1)
      persist()
    }
  }

  function clearTerm(termId: string) {
    selected.value = selected.value.filter((s) => s.termId !== termId)
    if (selected.value.length === 0) removeKey(STORAGE_KEY_SELECTED)
    else persist()
  }

  return {
    selected,
    byTerm,
    coursesOfTerm,
    termStats,
    allEnteredCredits,
    allPendingCount,
    creditsByCategoryAll,
    pendingItems,
    conflictsOfTerm,
    isSelected,
    addCourse,
    addCustomCourse,
    setCredit,
    removeCourse,
    clearTerm,
  }
})
