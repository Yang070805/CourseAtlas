<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { CourseCategory, Offering } from '@/types'
import { ALL_CATEGORIES, MAX_PERIOD, WEEKDAYS } from '@/constants'
import { findConflict } from '@/utils/conflict'
import { usePlannerStore } from '@/stores/planner'
import { useTermStore } from '@/stores/term'
import { useToast } from '@/composables/useToast'
import AppIcon from '@/components/common/AppIcon.vue'

const router = useRouter()
const planner = usePlannerStore()
const termStore = useTermStore()
const toast = useToast()

const periodOptions = computed(() => Array.from({ length: MAX_PERIOD }, (_, i) => i + 1))
const weekOptions = computed(() => Array.from({ length: 18 }, (_, i) => i + 1))

interface FormState {
  name: string
  unit: string
  category: CourseCategory | ''
  teacher: string
  credit: string
  room: string
  day: string
  startPeriod: string
  endPeriod: string
  startWeek: string
  endWeek: string
  description: string
}

const form = reactive<FormState>({
  name: '',
  unit: '',
  category: '',
  teacher: '',
  credit: '',
  room: '',
  day: '',
  startPeriod: '',
  endPeriod: '',
  startWeek: '1',
  endWeek: '16',
  description: '',
})

type Errors = Partial<Record<keyof FormState, string>>

const errors = reactive<Errors>({})
const touched = reactive<Partial<Record<keyof FormState, boolean>>>({})
const submitted = ref(false)
const globalError = ref('')

function validateField(field: keyof FormState): string {
  const value = form[field]
  switch (field) {
    case 'name': {
      if (!value.trim()) return '请输入课程名称'
      if (value.trim().length < 2 || value.trim().length > 30) return '课程名称长度需在 2-30 字之间'
      return ''
    }
    case 'unit':
      return value.trim() ? '' : '请输入开课单位 / 学院'
    case 'category':
      return value ? '' : '请选择课程类别'
    case 'teacher':
      return value.trim() ? '' : '请输入授课教师'
    case 'credit': {
      if (value === '') return '请输入学分（依据本人培养方案）'
      const c = Number(value)
      if (!Number.isFinite(c) || c < 0.5 || c > 20) return '学分需在 0.5-20 之间'
      if (Math.round(c * 10) !== c * 10) return '学分最多一位小数'
      return ''
    }
    case 'day':
      return value ? '' : '请选择上课星期'
    case 'startPeriod':
    case 'endPeriod':
      return value ? '' : '请选择节次'
    case 'startWeek':
    case 'endWeek':
      return value ? '' : '请选择周次'
    default:
      return ''
  }
}

function validateAll(): boolean {
  ;(Object.keys(form) as Array<keyof FormState>).forEach((k) => {
    errors[k] = validateField(k)
  })
  if (
    !errors.startPeriod &&
    !errors.endPeriod &&
    Number(form.startPeriod) > Number(form.endPeriod)
  ) {
    errors.endPeriod = `结束节次不能早于起始节次（起始为第 ${form.startPeriod} 节）`
  }
  if (!errors.startWeek && !errors.endWeek && Number(form.startWeek) > Number(form.endWeek)) {
    errors.endWeek = `结束周不能早于起始周（起始为第 ${form.startWeek} 周）`
  }
  return Object.values(errors).every((e) => !e)
}

function markTouched(field: keyof FormState) {
  touched[field] = true
  if (submitted.value) errors[field] = validateField(field)
}

/** 输入时实时清掉已修正字段的错误，避免错误提示突然消失引起按钮位移 */
function onFieldInput(field: keyof FormState) {
  if (submitted.value && errors[field]) errors[field] = validateField(field)
}

function buildCourse(): Offering {
  const ts = Date.now()
  return {
    id: `custom-${ts}`,
    code: `CUSTOM-${String(ts).slice(-6)}`,
    name: form.name.trim(),
    unit: form.unit.trim(),
    category: form.category as CourseCategory,
    typeLabel: '自定义课程',
    module: '',
    teacher: form.teacher.trim(),
    slots: [
      {
        day: Number(form.day),
        start: Number(form.startPeriod),
        end: Number(form.endPeriod),
        weeks: Array.from(
          { length: Number(form.endWeek) - Number(form.startWeek) + 1 },
          (_, i) => Number(form.startWeek) + i,
        ),
      },
    ],
    room: form.room.trim(),
    capacity: null,
    crossCapacity: null,
    sectionLabel: '',
    remark: '',
  }
}

