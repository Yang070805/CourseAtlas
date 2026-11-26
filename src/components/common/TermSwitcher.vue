<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CURRENT_TERM_ID, termById } from '@/constants'
import { useTermStore } from '@/stores/term'
import AppIcon from '@/components/common/AppIcon.vue'

const termStore = useTermStore()

const open = ref(false)
const activeYear = ref(termStore.currentTerm.academicYear)
const root = ref<HTMLElement | null>(null)

/** 打开面板时定位到当前选择所在学年 */
function toggle() {
  if (!open.value) activeYear.value = termStore.currentTerm.academicYear
  open.value = !open.value
}

function pickYear(year: string) {
  activeYear.value = year
}

function pickTerm(semesterNo: 1 | 2 | 3) {
  const id = `${activeYear.value}-${semesterNo}`
  termStore.setTerm(id)
  open.value = false
}

function backToCurrent() {
  termStore.setTerm(CURRENT_TERM_ID)
  activeYear.value = termById(CURRENT_TERM_ID)?.academicYear ?? activeYear.value
  open.value = false
}

const activeTerms = computed(
  () => termStore.termGroups.find((g) => g.academicYear === activeYear.value)?.terms ?? [],
)

const currentYear = computed(() => termStore.currentTerm.academicYear)

function onClickOutside(e: MouseEvent) {
  if (!open.value || !root.value) return
  if (!root.value.contains(e.target as Node)) open.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="term-switcher">
    <button
      class="term-trigger"
      :aria-expanded="open"
      aria-haspopup="dialog"
      :title="`当前学期：${termStore.currentTerm.label}`"
      @click="toggle"
    >
      <AppIcon name="calendar" :size="14" />
      <span class="tt-label">{{ termStore.currentTerm.label }}</span>
      <span v-if="termStore.currentTerm.isCurrent" class="tt-tag">当前</span>
      <span v-else-if="termStore.currentTerm.hasData === false" class="tt-tag muted">无数据</span>
      <AppIcon name="chevronDown" :size="14" />
    </button>

    <div v-if="open" class="term-panel" role="dialog" aria-label="选择学年学期">
      <div class="tp-head">
        <span class="tp-title">学年学期</span>
        <button
          v-if="termStore.currentTermId !== CURRENT_TERM_ID"
          class="btn btn-ghost btn-sm"
          @click="backToCurrent"
        >
          回到当前学期
        </button>
      </div>

      <div class="tp-body">
        <div class="tp-years" role="listbox" aria-label="学年">
          <button
            v-for="group in termStore.termGroups"
            :key="group.academicYear"
            class="tp-year"
            :class="{
              active: group.academicYear === activeYear,
              now: group.academicYear === currentYear,
            }"
            role="option"
            :aria-selected="group.academicYear === activeYear"
            @click="pickYear(group.academicYear)"
          >
            {{ group.academicYear }}
          </button>
        </div>

        <div class="tp-semesters" role="listbox" aria-label="学期">
          <button
            v-for="t in activeTerms"
            :key="t.id"
            class="tp-semester"
            :class="{ active: t.id === termStore.currentTermId, now: t.isCurrent }"
            role="option"
            :aria-selected="t.id === termStore.currentTermId"
            @click="pickTerm(t.semesterNo)"
          >
            <span class="tp-sem-main">
              <span class="tp-sem-name">学期{{ t.semesterNo }}</span>
              <span class="tp-sem-season">{{ t.seasonLabel }}</span>
            </span>
            <span v-if="t.isCurrent" class="tp-flag">当前</span>
            <span
              v-else-if="t.hasData"
              class="tp-flag data"
              :title="`该学期选课手册解析出 ${t.courseCount} 条开课记录（教学班），非个人已选课程数`"
            >
              {{ t.courseCount }} 教学班
            </span>
            <span v-else class="tp-flag muted">无数据</span>
          </button>
        </div>
      </div>

      <p class="tp-foot">
        学期 1 = 秋冬、学期 2 = 春夏、学期 3 =
        暑假小学期。绿色数字是该学期已导入的<b>教学班数量</b>（来自教务部公开选课手册：一门课可有多个教学班，非个人已选课程数）；"无数据"表示该学期手册尚未公开。
      </p>
    </div>
  </div>
</template>

<style scoped>
.term-switcher {
  position: relative;
}

.term-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--c-border);
  border-radius: 999px;
  background: var(--c-surface);
  color: var(--c-text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  max-width: 320px;
}

.term-trigger:hover {
  border-color: var(--c-primary);
}

.tt-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.tt-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--c-primary);
  background: var(--c-primary-soft);
  border-radius: 999px;
  padding: 1px 8px;
  flex-shrink: 0;
}

.tt-tag.muted {
  color: var(--c-muted);
  background: var(--c-bg);
}

.term-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 80;
  width: min(92vw, 520px);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: 14px;
}

.tp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.tp-title {
  font-weight: 700;
  font-size: 14px;
}

.tp-body {
  display: grid;
  grid-template-columns: 1fr 190px;
  gap: 10px;
}

.tp-years {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  max-height: 232px;
  overflow-y: auto;
  padding-right: 2px;
}

.tp-year {
  padding: 7px 4px;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  background: var(--c-surface);
  color: var(--c-text-secondary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.tp-year:hover {
  border-color: var(--c-primary);
  color: var(--c-primary);
}

.tp-year.active {
  border-color: var(--c-danger);
  color: var(--c-danger);
  font-weight: 700;
}

.tp-year.now {
  font-weight: 700;
  color: var(--c-text);
}

.tp-semesters {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-left: 1px solid var(--c-border);
  padding-left: 10px;
}

.tp-semester {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: var(--c-bg);
  color: var(--c-text);
  font-size: 13.5px;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
}

.tp-semester:hover {
  border-color: var(--c-primary);
}

.tp-semester.active {
  border-color: var(--c-primary);
  background: var(--c-primary-soft);
  font-weight: 700;
}

.tp-semester.now {
  color: var(--c-primary);
}

.tp-sem-main {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
  min-width: 0;
}

.tp-sem-name {
  font-weight: 700;
}

.tp-sem-season {
  color: var(--c-muted);
  font-size: 11.5px;
  font-weight: 400;
}

.tp-flag {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: var(--c-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.tp-flag.data {
  color: var(--c-success);
}

.tp-flag.muted {
  color: var(--c-muted);
  font-weight: 500;
}

.tp-foot {
  margin-top: 10px;
  font-size: 12px;
  color: var(--c-muted);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .term-trigger {
    max-width: 200px;
    font-size: 12px;
    padding: 6px 10px;
  }

  .term-panel {
    right: auto;
    left: 50%;
    transform: translateX(-50%);
  }

  .tp-body {
    grid-template-columns: 1fr;
  }

  .tp-semesters {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid var(--c-border);
    padding-top: 10px;
  }
}
</style>
