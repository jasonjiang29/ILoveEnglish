# Tasks

## 1. 工程脚手架

- [x] 1.1 初始化 Vite + React + TypeScript 工程并配置 lint/format；验证 `npm run build` 成功
- [x] 1.2 安装 dexie、ts-fsrs、vite-plugin-pwa、vitest 并配置测试脚本；验证 `npm test` 可运行（无测试时设置 passWithNoTests 且退出码为 0）
- [x] 1.3 建立 `src/{data,db,srs,features,components,pages}` 目录结构；验证目录与设计一致

## 2. 词库与校验

- [x] 2.1 定义 Word 类型与词库 JSON schema，实现加载与校验函数；验证单元测试覆盖合法、缺字段、不可解析三种输入
- [x] 2.2 整理首批 300 个上海高考高频核心词为 JSON（含 id/lemma/glossZh/level）；验证加载后计数为 300 且校验通过
- [x] 2.3 首页展示词库总数与版本，词库损坏时显示错误且不进入复习；验证篡改测试词库后出现错误提示

## 3. 数据层与 FSRS 调度

- [x] 3.1 实现 Dexie 数据库与 words/reviews/reviewLogs/settings/meta 表及版本迁移；验证单元测试可写入并读回
- [x] 3.2 封装 ts-fsrs 调度（评级映射、到期时间、状态更新）；验证单元测试断言到期时间不早于当前且重新读取一致
- [x] 3.3 实现今日队列生成（到期升序 + 新词上限 + 去重）；验证单元测试覆盖有到期、无到期、超上限、重复四种场景

## 4. 复习闭环 UI

- [x] 4.1 实现复习页：显示词形 → 点击翻面显示释义/例句 → 自评按钮；验证手工完成一轮后进入下一张
- [x] 4.2 提交复习时写入 reviews 与 reviewLogs 并更新队列；验证完成 3 张后队列减少 3、日志新增 3
- [x] 4.3 展示今日已完成状态与下次到期时间；验证清空到期队列后出现完成态

## 5. 词表、搜索与统计

- [x] 5.1 实现单词列表（含复习状态）与按词形搜索；验证命中结果正确、无匹配时显示空状态
- [x] 5.2 实现统计页（已学词数、今日完成、连续学习天数、状态分布）；验证展示数据与本地记录一致

## 6. 发音与提醒

- [x] 6.1 实现 Web Speech 发音按钮并处理不支持场景；验证支持设备可发音、禁用时不影响复习
- [x] 6.2 首页展示今日待复习数量与到期提示；验证存在到期卡片时首页出现提示

## 7. 导出与导入

- [x] 7.1 实现版本化 JSON 导出；验证导出文件含 schemaVersion/reviews/reviewLogs/settings 且可被 JSON 解析
- [x] 7.2 实现导入（校验、覆盖恢复、数量提示）；验证无效文件被拒绝、有效文件恢复后计数一致

## 8. PWA、离线与托管

- [x] 8.1 配置 manifest 与 Service Worker（图标、名称、全屏显示）；验证浏览器 Application 面板显示可安装
- [ ] 8.2 构建并部署到免费静态托管（GitHub Pages 或 Cloudflare Pages），配置 base 路径；验证手机 Safari 可访问并添加到主屏
- [x] 8.3 验证离线打开与完成复习（飞行模式）

## 9. 集成验证与文档

- [ ] 9.1 在 iPhone 上跑通「安装 → 复习 → 统计 → 导出 → 导入」完整流程并记录结果
- [x] 9.2 编写 README（本地运行、构建部署、备份与迁移说明）；验证按 README 命令可成功构建

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result.
