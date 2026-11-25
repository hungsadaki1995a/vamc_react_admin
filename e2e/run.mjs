#!/usr/bin/env node
// E2E runner for the team — runs the Playwright suite and writes a local HTML report.
// Cross-platform (Node only, no bash).
//
//   pnpm e2e                                   all scenarios
//   pnpm e2e e2e/screens/shell.spec.ts         one file
//   pnpm e2e -g "A06010300" --open             one screen (menu code), then serve the report
//   pnpm e2e:report                            serve the newest report again
//
// Settings come from the environment or e2e/.env.e2e (git-ignored, copy e2e/.env.e2e.example):
//   E2E_USER / E2E_PASS   test account with rights on every admin menu (required)
//   E2E_API_TARGET        admin backend, default http://127.0.0.1:7200 (your local backend)
//   E2E_PORT              Vite port for the run, default 13000
//   E2E_KEEP_REPORTS      reports kept under e2e/.report, default 10
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_ROOT = path.join(ROOT, 'e2e', '.report');
const CLI = path.join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');

function fail(message, code = 2) {
  console.error(`\n✖ ${message}`);
  process.exit(code);
}

function playwright(args) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, stdio: 'inherit', env: process.env }).status ?? 1;
}

function reportDirs() {
  if (!existsSync(REPORT_ROOT)) return [];
  return readdirSync(REPORT_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{8}-\d{6}$/.test(d.name))
    .map((d) => d.name)
    .sort()
    .reverse();
}

function showReport(dir) {
  console.log(`\nServing ${path.relative(ROOT, dir)} — Ctrl+C to stop`);
  playwright(['show-report', dir]);
}

if (!existsSync(CLI)) fail('Playwright is not installed — run `pnpm install` first.');

const argv = process.argv.slice(2);

// `report` mode: serve the newest report.
if (argv[0] === 'report') {
  const [latest] = reportDirs();
  if (!latest) fail('No report yet — run `pnpm e2e` first.');
  showReport(path.join(REPORT_ROOT, latest));
  process.exit(0);
}

const open = argv.includes('--open');
const args = argv.filter((a) => a !== '--open');

const envFile = process.env.E2E_ENV_FILE ?? path.join(ROOT, 'e2e', '.env.e2e');
if (existsSync(envFile)) process.loadEnvFile(envFile);
if (!process.env.E2E_USER || !process.env.E2E_PASS) {
  fail('Set E2E_USER / E2E_PASS — copy e2e/.env.e2e.example to e2e/.env.e2e and fill in a test account.');
}

const target = (process.env.E2E_API_TARGET ?? 'http://127.0.0.1:7200').replace(/\/+$/, '');
process.env.E2E_API_TARGET = target;
try {
  const res = await fetch(`${target}/api/auth/public-key`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch (error) {
  fail(
    `Admin backend ${target} is not answering (${error.message}).\n` +
      '  Start vamc-npl-admin-backend (profile local) or set E2E_API_TARGET in e2e/.env.e2e.',
    3,
  );
}

// No-op when the matching Chromium build is already installed.
if (playwright(['install', 'chromium']) !== 0) fail('Could not install Chromium for Playwright.');

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const reportDir = path.join(REPORT_ROOT, stamp);
process.env.E2E_REPORT_DIR = reportDir;

console.log(`\n▶ Playwright → ${target}  ·  report ${path.relative(ROOT, reportDir)}\n`);
const status = playwright(['test', ...args]);

if (existsSync(path.join(reportDir, 'index.html'))) {
  const keep = Number(process.env.E2E_KEEP_REPORTS ?? 10);
  for (const old of reportDirs().slice(keep)) rmSync(path.join(REPORT_ROOT, old), { recursive: true, force: true });
  console.log(`\n📄 Report: ${path.join(reportDir, 'index.html')}`);
  console.log('   View:   pnpm e2e:report');
}

console.log(status === 0 ? '✅ All scenarios passed' : `❌ Some scenarios failed (exit ${status})`);
if (open && existsSync(path.join(reportDir, 'index.html'))) showReport(reportDir);
process.exit(status);
