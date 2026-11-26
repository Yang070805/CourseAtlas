<script setup lang="ts">
import type { CourseCategory, SortBy, SortOrder } from '@/types'
import AppIcon from '@/components/common/AppIcon.vue'

defineProps<{
  keyword: string
  colleges: string[]
  selectedColleges: string[]
  categories: CourseCategory[]
  selectedCategories: CourseCategory[]
  sortBy: SortBy
  sortOrder: SortOrder
}>()

const emit = defineEmits<{
  'update:keyword': [value: string]
  'toggle-college': [college: string]
  'toggle-category': [category: CourseCategory]
  'update:sortBy': [value: SortBy]
  'toggle-order': []
  reset: []
}>()

const sortOptions: Array<{ value: SortBy; label: string }> = [
  { value: 'semester', label: '开课学期' },
  { value: 'credit', label: '学分' },
  { value: 'hours', label: '学时' },
  { value: 'name', label: '课程名称' },
]
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
          placeholder="搜索课程名称 / 课程编码 / 教师"
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

      <div class="sort-box">
        <label class="sort-label" for="sort-by">排序</label>
        <select
          id="sort-by"
          class="form-control sort-select"
          :value="sortBy"
          @change="emit('update:sortBy', ($event.target as HTMLSelectElement).value as SortBy)"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
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
        <span class="filter-label">学院</span>
        <div class="chip-group">
          <button
            v-for="college in colleges"
            :key="college"
            class="chip"
            :class="{ active: selectedColleges.includes(college) }"
            @click="emit('toggle-college', college)"
          >
            {{ college }}
          </button>
        </div>
      </div>
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
    </div>

    <div class="filter-summary">
      <slot name="count" />
      <span
        v-if="keyword || selectedColleges.length || selectedCategories.length"
        class="active-count"
      >
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
  gap: 12px;
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

.sort-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-label {
  font-size: 13px;
  color: var(--c-text-secondary);
  white-space: nowrap;
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

  .sort-box {
    justify-content: space-between;
  }
}
</style>
