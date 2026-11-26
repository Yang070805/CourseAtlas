import type { CourseCategory, RequirementItem, Term } from '@/types'

/** 可用学期（数据来自南开大学教务部公开选课手册，见 docs/05） */
export const TERMS: Term[] = [
  { id: '2026-2027-1', label: '2026-2027 学年第一学期（秋季）', season: '秋', isCurrent: true },
  { id: '2024-2025-2', label: '2024-2025 学年第二学期（春季）', season: '春', isCurrent: false },
]

export const DEFAULT_TERM_ID = '2026-2027-1'

/** 学期数据文件（public/data 下按学期懒加载） */
export const TERM_DATA_URL = (termId: string) =>
  `${import.meta.env.BASE_URL}data/term-${termId}.json`
export const REVIEWS_URL = `${import.meta.env.BASE_URL}data/reviews.json`

/** 每学期选课学分上限（示例教务口径，可在本文件调整） */
export const SEMESTER_CREDIT_CAP = 30

/** localStorage 键名（带版本号，结构变更可平滑迁移） */
export const STORAGE_KEY_SELECTED = 'course-atlas:selected:v2'
export const STORAGE_KEY_TERM = 'course-atlas:term:v1'

/** 课程类别配色（南开紫主色体系 + 辅助色，保证课表可区分） */
export const CATEGORY_STYLE: Record<CourseCategory, { color: string; bg: string; border: string }> =
  {
    通识必修课: { color: '#6E2F8C', bg: '#F5EDF9', border: '#D9C2E8' },
    通识选修课: { color: '#A63A8A', bg: '#FBEDF6', border: '#EBC0DE' },
    大类基础课: { color: '#3F62A8', bg: '#EDF1FA', border: '#C4D0EA' },
    专业课程: { color: '#2B7A6B', bg: '#E8F6F2', border: '#B5DFD3' },
    其他课程: { color: '#8A7B68', bg: '#F7F3ED', border: '#E0D6C7' },
  }

export const ALL_CATEGORIES: CourseCategory[] = [
  '通识必修课',
  '通识选修课',
  '大类基础课',
  '专业课程',
  '其他课程',
]

/**
 * 毕业学分要求（示例配置）
 *
 * 南开大学未公开全量培养方案（见 docs/05 排查结论），此处为演示用的示例要求，
 * 不代表任何专业的真实要求；可按本专业培养方案修改本文件后重新构建。
 */
export const REQUIREMENTS: RequirementItem[] = [
  {
    category: '通识必修课',
    label: '通识必修课',
    min: 40,
    note: '思政、外语、体育、军事理论、心理健康等',
  },
  {
    category: '通识选修课',
    label: '通识选修课',
    min: 14,
    note: '六大模块，艺术类课程建议不少于 2 学分',
  },
  {
    category: '大类基础课',
    label: '大类基础课',
    min: 24,
    note: '高等数学、大学物理、计算机基础等',
  },
  {
    category: '专业课程',
    label: '专业课程',
    min: 60,
    note: '专业必修与选修（按本院培养方案区分）',
  },
  { category: '总计', label: '毕业总学分', min: 138, note: '示例要求，实际以本人培养方案为准' },
]

export interface SelectOption<T extends string> {
  value: T
  label: string
}

export const SORT_OPTIONS: SelectOption<'name' | 'unit' | 'capacity'>[] = [
  { value: 'name', label: '课程名称' },
  { value: 'unit', label: '开课单位' },
  { value: 'capacity', label: '选课名额' },
]

/** 星期（1-7 → 周一至周日） */
export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const

/** 手册中的节次上限（数据中最大为 14 节） */
export const MAX_PERIOD = 14

/** 通识选修课六大模块（用于筛选） */
export const GENERAL_MODULES = [
  '艺术审美与文化思辨',
  '科学精神与健康生活',
  '社会发展与国家治理',
  '世界文明与国际视野',
  '工程素养与未来科技',
  '公能素质和服务中国',
] as const
