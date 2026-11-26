import type { CourseCategory, RequirementItem } from '@/types'

/** 每学期选课学分上限（模拟教务规定，多数高校为 25-35 学分） */
export const SEMESTER_CREDIT_CAP = 30

/** localStorage 键名 */
export const STORAGE_KEY = 'course-atlas:selected-courses:v1'

/** 课程类别展示配置：标签色 / 课表块底色 */
export const CATEGORY_STYLE: Record<CourseCategory, { color: string; bg: string; border: string }> =
  {
    通识必修: { color: '#3b5bdb', bg: '#edf2ff', border: '#bac8ff' },
    通识选修: { color: '#0b7285', bg: '#e3fafc', border: '#99e9f2' },
    学科基础: { color: '#1098ad', bg: '#e0fbfc', border: '#9be6ee' },
    专业必修: { color: '#6741d9', bg: '#f3f0ff', border: '#d0bfff' },
    专业选修: { color: '#b08800', bg: '#fff9db', border: '#ffe066' },
    实践环节: { color: '#c92a2a', bg: '#fff5f5', border: '#ffc9c9' },
  }

/** 培养方案（毕业要求）——依据公开培养方案整理的 mock 数据，见 docs/03-数据结构设计.md */
export const REQUIREMENTS: RequirementItem[] = [
  {
    category: '通识必修',
    label: '通识必修',
    min: 40,
    note: '思想政治、外语、体育、军训、写作沟通等',
  },
  { category: '通识选修', label: '通识选修', min: 4, note: '艺术类课程不少于 2 学分' },
  {
    category: '学科基础',
    label: '学科基础',
    min: 19.5,
    note: '高等数学、线性代数、大学物理、概率论等',
  },
  { category: '专业必修', label: '专业必修', min: 44, note: '专业基础课与专业核心课' },
  { category: '专业选修', label: '专业选修', min: 24, note: '含跨专业选修不低于 6 学分' },
  { category: '实践环节', label: '实践环节', min: 41, note: '课内实验、实训、毕业实习与毕业设计' },
  { category: '总计', label: '毕业总学分', min: 156, note: '最低毕业学分要求' },
]

/** 每学期建议学分数（用于规划页参考） */
export const SEMESTER_GUIDE: Record<number, number> = {
  1: 25,
  2: 26,
  3: 27,
  4: 27,
  5: 25,
  6: 24,
  7: 18,
  8: 14,
}

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'] as const

/** 每节课的开始时间（第 n 节，用于课表时间轴） */
export const PERIOD_TIMES = [
  '08:00',
  '08:55',
  '10:00',
  '10:55',
  '14:00',
  '14:55',
  '16:00',
  '16:55',
  '19:00',
  '19:55',
  '20:50',
  '21:45',
] as const

export const MAX_PERIOD = 12
export const MAX_WEEK = 18
