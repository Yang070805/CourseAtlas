<script setup lang="ts">
import type { CourseCategory } from '@/types'
import { CATEGORY_STYLE } from '@/constants'

const props = defineProps<{ category: CourseCategory }>()

const style = CATEGORY_STYLE[props.category]
</script>

<template>
  <span
    class="tag"
    :style="{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }"
  >
    {{ category }}
  </span>
</template>
