/**
 * CourseAtlas 冒烟测试（v2 · 南开真实数据 + 学期切换）
 *
 * 用法（需先启动开发服务器）：
 *   1. npm run dev      （默认 http://localhost:5173）
 *   2. npm run smoke    （本脚本，自动输出截图到 screenshots/）
 *
 * 覆盖：课程库加载/搜索/筛选/排序/分页 → 加入课表 → 时间冲突拦截 → 持久化
 *      → 学分录入 → 规划页与历史学期 → 学期切换 → 课程评价弹窗
 *      → 自定义课程校验与冲突拦截 → 移动端视图
 */
import { chromium } from 'playwright-core'
import { mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:5173'
const __dirname = dirname(fileURLToPath(import.meta.url))
const SHOT_DIR = join(__dirname, '..', 'screenshots')
const CURRENT_TERM = '2026-2027-1'
const HISTORY_TERM = '2024-2025-2'

let passed = 0
let failed = 0
const failures = []

function check(name, ok, extra = '') {
  if (ok) {
    passed++
    console.log(`  ✅ ${name}`)
  } else {
    failed++
    failures.push(name)
    console.log(`  ❌ ${name} ${extra}`)
  }
}

async function launch() {
  try {
    return await chromium.launch({ channel: 'chrome' })
  } catch {
    return await chromium.launch({ channel: 'msedge' })
  }
}

async function waitForServer(page, url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 })
      return true
    } catch {
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  return false
}

/** 找到同课名中两个时间重叠的教学班（用于确定性冲突测试），返回教师与时间文本 */
async function findConflictingSections(page) {
  return page.evaluate(async (term) => {
    const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const data = await fetch(`/data/term-${term}.json`).then((r) => r.json())
    const slotText = (s) => `${WEEKDAYS[s.day - 1]} ${s.start}-${s.end}节`
    const byName = new Map()
    for (const c of data.courses) {
      if (!c.slots.length || !c.teacher) continue
      const list = byName.get(c.name) ?? []
      list.push(c)
      byName.set(c.name, list)
    }
    const overlap = (a, b) =>
      a.slots.some((sa) =>
        b.slots.some(
          (sb) =>
            sa.day === sb.day &&
            sa.start <= sb.end &&
            sb.start <= sa.end &&
            sa.weeks.some((w) => sb.weeks.includes(w)),
        ),
      )
    for (const [name, list] of byName) {
      if (list.length < 2) continue
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (overlap(list[i], list[j])) {
            return {
              name,
              a: { teacher: list[i].teacher, slot: slotText(list[i].slots[0]) },
              b: { teacher: list[j].teacher, slot: slotText(list[j].slots[0]) },
            }
          }
        }
      }
    }
    return null
  }, CURRENT_TERM)
}

/** 在搜索结果中按「教师 + 时间段」定位卡片并加入（自动翻页查找） */
async function addOfferingByCard(page, name, teacher, slot) {
  await page.fill('.search-input', name)
  await page.waitForTimeout(500)
  for (let p = 1; p <= 3; p++) {
    if (p > 1) {
      const pageBtn = page.locator('.page-btn', { hasText: String(p) })
      if ((await pageBtn.count()) === 0) return false
      await pageBtn.first().click()
      await page.waitForTimeout(400)
    }
    const card = page
      .locator('.course-card')
      .filter({ hasText: teacher })
      .filter({ hasText: slot })
      .first()
    if ((await card.count()) === 0) continue
    await card.getByRole('button', { name: /加入课表|已在课表中/ }).click()
    return true
  }
  return false
}

