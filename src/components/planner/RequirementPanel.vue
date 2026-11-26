<script setup lang="ts">
import { computed } from 'vue'
import { REQUIREMENTS } from '@/constants'
import { usePlannerStore } from '@/stores/planner'
import ProgressBar from '@/components/common/ProgressBar.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const planner = usePlannerStore()

const totalReq = computed(() => REQUIREMENTS.find((r) => r.category === '总计')!)
const categoryReqs = computed(() => REQUIREMENTS.filter((r) => r.category !== '总计'))

const earned = computed(() => planner.allEnteredCredits)
const gap = computed(() => Math.max(0, Math.round((totalReq.value.min - earned.value) * 10) / 10))
const done = computed(() => earned.value >= totalReq.value.min)

function creditsOf(category: (typeof categoryReqs.value)[number]['category']) {
  return planner.creditsByCategoryAll[category] ?? 0
}
</script>

<template>
  <section aria-label="毕业学分进度（示例要求）">
    <div class="card total-card">
      <div class="total-left">
        <div class="total-icon">
          <AppIcon name="graduation" :size="26" />
        </div>
        <div class="total-text">
          <div class="total-label">已录入学分（全部学期）</div>
          <div class="total-value">
            {{ earned }} <span class="total-max">/ {{ totalReq.min }} 学分（示例）</span>
          </div>
        </div>
      </div>
      <div class="total-right">
        <ProgressBar :value="earned" :max="totalReq.min" success-when-done />
        <div class="total-status" :class="{ done }">
          <AppIcon :name="done ? 'check' : 'target'" :size="14" />
          <template v-if="done">已达到示例毕业学分要求</template>
          <template v-else>距示例毕业要求还差 {{ gap }} 学分</template>
        </div>
      </div>
    </div>

    <div class="cat-grid">
      <div v-for="req in categoryReqs" :key="req.category" class="card cat-card">
        <div class="cat-head">
          <span class="cat-name">{{ req.label }}</span>
          <span class="cat-num" :class="{ done: creditsOf(req.category) >= req.min }">
            {{ creditsOf(req.category) }} / {{ req.min }}
          </span>
        </div>
        <ProgressBar :value="creditsOf(req.category)" :max="req.min" success-when-done />
        <div class="cat-note">{{ req.note }}</div>
      </div>
    </div>

    <div class="notice warning req-disclaimer">
      <AppIcon name="info" :size="15" />
      <span>
        南开大学未公开全量培养方案，以上学分要求为<b>示例配置</b>（不代表任何专业的真实要求）， 可在
        <code>src/constants.ts</code> 的 REQUIREMENTS 中按本专业培养方案修改。
        <template v-if="planner.allPendingCount > 0">
          当前还有 <b>{{ planner.allPendingCount }}</b> 门已选课程未录入学分，未计入统计。
        </template>
      </span>
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
  background: linear-gradient(135deg, #842468 0%, #a63a8a 100%);
  border: none;
  color: #fff;
  margin-bottom: 14px;
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

/* ProgressBar 根节点会继承父级 scope，但内部 .progress-bar 不会，需 :deep 才能覆盖
   （作用域样式缺陷由周子为在 6e9ed3d 中发现，此处同步修复） */
.total-card :deep(.progress) {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.3);
}

.total-card :deep(.progress-bar) {
  background: #fff;
}

.total-card :deep(.progress-bar.done) {
  background: #b8f5d5;
}

.total-status {
  margin-top: 8px;
  font-size: 13.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.total-status.done {
  color: #f5e1ee;
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
  color: #8a5a00;
}

.cat-num.done {
  color: var(--c-success);
}

.cat-note {
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--c-muted);
}

.req-disclaimer {
  margin-top: 12px;
  align-items: flex-start;
}

.req-disclaimer code {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  padding: 0 4px;
  font-size: 12px;
}

@media (max-width: 768px) {
  .cat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
