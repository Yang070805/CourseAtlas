import type { CourseCategory, CourseSlot, Offering, SelectedCourse } from '@/types'
import { WEEKDAYS } from '@/constants'

/** 保留一位小数，规避浮点误差 */
export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** 已录入学分合计（未录入的不计入） */
export function sumEnteredCredits(list: SelectedCourse[]): number {
  return round1(list.reduce((sum, item) => sum + (item.credit ?? 0), 0))
}

/** 待补学分课程数 */
export function countPendingCredits(list: SelectedCourse[]): number {
  return list.filter((item) => item.credit === null).length
}

/** 按类别统计已录入学分 */
export function creditsByCategory(list: SelectedCourse[]): Record<CourseCategory, number> {
  const acc: Record<CourseCategory, number> = {
    通识必修课: 0,
    通识选修课: 0,
    大类基础课: 0,
    专业课程: 0,
    其他课程: 0,
  }
  for (const item of list) {
    if (item.credit !== null)
      acc[item.course.category] = round1(acc[item.course.category] + item.credit)
  }
  return acc
}

/** 周次数组 → 展示文本，如「1-16周」「1-8,10-16周」「2-16双周」 */
export function weeksLabel(weeks: number[]): string {
  const sorted = [...new Set(weeks)].sort((a, b) => a - b)
  if (sorted.length === 0) return ''
  const isStep2 = sorted.length > 2 && sorted.every((w, i) => i === 0 || w - sorted[i - 1] === 2)
  if (isStep2) return `${sorted[0]}-${sorted[sorted.length - 1]} 单/双周`

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

/** 单个时间段文本，如「周一 3-4节」 */
export function slotLabel(slot: Pick<CourseSlot, 'day' | 'start' | 'end'>): string {
  return `${WEEKDAYS[slot.day - 1] ?? `周${slot.day}`} ${slot.start}-${slot.end}节`
}

/** 全部时间段文本（含周次），无排课返回空串 */
export function slotsText(slots: CourseSlot[]): string {
  return slots.map((s) => `${slotLabel(s)}（${weeksLabel(s.weeks)}）`).join('；')
}

/** 名额文本 */
export function capacityText(course: Offering): string {
  const parts: string[] = []
  if (course.capacity !== null) parts.push(`名额 ${course.capacity}`)
  if (course.crossCapacity !== null) parts.push(`跨专业 ${course.crossCapacity}`)
  return parts.length ? parts.join(' · ') : '手册未标注名额'
}
