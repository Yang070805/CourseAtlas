<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import type { Offering } from '@/types'
import { capacityText, slotsText } from '@/utils/credit'
import { useCourseStore } from '@/stores/courses'
import { usePlannerStore } from '@/stores/planner'
import { useTermStore } from '@/stores/term'
import BaseTag from '@/components/common/BaseTag.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const props = defineProps<{
  course: Offering | null
}>()

const emit = defineEmits<{
  close: []
  add: [course: Offering]
}>()

const courseStore = useCourseStore()
const planner = usePlannerStore()
const termStore = useTermStore()

const reviews = computed(() => (props.course ? courseStore.reviewsFor(props.course.name) : []))
const selected = computed(() =>
  props.course ? planner.isSelected(termStore.currentTermId, props.course.id) : false,
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(
  () => props.course,
  (c) => {
    document.body.style.overflow = c ? 'hidden' : ''
  },
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="course"
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="`课程详情：${course.name}`"
        @click.self="emit('close')"
      >
        <div class="modal">
          <div class="modal-head">
            <div>
              <div class="m-tags">
                <BaseTag :category="course.category" />
                <span class="m-chip">{{ course.typeLabel }}</span>
                <span v-if="course.sectionLabel" class="m-chip info">{{
                  course.sectionLabel
                }}</span>
              </div>
              <h2 class="m-name">{{ course.name }}</h2>
              <div class="m-code">{{ course.code }} · {{ course.unit }}</div>
            </div>
            <button class="m-close" aria-label="关闭" @click="emit('close')">
              <AppIcon name="x" :size="18" />
            </button>
          </div>

          <div class="modal-body">
            <div class="m-grid">
              <div class="m-item">
                <span class="m-label">授课教师</span>
                <span>{{ course.teacher || '待定' }}</span>
              </div>
              <div class="m-item">
                <span class="m-label">上课时间</span>
                <span>{{ slotsText(course.slots) || '不排固定节次（实践类）' }}</span>
              </div>
              <div class="m-item">
                <span class="m-label">上课地点</span>
                <span>{{ course.room || '待定' }}</span>
              </div>
              <div class="m-item">
                <span class="m-label">名额</span>
                <span>{{ capacityText(course) }}</span>
              </div>
              <div v-if="course.module" class="m-item">
                <span class="m-label">通识模块</span>
                <span>{{ course.module }}</span>
              </div>
              <div v-if="course.remark" class="m-item">
                <span class="m-label">备注</span>
                <span>{{ course.remark }}</span>
              </div>
            </div>

            <div class="notice info m-credit-notice">
              <AppIcon name="info" :size="15" />
              <span>
                选课手册不提供学分。加入课表后可在「模拟课表」页按本人培养方案录入学分，学分规划页会自动汇总。
              </span>
            </div>

            <div class="m-section">
              <h3 class="m-section-title">
                <AppIcon name="star" :size="15" />
                学生课程评价
                <span class="m-review-count">枝上攻略 · {{ reviews.length }} 条</span>
              </h3>
              <p v-if="reviews.length === 0" class="m-none">
                暂无评价。评价来自《枝上 26 秋选课攻略》（学生填写），仅覆盖部分课程。
              </p>
              <ul v-else class="review-list">
                <li v-for="(r, i) in reviews" :key="i" class="review-item">
                  <div class="rv-head">
                    <span class="rv-teacher">{{ r.teacher || '未注明教师' }}</span>
                    <span v-if="r.grading" class="rv-chip">{{ r.grading }}</span>
                    <span v-if="r.score" class="rv-chip score">得分 {{ r.score }}</span>
                  </div>
                  <p class="rv-text">“{{ r.review }}”</p>
                  <dl class="rv-meta">
                    <div v-if="r.attendance">
                      <dt>点名</dt>
                      <dd>{{ r.attendance }}</dd>
                    </div>
                    <div v-if="r.tasks">
                      <dt>平时</dt>
                      <dd>{{ r.tasks }}</dd>
                    </div>
                    <div v-if="r.exam">
                      <dt>期末</dt>
                      <dd>{{ r.exam }}</dd>
                    </div>
                  </dl>
                </li>
              </ul>
            </div>
          </div>

          <div class="modal-foot">
            <button class="btn btn-ghost" @click="emit('close')">关闭</button>
            <button class="btn btn-primary" :disabled="selected" @click="emit('add', course)">
              <AppIcon name="plus" :size="15" />
              {{ selected ? '已在模拟课表中' : '加入模拟课表' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(43, 20, 38, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal {
  background: var(--c-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 680px;
  max-height: 86vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(12px);
}

.modal-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 22px 14px;
  border-bottom: 1px solid var(--c-border);
  position: sticky;
  top: 0;
  background: var(--c-surface);
  z-index: 2;
}

.m-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.m-chip {
  font-size: 12px;
  color: var(--c-muted);
  border: 1px solid var(--c-border);
  border-radius: 999px;
  padding: 2px 10px;
}

.m-chip.info {
  color: var(--c-info);
  border-color: var(--c-info-soft);
  background: var(--c-info-soft);
}

.m-name {
  font-size: 20px;
  font-weight: 700;
}

.m-code {
  color: var(--c-muted);
  font-size: 13px;
  margin-top: 2px;
}

.m-close {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--c-muted);
  padding: 6px;
  border-radius: 8px;
  height: fit-content;
}

.m-close:hover {
  background: var(--c-bg);
  color: var(--c-text);
}

.modal-body {
  padding: 16px 22px;
  flex: 1;
}

.m-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.m-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
}

.m-label {
  color: var(--c-muted);
  font-size: 12.5px;
}

.m-credit-notice {
  margin-top: 14px;
  align-items: flex-start;
}

.m-section {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--c-border);
}

.m-section-title {
  font-size: 14.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.m-review-count {
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  color: var(--c-muted);
}

.m-none {
  color: var(--c-muted);
  font-size: 13.5px;
}

.review-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review-item {
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  background: #fdfbfc;
}

.rv-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.rv-teacher {
  font-weight: 700;
  font-size: 13.5px;
}

.rv-chip {
  font-size: 12px;
  color: var(--c-text-secondary);
  background: var(--c-bg);
  border-radius: 999px;
  padding: 1px 9px;
}

.rv-chip.score {
  color: #8a5a00;
  background: var(--c-warning-soft);
}

.rv-text {
  font-size: 13.5px;
  color: var(--c-text-secondary);
  line-height: 1.7;
}

.rv-meta {
  margin: 8px 0 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12.5px;
  color: var(--c-muted);
}

.rv-meta div {
  display: flex;
  gap: 8px;
}

.rv-meta dt {
  flex-shrink: 0;
  color: var(--c-text-secondary);
  font-weight: 600;
}

.rv-meta dd {
  margin: 0;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px 18px;
  border-top: 1px solid var(--c-border);
  position: sticky;
  bottom: 0;
  background: var(--c-surface);
}

@media (max-width: 768px) {
  .m-grid {
    grid-template-columns: 1fr;
  }
}
</style>
