#!/usr/bin/env node
/**
 * Envio padrão de documentação executiva para a direção Aero Suite.
 * Destinatários, assinatura e hero definidos em docs/templates/directorio-email-direcao.json
 *
 * Uso:
 *   node scripts/send-documento-direcao.mjs --html docs/.../email.html --subject "Assunto" --attach path.pdf [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const nodemailer = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '../node_modules/nodemailer'));

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

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

const htmlPath = arg('--html');
const subject = arg('--subject');
const attachPath = arg('--attach');
const attachName = arg('--attach-name');

if (!htmlPath || !subject || !attachPath) {
  console.error('Uso: node scripts/send-documento-direcao.mjs --html <file> --subject "..." --attach <pdf> [--attach-name nome.pdf] [--dry-run]');
  process.exit(1);
}

const dirPath = path.join(root, 'docs/templates/directorio-email-direcao.json');
const diretorio = JSON.parse(fs.readFileSync(dirPath, 'utf8'));
const toList = diretorio.lista_to;

const resolvedHtml = path.isAbsolute(htmlPath) ? htmlPath : path.join(root, htmlPath);
const resolvedAttach = path.isAbsolute(attachPath) ? attachPath : path.join(root, attachPath);

for (const f of [resolvedHtml, resolvedAttach]) {
  if (!fs.existsSync(f)) {
    console.error('Arquivo ausente:', f);
    process.exit(1);
  }
}

const host = readEnv('QUARKUS_MAILER_HOST', 'smtp.gmail.com');
const port = Number(readEnv('QUARKUS_MAILER_PORT', '587'));
const user = readEnv('QUARKUS_MAILER_USERNAME', 'contato@aerosuite.com.br');
const pass = readEnv('QUARKUS_MAILER_PASSWORD');
const from = readEnv('QUARKUS_MAILER_FROM', user);

let html = fs.readFileSync(resolvedHtml, 'utf8');
html = html.replace(/<!--[\s\S]*?-->/g, '').trim();

const pdfSizeMb = (fs.statSync(resolvedAttach).size / (1024 * 1024)).toFixed(1);
html = html.replaceAll('{{PDF_SIZE_MB}}', pdfSizeMb);

const logoRel = diretorio.logos.hero || diretorio.logos.hero_light;
const logoPath = path.join(root, logoRel);
const logoCid = diretorio.logos.hero_cid || 'aerosuite-hero-logo';
const logoAttachments = [];

if (fs.existsSync(logoPath) && (html.includes('{{LOGO_DATA_URI}}') || html.includes('{{LOGO_CID_SRC}}'))) {
  const cidSrc = `cid:${logoCid}`;
  html = html.replaceAll('{{LOGO_DATA_URI}}', cidSrc);
  html = html.replaceAll('{{LOGO_CID_SRC}}', cidSrc);
  logoAttachments.push({
    filename: path.basename(logoPath),
    path: logoPath,
    cid: logoCid,
    contentDisposition: 'inline',
    contentType: 'image/png',
  });
}

const filename = attachName || path.basename(resolvedAttach);

if (dryRun) {
  console.log('Dry-run — envio omitido.');
  console.log('SMTP:', `${host}:${port}`);
  console.log('De:', `${diretorio.from_name} <${from}>`);
  console.log('Para:', toList.join(', '));
  console.log('Assunto:', subject);
  console.log('Anexo:', resolvedAttach, `(${pdfSizeMb} MB)`);
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
      filename,
      path: resolvedAttach,
      contentType: 'application/pdf',
    },
  ],
});

console.log('E-mail enviado.');
console.log('Message-Id:', info.messageId);
console.log('Para:', toList.join(', '));