function onSubmit() {
  submitted.value = true
  globalError.value = ''
  ;(Object.keys(form) as Array<keyof FormState>).forEach((k) => {
    touched[k] = true
  })
  if (!validateAll()) {
    toast.push('error', '表单校验未通过，请检查标红的输入项')
    return
  }

  const course = buildCourse()
  const termId = termStore.currentTermId

  const conflict = findConflict(course, planner.byTerm.get(termId)?.map((s) => s.course) ?? [])
  if (conflict) {
    globalError.value = `《${course.name}》与已选课程《${conflict.name}》上课时间冲突，无法提交。请调整上课时间或先移除冲突课程。`
    toast.push('error', `提交失败：与《${conflict.name}》时间冲突`)
    return
  }

  const result = planner.addCustomCourse(course, termId, Number(form.credit))
  if (!result.ok) {
    globalError.value =
      result.reason === 'conflict' ? '提交失败：时间冲突' : '添加失败，请稍后重试。'
    return
  }

  toast.push('success', `自定义课程《${course.name}》已加入模拟课表`)
  resetForm()
  router.push('/timetable')
}

function resetForm() {
  Object.assign(form, {
    name: '',
    unit: '',
    category: '',
    teacher: '',
    credit: '',
    room: '',
    day: '',
    startPeriod: '',
    endPeriod: '',
    startWeek: '1',
    endWeek: '16',
    description: '',
  })
  Object.keys(errors).forEach((k) => delete errors[k as keyof FormState])
  Object.keys(touched).forEach((k) => delete touched[k as keyof FormState])
  submitted.value = false
  globalError.value = ''
}
</script>

