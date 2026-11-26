<script setup lang="ts">
import { computed } from 'vue'
import { SEMESTER_CREDIT_CAP, SEMESTER_GUIDE } from '@/constants'
import { semesterLabel } from '@/utils/credit'
import { usePlannerStore } from '@/stores/planner'
import ProgressBar from '@/components/common/ProgressBar.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const planner = usePlannerStore()

const rows = computed(() => {
  const result: Array<{ semester: number; credits: number; guide: number }> = []
  for (let s = 1; s <= 8; s++) {
    const credits = planner.perSemester.find((p) => p.semester === s)?.credits ?? 0
    result.push({ semester: s, credits, guide: SEMESTER_GUIDE[s] ?? 0 })
  }
  return result
})

const overSemesters = computed(() =>
  rows.value.filter((r) => r.credits > SEMESTER_CREDIT_CAP).map((r) => r.semester),
)
</script>

<template>
  <section class="card" aria-label="学期学分分布">
    <div class="card-title">
      <AppIcon name="chart" :size="16" />
      学期学分分布
      <span class="cap-note">学期上限 {{ SEMESTER_CREDIT_CAP }} 学分</span>
    </div>

    <ul class="sem-list">
      <li v-for="row in rows" :key="row.semester">
        <span class="sem-label">{{ semesterLabel(row.semester) }}</span>
        <div class="sem-bar">
          <ProgressBar :value="row.credits" :max="SEMESTER_CREDIT_CAP" warn-when-over />
        </div>
        <span class="sem-num" :class="{ over: row.credits > SEMESTER_CREDIT_CAP }">
          {{ row.credits }}
        </span>
      </li>
    </ul>

    <p v-if="overSemesters.length" class="over-tip">
      <AppIcon name="alert" :size="14" />
      {{ overSemesters.map((s) => semesterLabel(s)).join('、') }}已超过学期学分上限，建议调整。
    </p>
  </section>
</template>

<style scoped>
.cap-note {
  margin-left: auto;
  font-size: 12px;
  color: var(--c-muted);
  font-weight: 500;
}

.sem-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sem-list li {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sem-label {
  width: 64px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--c-text-secondary);
}

.sem-bar {
  flex: 1;
}

.sem-num {
  width: 44px;
  text-align: right;
  font-size: 13px;
  font-weight: 700;
  color: var(--c-text);
}

.sem-num.over {
  color: var(--c-danger);
}

.over-tip {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--c-danger);
  font-size: 13px;
  background: var(--c-danger-soft);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
}
</style>
