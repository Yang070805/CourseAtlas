/**
 * CourseAtlas 冒烟测试脚本
 *
 * 用法（需先启动开发服务器）：
 *   1. npm run dev          （默认 http://127.0.0.1:5173）
 *   2. npm run smoke        （本脚本）
 *
 * 覆盖的核心流程：
 *   课程库搜索 → 加入模拟课表 → 时间冲突拦截 → 学分持久化 → 课表渲染与移除
 *   → 学分规划统计与前置课程提醒 → 自定义课程表单校验/冲突拦截/提交
 *   → 移动端响应式视图 → 截图输出到 screenshots/
 *
 * 依赖本机 Chrome / Edge 浏览器（playwright channel）。
 */
import { chromium } from 'playwright-core'
import { mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:5173'
const __dirname = dirname(fileURLToPath(import.meta.url))
const SHOT_DIR = join(__dirname, '..', 'screenshots')

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

async function main() {
  if (!existsSync(SHOT_DIR)) mkdirSync(SHOT_DIR, { recursive: true })

  const browser = await launch()
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
  })
  const page = await ctx.newPage()

  console.log('\n[0] 开发服务器可达性')
  const up = await waitForServer(page, BASE)
  check('开发服务器已启动', up)
  if (!up) {
    console.log('请先执行 npm run dev 再运行冒烟测试')
    await browser.close()
    process.exit(1)
  }

  console.log('\n[1] 课程库：列表与搜索')
  await page.goto(`${BASE}/courses`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.course-card', { timeout: 10000 })
  const cardCount = await page.locator('.course-card').count()
  check('课程卡片已渲染', cardCount > 0, `(实际 ${cardCount})`)
  check('分页组件存在', (await page.locator('.pagination').count()) > 0)

  await page.fill('.search-input', '数据结构')
  await page.waitForTimeout(300)
  const dsCards = await page.locator('.course-card').count()
  check('关键词搜索生效', dsCards >= 1 && dsCards <= 3, `(匹配 ${dsCards} 门)`)
  await page.fill('.search-input', '')
  await page.waitForTimeout(300)

  console.log('\n[2] 加入模拟课表与冲突拦截')
  // 先加《高等数学A（二）》（含前置课程提醒）
  await page.fill('.search-input', '高等数学A（二）')
  await page.waitForTimeout(300)
  await page
    .locator('.course-card', { hasText: '高等数学A（二）' })
    .getByRole('button', { name: /加入模拟课表/ })
    .click()
  await page.waitForTimeout(400)
  const toastOk = await page.locator('.toast', { hasText: '已加入模拟课表' }).count()
  check('加入成功提示', toastOk > 0)
  const prereqToast = await page.locator('.toast', { hasText: '前置课程' }).count()
  check('前置课程提醒提示', prereqToast > 0)

  // 再加《大学物理B（上）》——与高数二同为周一 3-4 节，应被拦截
  await page.fill('.search-input', '大学物理B（上）')
  await page.waitForTimeout(300)
  await page
    .locator('.course-card', { hasText: '大学物理B（上）' })
    .getByRole('button', { name: /加入模拟课表/ })
    .click()
  await page.waitForTimeout(400)
  const conflictToast = await page.locator('.toast', { hasText: '冲突' }).count()
  check('时间冲突被拦截', conflictToast > 0)

  // 持久化：刷新后已选仍在
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.header-credit', { timeout: 10000 })
  const creditText = await page.locator('.header-credit').innerText()
  check(
    '已选课程持久化（localStorage）',
    creditText.includes('5'),
    `(头部显示：${creditText.trim()})`,
  )

  console.log('\n[3] 模拟课表页')
  await page.goto(`${BASE}/timetable`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.tt-block', { timeout: 10000 })
  const blockCount = await page.locator('.tt-block').count()
  check('课表网格课程块渲染', blockCount >= 3, `(块数 ${blockCount})`)
  await page.screenshot({ path: join(SHOT_DIR, '01-timetable-desktop.png'), fullPage: false })

  await page.goto(`${BASE}/planner`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.total-card', { timeout: 10000 })
  const totalText = await page.locator('.total-status').innerText()
  check('毕业学分差距计算', totalText.includes('151'), `(文案：${totalText.trim()})`)
  const notice = await page.locator('.warn-list').count()
  check('前置课程提醒列表渲染', notice > 0)

  console.log('\n[4] 学分规划统计')
  // 移除高数二，避免遗留状态
  await page.goto(`${BASE}/timetable`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.sel-remove', { timeout: 10000 })
  await page.locator('.sel-remove').first().click()
  await page.waitForTimeout(300)
  const emptyText = await page.locator('.selected-panel').innerText()
  check('移除课程生效', !emptyText.includes('高等数学A（二）'))

  // 加入《深度学习》（前置：机器学习及应用/概率论/线代，均未选）
  await page.goto(`${BASE}/courses`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.course-card', { timeout: 10000 })
  await page.fill('.search-input', '深度学习')
  await page.waitForTimeout(300)
  await page
    .locator('.course-card', { hasText: '深度学习' })
    .getByRole('button', { name: /加入模拟课表/ })
    .click()
  await page.waitForTimeout(400)
  await page.goto(`${BASE}/planner`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.warn-list', { timeout: 10000 })
  const warnText = await page.locator('.warn-list').innerText()
  check('前置课程提醒列出缺失课程', warnText.includes('机器学习及应用'))
  await page.screenshot({ path: join(SHOT_DIR, '03-planner-desktop.png'), fullPage: false })

  console.log('\n[5] 自定义课程表单')
  await page.goto(`${BASE}/custom`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.custom-form', { timeout: 10000 })
  await page.getByRole('button', { name: /校验并加入/ }).click()
  await page.waitForTimeout(300)
  const errCount = await page.locator('.form-error').count()
  check('空表单提交触发校验错误', errCount >= 5, `(错误数 ${errCount})`)

  // 填一门与《深度学习》冲突的课程（周二 7-8 节，第 5 学期）
  await page.fill('#f-name', '强化学习导论')
  await page.fill('#f-college', '在线平台')
  await page.fill('#f-teacher', '刘老师')
  await page.selectOption('#f-category', '专业选修')
  await page.selectOption('#f-semester', '5')
  await page.fill('#f-credit', '2')
  await page.fill('#f-hours', '32')
  await page.selectOption('#f-day', '2')
  await page.selectOption('#f-start-period', '7')
  await page.selectOption('#f-end-period', '8')
  await page.selectOption('#f-start-week', '1')
  await page.selectOption('#f-end-week', '16')
  await page.getByRole('button', { name: /校验并加入/ }).click()
  await page.waitForTimeout(400)
  const conflictErr = await page.locator('.global-error').innerText()
  check(
    '自定义课程冲突拦截',
    conflictErr.includes('冲突'),
    `(提示：${conflictErr.trim().slice(0, 40)}...)`,
  )

  // 改到周三 9-10 节，无冲突，应成功并跳转
  await page.selectOption('#f-day', '3')
  await page.selectOption('#f-start-period', '9')
  await page.selectOption('#f-end-period', '10')
  await page.getByRole('button', { name: /校验并加入/ }).click()
  await page.waitForTimeout(600)
  check('自定义课程提交成功并跳转课表', page.url().includes('/timetable'))
  await page.waitForSelector('.sel-item', { timeout: 10000 })
  const panelText = await page.locator('.selected-panel').innerText()
  check(
    '自定义课程出现在已选列表',
    panelText.includes('强化学习导论') && panelText.includes('自定义'),
  )
  await page.screenshot({ path: join(SHOT_DIR, '02-timetable-with-custom.png'), fullPage: false })

  // 课程库与自定义表单截图
  await page.goto(`${BASE}/courses`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.course-card', { timeout: 10000 })
  await page.screenshot({ path: join(SHOT_DIR, '00-courses-desktop.png'), fullPage: false })
  await page.goto(`${BASE}/custom`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.custom-form', { timeout: 10000 })
  await page.screenshot({ path: join(SHOT_DIR, '04-custom-form-desktop.png'), fullPage: false })

  console.log('\n[6] 移动端响应式')
  const mobile = await ctx.newPage()
  await mobile.setViewportSize({ width: 390, height: 844 })
  await mobile.goto(`${BASE}/timetable`, { waitUntil: 'domcontentloaded' })
  await mobile.waitForSelector('.timetable-mobile', { timeout: 10000 })
  const listVisible = await mobile.locator('.timetable-mobile').isVisible()
  check('移动端课表列表视图', listVisible)
  const tabBarVisible = await mobile.locator('.tab-bar').isVisible()
  check('移动端底部导航', tabBarVisible)
  const gridHidden = !(await mobile.locator('.timetable').isVisible())
  check('移动端隐藏网格视图', gridHidden)
  await mobile.screenshot({ path: join(SHOT_DIR, '05-timetable-mobile.png') })
  await mobile.goto(`${BASE}/courses`, { waitUntil: 'domcontentloaded' })
  await mobile.waitForSelector('.course-card', { timeout: 10000 })
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