<template>
  <form class="card custom-form" novalidate @submit.prevent="onSubmit">
    <div class="form-intro">
      <AppIcon name="plus" :size="18" />
      <div>
        <h2>添加自定义课程</h2>
        <p>
          适用于课程库之外的教学班：校外课程、重修课程、特色班、实验/实践课等。 提交到「{{
            termStore.currentTerm.label
          }}」，提交前会校验表单与时间冲突。
        </p>
      </div>
    </div>

    <div class="form-section-title">基本信息</div>

    <div class="form-group">
      <label class="form-label" for="f-name">课程名称<span class="required">*</span></label>
      <input
        id="f-name"
        v-model="form.name"
        type="text"
        class="form-control"
        :class="{ invalid: errors.name && touched.name }"
        placeholder="例如：高级语言程序设计 2-2"
        maxlength="30"
        @blur="markTouched('name')"
        @input="onFieldInput('name')"
      />
      <div v-if="errors.name && touched.name" class="form-error">{{ errors.name }}</div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="f-unit">开课单位<span class="required">*</span></label>
        <input
          id="f-unit"
          v-model="form.unit"
          type="text"
          class="form-control"
          :class="{ invalid: errors.unit && touched.unit }"
          placeholder="例如：计算机学院"
          maxlength="20"
          @blur="markTouched('unit')"
          @input="onFieldInput('unit')"
        />
        <div v-if="errors.unit && touched.unit" class="form-error">{{ errors.unit }}</div>
      </div>
      <div class="form-group">
        <label class="form-label" for="f-teacher">授课教师<span class="required">*</span></label>
        <input
          id="f-teacher"
          v-model="form.teacher"
          type="text"
          class="form-control"
          :class="{ invalid: errors.teacher && touched.teacher }"
          placeholder="例如：张老师"
          maxlength="20"
          @blur="markTouched('teacher')"
          @input="onFieldInput('teacher')"
        />
        <div v-if="errors.teacher && touched.teacher" class="form-error">{{ errors.teacher }}</div>
      </div>
    </div>

    <div class="form-section-title">课程属性</div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="f-category">课程类别<span class="required">*</span></label>
        <select
          id="f-category"
          v-model="form.category"
          class="form-control"
          :class="{ invalid: errors.category && touched.category }"
          @change="markTouched('category')"
        >
          <option value="" disabled>请选择类别</option>
          <option v-for="c in ALL_CATEGORIES" :key="c" :value="c">{{ c }}</option>
        </select>
        <div v-if="errors.category && touched.category" class="form-error">
          {{ errors.category }}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="f-credit">学分<span class="required">*</span></label>
        <input
          id="f-credit"
          v-model="form.credit"
          type="number"
          class="form-control"
          :class="{ invalid: errors.credit && touched.credit }"
          min="0.5"
          max="20"
          step="0.5"
          placeholder="按本人培养方案填写"
          @blur="markTouched('credit')"
          @input="onFieldInput('credit')"
        />
        <div v-if="errors.credit && touched.credit" class="form-error">{{ errors.credit }}</div>
      </div>
    </div>

    <div class="form-section-title">上课时间</div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="f-day">星期<span class="required">*</span></label>
        <select
          id="f-day"
          v-model="form.day"
          class="form-control"
          :class="{ invalid: errors.day && touched.day }"
          @change="markTouched('day')"
        >
          <option value="" disabled>请选择</option>
          <option v-for="(d, i) in WEEKDAYS" :key="d" :value="i + 1">{{ d }}</option>
        </select>
        <div v-if="errors.day && touched.day" class="form-error">{{ errors.day }}</div>
      </div>
      <div class="form-group">
        <label class="form-label" for="f-room">上课地点（选填）</label>
        <input
          id="f-room"
          v-model="form.room"
          type="text"
          class="form-control"
          placeholder="例如：津南公教楼 A201"
          maxlength="30"
        />
      </div>
      <div class="form-group">
        <label class="form-label" for="f-start-period"
          >起始节次<span class="required">*</span></label
        >
        <select
          id="f-start-period"
          v-model="form.startPeriod"
          class="form-control"
          :class="{ invalid: errors.startPeriod && touched.startPeriod }"
          @change="markTouched('startPeriod')"
        >
          <option value="" disabled>请选择</option>
          <option v-for="p in periodOptions" :key="p" :value="p">第 {{ p }} 节</option>
        </select>
        <div v-if="errors.startPeriod && touched.startPeriod" class="form-error">
          {{ errors.startPeriod }}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="f-end-period">结束节次<span class="required">*</span></label>
        <select
          id="f-end-period"
          v-model="form.endPeriod"
          class="form-control"
          :class="{ invalid: errors.endPeriod && touched.endPeriod }"
          @change="markTouched('endPeriod')"
        >
          <option value="" disabled>请选择</option>
          <option v-for="p in periodOptions" :key="p" :value="p">第 {{ p }} 节</option>
        </select>
        <div v-if="errors.endPeriod && touched.endPeriod" class="form-error">
          {{ errors.endPeriod }}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="f-start-week">起始周<span class="required">*</span></label>
        <select
          id="f-start-week"
          v-model="form.startWeek"
          class="form-control"
          :class="{ invalid: errors.startWeek && touched.startWeek }"
          @change="markTouched('startWeek')"
        >
          <option v-for="w in weekOptions" :key="w" :value="w">第 {{ w }} 周</option>
        </select>
        <div v-if="errors.startWeek && touched.startWeek" class="form-error">
          {{ errors.startWeek }}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="f-end-week">结束周<span class="required">*</span></label>
        <select
          id="f-end-week"
          v-model="form.endWeek"
          class="form-control"
          :class="{ invalid: errors.endWeek && touched.endWeek }"
          @change="markTouched('endWeek')"
        >
          <option v-for="w in weekOptions" :key="w" :value="w">第 {{ w }} 周</option>
        </select>
        <div v-if="errors.endWeek && touched.endWeek" class="form-error">{{ errors.endWeek }}</div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="f-desc">备注（选填）</label>
      <textarea
        id="f-desc"
        v-model="form.description"
        class="form-control"
        maxlength="120"
        placeholder="补充说明（120 字以内），例如：与原课程时间冲突已与老师协商调课"
      />
    </div>

    <div v-if="globalError" class="global-error" role="alert">
      <AppIcon name="alert" :size="15" />
      {{ globalError }}
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-ghost" @click="resetForm">重置</button>
      <button type="submit" class="btn btn-primary">
        <AppIcon name="check" :size="15" />
        校验并加入模拟课表
      </button>
    </div>
  </form>
</template>

<style scoped>
.custom-form {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 28px;
}

.form-intro {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: var(--c-primary);
  background: var(--c-primary-soft);
  border-radius: var(--radius);
  padding: 14px 16px;
  margin-bottom: 20px;
}

.form-intro h2 {
  font-size: 16px;
  color: var(--c-text);
}

.form-intro p {
  font-size: 13px;
  color: var(--c-text-secondary);
  margin-top: 2px;
}

.form-section-title {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--c-text);
  padding-bottom: 8px;
  margin: 22px 0 16px;
  border-bottom: 1px solid var(--c-border);
}

.form-row {
  grid-template-columns: 1fr 1fr;
}

.global-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: var(--c-danger-soft);
  border: 1px solid #f3b9b4;
  color: var(--c-danger);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 14px;
  margin-bottom: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
