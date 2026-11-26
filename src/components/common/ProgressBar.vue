<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    max: number
    /** 达到或超过上限时用警示色（学期学分上限等场景） */
    warnWhenOver?: boolean
    /** 达到目标后显示完成态（毕业/分类学分要求场景，设计采纳自周子为 6e9ed3d） */
    successWhenDone?: boolean
  }>(),
  { warnWhenOver: false, successWhenDone: false },
)

const percent = computed(() => Math.min(100, Math.round((props.value / props.max) * 100)))
const tone = computed(() => {
  if (props.successWhenDone && props.value >= props.max) return 'done'
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
