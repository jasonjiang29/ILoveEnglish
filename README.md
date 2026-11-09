# 我爱英语 · 上海高考词汇

给初中阶段提前熟悉上海高考词汇的本地优先 PWA。当前 v1 聚焦「认读 + 间隔复习」，词库为 300 个高频核心词，学习进度保存在浏览器 IndexedDB。

线上地址：<https://jasonjiang29.github.io/ILoveEnglish/>

## 技术栈

- Vite + React + TypeScript
- Dexie（IndexedDB）保存复习记录
- ts-fsrs 计算复习节奏
- vite-plugin-pwa 生成 manifest 与 Service Worker

## 本地运行

```bash
npm install
npm run dev
```

打开终端提示的地址（默认 `http://localhost:5173`）。

常用命令：

```bash
npm test          # 单元测试
npm run lint      # ESLint
npm run format    # Prettier
npm run build     # 类型检查 + 生产构建
npm run preview   # 预览 dist
```

如果 npm 受本机代理影响，可临时指定镜像配置：

```bash
npm install --userconfig=/tmp/npmrc-noproxy --no-audit --no-fund
```

## 构建与部署

```bash
npm run build
```

产物在 `dist/`。项目已设置 `base: './'`，可部署到子路径。

### GitHub Pages

已配置 `.github/workflows/deploy-pages.yml`：推送到 `main` 后自动执行 `npm ci`、`npm run build`，并把 `dist/` 发布到 GitHub Pages。

- 线上地址：<https://jasonjiang29.github.io/ILoveEnglish/>
- Pages Source：GitHub Actions
- 如需重新部署：在 Actions 中手动运行 “Deploy to GitHub Pages”，或推送新的 `main` 提交。

### Cloudflare Pages

可选替代方案：

- Build command：`npm run build`
- Output directory：`dist`

## 安装到 iPhone

1. 用 Safari 打开部署地址。
2. 点底部分享按钮。
3. 选择「添加到主屏幕」。
4. 从主屏图标打开，即可全屏使用。

首次打开需要联网加载；之后 Service Worker 会缓存应用，可离线复习。

## 数据备份与迁移

- 设置 → 导出进度：下载 `iloveenglish-progress-*.json`。
- 设置 → 导入进度：选择 JSON 文件，确认后覆盖当前进度。
- 清理 Safari 网站数据或卸载主屏图标可能清除进度，换机前请先导出。

导出文件包含 `schemaVersion`、`reviews`、`reviewLogs`、`settings`。导入会校验版本和字段，无效文件会被拒绝。

## 词库维护

词库位于 `src/data/words.json`，格式：

```json
{
  "version": "1.0.0",
  "words": [
    {
      "id": "abandon",
      "lemma": "abandon",
      "glossZh": "放弃；抛弃",
      "pos": ["v"],
      "level": "必修",
      "frequencyRank": 1
    }
  ]
}
```

必需字段：`id`、`lemma`、`glossZh`、`level`；`level` 取值为 `必修`、`选必`、`提高`、`上海增补`。修改后运行 `npm test`，会校验 300 词数量、必填字段和 id 唯一性。

## 项目结构

```text
src/
  components/   导航、启动错误、朗读按钮
  data/         词库类型、校验、加载与 React Context
  db/           Dexie 表、复习记录、统计、导入导出
  pages/        首页、复习、单词、统计、设置
  srs/          FSRS 调度与今日队列
```

## v1 范围

已实现：认读卡片、FSRS 复习、每日新词上限、单词搜索、统计、朗读、进度导入导出、PWA 离线。

暂不包含：听力、阅读、账号与云同步、Web Push、真人音频、App Store 上架。

## 已知限制

- 发音使用系统 Web Speech，音色和可用性取决于 iOS/Safari。
- 进度只存在当前设备，没有自动多端同步。
- 首页的「今日完成」按本地自然日统计，跨时区旅行时可能有一天边界变化。
