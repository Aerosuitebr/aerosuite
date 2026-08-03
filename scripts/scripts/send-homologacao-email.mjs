#!/usr/bin/env node
/**
 * Envia e-mail do Manual de Homologacao via SendGrid API v3.
 * Uso:
 *   QUARKUS_MAILER_PASSWORD=SG.xxx node scripts/send-homologacao-email.mjs
 *   node scripts/send-homologacao-email.mjs --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');

function readEnv(name) {
  if (process.env[name]) return process.env[name];
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return null;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(new RegExp(`^\\s*${name}\\s*=\\s*(.+)\\s*$`));
    if (m) return m[1].trim();
  }
  return null;
}

const apiKey = readEnv('QUARKUS_MAILER_PASSWORD');
const from = readEnv('QUARKUS_MAILER_FROM') || 'noreply@mail.aerosuite.app';
const to = 'rafaellanottesconsultoria@gmail.com';
const cc = ['timmaia@bellowscontrols.com.br', 'wellemlyra@gmail.com'];

const pdfPath = path.join(root, 'manuals/Manual_Aero_Suite_Homologacao.pdf');
const logoPath = path.join(root, 'frontend/src/assets/LOGO_LETRA_LIGHT.png');
const htmlTemplate = path.join(root, 'docs/manual-homologacao/email-homologacao.html');

for (const f of [pdfPath, logoPath, htmlTemplate]) {
  if (!fs.existsSync(f)) {
    console.error('Arquivo ausente:', f);
    process.exit(1);
  }
}

const logoB64 = fs.readFileSync(logoPath).toString('base64');
const logoUri = `data:image/png;base64,${logoB64}`;
const pdfSizeMb = (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(2);
const dataEnvio = new Date().toLocaleDateString('pt-BR');

let html = fs.readFileSync(htmlTemplate, 'utf8');
html = html
  .replaceAll('{{LOGO_DATA_URI}}', logoUri)
  .replaceAll('{{PDF_SIZE_MB}}', pdfSizeMb)
  .replaceAll('{{DATA_ENVIO}}', dataEnvio)
  .replaceAll('{{COPYRIGHT_YEAR}}', String(new Date().getFullYear()));

const previewPath = path.join(root, 'docs/manual-homologacao/email-preview.html');
fs.writeFileSync(previewPath, html, 'utf8');
console.log('Preview:', previewPath);

if (dryRun) {
  console.log('Dry-run: envio omitido.');
  process.exit(0);
}

if (!apiKey || !apiKey.startsWith('SG.') || apiKey.includes('sua_api_key')) {
  console.error('Defina QUARKUS_MAILER_PASSWORD (SendGrid SG.*) no .env ou ambiente.');
  process.exit(1);
}

const subject =
  '[Aero Suite] ⚠ NOVA VERSÃO v2.0 — Manual de Homologação atualizado (SGQ · Fase 7 · SMS)';
const pdfB64 = fs.readFileSync(pdfPath).toString('base64');

const payload = {
  personalizations: [
    {
      to: [{ email: to }],
      cc: cc.map((email) => ({ email })),
      subject
    }
  ],
  from: { email: from, name: 'Equipe de Sistemas Aero Suite' },
  subject,
  content: [{ type: 'text/html', value: html }],
  attachments: [
    {
      content: pdfB64,
      type: 'application/pdf',
      filename: 'Manual_Aero_Suite_Homologacao.pdf',
      disposition: 'attachment'
    }
  ]
};

console.log('Enviando para:', to);
console.log('Copia:', cc.join(', '));
console.log('De:', from);

const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});

if (resp.ok) {
  console.log('OK - HTTP', resp.status, '- e-mail enviado.');
  const msgId = resp.headers.get('x-message-id');
  if (msgId) console.log('Message-Id:', msgId);
} else {
  const body = await resp.text();
  console.error('ERRO SendGrid HTTP', resp.status, body);
  process.exit(1);
}
