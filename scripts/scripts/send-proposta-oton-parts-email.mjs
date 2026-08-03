#!/usr/bin/env node
/**
 * Envia proposta comercial OTON PARTS CORP por e-mail.
 *
 * Pré-requisito:
 *   node scripts/build-proposta-oton-parts-pdf.mjs
 *
 * Uso:
 *   node scripts/send-proposta-oton-parts-email.mjs --dry-run
 *   node scripts/send-proposta-oton-parts-email.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const stamp = '20260624';

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

const pdfPath = path.join(root, `docs/comercial/Proposta_Comercial_OTON_PARTS_CORP_${stamp}.pdf`);
const htmlPath = path.join(root, `docs/comercial/emails/email-proposta-oton-parts-${stamp}.html`);

for (const f of [pdfPath, htmlPath]) {
  if (!fs.existsSync(f)) {
    console.error('Arquivo ausente:', f);
    console.error('Gere o PDF: node scripts/build-proposta-oton-parts-pdf.mjs');
    process.exit(1);
  }
}

const pdfMb = (fs.statSync(pdfPath).size / (1024 * 1024)).toFixed(2);

let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/<!--[\s\S]*?-->/g, '').trim();
html = html.replaceAll('{{PDF_MB}}', pdfMb);

const logoPath = path.join(root, 'frontend/src/assets/LOGO_AERO_WHITE.png');
const logoCid = 'aerosuite-hero-logo';
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
  'Proposta Comercial Premium · Aero Suite para OTON PARTS CORP (3 planos · PDF em anexo)';

const host = readEnv('QUARKUS_MAILER_HOST', 'smtp.gmail.com');
const port = Number(readEnv('QUARKUS_MAILER_PORT', '587'));
const user = readEnv('QUARKUS_MAILER_USERNAME', 'contato@aerosuite.com.br');
const pass = readEnv('QUARKUS_MAILER_PASSWORD');
const from = readEnv('QUARKUS_MAILER_FROM', user);
const to = 'wellemlyra@gmail.com';

if (dryRun) {
  console.log('Dry-run — envio omitido.');
  console.log('SMTP:', `${host}:${port}`);
  console.log('De:', `Wellem Lyra — Diretor de TI · Aero Suite <${from}>`);
  console.log('Para:', to);
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

console.log('Conectando SMTP...', host);
await transporter.verify();
console.log('SMTP OK');

const info = await transporter.sendMail({
  from: '"Wellem Lyra — Diretor de TI · Aero Suite" <' + from + '>',
  to,
  subject,
  html,
  attachments: [
    ...logoAttachments,
    {
      filename: 'Proposta_Comercial_AeroSuite_OTON_PARTS_CORP.pdf',
      path: pdfPath,
      contentType: 'application/pdf',
    },
  ],
});

console.log('E-mail enviado.');
console.log('Message-Id:', info.messageId);
console.log('Para:', to);
