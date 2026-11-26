<script setup lang="ts">
import { computed } from 'vue'
import type { Course } from '@/types'
import { CATEGORY_STYLE, WEEKDAYS } from '@/constants'
import { slotLabel, weeksLabel } from '@/utils/credit'

const props = defineProps<{ courses: Course[] }>()

const emit = defineEmits<{ select: [course: Course] }>()

interface Row {
  course: Course
  text: string
  conflict: boolean
}

const grouped = computed(() => {
  const result: Array<{ day: number; rows: Row[] }> = []
  for (let day = 1; day <= 5; day++) {
    const rows: Row[] = []
    for (const course of props.courses) {
      for (const slot of course.slots) {
        if (slot.day !== day) continue
        rows.push({
          course,
          text: `${slotLabel(slot)}（${weeksLabel(slot.weeks)}）`,
          conflict: false,
        })
      }
    }
    // 标记同一时段重复出现的行
    for (let i = 0; i < rows.length; i++) {
      rows[i].conflict = rows.some((r, j) => j !== i && r.text === rows[i].text)
    }
    if (rows.length) result.push({ day, rows })
  }
  return result
})

function blockStyle(course: Course) {
  const s = CATEGORY_STYLE[course.category]
  return { background: s.bg, borderColor: s.border, color: s.color }
}
</script>

<template>
  <div class="tt-mobile timetable-mobile">
    <div v-if="grouped.length === 0" class="ttm-empty">课表为空，先去课程库选课吧</div>
    <div v-for="group in grouped" :key="group.day" class="ttm-day">
      <h3 class="ttm-day-title">{{ WEEKDAYS[group.day - 1] }}</h3>
      <button
        v-for="(row, i) in group.rows"
        :key="row.course.id + i"
        class="ttm-row"
        :class="{ conflict: row.conflict }"
        :style="blockStyle(row.course)"
        @click="emit('select', row.course)"
      >
        <div class="ttm-main">
          <div class="ttm-name">{{ row.course.name }}</div>
          <div class="ttm-meta">{{ row.text }} · {{ row.course.teacher }}</div>
        </div>
        <div class="ttm-credit">{{ row.course.credit }}学分</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ttm-day {
  margin-bottom: 16px;
}

.ttm-day-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--c-text);
}

.ttm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  text-align: left;
  border: 1px solid;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  margin-bottom: 8px;
  cursor: pointer;
  font-size: 14px;
}

.ttm-row.conflict {
  border-style: dashed;
  border-color: var(--c-danger) !important;
  box-shadow: 0 0 0 2px var(--c-danger-soft);
}

.ttm-name {
  font-weight: 700;
}

.ttm-meta {
  font-size: 12.5px;
  opacity: 0.85;
  margin-top: 2px;
}

.ttm-credit {
  font-weight: 700;
  white-space: nowrap;
}

.ttm-empty {
  color: var(--c-muted);
  text-align: center;
  padding: 40px 0;
}
</style>
