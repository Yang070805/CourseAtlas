<script setup lang="ts">
import { computed } from 'vue'
import { REQUIREMENTS } from '@/constants'
import { usePlannerStore } from '@/stores/planner'
import ProgressBar from '@/components/common/ProgressBar.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const planner = usePlannerStore()

const totalReq = computed(() => REQUIREMENTS.find((r) => r.category === '总计')!)

const categoryReqs = computed(() => REQUIREMENTS.filter((r) => r.category !== '总计'))

const totalGap = computed(() =>
  Math.max(0, Math.round((totalReq.value.min - planner.totalCredits) * 10) / 10),
)

const totalDone = computed(() => planner.totalCredits >= totalReq.value.min)

const allCategoryDone = computed(() =>
  categoryReqs.value.every((r) => (planner.creditsByCategory[r.category] ?? 0) >= r.min),
)

function creditsOf(category: (typeof categoryReqs.value)[number]['category']) {
  return planner.creditsByCategory[category] ?? 0
}
</script>

<template>
  <section aria-label="学分要求进度">
    <!-- 总学分卡片 -->
    <div class="card total-card">
      <div class="total-left">
        <div class="total-icon">
          <AppIcon name="graduation" :size="26" />
        </div>
        <div class="total-text">
          <div class="total-label">毕业总学分</div>
          <div class="total-value">
            {{ planner.totalCredits }} <span class="total-max">/ {{ totalReq.min }} 学分</span>
          </div>
        </div>
      </div>
      <div class="total-right">
        <ProgressBar :value="planner.totalCredits" :max="totalReq.min" warn-when-over />
        <div class="total-status" :class="{ done: totalDone }">
          <AppIcon :name="totalDone ? 'check' : 'target'" :size="14" />
          <template v-if="totalDone">已满足毕业总学分要求</template>
          <template v-else>距毕业总学分要求还差 {{ totalGap }} 学分</template>
        </div>
      </div>
    </div>

    <!-- 分类要求 -->
    <div class="cat-grid">
      <div v-for="req in categoryReqs" :key="req.category" class="card cat-card">
        <div class="cat-head">
          <span class="cat-name">{{ req.label }}</span>
          <span class="cat-num" :class="{ done: creditsOf(req.category) >= req.min }">
            {{ creditsOf(req.category) }} / {{ req.min }} 学分
          </span>
        </div>
        <ProgressBar :value="creditsOf(req.category)" :max="req.min" warn-when-over />
        <div class="cat-note">{{ req.note }}</div>
      </div>
    </div>

    <div v-if="totalDone && allCategoryDone" class="finish-banner">
      <AppIcon name="check" :size="16" />
      恭喜！已满足全部培养方案学分要求，可以安心准备毕业啦。
    </div>
  </section>
</template>

<style scoped>
.total-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  padding: 22px 26px;
  background: linear-gradient(135deg, #4c6ef5 0%, #6741d9 100%);
  border: none;
  color: #fff;
  margin-bottom: 16px;
}

.total-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.total-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.total-label {
  font-size: 13px;
  opacity: 0.85;
}

.total-value {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.2;
}

.total-max {
  font-size: 15px;
  font-weight: 500;
  opacity: 0.8;
}

.total-right {
  flex: 1;
  min-width: 220px;
}

.total-card .progress {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.3);
}

.total-card .progress-bar {
  background: #fff;
}

.total-status {
  margin-top: 8px;
  font-size: 13.5px;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.95;
}

.total-status.done {
  color: #b8f5d5;
}

.cat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.cat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.cat-name {
  font-weight: 700;
  font-size: 15px;
}

.cat-num {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--c-warning);
}

.cat-num.done {
  color: var(--c-success);
}

.cat-note {
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--c-muted);
}

.finish-banner {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--c-success-soft);
  color: var(--c-success);
  border: 1px solid #a6e9cc;
  border-radius: var(--radius);
  padding: 12px 16px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .cat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
