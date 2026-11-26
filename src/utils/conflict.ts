import type { Course, CourseSlot, SelectedCourse } from '@/types'
import { SEMESTER_CREDIT_CAP } from '@/constants'

/** 两个节次区间是否重叠（闭区间） */
export function periodsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

/** 两个周次数组是否有交集 */
export function weeksOverlap(a: number[], b: number[]): boolean {
  return a.some((w) => b.includes(w))
}

/** 两个上课安排是否冲突 */
export function slotsConflict(a: CourseSlot, b: CourseSlot): boolean {
  return (
    a.day === b.day &&
    periodsOverlap(a.start, a.end, b.start, b.end) &&
    weeksOverlap(a.weeks, b.weeks)
  )
}

/** 课程 a 与课程 b 是否存在时间冲突（同一学期且任一时间段重叠） */
export function coursesConflict(a: Course, b: Course): boolean {
  if (a.semester !== b.semester) return false
  return a.slots.some((sa) => b.slots.some((sb) => slotsConflict(sa, sb)))
}

/** 在课程列表中找出与 course 冲突的第一门课 */
export function findConflict(course: Course, list: Course[]): Course | null {
  return list.find((c) => c.id !== course.id && coursesConflict(course, c)) ?? null
}

/** 某学期已选学分总和 */
export function semesterCredits(list: Course[], semester: number): number {
  return list.filter((c) => c.semester === semester).reduce((sum, c) => sum + c.credit, 0)
}

/** 学期学分上限校验 */
export function exceedsCreditCap(
  course: Course,
  list: Course[],
  cap = SEMESTER_CREDIT_CAP,
): boolean {
  return semesterCredits(list, course.semester) + course.credit > cap
}

/** 课程的前置要求是否已被满足（前置课程全部出现在 list 中） */
export function prerequisitesSatisfied(course: Course, list: Course[]): boolean {
  return course.prerequisites.every((id) => list.some((c) => c.id === id))
}

/**
 * 找出 selected 中前置要求未满足的课程：
 * 返回 Map<已选课程id, 缺失的前置课程列表（从 catalog 中解析）>
 */
export function missingPrerequisites(selected: Course[], catalog: Course[]): Map<string, Course[]> {
  const result = new Map<string, Course[]>()
  for (const course of selected) {
    const missing = course.prerequisites
      .map((id) => catalog.find((c) => c.id === id))
      .filter((c): c is Course => Boolean(c))
    if (missing.length > 0) result.set(course.id, missing)
  }
  return result
}

/** 已选列表按加入时间排序（stable） */
export function sortByAddedAt(list: SelectedCourse[]): SelectedCourse[] {
  return [...list].sort((a, b) => a.addedAt - b.addedAt)
}
