<script setup lang="ts">
import { computed } from 'vue'
import type { SelectedCourse } from '@/types'
import { CATEGORY_STYLE, WEEKDAYS } from '@/constants'
import { slotsText } from '@/utils/credit'

const props = defineProps<{ items: SelectedCourse[] }>()

interface Row {
  item: SelectedCourse
  text: string
  conflict: boolean
}

const grouped = computed(() => {
  const result: Array<{ day: number; rows: Row[] }> = []
  for (let day = 1; day <= 7; day++) {
    const rows: Row[] = []
    for (const item of props.items) {
      const slots = item.course.slots.filter((s) => s.day === day)
      if (slots.length === 0) continue
      for (const s of slots) {
        rows.push({ item, text: slotsText([s]), conflict: false })
      }
    }
    for (let i = 0; i < rows.length; i++) {
      rows[i].conflict = rows.some(
        (r, j) => j !== i && r.text.split('（')[0] === rows[i].text.split('（')[0],
      )
    }
    if (rows.length) result.push({ day, rows })
  }
  return result
})

const noTime = computed(() => props.items.filter((i) => i.course.slots.length === 0))

function blockStyle(item: SelectedCourse) {
  const s = CATEGORY_STYLE[item.course.category]
  return { background: s.bg, borderColor: s.border, color: s.color }
}
</script>

<template>
  <div class="tt-mobile timetable-mobile">
    <div v-if="grouped.length === 0 && noTime.length === 0" class="ttm-empty">
      课表为空，先去课程库选课吧
    </div>

    <div v-for="group in grouped" :key="group.day" class="ttm-day">
      <h3 class="ttm-day-title">{{ WEEKDAYS[group.day - 1] }}</h3>
      <div
        v-for="(row, i) in group.rows"
        :key="row.item.id + i"
        class="ttm-row"
        :class="{ conflict: row.conflict }"
        :style="blockStyle(row.item)"
      >
        <div class="ttm-main">
          <div class="ttm-name">{{ row.item.course.name }}</div>
          <div class="ttm-meta">{{ row.text }} · {{ row.item.course.teacher }}</div>
          <div class="ttm-meta">{{ row.item.course.room || '地点待定' }}</div>
        </div>
        <div class="ttm-credit">{{ row.item.credit ?? '—' }} 学分</div>
      </div>
    </div>

    <div v-if="noTime.length" class="ttm-day">
      <h3 class="ttm-day-title">不排固定节次</h3>
      <div v-for="item in noTime" :key="item.id" class="ttm-row" :style="blockStyle(item)">
        <div class="ttm-main">
          <div class="ttm-name">{{ item.course.name }}</div>
          <div class="ttm-meta">{{ item.course.unit }} · {{ item.course.teacher }}</div>
        </div>
        <div class="ttm-credit">{{ item.credit ?? '—' }} 学分</div>
      </div>
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
}

.ttm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  margin-bottom: 8px;
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
