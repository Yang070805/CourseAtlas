<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlannerStore } from '@/stores/planner'
import { useTermStore } from '@/stores/term'
import BaseTag from '@/components/common/BaseTag.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const props = defineProps<{ termId: string }>()

const planner = usePlannerStore()
const termStore = useTermStore()

const expanded = ref(false)

const term = computed(() => termStore.terms.find((t) => t.id === props.termId))
const items = computed(() => planner.byTerm.get(props.termId) ?? [])
const stats = computed(() => planner.termStats(props.termId))
const shown = computed(() => (expanded.value ? items.value : items.value.slice(0, 4)))
</script>

<template>
  <section
    class="card term-card"
    :class="{ current: term?.isCurrent }"
    :aria-label="`${term?.label} 选课记录`"
  >
    <div class="tc-head">
      <div class="tc-title-wrap">
        <h3 class="tc-title">{{ term?.label }}</h3>
        <span v-if="term?.isCurrent" class="tc-tag">当前学期 · 在选</span>
        <span v-else class="tc-tag history">历史学期 · 已修记录</span>
      </div>
      <div class="tc-stats">
        <span>{{ stats.count }} 门</span>
        <span>已录 {{ stats.entered }} 学分</span>
        <span v-if="stats.pending > 0" class="pending">{{ stats.pending }} 门待补</span>
      </div>
    </div>

    <p v-if="items.length === 0" class="tc-empty">
      这个学期还没有选课记录。
      <RouterLink v-if="term?.isCurrent" to="/courses" class="tc-link">去选课 →</RouterLink>
    </p>

    <ul v-else class="tc-list">
      <li v-for="item in shown" :key="item.id">
        <span class="tc-name">{{ item.course.name }}</span>
        <BaseTag :category="item.course.category" />
        <span class="tc-credit" :class="{ missing: item.credit === null }">
          {{ item.credit === null ? '学分待补' : `${item.credit} 学分` }}
        </span>
      </li>
    </ul>

    <div v-if="items.length > 4" class="tc-more">
      <button class="btn btn-ghost btn-sm" @click="expanded = !expanded">
        {{ expanded ? '收起' : `展开全部 ${items.length} 门` }}
        <AppIcon :name="expanded ? 'chevronLeft' : 'chevronRight'" :size="14" />
      </button>
    </div>

    <p v-if="term?.isCurrent && stats.pending > 0" class="tc-hint">
      <AppIcon name="edit" :size="14" />
      有 {{ stats.pending }} 门课程未录入学分，<RouterLink to="/timetable" class="tc-link"
        >去课表页录入 →</RouterLink
      >
    </p>
  </section>
</template>

<style scoped>
.term-card {
  padding: 16px 18px;
}

.term-card.current {
  border-color: #e3cbdb;
  background: linear-gradient(180deg, var(--c-primary-tint), #fff 60%);
}

.tc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.tc-title {
  font-size: 15px;
  font-weight: 700;
}

.tc-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tc-tag {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--c-primary);
  background: var(--c-primary-soft);
  border-radius: 999px;
  padding: 1px 9px;
}

.tc-tag.history {
  color: var(--c-text-secondary);
  background: var(--c-bg);
}

.tc-stats {
  display: flex;
  gap: 10px;
  font-size: 12.5px;
  color: var(--c-text-secondary);
}

.tc-stats .pending {
  color: #8a5a00;
  font-weight: 600;
}

.tc-empty {
  color: var(--c-muted);
  font-size: 13.5px;
}

.tc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tc-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  padding: 4px 0;
  border-bottom: 1px dashed var(--c-border);
}

.tc-list li:last-child {
  border-bottom: none;
}

.tc-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tc-credit {
  font-weight: 700;
  color: var(--c-primary);
  white-space: nowrap;
  font-size: 12.5px;
}

.tc-credit.missing {
  color: var(--c-muted);
  font-weight: 500;
}

.tc-more {
  margin-top: 8px;
}

.tc-hint {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #8a5a00;
  background: var(--c-warning-soft);
  border-radius: var(--radius-sm);
  padding: 7px 10px;
}

.tc-link {
  font-weight: 600;
}
</style>
