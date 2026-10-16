#!/usr/bin/env node
/**
 * 构建脚本：把 src/ 下的模块拼接成单文件 HTML。
 *
 * 为什么需要它：
 *   file:// 协议下，ES Module(import/export)、fetch、Worker 都会被 CORS 拦截
 *   （opaque origin）。只有拼接成单文件、且只用普通 <script> 才安全。
 *   本脚本输出的 dist 文件在 file:// 下双击即玩。
 *
 * 用法：
 *   node build.js                  # 构建（自动读 version.txt 注入版本号，并同步到根目录 whk.html）
 *   node build.js --check          # 只校验，不写文件
 *   node build.js --watch          # 监听 src/ 变化自动重建
 *   node release.js [版本号]        # 发布：更新版本号（可选）→ 构建 → 同步 → 打印提示
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

// ---------- 版本号（单一来源 version.txt） ----------
const VERSION_FILE = 'version.txt';

function readVersion() {
  try {
    const v = fs.readFileSync(path.join(ROOT, VERSION_FILE), 'utf8').trim();
    return v || '2.1';
  } catch (e) {
    return '2.1';
  }
}

const VERSION = readVersion();

// 拼接顺序 = 依赖顺序。后加载的可以引用先加载的顶层 const/let。
// 角色说明：
//   ui.js      —— UI 对象（含主题/模态框/事件选项渲染）
//   config.js  —— CONFIG / SEASONS / WEATHER_POOL（纯数据，无依赖）
//   state.js   —— State 全局状态 + 存档读写
//   utils.js   —— 效率曲线、等级换算等纯函数
//   game.js    —— 核心玩法对象
//   chart.js   —— Canvas 成绩走势图
//   debug.js   —— 调试面板（按 D 后 3 秒内输入 yc6n 触发）
//   boot.js    —— 启动入口（必须最后）
// gapBefore: 该模块前是否留一个空行（与原单文件排版一致，避免污染 git diff）
const JS_MODULES = [
  { file: 'ui.js', gapBefore: false },
  { file: 'config.js', gapBefore: false },
  { file: 'state.js', gapBefore: true },
  { file: 'utils.js', gapBefore: true },
  { file: 'game.js', gapBefore: true },
  { file: 'chart.js', gapBefore: false },
  { file: 'debug.js', gapBefore: false },
  { file: 'boot.js', gapBefore: false },
];

const JS_ORDER = JS_MODULES.map((m) => m.file);

const CSS_FILE = 'styles.css';
const TEMPLATE_FILE = 'template.html';
const OUT_NAME = 'whk.html'; // 不带版本号，避免每次发版都要改文件名（版本号在 version.txt）

// ---------- 小工具 ----------
const read = (p) => fs.readFileSync(p, 'utf8');

/**
 * 统一行尾为 CRLF（原文件就是 CRLF），并保证文件以单个换行结尾。
 * 不做这步会因编辑器/平台差异产出混合行尾。
 */
function normalizeEol(text, eol = '\r\n') {
  return text.replace(/\r\n|\r|\n/g, eol);
}

/**
 * 去掉末尾多余换行（不补回）。
 * 占位符在模板里已独占一行，替换时模板自身的换行会接手，
 * 所以内联块本身不能带结尾换行，否则会多出空行。
 */
function stripTrailing(text) {
  return text.replace(/(\r\n|\r|\n)+$/, '');
}

function collectFiles() {
  const missing = [];
  const cssPath = path.join(SRC, CSS_FILE);
  const tplPath = path.join(SRC, TEMPLATE_FILE);
  if (!fs.existsSync(cssPath)) missing.push(CSS_FILE);
  if (!fs.existsSync(tplPath)) missing.push(TEMPLATE_FILE);
  for (const f of JS_ORDER) {
    if (!fs.existsSync(path.join(SRC, f))) missing.push(f);
  }
  return missing;
}

/**
 * 安全内联：防止源码里出现 '</script>' 或 '</style>' 提前闭合标签。
 * 这是拼接方案唯一的真实坑 —— 必须在构建期处理掉。
 */
function safeInline(code, tag) {
  // 把 </script 变成 <\/script，JS 字符串里等价，且不会提前闭合
  return code.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);
}

