#!/usr/bin/env node
/**
 * Envia Resposta Técnica Homologação UX Sessão 2 para Comercial, Marketing, Qualidade e TI.
 *
 * Pré-requisito:
 *   node scripts/build-homolog-ux-sessao2-resposta-pdf.mjs
 *
 * Uso:
 *   node scripts/send-homolog-ux-sessao2-email.mjs --dry-run
 *   node scripts/send-homolog-ux-sessao2-email.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const stamp = '20260610';

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

const pdfPath = path.join(root, `docs/homolog_ux/Resposta_Homolog_UX_Sessao2_${stamp}.pdf`);
const htmlPath = path.join(root, `docs/homolog_ux/emails/email-resposta-sessao2-equipe-${stamp}.html`);

for (const f of [pdfPath, htmlPath]) {
  if (!fs.existsSync(f)) {
    console.error('Arquivo ausente:', f);
    console.error('Gere o PDF: node scripts/build-homolog-ux-sessao2-resposta-pdf.mjs');
    process.exit(1);
  }
}

const pdfMb = (fs.statSync(pdfPath).size / (1024 * 1024)).toFixed(1);

let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/<!--[\s\S]*?-->/g, '').trim();
html = html.replaceAll('{{PDF_SIZE_MB}}', pdfMb);

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
}

const subject =
  'Resposta Técnica — Homologação UX Sessão 2 (71/71 achados endereçados · PDF em anexo)';

const host = readEnv('QUARKUS_MAILER_HOST', 'smtp.gmail.com');
const port = Number(readEnv('QUARKUS_MAILER_PORT', '587'));
const user = readEnv('QUARKUS_MAILER_USERNAME', 'contato@aerosuite.com.br');
const pass = readEnv('QUARKUS_MAILER_PASSWORD');
const from = readEnv('QUARKUS_MAILER_FROM', user);
const toList = diretorio.lista_to;

if (dryRun) {
  console.log('Dry-run — envio omitido.');
  console.log('SMTP:', `${host}:${port}`);
  console.log('De:', `${diretorio.from_name} <${from}>`);
  console.log('Para:', toList.join(', '));
  console.log('Assunto:', subject);
  console.log('Anexo:', pdfPath, `(${pdfMb} MB)`);
  process.exit(0);
}

if (!pass || pass.length < 8) {
  console.error('Defina QUARKUS_MAILER_PASSWORD (senha de app Google) no .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  requireTLS: port === 587,
});

console.log('Conectando SMTP Gmail...', host);
await transporter.verify();
console.log('SMTP OK');

const info = await transporter.sendMail({
  from: `"${diretorio.from_name}" <${from}>`,
  to: toList.join(', '),
  subject,
  html,
  attachments: [
    ...logoAttachments,
    {
      filename: 'Resposta_Homolog_UX_Sessao2_AeroSuite.pdf',
      path: pdfPath,
      contentType: 'application/pdf',
    },
  ],
});

console.log('E-mail enviado.');
console.log('Message-Id:', info.messageId);
console.log('Para:', toList.join(', '));
