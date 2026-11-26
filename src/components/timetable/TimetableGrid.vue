<script setup lang="ts">
import { computed } from 'vue'
import type { Course, CourseSlot } from '@/types'
import { CATEGORY_STYLE, MAX_PERIOD, PERIOD_TIMES, WEEKDAYS } from '@/constants'
import { slotLabel, weeksLabel } from '@/utils/credit'

const props = defineProps<{ courses: Course[] }>()

const emit = defineEmits<{ select: [course: Course] }>()

const CELL_H = 48
const HEADER_H = 42

interface Block {
  course: Course
  slot: CourseSlot
  day: number
  top: number
  height: number
  overlapIndex: number
  overlapCount: number
}

/** 把已选课程展开为课表块，并按“天”分组、计算同一天内的重叠情况 */
const dayGroups = computed(() => {
  const groups: Array<{ day: number; blocks: Block[] }> = []
  for (let day = 1; day <= 5; day++) {
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

    // 1) 按传递重叠切分连通分量（A 与 B 重叠、B 与 C 重叠 → 同分量）
    const components: Block[][] = []
    for (const block of raw) {
      const last = components[components.length - 1]
      if (last && last.some((b) => b.slot.end >= block.slot.start)) last.push(block)
      else components.push([block])
    }

    // 2) 分量内贪心分配泳道：每个块放入第一个已空闲的泳道
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
      const lanesCount = laneEnds.length
      for (const block of comp) block.overlapCount = lanesCount
    }

    groups.push({ day, blocks: raw })
  }
  return groups
})

function blockStyle(block: Block) {
  const categoryStyle = CATEGORY_STYLE[block.course.category]
  const dayWidth = 100 / 5
  const left = (block.day - 1) * dayWidth + block.overlapIndex * (dayWidth / block.overlapCount)
  const width = dayWidth / block.overlapCount
  return {
    left: `calc(${left}% + 3px)`,
    width: `calc(${width}% - 6px)`,
    top: `${HEADER_H + block.top}px`,
    height: `${block.height - 5}px`,
    background: categoryStyle.bg,
    borderColor: categoryStyle.border,
    color: categoryStyle.color,
  }
}

const isConflict = (block: Block) => block.overlapCount > 1
</script>

<template>
  <div class="tt-wrap">
    <div class="timetable" role="grid" aria-label="周课表（桌面端网格视图）">
      <!-- 表头 -->
      <div class="timetable-head" aria-hidden="true" />
      <div
        v-for="(dayName, i) in WEEKDAYS"
        :key="dayName"
        class="timetable-head timetable-cell"
        role="columnheader"
      >
        {{ dayName }}
        <span class="tt-day-index">{{ i + 1 }}</span>
      </div>

      <!-- 时间轴 + 网格单元格 -->
      <template v-for="period in MAX_PERIOD" :key="period">
        <div class="timetable-time timetable-cell" role="rowheader">
          {{ period }}<br />{{ PERIOD_TIMES[period - 1] }}
        </div>
        <div v-for="day in 5" :key="day" class="timetable-cell tt-cell" />
      </template>

      <!-- 课程块 -->
      <div class="tt-blocks">
        <div v-for="group in dayGroups" :key="`g${group.day}`" class="tt-day-layer">
          <button
            v-for="block in group.blocks"
            :key="block.course.id + block.slot.start + block.slot.end"
            class="course-block tt-block"
            :class="{ conflict: isConflict(block) }"
            :style="blockStyle(block)"
            :title="`${block.course.name}｜${slotLabel(block.slot)}（${weeksLabel(block.slot.weeks)}）${isConflict(block) ? '｜存在时间冲突' : ''}`"
            @click="emit('select', block.course)"
          >
            <div class="cb-name">{{ block.course.name }}</div>
            <div class="cb-meta">
              {{ slotLabel(block.slot) }}（{{ weeksLabel(block.slot.weeks) }}）
            </div>
            <div class="cb-meta">@{{ block.course.teacher }}</div>
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
  grid-template-rows: var(--tt-header) repeat(12, var(--tt-cell));
  --tt-header: 42px;
  --tt-cell: 48px;
}

.tt-day-index {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--c-muted);
}

.tt-cell {
  min-height: var(--tt-cell);
  background: var(--c-surface);
}

.tt-blocks {
  position: absolute;
  inset: var(--tt-header) 0 0 56px;
  pointer-events: none;
}

.tt-day-layer {
  position: absolute;
  inset: 0;
  border: none;
  background: none;
  padding: 0;
  pointer-events: none;
}

.tt-block {
  position: absolute;
  display: block;
  pointer-events: auto;
  text-align: left;
  border-width: 1px;
  border-style: solid;
}

.tt-block.conflict {
  border-color: var(--c-danger);
  border-style: dashed;
  box-shadow: 0 0 0 2px var(--c-danger-soft);
}

.tt-block .cb-meta {
  -webkit-line-clamp: 1;
}
</style>
