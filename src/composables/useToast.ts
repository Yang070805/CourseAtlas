import { reactive } from 'vue'

export type ToastType = 'success' | 'warning' | 'error' | 'info'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
}

const state = reactive<{ items: ToastItem[] }>({ items: [] })

let seq = 0

function dismiss(id: number) {
  const i = state.items.findIndex((t) => t.id === id)
  if (i >= 0) state.items.splice(i, 1)
}

export function useToast() {
  function push(type: ToastType, message: string, duration = 3200) {
    const id = ++seq
    state.items.push({ id, type, message })
    window.setTimeout(() => dismiss(id), duration)
  }

  return {
    items: state.items,
    push,
    dismiss,
  }
}
