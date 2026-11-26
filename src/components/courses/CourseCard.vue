<script setup lang="ts">
import { computed } from 'vue'
import type { Course } from '@/types'
import { semesterLabel, slotLabel, weeksLabel } from '@/utils/credit'
import BaseTag from '@/components/common/BaseTag.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const props = defineProps<{
  course: Course
  selected: boolean
}>()

defineEmits<{
  view: []
  add: []
}>()

const previewSlots = computed(() => props.course.slots.slice(0, 2))
</script>

<template>
  <article class="course-card" :class="{ selected }">
    <div class="cc-top">
      <BaseTag :category="course.category" />
      <span class="cc-assessment">{{ course.assessment }}</span>
    </div>

    <h3 class="cc-name" :title="course.name">{{ course.name }}</h3>
    <div class="cc-code">{{ course.code }} · {{ semesterLabel(course.semester) }}</div>

    <dl class="cc-meta">
      <div class="cc-meta-row">
        <dt><AppIcon name="graduation" :size="14" /> 学院</dt>
        <dd>{{ course.college }}</dd>
      </div>
      <div class="cc-meta-row">
        <dt><AppIcon name="info" :size="14" /> 教师</dt>
        <dd>{{ course.teacher }}</dd>
      </div>
      <div class="cc-meta-row">
        <dt><AppIcon name="target" :size="14" /> 学分/学时</dt>
        <dd>{{ course.credit }} 学分 · {{ course.hours }} 学时</dd>
      </div>
      <div v-if="previewSlots.length" class="cc-meta-row">
        <dt><AppIcon name="clock" :size="14" /> 时间</dt>
        <dd class="cc-schedule">
          <span v-for="(s, i) in previewSlots" :key="i">
            {{ slotLabel(s) }}（{{ weeksLabel(s.weeks) }}）
          </span>
          <span v-if="course.slots.length > 2" class="cc-more"
            >等 {{ course.slots.length }} 个时段</span
          >
        </dd>
      </div>
      <div v-else class="cc-meta-row">
        <dt><AppIcon name="clock" :size="14" /> 时间</dt>
        <dd class="cc-schedule-none">时间分散安排</dd>
      </div>
      <div v-if="course.prerequisites.length" class="cc-meta-row">
        <dt><AppIcon name="alert" :size="14" /> 前置</dt>
        <dd>{{ course.prerequisites.length }} 门前置课程</dd>
      </div>
    </dl>

    <div class="cc-actions">
      <button class="btn btn-ghost btn-sm" @click="$emit('view')">详情</button>
      <button class="btn btn-primary btn-sm" :disabled="selected" @click="$emit('add')">
        <AppIcon name="check" :size="14" />
        {{ selected ? '已在课表中' : '加入模拟课表' }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.course-card {
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 16px;
  transition:
    box-shadow 0.15s,
    border-color 0.15s,
    transform 0.15s;
}

.course-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.course-card.selected {
  border-color: var(--c-primary);
  background: #fbfdff;
}

.cc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.cc-assessment {
  font-size: 12px;
  color: var(--c-muted);
  border: 1px solid var(--c-border);
  border-radius: 999px;
  padding: 1px 9px;
}

.cc-name {
  font-size: 16.5px;
  font-weight: 700;
  line-height: 1.4;
}

.cc-code {
  color: var(--c-muted);
  font-size: 12.5px;
  margin-top: 2px;
}

.cc-meta {
  margin: 12px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.cc-meta-row {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.cc-meta-row dt {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--c-muted);
  flex-shrink: 0;
  min-width: 84px;
}

.cc-meta-row dd {
  margin: 0;
  color: var(--c-text-secondary);
}

.cc-schedule {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cc-schedule-none {
  color: var(--c-muted);
}

.cc-more {
  color: var(--c-muted);
}

.cc-actions {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--c-border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
