<script setup lang="ts">
import type { CourseCategory, SortBy, SortOrder } from '@/types'
import { GENERAL_MODULES, SORT_OPTIONS } from '@/constants'
import AppIcon from '@/components/common/AppIcon.vue'

defineProps<{
  keyword: string
  units: string[]
  unit: string
  categories: CourseCategory[]
  selectedCategories: CourseCategory[]
  module: string
  sortBy: SortBy
  sortOrder: SortOrder
  resultCount: number
  loading: boolean
}>()

const emit = defineEmits<{
  'update:keyword': [value: string]
  'update:unit': [value: string]
  'update:module': [value: string]
  'toggle-category': [category: CourseCategory]
  'update:sortBy': [value: SortBy]
  'toggle-order': []
  reset: []
}>()
</script>

<template>
  <div class="course-filters card">
    <div class="filters-row">
      <div class="search-box">
        <AppIcon name="search" :size="17" />
        <input
          :value="keyword"
          type="search"
          class="search-input"
          placeholder="搜索课程名 / 课程号 / 教师 / 教室"
          aria-label="搜索课程"
          @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
        />
        <button
          v-if="keyword"
          class="search-clear"
          aria-label="清空搜索"
          @click="emit('update:keyword', '')"
        >
          <AppIcon name="x" :size="14" />
        </button>
      </div>

      <select
        class="form-control unit-select"
        :value="unit"
        aria-label="筛选开课单位"
        @change="emit('update:unit', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">全部开课单位</option>
        <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
      </select>

      <div class="sort-box">
        <select
          class="form-control sort-select"
          :value="sortBy"
          aria-label="排序方式"
          @change="emit('update:sortBy', ($event.target as HTMLSelectElement).value as SortBy)"
        >
          <option v-for="opt in SORT_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <button
          class="btn btn-ghost btn-sm order-btn"
          :title="sortOrder === 'asc' ? '当前升序，点击切换为降序' : '当前降序，点击切换为升序'"
          @click="emit('toggle-order')"
        >
          {{ sortOrder === 'asc' ? '升序 ↑' : '降序 ↓' }}
        </button>
      </div>

      <button class="btn btn-ghost btn-sm" @click="emit('reset')">
        <AppIcon name="refresh" :size="14" />
        重置
      </button>
    </div>

    <div class="filter-groups">
      <div class="filter-group-row">
        <span class="filter-label">类别</span>
        <div class="chip-group">
          <button
            v-for="category in categories"
            :key="category"
            class="chip"
            :class="{ active: selectedCategories.includes(category) }"
            @click="emit('toggle-category', category)"
          >
            {{ category }}
          </button>
        </div>
      </div>
      <div class="filter-group-row">
        <span class="filter-label">模块</span>
        <div class="chip-group">
          <select
            class="form-control module-select"
            :value="module"
            aria-label="筛选通识模块"
            @change="emit('update:module', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">全部模块（通识选修 / 体育专项）</option>
            <option v-for="m in GENERAL_MODULES" :key="m" :value="m">{{ m }}</option>
            <option value="专项运动训练">专项运动训练</option>
            <option value="身体素质训练">身体素质训练</option>
          </select>
        </div>
      </div>
    </div>

    <div class="filter-summary">
      <slot name="count">{{ loading ? '加载中…' : `共 ${resultCount} 个教学班` }}</slot>
      <span v-if="keyword || unit || selectedCategories.length || module" class="active-count">
        （已启用筛选条件）
      </span>
    </div>
  </div>
</template>

<style scoped>
.course-filters {
  padding: 16px 20px;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 240px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface);
  color: var(--c-muted);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.search-box:focus-within {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px var(--c-primary-soft);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 9px 0;
  background: transparent;
  color: var(--c-text);
}

.search-clear {
  border: none;
  background: none;
  color: var(--c-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
}

.search-clear:hover {
  color: var(--c-text);
}

.unit-select {
  width: auto;
  max-width: 240px;
  padding: 8px 10px;
}

.module-select {
  width: auto;
  padding: 6px 10px;
  font-size: 13px;
}

.sort-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-select {
  width: auto;
  padding: 7px 10px;
}

.order-btn {
  padding: 7px 10px;
}

.filter-groups {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-group-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.filter-label {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--c-text-secondary);
  font-weight: 600;
  padding-top: 6px;
  width: 36px;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-text-secondary);
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.chip:hover {
  border-color: var(--c-primary);
  color: var(--c-primary);
}

.chip.active {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
  font-weight: 600;
}

.filter-summary {
  margin-top: 12px;
  color: var(--c-muted);
  font-size: 13px;
}

.active-count {
  color: var(--c-primary);
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    min-width: 0;
  }

  .unit-select {
    max-width: none;
  }

  .sort-box {
    justify-content: space-between;
  }
}
</style>
