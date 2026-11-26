import type { CourseSlot, Offering } from '@/types'

/** 两个节次区间是否重叠（闭区间） */
export function periodsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

/** 两个周次数组是否有交集（支持单双周等非连续周次） */
export function weeksOverlap(a: number[], b: number[]): boolean {
  const setB = new Set(b)
  return a.some((w) => setB.has(w))
}

/** 两个上课安排是否冲突：同一天 + 节次重叠 + 周次有交集 */
export function slotsConflict(a: CourseSlot, b: CourseSlot): boolean {
  return (
    a.day === b.day &&
    periodsOverlap(a.start, a.end, b.start, b.end) &&
    weeksOverlap(a.weeks, b.weeks)
  )
}

/** 两门课程（教学班）是否时间冲突（任一时间段重叠即冲突） */
export function coursesConflict(a: Offering, b: Offering): boolean {
  return a.slots.some((sa) => b.slots.some((sb) => slotsConflict(sa, sb)))
}

/** 在课程列表中找出与 course 冲突的第一门课 */
export function findConflict(course: Offering, list: Offering[]): Offering | null {
  return list.find((c) => c.id !== course.id && coursesConflict(course, c)) ?? null
}
