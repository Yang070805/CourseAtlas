<script setup lang="ts">
import type { Offering } from '@/types'
import { capacityText, slotsText } from '@/utils/credit'
import BaseTag from '@/components/common/BaseTag.vue'
import AppIcon from '@/components/common/AppIcon.vue'

defineProps<{
  course: Offering
  selected: boolean
  reviewCount: number
}>()

defineEmits<{
  view: []
  add: []
}>()
</script>

<template>
  <article class="course-card" :class="{ selected }">
    <div class="cc-top">
      <BaseTag :category="course.category" />
      <span class="cc-type">{{ course.typeLabel }}</span>
      <span v-if="course.sectionLabel" class="cc-section">{{ course.sectionLabel }}</span>
    </div>

    <h3 class="cc-name" :title="course.name">{{ course.name }}</h3>
    <div class="cc-code">
      {{ course.code }} · {{ course.unit }}
      <template v-if="course.module"> · {{ course.module }}</template>
    </div>

    <dl class="cc-meta">
      <div class="cc-meta-row">
        <dt><AppIcon name="users" :size="14" /> 教师</dt>
        <dd>{{ course.teacher || '待定' }}</dd>
      </div>
      <div class="cc-meta-row">
        <dt><AppIcon name="clock" :size="14" /> 时间</dt>
        <dd class="cc-schedule">
          <span>{{ slotsText(course.slots) || '不排固定节次（实践类）' }}</span>
        </dd>
      </div>
      <div class="cc-meta-row">
        <dt><AppIcon name="pin" :size="14" /> 地点</dt>
        <dd>{{ course.room || '待定' }}</dd>
      </div>
      <div class="cc-meta-row">
        <dt><AppIcon name="target" :size="14" /> 名额</dt>
        <dd>{{ capacityText(course) }}</dd>
      </div>
    </dl>

    <div class="cc-actions">
      <span v-if="reviewCount > 0" class="cc-review" :title="`枝上学生评价 ${reviewCount} 条`">
        <AppIcon name="star" :size="13" />
        {{ reviewCount }} 条评价
      </span>
      <span v-else class="cc-review none">暂无评价</span>
      <button class="btn btn-ghost btn-sm" @click="$emit('view')">详情</button>
      <button class="btn btn-primary btn-sm" :disabled="selected" @click="$emit('add')">
        <AppIcon name="check" :size="14" />
        {{ selected ? '已在课表中' : '加入课表' }}
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
  background: var(--c-primary-tint);
}

.cc-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.cc-type,
.cc-section {
  font-size: 12px;
  color: var(--c-muted);
  border: 1px solid var(--c-border);
  border-radius: 999px;
  padding: 1px 9px;
}

.cc-section {
  color: var(--c-info);
  border-color: var(--c-info-soft);
  background: var(--c-info-soft);
}

.cc-name {
  font-size: 16.5px;
  font-weight: 700;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cc-code {
  color: var(--c-muted);
  font-size: 12.5px;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  min-width: 74px;
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

.cc-actions {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px dashed var(--c-border);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.cc-review {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #a06a00;
  margin-right: auto;
}

.cc-review.none {
  color: var(--c-muted);
}
</style>
