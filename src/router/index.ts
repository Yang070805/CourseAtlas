import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/courses',
    },
    {
      path: '/courses',
      name: 'courses',
      component: () => import('@/views/CoursesView.vue'),
      meta: { title: '课程库' },
    },
    {
      path: '/timetable',
      name: 'timetable',
      component: () => import('@/views/TimetableView.vue'),
      meta: { title: '模拟课表' },
    },
    {
      path: '/planner',
      name: 'planner',
      component: () => import('@/views/PlannerView.vue'),
      meta: { title: '学分规划' },
    },
    {
      path: '/custom',
      name: 'custom',
      component: () => import('@/views/CustomCourseView.vue'),
      meta: { title: '自定义课程' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/courses',
    },
  ],
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} · CourseAtlas 选课导航` : 'CourseAtlas · 选课导航'
})

export default router