/** 读取当前学期已选课程的占用情况，返回冲突时段与一个空闲时段 */
async function computeSlots(page, term) {
  return page.evaluate((termId) => {
    const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const selected = JSON.parse(localStorage.getItem('course-atlas:selected:v2') ?? '[]').filter(
      (s) => s.termId === termId,
    )
    const slots = selected.flatMap((s) => s.course.slots)
    const hit = (day, start, end, weeks) =>
      slots.some(
        (s) =>
          s.day === day &&
          s.start <= end &&
          start <= s.end &&
          s.weeks.some((w) => weeks.includes(w)),
      )
    const busy = slots[0] ?? null
    let free = null
    outer: for (let day = 7; day >= 1; day--) {
      for (let start = 13; start >= 1; start--) {
        const end = Math.min(start + 1, 14)
        if (!hit(day, start, end, [1, 2, 3, 4, 5, 6, 7, 8])) {
          free = { day, start, end, label: `${WEEKDAYS[day - 1]} ${start}-${end}节` }
          break outer
        }
      }
    }
    return {
      busy: busy
        ? {
            day: busy.day,
            start: busy.start,
            end: busy.end,
            label: `${WEEKDAYS[busy.day - 1]} ${busy.start}-${busy.end}节`,
          }
        : null,
      free,
    }
  }, term)
}

