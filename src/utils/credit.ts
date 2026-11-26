import type { Course, CourseCategory } from '@/types'

/** 学分合计（保留一位小数，避免浮点误差） */
export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** 课程列表的总学分 */
export function totalCredits(list: Course[]): number {
  return round1(list.reduce((sum, c) => sum + c.credit, 0))
}

/** 按类别统计学分 */
export function creditsByCategory(list: Course[]): Record<CourseCategory, number> {
  const acc: Record<CourseCategory, number> = {
    通识必修: 0,
    通识选修: 0,
    学科基础: 0,
    专业必修: 0,
    专业选修: 0,
    实践环节: 0,
  }
  for (const c of list) acc[c.category] = round1(acc[c.category] + c.credit)
  return acc
}

/** 学期学分分布：返回每学期 [学期, 学分] 数组 */
export function creditsPerSemester(list: Course[]): Array<{ semester: number; credits: number }> {
  const map = new Map<number, number>()
  for (const c of list) map.set(c.semester, round1((map.get(c.semester) ?? 0) + c.credit))
  return [...map.entries()]
    .map(([semester, credits]) => ({ semester, credits }))
    .sort((a, b) => a.semester - b.semester)
}

/** 学期数字 → 中文（第 1-8 学期） */
export function semesterLabel(n: number): string {
  return `第${['一', '二', '三', '四', '五', '六', '七', '八'][n - 1] ?? n}学期`
}

/** 周次数组 → 展示文本，如 "1-16周" 或 "1-8,10-16周" */
export function weeksLabel(weeks: number[]): string {
  const sorted = [...weeks].sort((a, b) => a - b)
  if (sorted.length === 0) return ''
  const parts: string[] = []
  let start = sorted[0]
  let prev = sorted[0]
  for (let i = 1; i <= sorted.length; i++) {
    const w = sorted[i]
    if (w !== prev + 1) {
      parts.push(start === prev ? `${start}` : `${start}-${prev}`)
      start = w
    }
    prev = w
  }
  return `${parts.join(',')}周`
}

/** 时间段文本，如 "周一 1-2节" */
export function slotLabel(slot: { day: number; start: number; end: number }): string {
  const days = ['周一', '周二', '周三', '周四', '周五']
  return `${days[slot.day - 1]} ${slot.start}-${slot.end}节`
}

/** 课程所有时间段拼接文本 */
export function courseScheduleText(course: Course): string {
  return course.slots.map((s) => `${slotLabel(s)}（${weeksLabel(s.weeks)}）`).join('；')
}
