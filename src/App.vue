<script setup lang="ts">
import { computed } from 'vue'
import { usePlannerStore } from '@/stores/planner'
import AppIcon from '@/components/common/AppIcon.vue'
import ToastList from '@/components/common/ToastList.vue'

const planner = usePlannerStore()

const creditSummary = computed(() => `已选 ${planner.totalCredits} 学分`)

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
          <rect width="64" height="64" rx="14" fill="#4c6ef5" />
          <path d="M32 12a20 20 0 1 0 20 20h-8a12 12 0 1 1-12-12v8l-9-11 9-11z" fill="#ffffff" />
          <circle cx="32" cy="32" r="3.5" fill="#4c6ef5" />
        </svg>
        CourseAtlas
        <span class="brand-sub">选课导航 · 模拟排课与学分路径规划</span>
      </RouterLink>

      <nav class="main-nav" aria-label="主导航">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">
          {{ item.label }}
        </RouterLink>
      </nav>

      <RouterLink to="/planner" class="header-credit" :title="creditSummary">
        <AppIcon name="graduation" :size="15" />
        {{ creditSummary }} / 156
      </RouterLink>
    </div>
  </header>

  <main class="app-main">
    <RouterView />
  </main>

  <footer class="app-footer">
    <div>CourseAtlas 选课导航 · 《前端开发实训》期末工程项目（Web 方向） · 课程数据为演示用途</div>
    <div>
      数据蓝本：
      <a href="https://www.csust.edu.cn/jtxy/info/1975/28924.htm" target="_blank" rel="noopener">
        长沙理工大学《软件工程专业培养方案(2026)》
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
