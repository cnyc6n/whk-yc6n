# whk班主任模拟器

纯前端单文件 HTML 游戏。玩家扮演高中班主任，从 2025 年 8 月高三开学带班到
2026 年 6 月高考，管理学生的成绩、压力与心情。

**游戏请直接打开 [`whk-V2.0.html`](whk-V2.0.html)**（双击即玩，无需服务器）。

---

## 为什么是"单文件"

现代浏览器把 `file://` 视为 **opaque origin（不透明源）**，因此下列写法在本地直接
打开时**一律被拦截**：

| 写法 | `file://` 下 |
|---|---|
| `<script type="module">` / `import` / `export` | ❌ 被 CORS 拦截 |
| `fetch()` / `XMLHttpRequest` | ❌ 被 CORS 拦截 |
| `new Worker()` / Service Worker | ❌ 不可用 |
| 外链 CDN、字体、图片 | ❌ 可能被拦 |

而**普通 `<script src="x.js">`**（`no-cors` 模式）是唯一能在 `file://` 下加载外部
脚本的方式。

因此本项目采用：**源码拆分便于维护 + 构建时全部内联成单个 HTML**。
分发物始终是一个文件，`file://` 下双击即玩，且 localStorage 存档可跨会话保留。

## 目录结构

```
whk-V2.0.html      ← 分发给玩家的单文件（也是构建产物，随仓库提交）
src/               ← 开发时的源码，按模块拆分
  template.html        HTML 骨架（含 /*__CSS__*/ 与 /*__JS__*/ 占位符）
  styles.css           全部样式
  ui.js                UI 对象（主题、模态框、事件选项渲染）
  config.js            CONFIG / SEASONS / WEATHER_POOL（纯数据）
  state.js             State 全局状态 + 存档读写
  utils.js             效率曲线、等级换算
  game.js              核心玩法
  chart.js             Canvas 成绩走势图
  boot.js              启动入口（必须最后加载）
build.js           ← 构建脚本（零依赖，只要 Node）
dist/              ← 构建输出（已 gitignore，内容与 whk-V2.0.html 相同）
```

## 构建

需要 Node.js（无第三方依赖）：

```bash
node build.js            # 构建到 dist/whk-V2.0.html
node build.js --check    # 只校验语法与 file:// 兼容性，不写文件
node build.js --watch    # 监听 src/ 改动自动重建
```

### 构建期安全检查

`build.js` 会在内联前扫描每个模块，命中以下任意一条就**直接构建失败**，
因为它会导致 `file://` 下白屏：

- `import` / `export`
- `fetch()` / `XMLHttpRequest` / `new Worker()`
- 外链 CDN 资源（.js/.css/字体/图片）

另外会自动转义源码中字面量出现的 `</script>`，避免提前闭合脚本标签。

## 开发注意事项

1. **模块拼接顺序**由 `build.js` 顶部的 `JS_MODULES` 决定，`boot.js` 必须最后。
   每个模块可配 `gapBefore` 控制前置空行，用于保持与原文件排版一致。
2. **模块间靠顶层 `const` / `let` 共享作用域**（拼接后是同一个 `<script>`），
   不要用 `import`，也不要用 IIFE 包裹模块。
3. **改动 `State` 字段时，必须同步 `state.js` 中 `checkSavedGame()` 的兼容补齐**，
   否则老存档会崩。
4. **行尾统一 CRLF**，`build.js` 会自动规范化。
5. 提交前建议跑 `node build.js` 并确认产物内容与源码一致。

## 版本

- `whk-V2.0.html` — 当前主线
- `New-whk-safe.html` — 旧的 V1.2，已停止维护

## 许可

见仓库设置。
