# CourseAtlas · 选课导航

> 高校模拟排课与学分路径规划器 —— 让每一分都花在刀刃上。

《前端开发实训》期末工程项目（Web 方向）· Vue 3 + Vite + TypeScript

![技术栈](https://img.shields.io/badge/Vue-3.5-4c6ef5) ![技术栈](https://img.shields.io/badge/Vite-8-6741d9) ![技术栈](https://img.shields.io/badge/TypeScript-strict-0b7285) ![技术栈](https://img.shields.io/badge/Vue_Router-4-1098ad) ![技术栈](https://img.shields.io/badge/Pinia-3-b08800)

## 项目背景

选课周前，每个大学生都会遇到三个问题：**这门课和已选的课冲不冲突？前置课程修了没有？离毕业要求还差几个学分？** 教务系统只负责"抢课"，不负责"规划"。CourseAtlas 填补这个空白：选课前先在模拟课表里排一遍，冲突实时拦截，学分逐类对照培养方案，前置课程缺啥一目了然。

**目标用户**：软件工程等工科专业在校本科生，尤其是大一至大三每学期需要选课的学生。

## 功能列表

- **课程库**：79 门课程（8 个学期），支持关键词搜索（课程名 / 编码 / 教师）、学院筛选、课程类别筛选、按学期 / 学分 / 学时 / 名称排序、分页浏览；课程详情弹窗展示上课时间、前置课程与学期学分占用。
- **模拟课表**：加入课程时自动校验并拦截时间冲突（红色虚线框标出重叠课程）与学期学分上限（默认 30 学分）；周课表网格视图，桌面端 5 天 × 12 节，移动端自动切换按天列表；支持移除课程与一键清空。
- **学分规划**：对照培养方案逐类显示学分进度条（通识必修 / 通识选修 / 学科基础 / 专业必修 / 专业选修 / 实践环节），计算"距毕业还差 X 学分"；前置课程缺失提醒；每学期学分分布与上限预警；已选课程分类明细。
- **自定义课程**：为课程库之外的课程（校外课程、重修课程）提供录入表单，含完整字段校验（必填、长度、数值范围、节次与周次先后关系），提交时同样进行时间冲突与学分上限校验。
- **数据持久化**：模拟课表保存在 localStorage，刷新页面不丢失。
- **响应式**：桌面端（顶部导航 + 网格课表）与手机端（底部标签栏 + 列表课表）双端适配。

## 页面结构（路由）

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/courses` | 课程库 | 搜索 / 筛选 / 排序 / 分页 / 详情弹窗 / 加入课表 |
| `/timetable` | 模拟课表 | 周课表网格 + 冲突高亮 + 已选课程管理 |
| `/planner` | 学分规划 | 培养方案进度、前置提醒、学期分布 |
| `/custom` | 自定义课程 | 表单校验 + 冲突检测 + 提交入表 |

## 技术栈

- Vue 3（组合式 API + `<script setup>`）、TypeScript（strict）
- Vite 8、Vue Router 4（懒加载路由 + 路由级标题）、Pinia 3（课程库 / 模拟课表两个 store）
- 自研轻量设计系统（CSS 变量主题 + 组件化样式），未引入第三方 UI 框架
- ESLint 9 + Prettier 3 代码规范
- 冒烟测试脚本（`scripts/smoke.mjs`，基于 playwright-core）

## 数据来源

课程库与培养方案以**长沙理工大学计算机学院《软件工程专业培养方案(2026)》**（<https://www.csust.edu.cn/jtxy/info/1975/28924.htm>）公开的课程体系表为蓝本整理；其中**上课时间、周次、授课教师、前置课程关系为演示用途虚构**。毕业学分要求参考公开培养方案的学分结构设定（最低毕业学分 156，学期学分上限 30）。详细声明见 `docs/03-数据结构设计.md`。

## 运行步骤

```bash
npm install     # 安装依赖
npm run dev     # 启动开发服务器，浏览器访问 http://localhost:5173
```

## 构建步骤

```bash
npm run build       # 类型检查 + 生产构建（产物在 dist/）
npm run preview     # 本地预览构建产物
npm run type-check  # 仅类型检查（vue-tsc）
npm run lint        # 代码规范检查（ESLint）
npm run format      # 代码格式化（Prettier）
npm run smoke       # 冒烟测试（需先启动 npm run dev，自动生成 screenshots/）
```

## 目录结构

```
course-atlas/
├── public/favicon.svg
├── scripts/smoke.mjs            # 冒烟测试
├── screenshots/                 # 功能截图（冒烟测试自动生成）
├── docs/                        # 设计文档
├── src/
│   ├── components/
│   │   ├── common/              # 通用组件（图标/标签/分页/进度条/Toast/空状态）
│   │   ├── courses/             # 课程库（筛选栏/课程卡片/详情弹窗）
│   │   ├── timetable/           # 课表（网格/移动列表/已选面板）
│   │   ├── planner/             # 规划（要求进度/前置提醒/学期分布/明细）
│   │   └── custom/              # 自定义课程表单
│   ├── composables/useToast.ts
│   ├── constants.ts             # 培养方案要求、类别配色、学期上限等
│   ├── data/courses.ts          # 课程库 mock 数据（79 门）
│   ├── router/  stores/  styles/  types/  utils/
│   ├── App.vue  main.ts
├── index.html
└── package.json
```

## 已知问题

1. 项目为纯前端应用，课程数据为本地 Mock，未接入真实教务接口；上线时需将 `src/data/courses.ts` 替换为接口数据。
2. 学期学分上限（30）为全局常量，未按专业区分；不同专业可在 `src/constants.ts` 中调整。
3. 自定义课程仅支持录入一个上课时间段；多时段课程可拆分为多条录入。
4. 通识选修"艺术类 ≥ 2 学分"目前仅作为提示展示，未做强制拦截。
5. 冲突检测基于"周次有交集即冲突"，未区分单双周等更细粒度规则。

## 小组分工

> 提交前请补充真实姓名与学号。

| 成员 | 学号 | 负责模块 | 贡献说明 |
| --- | --- | --- | --- |
| 杨文宇 | 2514026 | 项目负责人 / 核心开发 | 项目架构、课程库、模拟课表、冲突检测算法、文档 |
| 成员B | （待填） | 学分规划模块 | （待填） |
| 成员C | （待填） | 自定义课程表单 | （待填） |
| 成员D | （待填） | 测试与文档 | （待填） |

## 参考资料

- 长沙理工大学计算机学院《软件工程专业培养方案(2026)》：<https://www.csust.edu.cn/jtxy/info/1975/28924.htm>
- 同类参考项目调研：timetablely、CDJ-academic-schedule-builder、UofT-Timetable-Builder（GitHub）
- Vue 3 官方文档：<https://cn.vuejs.org/> ｜ Vue Router：<https://router.vuejs.org/zh/> ｜ Pinia：<https://pinia.vuejs.org/zh/> ｜ Vite：<https://cn.vite.dev/>
