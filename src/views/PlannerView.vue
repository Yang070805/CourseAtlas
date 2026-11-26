<script setup lang="ts">
import { useTermStore } from '@/stores/term'
import RequirementPanel from '@/components/planner/RequirementPanel.vue'
import TermOverview from '@/components/planner/TermOverview.vue'
import CategoryBreakdown from '@/components/planner/CategoryBreakdown.vue'

const termStore = useTermStore()
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
        <TermOverview v-for="t in termStore.historyTerms" :key="t.id" :term-id="t.id" />
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
