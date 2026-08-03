/**
 * Gera baseline JSON do smoke axe (WCAG 2.2 AA).
 * Uso: node scripts/wcag-report.mjs
 * Requer build prévio: cd frontend && npm run build
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '../frontend');

const result = spawnSync('npm', ['run', 'a11y:axe'], {
  cwd: frontendDir,
  env: { ...process.env, WCAG_REPORT: '1' },
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
