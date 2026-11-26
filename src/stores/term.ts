import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { DEFAULT_TERM_ID, STORAGE_KEY_TERM, TERMS } from '@/constants'
import { loadJSON, saveJSON } from '@/utils/storage'

export const useTermStore = defineStore('term', () => {
  const saved = loadJSON<string>(STORAGE_KEY_TERM)
  const currentTermId = ref(
    typeof saved === 'string' && TERMS.some((t) => t.id === saved) ? saved : DEFAULT_TERM_ID,
  )

  const terms = TERMS

  const currentTerm = computed(() => terms.find((t) => t.id === currentTermId.value) ?? terms[0])

  const historyTerms = computed(() => terms.filter((t) => !t.isCurrent))

  function setTerm(id: string) {
    if (!terms.some((t) => t.id === id)) return
    currentTermId.value = id
    saveJSON(STORAGE_KEY_TERM, id)
  }

  return { terms, currentTermId, currentTerm, historyTerms, setTerm }
})
