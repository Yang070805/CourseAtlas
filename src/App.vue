<script setup lang="ts">
import { computed } from 'vue'
import { useTermStore } from '@/stores/term'
import { usePlannerStore } from '@/stores/planner'
import AppIcon from '@/components/common/AppIcon.vue'
import ToastList from '@/components/common/ToastList.vue'

const termStore = useTermStore()
const planner = usePlannerStore()

const stats = computed(() => planner.termStats(termStore.currentTermId))

const creditSummary = computed(() => {
  const s = stats.value
  const base = `${s.count} 门 · ${s.entered} 学分`
  return s.pending > 0 ? `${base}（${s.pending} 门待补）` : base
})

const navItems = [
  { to: '/courses', label: '课程库', icon: 'book' },
  { to: '/timetable', label: '模拟课表', icon: 'calendar' },
  { to: '/planner', label: '学分规划', icon: 'chart' },
  { to: '/custom', label: '自定义课程', icon: 'plus' },
]
</script>

<template>
  <header class="app-header">
    <div class="app-header-inner">
      <RouterLink to="/" class="brand">
        <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="#842468" />
          <path d="M32 12a20 20 0 1 0 20 20h-8a12 12 0 1 1-12-12v8l-9-11 9-11z" fill="#ffffff" />
          <circle cx="32" cy="32" r="3.5" fill="#842468" />
        </svg>
        CourseAtlas
        <span class="brand-sub">南开选课导航 · 模拟排课与学分规划</span>
      </RouterLink>

      <nav class="main-nav" aria-label="主导航">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="header-tools">
        <label class="term-select" title="切换学期（数据来自教务部选课手册）">
          <AppIcon name="calendar" :size="14" />
          <select
            :value="termStore.currentTermId"
            aria-label="选择学期"
            @change="termStore.setTerm(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="t in termStore.terms" :key="t.id" :value="t.id">
              {{ t.label }}{{ t.isCurrent ? '（当前）' : '' }}
            </option>
          </select>
          <span v-if="termStore.currentTerm.isCurrent" class="term-current-tag">在选</span>
        </label>

        <RouterLink to="/planner" class="header-credit" :title="creditSummary">
          <AppIcon name="graduation" :size="14" />
          <span>{{ creditSummary }}</span>
        </RouterLink>
      </div>
    </div>
  </header>

  <main class="app-main">
    <RouterView />
  </main>

  <footer class="app-footer">
    <div>
      CourseAtlas 选课导航 · 《前端开发实训》期末工程项目（Web 方向） ·
      课程与评价数据来自南开大学公开资料，仅供学习演示
    </div>
    <div>
      数据来源：
      <a
        href="https://jwc.nankai.edu.cn/2026/0817/c35933a601256/page.htm"
        target="_blank"
        rel="noopener"
      >
        南开大学教务部《2026-2027 学年第一学期选课手册》
      </a>
      ·
      <a
        href="https://jwc.nankai.edu.cn/2024/1203/c35933a558034/page.htm"
        target="_blank"
        rel="noopener"
      >
        2024-2025 学年第二学期选课手册
      </a>
    </div>
  </footer>

  <nav class="tab-bar" aria-label="移动端导航">
    <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">
      <AppIcon :name="item.icon" :size="22" />
      {{ item.label }}
    </RouterLink>
  </nav>

  <ToastList />
</template>
