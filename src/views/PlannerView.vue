<script setup lang="ts">
import { computed } from 'vue'
import { usePlannerStore } from '@/stores/planner'
import { useTermStore } from '@/stores/term'
import RequirementPanel from '@/components/planner/RequirementPanel.vue'
import TermOverview from '@/components/planner/TermOverview.vue'
import CategoryBreakdown from '@/components/planner/CategoryBreakdown.vue'

const termStore = useTermStore()
const planner = usePlannerStore()

/** 有选课记录的其他学期（按时间顺序展示，避免罗列全部 21 个学期空卡片） */
const recordTerms = computed(() =>
  termStore.terms
    .filter((t) => t.id !== termStore.currentTermId && planner.byTerm.has(t.id))
    .sort((a, b) => a.id.localeCompare(b.id)),
)
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">学分规划</h1>
        <p class="page-subtitle">
          按学期查看选课记录与已录学分，对照培养方案查看毕业进度。学分由你在课表页按本人培养方案录入，
          历史学期记录会一直保留。
        </p>
      </div>
    </div>

    <RequirementPanel />

    <div class="planner-grid">
      <div class="planner-col">
        <TermOverview :term-id="termStore.currentTermId" />
        <TermOverview v-for="t in recordTerms" :key="t.id" :term-id="t.id" />
      </div>
      <CategoryBreakdown />
    </div>
  </div>
</template>

<style scoped>
.planner-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 420px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.planner-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 1100px) {
  .planner-grid {
    grid-template-columns: 1fr;
  }
}
</style>
