<script setup lang="ts">
import { computed } from 'vue'
import type { SelectedCourse } from '@/types'
import { SEMESTER_CREDIT_CAP } from '@/constants'
import { slotsText } from '@/utils/credit'
import { usePlannerStore } from '@/stores/planner'
import BaseTag from '@/components/common/BaseTag.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps<{ items: SelectedCourse[] }>()

const planner = usePlannerStore()
const emit = defineEmits<{ select: [item: SelectedCourse] }>()

const entered = computed(
  () => Math.round(props.items.reduce((s, i) => s + (i.credit ?? 0), 0) * 10) / 10,
)
const pendingCount = computed(() => props.items.filter((i) => i.credit === null).length)
const overCap = computed(() => entered.value > SEMESTER_CREDIT_CAP)

function onCreditChange(item: SelectedCourse, e: Event) {
  const input = e.target as HTMLInputElement
  const value = input.value.trim()
  if (value === '') {
    planner.setCredit(item.id, null)
    return
  }
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0.5 || n > 20 || Math.round(n * 10) !== n * 10) {
    input.value = item.credit === null ? '' : String(item.credit)
    return
  }
  planner.setCredit(item.id, Math.round(n * 10) / 10)
}
</script>

<template>
  <section class="card selected-panel" aria-label="已选课程清单">
    <div class="card-title">
      <AppIcon name="check" :size="17" />
      本学期已选（{{ items.length }} 门 · 已录 {{ entered }} 学分）
    </div>

    <p class="panel-hint">
      选课手册不提供学分，请按本人培养方案在右侧输入。未录入的学分不计入规划统计。
    </p>

    <EmptyState
      v-if="items.length === 0"
      icon="empty"
      title="还没有选择课程"
      hint="到课程库挑几门课，构建你的模拟课表"
    />

    <ul v-else class="sel-list">
      <li v-for="item in items" :key="item.id" class="sel-item">
        <button class="sel-main" @click="emit('select', item)">
          <span class="sel-name">
            {{ item.course.name }}
            <span v-if="item.course.sectionLabel" class="sel-section">{{
              item.course.sectionLabel
            }}</span>
            <span v-if="item.source === 'custom'" class="sel-custom">自定义</span>
          </span>
          <span class="sel-meta">
            <BaseTag :category="item.course.category" />
            <span>{{ item.course.teacher || '教师待定' }}</span>
          </span>
          <span class="sel-meta">
            {{ slotsText(item.course.slots) || '不排固定节次' }}
          </span>
          <span class="sel-meta">{{ item.course.room || '地点待定' }}</span>
        </button>
        <div class="sel-side">
          <label class="credit-edit">
            <input
              type="number"
              class="credit-input"
              :value="item.credit ?? ''"
              min="0.5"
              max="20"
              step="0.5"
              placeholder="学分"
              aria-label="录入学分"
              @change="onCreditChange(item, $event)"
            />
          </label>
          <button
            class="sel-remove"
            :aria-label="`移除 ${item.course.name}`"
            title="从模拟课表移除"
            @click="planner.removeCourse(item.id)"
          >
            <AppIcon name="trash" :size="15" />
          </button>
        </div>
      </li>
    </ul>

    <div v-if="items.length > 0" class="sel-summary">
      <span :class="{ over: overCap }">
        已录 {{ entered }} / 上限 {{ SEMESTER_CREDIT_CAP }} 学分
        <template v-if="pendingCount > 0"> · {{ pendingCount }} 门待补</template>
      </span>
    </div>
    <p v-if="overCap" class="notice warning sel-warn">
      <AppIcon name="alert" :size="14" />
      已录学分超过学期上限，请确认选课量（示例口径，实际以培养方案为准）。
    </p>

    <button
      v-if="items.length > 0"
      class="btn btn-danger btn-sm btn-block sel-clear"
      @click="planner.clearTerm(items[0].termId)"
    >
      清空本学期课表
    </button>
  </section>
</template>

<style scoped>
.panel-hint {
  font-size: 12.5px;
  color: var(--c-muted);
  margin-bottom: 12px;
  line-height: 1.6;
}

.sel-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sel-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  transition: border-color 0.15s;
}

.sel-item:hover {
  border-color: var(--c-primary);
}

.sel-main {
  flex: 1;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sel-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--c-text);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.sel-section {
  font-size: 11px;
  color: var(--c-info);
  background: var(--c-info-soft);
  border-radius: 999px;
  padding: 0 7px;
}

.sel-custom {
  font-size: 11px;
  color: var(--c-warning);
  border: 1px solid var(--c-warning);
  border-radius: 999px;
  padding: 0 7px;
}

.sel-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--c-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sel-side {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.credit-input {
  width: 64px;
  padding: 5px 8px;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
  color: var(--c-text);
}

.credit-input:focus {
  outline: none;
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px var(--c-primary-soft);
}

.sel-remove {
  border: none;
  background: none;
  color: var(--c-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
}

.sel-remove:hover {
  color: var(--c-danger);
  background: var(--c-danger-soft);
}

.sel-summary {
  margin-top: 12px;
  font-size: 13px;
  color: var(--c-text-secondary);
}

.sel-summary .over {
  color: var(--c-danger);
  font-weight: 700;
}

.sel-warn {
  margin-top: 8px;
}

.sel-clear {
  margin-top: 12px;
}
</style>
