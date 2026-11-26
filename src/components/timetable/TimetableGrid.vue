<script setup lang="ts">
import { computed } from 'vue'
import type { CourseSlot, Offering } from '@/types'
import { CATEGORY_STYLE, MAX_PERIOD, WEEKDAYS } from '@/constants'
import { slotLabel, weeksLabel } from '@/utils/credit'

const props = defineProps<{ courses: Offering[] }>()

const emit = defineEmits<{ select: [course: Offering] }>()

const CELL_H = 42
const HEADER_H = 38
const DAYS = 7

interface Block {
  course: Offering
  slot: CourseSlot
  day: number
  top: number
  height: number
  overlapIndex: number
  overlapCount: number
}

/** 展开为课表块，按天分组并计算重叠泳道 */
const dayGroups = computed(() => {
  const groups: Array<{ day: number; blocks: Block[] }> = []
  for (let day = 1; day <= DAYS; day++) {
    const raw: Block[] = []
    for (const course of props.courses) {
      for (const slot of course.slots) {
        if (slot.day !== day) continue
        const start = Math.max(1, slot.start)
        const end = Math.min(MAX_PERIOD, slot.end)
        if (end < start) continue
        raw.push({
          course,
          slot,
          day,
          top: (start - 1) * CELL_H,
          height: (end - start + 1) * CELL_H,
          overlapIndex: 0,
          overlapCount: 1,
        })
      }
    }
    raw.sort((a, b) => a.slot.start - b.slot.start || a.slot.end - b.slot.end)

    // 传递重叠 → 连通分量 → 贪心泳道
    const components: Block[][] = []
    for (const block of raw) {
      const last = components[components.length - 1]
      if (last && last.some((b) => b.slot.end >= block.slot.start)) last.push(block)
      else components.push([block])
    }
    for (const comp of components) {
      const laneEnds: number[] = []
      for (const block of comp) {
        let lane = laneEnds.findIndex((end) => end < block.slot.start)
        if (lane < 0) {
          lane = laneEnds.length
          laneEnds.push(block.slot.end)
        } else {
          laneEnds[lane] = block.slot.end
        }
        block.overlapIndex = lane
      }
      const lanes = laneEnds.length
      for (const block of comp) block.overlapCount = lanes
    }

    groups.push({ day, blocks: raw })
  }
  return groups
})

function blockStyle(block: Block) {
  const s = CATEGORY_STYLE[block.course.category]
  const dayWidth = 100 / DAYS
  const left = (block.day - 1) * dayWidth + block.overlapIndex * (dayWidth / block.overlapCount)
  const width = dayWidth / block.overlapCount
  return {
    left: `calc(${left}% + 2px)`,
    width: `calc(${width}% - 4px)`,
    top: `${HEADER_H + block.top}px`,
    height: `${block.height - 4}px`,
    background: s.bg,
    borderColor: s.border,
    color: s.color,
  }
}
</script>

<template>
  <div class="tt-wrap">
    <div class="timetable" role="grid" aria-label="周课表（桌面端网格视图，周一至周日 1-14 节）">
      <div class="timetable-head" aria-hidden="true" />
      <div
        v-for="(dayName, i) in WEEKDAYS"
        :key="dayName"
        class="timetable-head timetable-cell"
        :class="{ weekend: i >= 5 }"
        role="columnheader"
      >
        {{ dayName }}
      </div>

      <template v-for="period in MAX_PERIOD" :key="period">
        <div class="timetable-time timetable-cell" role="rowheader">{{ period }}</div>
        <div v-for="day in DAYS" :key="day" class="timetable-cell tt-cell" />
      </template>

      <div class="tt-blocks">
        <div v-for="group in dayGroups" :key="`g${group.day}`" class="tt-day-layer">
          <button
            v-for="block in group.blocks"
            :key="block.course.id + block.slot.start + block.slot.end"
            class="course-block tt-block"
            :class="{ conflict: block.overlapCount > 1 }"
            :style="blockStyle(block)"
            :title="`${block.course.name}｜${slotLabel(block.slot)}（${weeksLabel(block.slot.weeks)}）｜${block.course.teacher}｜${block.course.room || '地点待定'}${block.overlapCount > 1 ? '｜存在时间冲突' : ''}`"
            @click="emit('select', block.course)"
          >
            <div class="cb-name">{{ block.course.name }}</div>
            <div class="cb-meta">{{ block.course.room || '地点待定' }}</div>
            <div class="cb-meta">{{ block.course.teacher }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tt-wrap {
  position: relative;
}

.timetable {
  position: relative;
  grid-template-rows: 38px repeat(14, 42px);
}

.tt-cell {
  min-height: 42px;
  background: var(--c-surface);
}

.tt-blocks {
  position: absolute;
  inset: 38px 0 0 44px;
  pointer-events: none;
}

.tt-day-layer {
  position: absolute;
  inset: 0;
}

.tt-block {
  position: absolute;
  display: block;
  pointer-events: auto;
  text-align: left;
  border-width: 1px;
  border-style: solid;
  padding: 2px 4px;
}

.tt-block .cb-meta {
  -webkit-line-clamp: 1;
  font-size: 9.5px;
}
</style>