async function main() {
  if (!existsSync(SHOT_DIR)) mkdirSync(SHOT_DIR, { recursive: true })

  const browser = await launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' })
  const page = await ctx.newPage()

  console.log('\n[0] 开发服务器可达性')
  const up = await waitForServer(page, BASE)
  check('开发服务器已启动', up)
  if (!up) {
    console.log('请先执行 npm run dev 再运行冒烟测试')
    await browser.close()
    process.exit(1)
  }

  console.log('\n[1] 课程库：真实数据加载 / 搜索 / 筛选 / 排序 / 分页')
  // 清空历史状态，保证测试可重复
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}/courses`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.course-card', { timeout: 15000 })
  const totalText = await page.locator('.filter-summary').innerText()
  check('教学班总数来自真实数据（4876）', totalText.includes('4876'), `(${totalText.trim()})`)

  await page.fill('.search-input', '高等数学')
  await page.waitForTimeout(400)
  const mathCards = await page.locator('.course-card').count()
  check('关键词搜索生效', mathCards > 0, `(匹配 ${mathCards} 张卡片)`)
  check(
    '搜索结果为高等数学',
    (await page.locator('.course-card').first().innerText()).includes('高等数学'),
  )

  await page.fill('.search-input', '')
  await page.waitForTimeout(400)
  const unitCount = await page.locator('.unit-select option').count()
  check('开课单位筛选有 38 个选项', unitCount >= 38, `(${unitCount})`)
  await page.locator('.unit-select').selectOption({ index: 1 })
  await page.waitForTimeout(400)
  const filteredText = await page.locator('.filter-summary').innerText()
  check('开课单位筛选生效', !filteredText.includes('4876'), `(${filteredText.trim()})`)
  await page.locator('.unit-select').selectOption('')

  await page.locator('.chip', { hasText: '通识选修课' }).click()
  await page.waitForTimeout(400)
  const catText = await page.locator('.filter-summary').innerText()
  check('课程类别筛选生效', !catText.includes('4876'), `(${catText.trim()})`)
  await page.locator('.chip', { hasText: '通识选修课' }).click()

  await page.locator('.order-btn').click()
  await page.waitForTimeout(300)
  check('排序切换生效', (await page.locator('.order-btn').innerText()).includes('降序'))
  await page.locator('.order-btn').click()

  await page.locator('.page-btn', { hasText: '2' }).click()
  await page.waitForTimeout(300)
  check('分页切换生效', (await page.locator('.page-info').innerText()).includes('2/'))
  await page.locator('.page-btn', { hasText: '1' }).first().click()

  console.log('\n[2] 加入课表 / 冲突拦截 / 持久化')
  const pair = await findConflictingSections(page)
  check(
    '数据中找到时间重叠的同课名教学班',
    Boolean(pair),
    pair ? `(${pair.name} ${pair.a.slot})` : '',
  )

  const addedA = await addOfferingByCard(page, pair.name, pair.a.teacher, pair.a.slot)
  await page.waitForTimeout(400)
  check(
    '加入第一门课程',
    addedA && (await page.locator('.toast', { hasText: '已加入模拟课表' }).count()) > 0,
  )

  const addedB = await addOfferingByCard(page, pair.name, pair.b.teacher, pair.b.slot)
  await page.waitForTimeout(400)
  const conflictToast = await page.locator('.toast', { hasText: '冲突' }).count()
  check('第二门同时间课程被拦截', addedB && conflictToast > 0)

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.header-credit', { timeout: 15000 })
  await page
    .waitForFunction(
      () => !document.querySelector('.header-credit')?.textContent?.includes('0 门'),
      null,
      { timeout: 10000 },
    )
    .catch(() => {})
  const creditText = await page.locator('.header-credit').innerText()
  check(
    '已选课程持久化（localStorage v2）',
    !creditText.includes('0 门'),
    `(头部：${creditText.trim()})`,
  )

  console.log('\n[3] 模拟课表：网格渲染与学分录入')
  await page.goto(`${BASE}/timetable`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.tt-block', { timeout: 15000 })
  check('课表网格课程块渲染', (await page.locator('.tt-block').count()) >= 1)
  const statBefore = await page.locator('.stat-value').first().innerText()
  check('统计卡显示已选门数', /[1-9]/.test(statBefore), `(${statBefore})`)

  await page.locator('.credit-input').first().fill('3')
  await page.locator('.credit-input').first().press('Tab')
  await page.waitForTimeout(400)
  const creditAfter = await page.locator('.header-credit').innerText()
  check('学分录入后头部同步（3 学分）', creditAfter.includes('3 学分'), `(${creditAfter.trim()})`)
  const timelineText = await page.locator('.selected-panel').innerText()
  check('已选面板显示学分与待补提示', timelineText.includes('3 学分'))
  await page.screenshot({ path: join(SHOT_DIR, '01-timetable-desktop.png') })

  console.log('\n[4] 学分规划：示例要求 / 学期记录 / 分类明细')
  await page.goto(`${BASE}/planner`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.total-card', { timeout: 15000 })
  const plannerText = await page.locator('.main-content, main').innerText()
  check('规划页显示示例要求说明', plannerText.includes('示例配置'))
  check('历史学期卡片存在', plannerText.includes('2024-2025 学年第二学期'))
  check('分类明细含已选课程', plannerText.includes(pair.name))
  await page.screenshot({ path: join(SHOT_DIR, '02-planner-desktop.png') })

  console.log('\n[5] 学期切换（历史学期查询）')
  await page.goto(`${BASE}/courses`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.course-card', { timeout: 15000 })
  await page.locator('.term-select select').selectOption(HISTORY_TERM)
  await page.waitForFunction(
    () => document.querySelector('.filter-summary')?.textContent?.includes('4525'),
    null,
    { timeout: 15000 },
  )
  check(
    '切换历史学期后加载该学期课程（4525）',
    (await page.locator('.filter-summary').innerText()).includes('4525'),
  )
  const subtitle = await page.locator('.page-subtitle').innerText()
  check('页面标识历史学期', subtitle.includes('2024-2025'), `(${subtitle.trim().slice(0, 40)})`)
  const historyCredit = await page.locator('.header-credit').innerText()
  check('历史学期独立统计（0 门）', historyCredit.includes('0 门'), `(${historyCredit.trim()})`)

  await page.locator('.term-select select').selectOption(CURRENT_TERM)
  await page.waitForFunction(
    () => document.querySelector('.filter-summary')?.textContent?.includes('4876'),
    null,
    { timeout: 15000 },
  )
  check('切回当前学期正常', (await page.locator('.filter-summary').innerText()).includes('4876'))

  console.log('\n[6] 课程评价（枝上攻略）')
  await page.fill('.search-input', '泥人张')
  await page.waitForTimeout(500)
  await page.locator('.course-card').first().getByRole('button', { name: '详情' }).click()
  await page.waitForSelector('.modal', { timeout: 10000 })
  const modalText = await page.locator('.modal').innerText()
  check('详情弹窗显示学生评价来源', modalText.includes('枝上攻略'))
  check('评价内容渲染', modalText.includes('泥巴') || modalText.includes('通过制'))
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await page.fill('.search-input', '')
  await page.waitForTimeout(500)
  await page.screenshot({ path: join(SHOT_DIR, '00-courses-desktop.png') })

  console.log('\n[7] 自定义课程：校验 / 冲突 / 提交')
  const slots = await computeSlots(page, CURRENT_TERM)
  check(
    '取得已选课程的冲突时段与空闲时段',
    Boolean(slots.busy && slots.free),
    JSON.stringify(slots),
  )

  await page.goto(`${BASE}/custom`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.custom-form', { timeout: 15000 })
  await page.getByRole('button', { name: /校验并加入/ }).click()
  await page.waitForTimeout(300)
  const errCount = await page.locator('.form-error').count()
  check('空表单提交触发校验错误', errCount >= 5, `(错误数 ${errCount})`)

  await page.fill('#f-name', '学术写作实践')
  await page.fill('#f-unit', '外国语学院')
  await page.fill('#f-teacher', '王老师')
  await page.selectOption('#f-category', '通识选修课')
  await page.fill('#f-credit', '1')
  await page.selectOption('#f-day', String(slots.busy.day))
  await page.selectOption('#f-start-period', String(slots.busy.start))
  await page.selectOption('#f-end-period', String(slots.busy.end))
  await page.selectOption('#f-start-week', '1')
  await page.selectOption('#f-end-week', '16')
  await page.getByRole('button', { name: /校验并加入/ }).click()
  await page.waitForTimeout(600)
  const conflictState = await page.evaluate(() => ({
    url: location.href,
    globalError: document.querySelector('.global-error')?.textContent?.trim() ?? '',
    formErrors: Array.from(document.querySelectorAll('.form-error')).map((e) =>
      e.textContent?.trim(),
    ),
    toasts: Array.from(document.querySelectorAll('.toast')).map((t) => t.textContent?.trim()),
  }))
  if (!conflictState.globalError) {
    console.log('    [debug] 冲突步骤状态：', JSON.stringify(conflictState))
  }
  check(
    '自定义课程冲突拦截',
    conflictState.globalError.includes('冲突') ||
      conflictState.toasts.some((t) => t.includes('冲突')),
  )

  // 换到空闲时段，应成功并跳转课表
  await page.selectOption('#f-day', String(slots.free.day))
  await page.selectOption('#f-start-period', String(slots.free.start))
  await page.selectOption('#f-end-period', String(slots.free.end))
  await page.selectOption('#f-start-week', '1')
  await page.selectOption('#f-end-week', '8')
  await page.getByRole('button', { name: /校验并加入/ }).click()
  await page.waitForTimeout(800)
  check('自定义课程提交成功并跳转课表', page.url().includes('/timetable'))
  await page.waitForSelector('.sel-item', { timeout: 10000 })
  check(
    '自定义课程出现在已选列表',
    (await page.locator('.selected-panel').innerText()).includes('学术写作实践'),
  )
  await page.screenshot({ path: join(SHOT_DIR, '03-timetable-with-custom.png') })

  await page.goto(`${BASE}/custom`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.custom-form', { timeout: 15000 })
  await page.screenshot({ path: join(SHOT_DIR, '04-custom-form-desktop.png') })

  console.log('\n[8] 移动端响应式')
  const mobile = await ctx.newPage()
  await mobile.setViewportSize({ width: 390, height: 844 })
  await mobile.goto(`${BASE}/timetable`, { waitUntil: 'domcontentloaded' })
  await mobile.waitForSelector('.timetable-mobile', { timeout: 15000 })
  check('移动端课表列表视图', await mobile.locator('.timetable-mobile').isVisible())
  check('移动端底部导航', await mobile.locator('.tab-bar').isVisible())
  check('移动端隐藏网格视图', !(await mobile.locator('.timetable').isVisible()))
  await mobile.screenshot({ path: join(SHOT_DIR, '05-timetable-mobile.png') })
  await mobile.goto(`${BASE}/courses`, { waitUntil: 'domcontentloaded' })
  await mobile.waitForSelector('.course-card', { timeout: 15000 })
  await mobile.screenshot({ path: join(SHOT_DIR, '06-courses-mobile.png') })

  await browser.close()

  console.log(`\n========== 冒烟测试结果：${passed} 通过 / ${failed} 失败 ==========`)
  if (failed > 0) {
    console.log('失败项：')
    for (const f of failures) console.log(`  - ${f}`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('冒烟测试异常：', e)
  process.exit(1)
})
