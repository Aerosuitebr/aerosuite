#!/usr/bin/env node
/**
 * Prévia / envio do e-mail comercial Vaga Jato para empresas e consultorias parceiras.
 *
 * Uso:
 *   node scripts/send-vaga-jato-empresas-parceiras-email.mjs --dry-run
 *   node scripts/send-vaga-jato-empresas-parceiras-email.mjs
 *   node scripts/send-vaga-jato-empresas-parceiras-email.mjs --to empresa@dominio.com.br
 *   node scripts/send-vaga-jato-empresas-parceiras-email.mjs --official
 *   node scripts/send-vaga-jato-empresas-parceiras-email.mjs --official --dry-run
 *   node scripts/send-vaga-jato-empresas-parceiras-email.mjs --official --groups consultorias_ti_nacionais --skip-sent
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const official = process.argv.includes('--official');
const skipSent = process.argv.includes('--skip-sent');
const stamp = '20260713';

const GROUP_LABELS = {
  consultorias_ti: 'Consultoria de TI',
  consultorias_ti_nacionais: 'Consultoria de TI · Brasil',
  grandes_empresas: 'Grande empresa',
};

function argList(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return null;
  const values = [];
  for (let i = idx + 1; i < process.argv.length; i += 1) {
    const token = process.argv[i];
    if (token.startsWith('--')) break;
    values.push(token);
  }
  return values.length ? values : null;
}

function loadSentEmails(rootDir) {
  const emailsDir = path.join(rootDir, 'docs/comercial/emails');
  const sent = new Set();
  if (!fs.existsSync(emailsDir)) return sent;

  for (const file of fs.readdirSync(emailsDir)) {
    if (!file.startsWith('relatorio-envio-vaga-jato-empresas-') || !file.endsWith('.json')) continue;
    try {
      const report = JSON.parse(fs.readFileSync(path.join(emailsDir, file), 'utf8'));
      for (const item of report.resultados || []) {
        if (item.email) sent.add(String(item.email).toLowerCase());
      }
    } catch {
      // ignora relatórios inválidos
    }
  }
  return sent;
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

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 ? process.argv[idx + 1] : null;
}

const htmlPath = path.join(root, `docs/comercial/emails/email-vaga-jato-empresas-parceiras-${stamp}.html`);
const contactsPath = path.join(root, `docs/comercial/emails/vaga-jato-empresas-parceiras-contatos.json`);

if (!fs.existsSync(htmlPath)) {
  console.error('Template ausente:', htmlPath);
  process.exit(1);
}

function buildHtml(previewBanner = '') {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/<!--[\s\S]*?-->/g, '').trim();

  const logoPath = path.join(root, 'frontend/src/assets/LOGO_AERO_WHITE.png');
  const logoCid = 'aerosuite-vaga-jato-logo';

  if (fs.existsSync(logoPath)) {
    html = html.replaceAll('{{LOGO_CID_SRC}}', `cid:${logoCid}`);
  } else {
    html = html.replaceAll('{{LOGO_CID_SRC}}', '');
  }

  html = html.replace('{{PREVIEW_BANNER}}', previewBanner);
  return html;
}

function logoAttachments() {
  const logoPath = path.join(root, 'frontend/src/assets/LOGO_AERO_WHITE.png');
  const logoCid = 'aerosuite-vaga-jato-logo';
  if (!fs.existsSync(logoPath)) return [];

  return [{
    filename: 'aerosuite-logo.png',
    path: logoPath,
    cid: logoCid,
    contentDisposition: 'inline',
    contentType: 'image/png',
  }];
}

const subject =
  'Exposição gratuita de vagas no Vaga Jato para ampliar o alcance da sua empresa';

const host = readEnv('QUARKUS_MAILER_HOST', 'smtp.gmail.com');
const port = Number(readEnv('QUARKUS_MAILER_PORT', '587'));
const user = readEnv('QUARKUS_MAILER_USERNAME', 'contato@aerosuite.com.br');
const pass = readEnv('QUARKUS_MAILER_PASSWORD');
const fromAddress = 'comercial@aerosuite.com.br';
const fromName = 'Departamento Comercial · Aero Suite';

const previewBanner =
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px 0;border-collapse:collapse;"><tr><td bgcolor="#fef3c7" style="background-color:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:14px 18px;font-size:13px;line-height:1.5;color:#92400e;"><strong>Prévia interna.</strong> Este e-mail será encaminhado a consultorias de TI e grandes empresas após sua aprovação.</td></tr></table>`;

async function sendOne(transporter, { to, bcc = [], preview = false }) {
  const previewTag = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const finalSubject = preview ? `[PRÉVIA ${previewTag}] ${subject}` : subject;
  const html = buildHtml(preview ? previewBanner : '');

  if (dryRun) {
    return { to, bcc, subject: finalSubject, messageId: '(dry-run)' };
  }

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    replyTo: fromAddress,
    to,
    bcc: bcc.length ? bcc.join(', ') : undefined,
    subject: finalSubject,
    html,
    attachments: logoAttachments(),
  });

  return { to, bcc, subject: finalSubject, messageId: info.messageId };
}

if (!dryRun && (!pass || pass.length < 8)) {
  console.error('Defina QUARKUS_MAILER_PASSWORD (senha de app Google) no .env');
  process.exit(1);
}

let transporter = null;
if (!dryRun) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    requireTLS: port === 587,
  });

  console.log('Conectando SMTP Gmail...', host);
  await transporter.verify();
  console.log('SMTP OK');
}

const report = {
  enviadoEm: new Date().toISOString(),
  remetente: `${fromName} <${fromAddress}>`,
  assunto: subject,
  resultados: [],
  pendentes: [],
};

if (official) {
  if (!fs.existsSync(contactsPath)) {
    console.error('Lista de contatos ausente:', contactsPath);
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
  const bcc = catalog.bcc || [];
  const selectedGroups = argList('--groups') || Object.keys(GROUP_LABELS);
  const sentEmails = skipSent ? loadSentEmails(root) : new Set();

  const contatos = selectedGroups.flatMap(groupKey => {
    const label = GROUP_LABELS[groupKey];
    if (!label) {
      console.error('Grupo desconhecido:', groupKey);
      process.exit(1);
    }
    return (catalog[groupKey] || []).map(item => ({ ...item, grupo: label, groupKey }));
  });

  if (!contatos.length) {
    console.error('Nenhum contato encontrado para os grupos:', selectedGroups.join(', '));
    process.exit(1);
  }

  for (const item of contatos) {
    if (skipSent && sentEmails.has(String(item.email).toLowerCase())) {
      console.log(`Pulando ${item.empresa} <${item.email}> (já enviado).`);
      report.resultados.push({
        grupo: item.grupo,
        empresa: item.empresa,
        email: item.email,
        segmento: item.segmento,
        status: 'pulado_ja_enviado',
        messageId: null,
        bcc,
      });
      continue;
    }
    console.log(`Enviando para ${item.empresa} <${item.email}>...`);
    const result = await sendOne(transporter, { to: item.email, bcc, preview: false });
    report.resultados.push({
      grupo: item.grupo,
      empresa: item.empresa,
      email: item.email,
      segmento: item.segmento,
      status: dryRun ? 'dry-run' : 'enviado',
      messageId: result.messageId,
      bcc,
    });
  }

  report.pendentes = catalog.pendentes_formulario || [];

  const reportPath = path.join(
    root,
    `docs/comercial/emails/relatorio-envio-vaga-jato-empresas-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}.json`
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('\nRelatório salvo em:', reportPath);
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const to = argValue('--to') || 'wellemlyra@gmail.com';
const isPreview = to === 'wellemlyra@gmail.com';

if (dryRun) {
  console.log('Dry-run — envio omitido.');
  console.log('SMTP:', `${host}:${port}`);
  console.log('Auth user:', user);
  console.log('De:', `${fromName} <${fromAddress}>`);
  console.log('Para:', to);
  console.log('Assunto:', subject);
  console.log('Template:', htmlPath);
  process.exit(0);
}

const result = await sendOne(transporter, { to, preview: isPreview });
console.log('E-mail enviado.');
console.log('Message-Id:', result.messageId);
console.log('Para:', to);
