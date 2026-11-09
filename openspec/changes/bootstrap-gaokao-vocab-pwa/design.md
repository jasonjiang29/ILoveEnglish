# Design

## Context

见 `proposal.md - Why`。当前仓库除 `openspec/` 外为空，属于全新项目。约束：目标设备为 iPhone；无 Apple 开发者账号，需零成本；单人（家长）开发并维护；首期只验证词汇复习闭环。

## Goals / Non-Goals

**Goals:**

- 用零成本方式在 iPhone 上获得「像 App 一样」的使用体验（主屏图标、离线、全屏）。
- 词汇复习闭环可在无后端、无网络的情况下完成。
- 词库与学习进度可导出，未来能无痛迁移到原生实现。
- 核心调度逻辑可单元测试。

**Non-Goals:**

- 不做 iOS 原生、App Store 上架、账号体系、云同步。
- 不做听力/阅读模块。
- 不做 Web Push，v1 仅应用内提醒。

## Decisions

### D1. 采用 PWA，而非原生或跨平台框架

零成本且要长期使用，PWA 是唯一没有「过期/重签/年费」成本的形态；加到主屏后拥有独立图标与离线能力。备选：SwiftUI + 免费签名（每 7 天重签，不适合日常使用）、React Native/Capacitor（仍受签名限制）。数据格式保持中立，后续可用 Capacitor 包壳或重写为原生。

### D2. Vite + React + TypeScript

Vite 构建快、静态产物便于托管；React 生态成熟，FSRS 有现成 TS 库。备选：Svelte（更轻，但团队/示例少）、Vue（同样可行）。选择 React 主要是降低后续维护与 AI 生成代码的风险。

### D3. 本地优先，Dexie + IndexedDB，无后端

数据全部存于设备本地，避免服务器与账号成本。Dexie 提供带索引的 IndexedDB 封装与版本迁移。备选：localStorage（容量小、无索引，不适合数千词条与复习日志）。

### D4. FSRS 调度使用 `ts-fsrs`

采用 FSRS 而非 SM-2，因为其在同等复习量下记忆保持更好，且 `ts-fsrs` 提供成熟的 TS 实现与默认参数。备选：自研 SM-2（简单但效果差）、自研 FSRS（易出错）。冷启动使用库默认参数，不做个性化训练。

### D5. 词库以 JSON 形式随构建产物内置

词库为版本化 JSON（含 `version` 与词条数组），构建时打包，运行时校验。这样离线可用、无需请求；升级词库 = 发布新版本。字段设计：

```
Word {
  id: string            // 稳定唯一键，建议用词形小写
  lemma: string         // 词形
  ipa?: string
  pos?: string[]
  glossZh: string       // 中文释义（必需）
  example?: { en: string; zh?: string }
  level: "必修" | "选必" | "提高" | "上海增补"
  frequencyRank?: number
  tags?: string[]
}
```

必需字段：`id`、`lemma`、`glossZh`、`level`。首批约 300 个高频核心词。

### D6. 复习队列算法

`今日队列 = 当天到期卡片（按到期时间升序） + 新词（不超过每日新词上限）`；同一词条去重。每日新词上限为可配置项，默认 10。无到期且新词额度用尽时展示「今日已完成」。

```
due cards (dueAt <= now, asc)
        +
new words (state = New, limit = dailyNewLimit)
        |
        v
   dedupe by word.id  -->  today queue
```

### D7. 数据模型（Dexie 表）

```
words         (只读，来自内置词库；可缓存)
reviews       { wordId, dueAt, stability, difficulty, reps, lapses, state, lastReviewAt }
reviewLogs    { id, wordId, rating, reviewedAt, elapsedDays, scheduledDays }
settings      { key, value }   // dailyNewLimit、提醒开关等
meta          { key, value }   // wordPackVersion、schemaVersion
```

### D8. 发音使用 Web Speech API，不可用则禁用入口

`window.speechSynthesis` 在 iOS Safari（含主屏 PWA）可用，无网络依赖。检测不到时隐藏/禁用发音按钮并提示，不影响复习。备选：内置真人音频（版权与体积成本高）。

### D9. 导出/导入为版本化 JSON

导出包含 `schemaVersion`、`exportedAt`、`reviews`、`reviewLogs`、`settings`。导入时先校验版本与结构，再合并或覆盖（默认覆盖并提示数量）。用途：备份防 IndexedDB 被清、迁移到原生。

### D10. 托管与构建

`vite-plugin-pwa` 生成 manifest 与 Service Worker，实现主屏安装与离线缓存。静态托管二选一：GitHub Pages 或 Cloudflare Pages（均免费）。构建需正确设置 `base` 路径以适配子路径部署。

### D11. 测试

用 Vitest 覆盖纯逻辑：队列生成与去重、FSRS 调度封装、导入导出校验、词库校验。UI 手测为主，v1 不引入端到端测试框架。

## Risks / Trade-offs

- [iOS 可能清理站点数据] → 提供一键导出，并在设置页提示定期备份。
- [PWA 通知能力弱] → v1 只做应用内提醒与「今日待复习数」角标，不承诺后台推送。
- [Web Speech 音色/可用性不稳定] → 发音为增强功能，失败可降级，不影响复习。
- [词表来源与准确性] → 首批小规模、人工抽检；词条记录 `level` 与来源标签，便于日后校对替换。
- [FSRS 默认参数不一定适配初中生] → 先用默认参数，后续可导出日志做参数优化，无需改架构。
- [免费静态托管的可用性/访问速度] → 静态站点可随时切换托管商，迁移成本低。

## Migration Plan

1. 本地开发（`npm run dev`），在 iPhone Safari 中访问并「添加到主屏幕」试用。
2. 部署到免费静态托管，获得 HTTPS 地址后正式安装使用。
3. 升级 = 重新部署；Service Worker 更新后提示刷新。回滚 = 重新部署上一版本静态产物。
4. 未来迁移：用导出 JSON 导入原生 App；词库 JSON 可直接复用。

## Open Questions

- 首批 300 词的最终清单与校对方式（按词频排序后人工抽检，还是以某份公开考纲词表为准）。
- 静态托管最终选 GitHub Pages 还是 Cloudflare Pages（取决于是否已有账号）。
- 每日新词上限的初始值（默认 10，可按她的实际接受度调整）。
