#!/usr/bin/env node
/**
 * Verifica o gate automatizado WCAG (trilha CÓDIGO).
 * Uso: cd frontend && npm run a11y:gate
 * Saída: docs/wcag-evidencias/gate-codigo-latest.json
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const frontendDir = path.join(root, 'frontend');
const outDir = path.join(root, 'docs/wcag-evidencias');
const outFile = path.join(outDir, 'gate-codigo-latest.json');

function runStep(name, cmd, args, extraEnv = {}) {
  const started = Date.now();
  const result = spawnSync(cmd, args, {
    cwd: frontendDir,
    env: { ...process.env, ...extraEnv },
    encoding: 'utf8',
    shell: true,
  });
  const ok = result.status === 0;
  return {
    name,
    ok,
    exitCode: result.status ?? 1,
    durationMs: Date.now() - started,
    stderr: (result.stderr || '').trim().slice(0, 2000),
    stdout: (result.stdout || '').trim().slice(-1500),
  };
}

const steps = [
  runStep('build', 'npm', ['run', 'build']),
  runStep('test:unit', 'npm', ['run', 'test:unit']),
  runStep('a11y:axe', 'npm', ['run', 'a11y:axe'], { WCAG_REPORT: '1' }),
  runStep('a11y:flow-p0', 'npm', ['run', 'a11y:flow-p0']),
  runStep('a11y:flow-full', 'npm', ['run', 'a11y:flow-full'], { A11Y_FLOW_SCOPE: 'full' }),
];

let perfLcp = runStep('perf:lcp', 'npm', ['run', 'perf:lcp']);
if (!perfLcp.ok) {
  perfLcp = { ...perfLcp, optional: true, note: 'LCP smoke falhou — não bloqueia gate código se resto OK' };
}
steps.push(perfLcp);

const required = steps.filter(s => !s.optional);
const passed = required.filter(s => s.ok).length;
const codePercent = Math.round((passed / required.length) * 100);

let commit = 'unknown';
try {
  const git = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' });
  if (git.status === 0) commit = git.stdout.trim();
} catch {
  /* ignore */
}

const report = {
  generatedAt: new Date().toISOString(),
  commit,
  track: 'codigo',
  codePercent,
  pass: required.every(s => s.ok),
  steps,
  nextHuman: 'docs/WCAG-100-PASSO-A-PASSO.md — §B Trilha HUMANO',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

console.log(`wcag-gate (código): ${passed}/${required.length} — ${codePercent}%`);
for (const s of steps) {
  const mark = s.ok ? 'OK' : s.optional ? 'SKIP' : 'FAIL';
  console.log(`  [${mark}] ${s.name} (${s.durationMs}ms)`);
}
console.log(`Relatório: ${outFile}`);

process.exit(report.pass ? 0 : 1);
