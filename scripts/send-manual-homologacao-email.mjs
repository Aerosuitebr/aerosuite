#!/usr/bin/env node
/**
 * Envia Manual de Homologação v3.0 para a direção (destinatários padrão).
 * Uso:
 *   node scripts/build-manual-pdf.mjs
 *   node scripts/send-manual-homologacao-email.mjs [--dry-run]
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run') ? ['--dry-run'] : [];

const subject =
  'Manual de Homologação Aero Suite v3.0 — certificação ANAC e rotina completa (PDF)';

const args = [
  path.join(root, 'scripts/send-documento-direcao.mjs'),
  '--html',
  'docs/manual-homologacao/email-homologacao-v3.html',
  '--subject',
  subject,
  '--attach',
  'manuals/Manual_Aero_Suite_Homologacao.pdf',
  '--attach-name',
  'Manual_Aero_Suite_Homologacao_v3.pdf',
  ...dryRun,
];

const r = spawnSync(process.execPath, args, { stdio: 'inherit', cwd: root });
process.exit(r.status ?? 1);
