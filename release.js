#!/usr/bin/env node
/**
 * 发布脚本：把「改版本号 → 构建 → 同步 → 提交」收成一条命令。
 *
 * 用法：
 *   node release.js             # 用当前 version.txt 构建 + 同步
 *   node release.js 2.2         # 先把版本号改成 2.2，再构建 + 同步
 *   node release.js --check     # 只校验（不写文件、不改版本号）
 *
 * 原理：
 *   版本号单一来源是根目录 version.txt，template.html 里用 {{VERSION}} 占位符，
 *   build.js 构建时自动注入。本脚本只负责「改 version.txt + 调 build.js + 提示」，
 *   避免手动改文件名 / 改 title / 改 h1 漏一处。
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const VERSION_FILE = path.join(ROOT, 'version.txt');
const RELEASE_FILE = path.join(ROOT, 'whk.html');

// ---------- 小工具 ----------
function runBuild(check = false) {
  const args = ['build.js'];
  if (check) args.push('--check');
  try {
    execFileSync(process.execPath, args, { stdio: 'inherit', cwd: ROOT });
    return true;
  } catch (e) {
    return false;
  }
}

function currentVersion() {
  try {
    return fs.readFileSync(VERSION_FILE, 'utf8').trim();
  } catch (e) {
    return '';
  }
}

function isVersionLike(s) {
  // 允许 2.1 / 2.1.3 / 2.1-beta.1 等常见版本号
  return /^\d+\.\d+(\.\d+)?([-+][\w.]+)?$/.test(s);
}

function gitDirtyCheck() {
  try {
    const out = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' });
    return out.trim() !== '';
  } catch (e) {
    return true; // git 不可用时保守处理
  }
}

// ---------- main ----------
const argv = process.argv.slice(2);

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`用法:
  node release.js            用当前版本构建并同步
  node release.js <版本号>   先改版本号再构建并同步（如 node release.js 2.2）
  node release.js --check    只校验`);
  process.exit(0);
}

// --check：只校验
if (argv.includes('--check')) {
  const ok = runBuild(true);
  process.exit(ok ? 0 : 1);
}

// 可选：更新版本号
const versionArg = argv.find((a) => !a.startsWith('-'));
if (versionArg !== undefined) {
  if (!isVersionLike(versionArg)) {
    console.error(`✗ 版本号格式不正确: "${versionArg}"（应形如 2.2 或 2.2.1）`);
    process.exit(1);
  }
  fs.writeFileSync(VERSION_FILE, versionArg.trim() + '\n', 'utf8');
  console.log(`✓ 版本号已写入 ${path.relative(ROOT, VERSION_FILE)}: ${versionArg.trim()}`);
}

const version = currentVersion();
console.log(`\n===== 发布 V${version} =====`);

// 构建 + 同步（build.js 会一并把 dist 产物同步到根目录）
const ok = runBuild(false);
if (!ok) {
  console.error('✗ 构建失败，未发布。');
  process.exit(1);
}

// 提示后续操作
console.log(`\n===== 发布完成 =====`);
console.log(`  版本  : V${version}`);
console.log(`  分发物: ${path.relative(ROOT, RELEASE_FILE)}（已同步）`);
console.log(`  下一步:`);
console.log(`    git add version.txt whk.html src/ build.js release.js README.md`);
console.log(`    git commit -m "发布 V${version}"`);
console.log(`    git push origin master`);
if (gitDirtyCheck()) {
  console.log(`  ⚠️  工作区还有其它改动，提交前请 git status 确认范围。`);
}
process.exit(0);
