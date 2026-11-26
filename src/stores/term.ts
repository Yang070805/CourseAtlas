import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { CURRENT_TERM_ID, STORAGE_KEY_TERM, TERM_GROUPS, TERMS, termById } from '@/constants'
import { loadJSON, saveJSON } from '@/utils/storage'

export const useTermStore = defineStore('term', () => {
  const saved = loadJSON<string>(STORAGE_KEY_TERM)
  const currentTermId = ref(typeof saved === 'string' && termById(saved) ? saved : CURRENT_TERM_ID)

  const terms = TERMS
  const termGroups = TERM_GROUPS

  const currentTerm = computed(() => termById(currentTermId.value) ?? TERMS[0])

  const currentTermIndex = computed(() => TERMS.findIndex((t) => t.id === currentTermId.value))
  const officialCurrentIndex = computed(() => TERMS.findIndex((t) => t.isCurrent))

  /** 是否正在查看"当前学期之前"的学期 */
  const viewingPast = computed(() => currentTermIndex.value < officialCurrentIndex.value)
  /** 是否正在查看"当前学期之后"的学期（未来学期，可提前规划） */
  const viewingFuture = computed(() => currentTermIndex.value > officialCurrentIndex.value)

  function setTerm(id: string) {
    if (!termById(id)) return
    currentTermId.value = id
    saveJSON(STORAGE_KEY_TERM, id)
  }

  return {
    terms,
    termGroups,
    currentTermId,
    currentTerm,
    viewingPast,
    viewingFuture,
    setTerm,
  }
})
