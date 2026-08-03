/**
 * Verifica DNS (SPF/DMARC) e configuração pública do fluxo de conversão.
 * Uso: node check-conversion-infra.mjs
 */
import { promises as dns, setServers } from 'node:dns';

setServers(['8.8.8.8', '1.1.1.1']);

const DOMAIN = 'aerosuite.com.br';
const ORIGIN = `https://${DOMAIN}`;

async function txtRecords(name) {
  try {
    return await dns.resolveTxt(name);
  } catch {
    return [];
  }
}

function flatten(records) {
  return records.map((r) => r.join('')).join(' | ');
}

const [spf, dmarc, dkim, homeHtml, contato] = await Promise.all([
  txtRecords(DOMAIN),
  txtRecords(`_dmarc.${DOMAIN}`),
  txtRecords(`google._domainkey.${DOMAIN}`),
  fetch(ORIGIN).then((r) => r.text()),
  fetch(`${ORIGIN}/contato/`).then((r) => r.text()),
]);
const spfFlat = flatten(spf);
const dmarcFlat = flatten(dmarc);
const dkimFlat = flatten(dkim);

const report = {
  at: new Date().toISOString(),
  spf: { ok: /v=spf1/i.test(spfFlat), preview: spfFlat.slice(0, 200) },
  dmarc: { ok: /v=DMARC1/i.test(dmarcFlat), preview: dmarcFlat.slice(0, 200) },
  dkim: { ok: /v=DKIM1/i.test(dkimFlat), preview: dkimFlat.slice(0, 120) },
  calendlyEmbed: /calendly\.com\/comercial-aerosuite/i.test(contato),
  obrigadoClean: !homeHtml.includes('?lead=calendly'),
  footerLegal: homeHtml.includes('politica-de-privacidade') && homeHtml.includes('termos-de-uso'),
  notes: [
    'DKIM Google: após publicar TXT, clique em Iniciar autenticação no Admin (propagação até 48h)',
    'E-mail From: só confirmável com agendamento real',
    'Título Calendly: ajustar no painel Calendly (ver FLUXO-CONVERSAO-OPERACIONAL.md)',
  ],
};

console.log(JSON.stringify(report, null, 2));
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
fs.writeFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'conversion-infra-report.json'),
  JSON.stringify(report, null, 2)
);
