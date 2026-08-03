#!/usr/bin/env node
/**
 * Envia comunicado certificação ANAC via SMTP Gmail (mesmo .env do Quarkus).
 * Uso:
 *   node scripts/send-certificacao-anac-email.mjs --dry-run
 *   node scripts/send-certificacao-anac-email.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');

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

const host = readEnv('QUARKUS_MAILER_HOST', 'smtp.gmail.com');
const port = Number(readEnv('QUARKUS_MAILER_PORT', '587'));
const user = readEnv('QUARKUS_MAILER_USERNAME', 'contato@aerosuite.com.br');
const pass = readEnv('QUARKUS_MAILER_PASSWORD');
const from = readEnv('QUARKUS_MAILER_FROM', user);

const toList = [
  'timmaia@bellowscontrols.com.br',
  'rafaellanottesconsultoria@gmail.com',
];
const ccList = ['wellemlyra@gmail.com'];

const pdfPath = path.join(root, 'docs/comercial/Comunicado_Certificacao_ANAC_20260610.pdf');
const htmlPath = path.join(root, 'docs/comercial/email-certificacao-anac-comercial-20260610.html');

for (const f of [pdfPath, htmlPath]) {
  if (!fs.existsSync(f)) {
    console.error('Arquivo ausente:', f);
    console.error('Gere o PDF: node scripts/build-comunicado-certificacao-anac-pdf.mjs');
    process.exit(1);
  }
}

let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/<!--[\s\S]*?-->/g, '').trim();

const subject =
  'Oba! Aero Suite pronta para o processo de certificação ANAC — comunicado executivo (PDF)';

if (dryRun) {
  console.log('Dry-run — envio omitido.');
  console.log('SMTP:', `${host}:${port}`);
  console.log('De:', from, `(${user})`);
  console.log('Para:', toList.join(', '));
  console.log('Cc:', ccList.join(', '));
  console.log('Assunto:', subject);
  console.log('Anexo:', pdfPath);
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
  from: `"Wellem Lyra — Aero Suite TI" <${from}>`,
  to: toList.join(', '),
  cc: ccList.join(', '),
  subject,
  html,
  attachments: [
    {
      filename: 'Comunicado_Certificacao_ANAC_AeroSuite.pdf',
      path: pdfPath,
      contentType: 'application/pdf',
    },
  ],
});

console.log('E-mail enviado.');
console.log('Message-Id:', info.messageId);
console.log('Para:', toList.join(', '));
console.log('Cc:', ccList.join(', '));
