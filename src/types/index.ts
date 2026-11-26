export type CourseCategory =
  '通识必修' | '通识选修' | '学科基础' | '专业必修' | '专业选修' | '实践环节'

export type Assessment = '考试' | '考查'

/** 一周内某一节课的上课安排：星期几 + 起止节次 + 周次 */
export interface CourseSlot {
  /** 1-5 对应周一至周五 */
  day: number
  /** 起始节次（1-12） */
  start: number
  /** 结束节次（含，>= start） */
  end: number
  /** 上课周次列表，如 [1,2,...,16] */
  weeks: number[]
}

/** 课程（来自课程库或用户自定义） */
export interface Course {
  id: string
  /** 课程编码，如 0701000225 */
  code: string
  name: string
  /** 开课学院 */
  college: string
  category: CourseCategory
  credit: number
  hours: number
  assessment: Assessment
  /** 开课学期 1-8 */
  semester: number
  teacher: string
  slots: CourseSlot[]
  /** 前置课程 id 列表（空数组表示无前置要求） */
  prerequisites: string[]
  description: string
}

/** 已选入模拟课表的课程条目 */
export interface SelectedCourse {
  id: string
  course: Course
  /** catalog=来自课程库；custom=用户自定义课程 */
  source: 'catalog' | 'custom'
  /** 加入时间戳，用于排序与展示 */
  addedAt: number
}

/** 添加课程到课表的校验结果 */
export type AddResult =
  | { ok: true }
  | {
      ok: false
      reason: 'duplicate' | 'conflict' | 'credit-cap'
      /** 冲突时给出冲突的课程名称 */
      conflictName?: string
      /** 学分上限时给出该学期已选学分与上限 */
      detail?: { semester: number; selected: number; cap: number }
    }

/** 培养方案中的一条学分要求 */
export interface RequirementItem {
  category: CourseCategory | '总计'
  label: string
  /** 最低要求学分 */
  min: number
  note?: string
}

export type SortBy = 'semester' | 'credit' | 'hours' | 'name'
export type SortOrder = 'asc' | 'desc'
