<script setup lang="ts">
import RequirementPanel from '@/components/planner/RequirementPanel.vue'
import PrereqNotice from '@/components/planner/PrereqNotice.vue'
import SemesterLoadPanel from '@/components/planner/SemesterLoadPanel.vue'
import CategoryBreakdown from '@/components/planner/CategoryBreakdown.vue'
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">学分规划</h1>
        <p class="page-subtitle">
          对照培养方案逐类核对你已获得的学分，看看离毕业还差多少，前置课程有没有补上。
        </p>
      </div>
    </div>

    <RequirementPanel />

    <div class="planner-grid">
      <div class="planner-col">
        <PrereqNotice />
        <SemesterLoadPanel />
      </div>
      <CategoryBreakdown />
    </div>
  </div>
</template>

<style scoped>
.planner-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.planner-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 1100px) {
  .planner-grid {
    grid-template-columns: 1fr;
  }
}
</style>
