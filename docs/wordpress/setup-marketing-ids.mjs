#!/usr/bin/env node
/**
 * Grava GA4 + Calendly em aerosuite-site-secrets.local.mjs e regenera o deploy.
 *
 * Uso:
 *   node setup-marketing-ids.mjs --ga4 G-ABC123XYZ --calendly https://calendly.com/conta/evento
 *   node setup-marketing-ids.mjs   (lê AEROSUITE_GA4 e AEROSUITE_CALENDLY do ambiente)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const secretsPath = path.join(dir, 'aerosuite-site-secrets.local.mjs');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const ga4 = arg('--ga4') || process.env.AEROSUITE_GA4 || '';
const calendly = arg('--calendly') || process.env.AEROSUITE_CALENDLY || '';
const metaPixel = arg('--meta-pixel') || process.env.AEROSUITE_META_PIXEL || '';
const linkedIn = arg('--linkedin-partner') || process.env.AEROSUITE_LINKEDIN_PARTNER || '';

if (!ga4 && !calendly && !metaPixel && !linkedIn) {
  console.error(`
Informe pelo menos um valor:

  node setup-marketing-ids.mjs --ga4 G-XXXXXXXXXX --calendly https://calendly.com/.../...

Ou variáveis de ambiente AEROSUITE_GA4 e AEROSUITE_CALENDLY.

Guia rápido: docs/wordpress/SETUP-GA4-CALENDLY.md
`);
  process.exit(1);
}

let existing = { ga4MeasurementId: '', calendlyEmbedUrl: '', metaPixelId: '', linkedInPartnerId: '' };
if (fs.existsSync(secretsPath)) {
  const mod = await import(pathToFileURL(secretsPath).href + '?t=' + Date.now());
  existing = mod.SECRETS || existing;
}

const next = {
  ga4MeasurementId: ga4 || existing.ga4MeasurementId,
  calendlyEmbedUrl: calendly || existing.calendlyEmbedUrl,
  metaPixelId: metaPixel || existing.metaPixelId || '',
  linkedInPartnerId: linkedIn || existing.linkedInPartnerId || '',
};

const body = `/** Gerado por setup-marketing-ids.mjs — não commitar */
export const SECRETS = {
  ga4MeasurementId: ${JSON.stringify(next.ga4MeasurementId)},
  calendlyEmbedUrl: ${JSON.stringify(next.calendlyEmbedUrl)},
  metaPixelId: ${JSON.stringify(next.metaPixelId)},
  linkedInPartnerId: ${JSON.stringify(next.linkedInPartnerId)},
};
`;

fs.writeFileSync(secretsPath, body);
console.log('Gravado:', secretsPath);
console.log('  GA4:', next.ga4MeasurementId || '(vazio — analytics desligado)');
console.log('  Calendly:', next.calendlyEmbedUrl || '(vazio — só formulário + WhatsApp)');

const r = spawnSync(process.execPath, ['build-gaps-deploy.mjs'], {
  cwd: dir,
  stdio: 'inherit',
});
process.exit(r.status ?? 1);
