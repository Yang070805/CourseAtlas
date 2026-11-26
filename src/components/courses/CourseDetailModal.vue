<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import type { Course } from '@/types'
import { SEMESTER_CREDIT_CAP } from '@/constants'
import { courseScheduleText, semesterLabel } from '@/utils/credit'
import { usePlannerStore } from '@/stores/planner'
import BaseTag from '@/components/common/BaseTag.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const props = defineProps<{
  course: Course | null
}>()

const emit = defineEmits<{
  close: []
  add: [course: Course]
}>()

const planner = usePlannerStore()

const prereqStatus = computed(() => {
  if (!props.course) return []
  return props.course.prerequisites.map((id) => ({
    id,
    course: planner.courses.find((c) => c.id === id),
    satisfied: planner.courses.some((c) => c.id === id),
  }))
})

const semesterLoad = computed(() => {
  if (!props.course) return { current: 0, after: 0 }
  const current =
    planner.perSemester.find((s) => s.semester === props.course!.semester)?.credits ?? 0
  return { current, after: current + props.course.credit }
})

const scheduleText = computed(() => {
  if (!props.course) return ''
  const text = courseScheduleText(props.course)
  return text || '分散安排，不占用固定节次'
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(
  () => props.course,
  (c) => {
    if (c) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
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
                <span class="cc-assessment">{{ course.assessment }}</span>
                <span class="m-semester">{{ semesterLabel(course.semester) }}</span>
              </div>
              <h2 class="m-name">{{ course.name }}</h2>
              <div class="m-code">{{ course.code }}</div>
            </div>
            <button class="m-close" aria-label="关闭" @click="emit('close')">
              <AppIcon name="x" :size="18" />
            </button>
          </div>

          <div class="modal-body">
            <p class="m-desc">{{ course.description }}</p>

            <div class="m-grid">
              <div class="m-item">
                <span class="m-label">开课学院</span>
                <span>{{ course.college }}</span>
              </div>
              <div class="m-item">
                <span class="m-label">授课教师</span>
                <span>{{ course.teacher }}</span>
              </div>
              <div class="m-item">
                <span class="m-label">学分</span>
                <span class="m-strong">{{ course.credit }} 学分</span>
              </div>
              <div class="m-item">
                <span class="m-label">总学时</span>
                <span>{{ course.hours }} 学时</span>
              </div>
            </div>

            <div class="m-section">
              <h3 class="m-section-title">
                <AppIcon name="clock" :size="15" />
                上课时间
              </h3>
              <p class="m-schedule">{{ scheduleText }}</p>
            </div>

            <div class="m-section">
              <h3 class="m-section-title">
                <AppIcon name="alert" :size="15" />
                前置课程
              </h3>
              <p v-if="course.prerequisites.length === 0" class="m-none">无前置要求</p>
              <ul v-else class="m-prereq">
                <li v-for="p in prereqStatus" :key="p.id" :class="{ satisfied: p.satisfied }">
                  <AppIcon :name="p.satisfied ? 'check' : 'x'" :size="14" />
                  {{ p.course?.name ?? '未知课程' }}
                  <span class="m-prereq-status">{{ p.satisfied ? '已加入课表' : '尚未加入' }}</span>
                </li>
              </ul>
            </div>

            <div class="m-section">
              <h3 class="m-section-title">
                <AppIcon name="target" :size="15" />
                学期学分占用
              </h3>
              <p class="m-schedule">
                {{ semesterLabel(course.semester) }}当前已选 {{ semesterLoad.current }} 学分，
                加入后为 {{ semesterLoad.after }} 学分（学期上限 {{ SEMESTER_CREDIT_CAP }} 学分）。
              </p>
            </div>
          </div>

          <div class="modal-foot">
            <button class="btn btn-ghost" @click="emit('close')">关闭</button>
            <button
              class="btn btn-primary"
              :disabled="planner.isSelected(course.id)"
              @click="emit('add', course)"
            >
              <AppIcon name="plus" :size="15" />
              {{ planner.isSelected(course.id) ? '已在模拟课表中' : '加入模拟课表' }}
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
  background: rgba(15, 23, 42, 0.45);
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
  max-width: 620px;
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
}

.m-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.m-semester {
  font-size: 12px;
  color: var(--c-text-secondary);
  background: var(--c-bg);
  border-radius: 999px;
  padding: 2px 10px;
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

.m-desc {
  color: var(--c-text-secondary);
  font-size: 14px;
  background: var(--c-bg);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  margin-bottom: 16px;
}

.m-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 4px;
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

.m-strong {
  font-weight: 700;
  color: var(--c-primary);
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
  margin-bottom: 8px;
}

.m-schedule {
  font-size: 14px;
  color: var(--c-text-secondary);
  line-height: 1.7;
}

.m-none {
  color: var(--c-muted);
  font-size: 13.5px;
}

.m-prereq {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}

.m-prereq li {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--c-danger);
  background: var(--c-danger-soft);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
}

.m-prereq li.satisfied {
  color: var(--c-success);
  background: var(--c-success-soft);
}

.m-prereq-status {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.85;
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
