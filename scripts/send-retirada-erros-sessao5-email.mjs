#!/usr/bin/env node
/**
 * Envia Relatório Executivo de Retirada de Erros — Sessão 5 à equipe (PDF + e-mail HTML).
 * Uso:
 *   node scripts/send-retirada-erros-sessao5-email.mjs --dry-run
 *   node scripts/send-retirada-erros-sessao5-email.mjs
 *   node scripts/send-retirada-erros-sessao5-email.mjs --to wellemlyra@aerosuite.com.br
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const toArgIdx = process.argv.indexOf('--to');
const toOverride = toArgIdx >= 0 ? process.argv[toArgIdx + 1] : null;
const stamp = '20260701';

function readEnv(name, fallback = null) {
  if (process.env[name]) return process.env[name];
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return fallback;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(new RegExp(`^\\s*${name}\\s*=\\s*(.+)\\s*$`));
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return fallback;
}

const diretorio = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/templates/directorio-email-direcao.json'), 'utf8'),
);

const pdfPath = path.join(root, 'output/pdf/Relatorio_Executivo_Retirada_de_Erros_Sessao_5.pdf');
const htmlPath = path.join(root, `docs/homolog_ux/emails/email-retirada-erros-sessao5-equipe-${stamp}.html`);

for (const f of [pdfPath, htmlPath]) {
  if (!fs.existsSync(f)) {
    console.error('Arquivo ausente:', f);
    process.exit(1);
  }
}

const pdfBytes = fs.statSync(pdfPath).size;
const pdfMb = (pdfBytes / (1024 * 1024)).toFixed(2);
let html = fs.readFileSync(htmlPath, 'utf8').replaceAll('{{PDF_SIZE_MB}}', pdfMb);

const logoPath = path.join(root, diretorio.logos.hero);
const logoCid = diretorio.logos.hero_cid || 'aerosuite-hero-logo';
const logoAttachments = [];
if (fs.existsSync(logoPath)) {
  html = html.replaceAll('{{LOGO_CID_SRC}}', `cid:${logoCid}`);
  logoAttachments.push({
    filename: path.basename(logoPath),
    path: logoPath,
    cid: logoCid,
    contentDisposition: 'inline',
    contentType: 'image/png',
  });
} else {
  html = html.replaceAll('{{LOGO_CID_SRC}}', '');
}

const subject =
  'Relatório Executivo — Retirada de Erros · Sessão 5 · 12/12 apontamentos encerrados (PDF em anexo)';
const toList = toOverride ? [toOverride] : diretorio.lista_to;
const host = readEnv('QUARKUS_MAILER_HOST', 'smtp.gmail.com');
const port = Number(readEnv('QUARKUS_MAILER_PORT', '587'));
const user = readEnv('QUARKUS_MAILER_USERNAME', 'contato@aerosuite.com.br');
const pass = readEnv('QUARKUS_MAILER_PASSWORD');
const from = readEnv('QUARKUS_MAILER_FROM', user);

if (dryRun) {
  console.log('Dry-run — Retirada de Erros Sessão 5');
  console.log('Para:', toList.join(', '));
  console.log('Assunto:', subject);
  console.log('PDF:', pdfPath, `(${pdfMb} MB)`);
  process.exit(0);
}

if (!pass || pass.length < 8) {
  console.error('Defina QUARKUS_MAILER_PASSWORD no .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  requireTLS: port === 587,
});

const info = await transporter.sendMail({
  from: `"${diretorio.from_name}" <${from}>`,
  to: toList.join(', '),
  subject,
  html,
  attachments: [
    ...logoAttachments,
    {
      filename: 'Relatorio_Executivo_Retirada_de_Erros_Sessao_5_AeroSuite.pdf',
      path: pdfPath,
      contentType: 'application/pdf',
    },
  ],
});

console.log('E-mail enviado.');
console.log('Message-Id:', info.messageId);
console.log('Para:', toList.join(', '));
