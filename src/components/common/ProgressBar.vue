<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    max: number
    /** 达到目标后是否用警示色 */
    warnWhenOver?: boolean
  }>(),
  { warnWhenOver: false },
)

const percent = computed(() => Math.min(100, Math.round((props.value / props.max) * 100)))
const tone = computed(() => {
  if (!props.warnWhenOver) return ''
  return props.value > props.max ? 'danger' : percent.value >= 100 ? 'over' : ''
})
</script>

<template>
  <div
    class="progress"
    role="progressbar"
    :aria-valuenow="value"
    :aria-valuemin="0"
    :aria-valuemax="max"
  >
    <div class="progress-bar" :class="tone" :style="{ width: `${percent}%` }" />
  </div>
</template>
