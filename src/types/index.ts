export type CourseCategory = '通识必修课' | '通识选修课' | '大类基础课' | '专业课程' | '其他课程'

/** 一节课的安排：星期几 + 起止节次 + 周次 */
export interface CourseSlot {
  /** 1-7 对应周一至周日 */
  day: number
  /** 起始节次（1-14） */
  start: number
  /** 结束节次（含，>= start） */
  end: number
  /** 上课周次列表，如 [1,2,...,16]，支持单双周等非连续周次 */
  weeks: number[]
}

/** 教学班（课程 + 一条开课记录 = 一个可选的具体班级） */
export interface Offering {
  id: string
  /** 课程号（手册体系内唯一，跨开课单位可能重复） */
  code: string
  name: string
  /** 开课单位 */
  unit: string
  category: CourseCategory
  /** 细分类：体育 / 大学英语 / 思想政治 / 数学 / 计算机 / 专业课程…… */
  typeLabel: string
  /** 通识选修六大模块 / 体育专项类别，其余为空 */
  module: string
  teacher: string
  /** 上课时间，可为空数组（实践类课程不排固定节次） */
  slots: CourseSlot[]
  room: string
  /** 选课名额（培养方案内），空表示手册未给出 */
  capacity: number | null
  /** 跨专业名额，空表示手册未给出 */
  crossCapacity: number | null
  /** 同一课程多班时的班次标识，如「班次 1/3」 */
  sectionLabel: string
  /** 手册备注（组1/组2 等） */
  remark: string
}

/** 枝上学生课程评价 */
export interface Review {
  category: string
  teacher: string
  grading: string
  attendance: string
  score: string
  review: string
  tasks: string
  exam: string
  unit: string
}

/** 选课计划中的一条记录 */
export interface SelectedCourse {
  /** `${termId}:${course.id}` */
  id: string
  termId: string
  course: Offering
  /** 学分：手册未提供，由用户按本人培养方案录入；null 表示待补 */
  credit: number | null
  source: 'catalog' | 'custom'
  addedAt: number
}

/** 学期：学年 + 学期号（1=秋冬、2=春夏、3=暑假小学期） */
export interface Term {
  /** 例：2026-2027-1 */
  id: string
  /** 学年，例：2026-2027 */
  academicYear: string
  /** 学期号 1-3 */
  semesterNo: 1 | 2 | 3
  /** 完整名称，例：2026-2027 学年第一学期（秋冬） */
  label: string
  /** 简要标签，例：2026-2027-1 */
  shortLabel: string
  /** 季节说明 */
  seasonLabel: '秋冬' | '春夏' | '暑假小学期'
  isCurrent: boolean
  /** 是否已导入该学期公开课程数据 */
  hasData: boolean
  /** 该学期教学班数（仅 hasData 时有值） */
  courseCount?: number
}

export type AddResult =
  { ok: true } | { ok: false; reason: 'duplicate' | 'conflict'; conflictName?: string }

export interface RequirementItem {
  category: CourseCategory | '总计'
  label: string
  min: number
  note?: string
}

export type SortBy = 'name' | 'unit' | 'capacity'
export type SortOrder = 'asc' | 'desc'