// ---------- 校验 ----------
function lintModule(name, code) {
  const errs = [];

  // 1. 禁止 ES Module 语法 —— file:// 下必崩
  if (/^\s*import\s+[\w{*]/m.test(code) || /^\s*import\s*\(/m.test(code)) {
    errs.push(`${name}: 含有 import —— file:// 下会被 CORS 拦截`);
  }
  if (/^\s*export\s+(default|const|let|var|function|class|\{)/m.test(code)) {
    errs.push(`${name}: 含有 export —— file:// 下会被 CORS 拦截`);
  }

  // 2. 禁止 fetch / XHR / Worker —— file:// 下被拦
  if (/\bfetch\s*\(/.test(code)) {
    errs.push(`${name}: 含有 fetch() —— file:// 下会被 CORS 拦截`);
  }
  if (/\bXMLHttpRequest\b/.test(code)) {
    errs.push(`${name}: 含有 XMLHttpRequest —— file:// 下会被拦截`);
  }
  if (/\bnew\s+Worker\s*\(/.test(code)) {
    errs.push(`${name}: 含有 Worker —— file:// 下不可用`);
  }

  // 3. 禁止外部资源引用
  const ext = code.match(/https?:\/\/[^\s"'`)]+\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf)/gi);
  if (ext) {
    errs.push(`${name}: 引用了外部资源 -> ${[...new Set(ext)].join(', ')}`);
  }

  // 4. 标签提前闭合风险（警告级）
  if (/<\/script/i.test(code)) {
    errs.push(`${name}: 含字面量 </script，会被替换转义（若非字符串请检查）`);
  }

  return errs;
}

// ---------- 构建 ----------
function build({ check = false } = {}) {
  const missing = collectFiles();
  if (missing.length) {
    console.error('✗ src/ 缺少文件：\n  - ' + missing.join('\n  - '));
    return false;
  }

  const problems = [];
  const parts = [];

  // 1. CSS
  const css = read(path.join(SRC, CSS_FILE));
  parts.push({ kind: 'css', name: CSS_FILE, code: css });

  // 2. JS（按依赖顺序）
  for (const f of JS_ORDER) {
    const code = read(path.join(SRC, f));
    const errs = lintModule(f, code);
    if (errs.length) problems.push(...errs);
    parts.push({ kind: 'js', name: f, code });
  }

  if (problems.length) {
    console.error('✗ 校验未通过（这些问题会让 file:// 下的游戏白屏）：');
    for (const p of problems) console.error('  - ' + p);
    return false;
  }

  const EOL = '\r\n';

  // 3. 组装（每个模块先规范化行尾，再内联）
  const cssBlock = stripTrailing(
    parts.filter((p) => p.kind === 'css')
      .map((p) => safeInline(normalizeEol(p.code, EOL), 'style'))
      .join(EOL)
  );

  // 注意：模块之间只用一个换行相接，与原始单文件的行距保持一致。
  // 加空行会让产物比原文件多出空白（虽然不影响运行，但会污染 diff）。
  // 按 gapBefore 精确复刻原文件的模块间距（避免产物与原文件产生无谓 diff）
  const blocks = JS_MODULES.map((m) => {
    const p = parts.find((x) => x.name === m.file);
    const bar = '='.repeat(60);
    const header = `// ${bar}${EOL}// ${m.file}${EOL}// ${bar}`;
    const body = stripTrailing(safeInline(normalizeEol(p.code, EOL), 'script'));
    return { text: header + EOL + body, gapBefore: m.gapBefore };
  });
  let joined = blocks[0].text;
  for (let i = 1; i < blocks.length; i++) {
    joined += (blocks[i].gapBefore ? EOL + EOL : EOL) + blocks[i].text;
  }
  const jsBlock = stripTrailing(joined);

  let html = normalizeEol(read(path.join(SRC, TEMPLATE_FILE)), EOL);
  if (!html.includes('/*__CSS__*/')) {
    console.error('✗ template.html 缺少 /*__CSS__*/ 占位符');
    return false;
  }
  if (!html.includes('/*__JS__*/')) {
    console.error('✗ template.html 缺少 /*__JS__*/ 占位符');
    return false;
  }

  // 注入版本号（{{VERSION}} 占位符 → version.txt 的值）
  if (!html.includes('{{VERSION}}')) {
    console.error(`✗ template.html 缺少 {{VERSION}} 占位符（版本号单一来源失效）`);
    return false;
  }
  html = html.replace(/\{\{VERSION\}\}/g, VERSION);

  html = html.replace('/*__CSS__*/', () => cssBlock);
  html = html.replace('/*__JS__*/', () => jsBlock);

  // 4. 产物自检：确认没有任何外部引用漏进去
  const badRefs = html.match(/<script[^>]+src\s*=/gi);
  if (badRefs) {
    console.error('✗ 产物中仍存在 <script src=>，file:// 下会失败');
    return false;
  }

  const bytes = Buffer.byteLength(html, 'utf8');
  const kb = (bytes / 1024).toFixed(1);

  if (check) {
    console.log(`✓ 校验通过（${parts.length} 个模块，产物约 ${kb} KB，未写文件）`);
    return true;
  }

  fs.mkdirSync(DIST, { recursive: true });
  const outPath = path.join(DIST, OUT_NAME);
  fs.writeFileSync(outPath, html, 'utf8');

  // 同步到仓库根目录（分发物随仓库提交，构建后必须一致）
  const rootOut = path.join(ROOT, OUT_NAME);
  fs.copyFileSync(outPath, rootOut);

  console.log('✓ 构建完成');
  console.log(`  产物: ${path.relative(ROOT, outPath)}`);
  console.log(`  同步: ${path.relative(ROOT, rootOut)}`);
  console.log(`  版本: V${VERSION}（来源 ${VERSION_FILE}）`);
  console.log(`  大小: ${kb} KB (${bytes} bytes)`);
  console.log(`  模块: ${parts.length} 个`);
  for (const p of parts) {
    const lineCount = p.code.split('\n').length;
    console.log(`    - ${p.name.padEnd(16)} ${String(lineCount).padStart(5)} 行`);
  }
  return true;
}

// ---------- watch ----------
function watch() {
  console.log('👀 监听 src/ 变化… (Ctrl+C 退出)');
  if (!build()) process.exitCode = 1;
  let timer = null;
  fs.watch(SRC, { recursive: true }, (_evt, file) => {
    if (!file) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(`\n↻ ${file} 变化，重新构建…`);
      build();
    }, 150);
  });
}

// ---------- main ----------
const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
  console.log('用法: node build.js [--check] [--watch]');
  process.exit(0);
}
if (argv.includes('--watch')) {
  watch();
} else {
  const ok = build({ check: argv.includes('--check') });
  process.exit(ok ? 0 : 1);
}
