/**
 * Migra DNS do aerosuite.com.br (Cloudflare) de Locaweb → Google Workspace Gmail.
 *
 * Requer: CLOUDFLARE_API_TOKEN com Zone.DNS Edit
 *
 * Uso:
 *   node docs/wordpress/run-cloudflare-dns-gmail-migrate.mjs --dry-run
 *   CLOUDFLARE_API_TOKEN=... node docs/wordpress/run-cloudflare-dns-gmail-migrate.mjs
 *
 * Opcional DKIM (após gerar no Admin → Gmail → Autenticar e-mails):
 *   --dkim-selector google --dkim-value "v=DKIM1; k=rsa; p=...."
 */
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '44a7c31ca337648abef38dea0c599e79';
const DOMAIN = 'aerosuite.com.br';
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const DRY = process.argv.includes('--dry-run');

function arg(name, fallback = '') {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const dkimSelector = arg('dkim-selector', 'google');
const dkimValue = arg('dkim-value', '');

// Wizard Workspace 2024+ (mx/codes): um único MX SMTP.GOOGLE.COM prioridade 1.
const GOOGLE_MX = [{ priority: 1, content: 'SMTP.GOOGLE.COM' }];

const SPF_GOOGLE = 'v=spf1 include:_spf.google.com ~all';
const DMARC = 'v=DMARC1; p=quarantine; rua=mailto:contato@aerosuite.com.br; pct=100; adkim=r; aspf=r';

const headers = {
  Authorization: `Bearer ${CF_TOKEN}`,
  'Content-Type': 'application/json',
};

async function api(path, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  const json = await res.json();
  if (!json.success) throw new Error(JSON.stringify(json.errors || json));
  return json.result;
}

async function listRecords(type, name = DOMAIN) {
  const q = new URLSearchParams({ type, name, per_page: '100' });
  return api(`/dns_records?${q}`);
}

async function deleteRecord(id) {
  if (DRY) return { id, action: 'delete(dry)' };
  await api(`/dns_records/${id}`, { method: 'DELETE' });
  return { id, action: 'deleted' };
}

async function upsertMx() {
  const existing = await listRecords('MX');
  const locaweb = existing.filter((r) => /locaweb/i.test(r.content));
  const actions = [];

  for (const r of locaweb) {
    actions.push(await deleteRecord(r.id));
  }

  for (const mx of GOOGLE_MX) {
    const hit = existing.find((r) => r.type === 'MX' && r.content === mx.content);
    if (hit) {
      actions.push({ id: hit.id, action: 'mx-exists', content: mx.content });
      continue;
    }
    if (DRY) {
      actions.push({ action: 'create-mx(dry)', ...mx });
      continue;
    }
    const created = await api('/dns_records', {
      method: 'POST',
      body: JSON.stringify({
        type: 'MX',
        name: DOMAIN,
        content: mx.content,
        priority: mx.priority,
        ttl: 3600,
      }),
    });
    actions.push({ id: created.id, action: 'created-mx', content: mx.content, priority: mx.priority });
  }
  return actions;
}

async function replaceTxt(name, matcher, content) {
  const existing = await listRecords('TXT', name);
  const old = existing.filter((r) => matcher(r.content));
  const actions = [];
  for (const r of old) {
    if (r.content === content) continue;
    actions.push(await deleteRecord(r.id));
  }
  const has = existing.some((r) => r.content === content);
  if (has) {
    actions.push({ action: 'txt-exists', name, content });
    return actions;
  }
  if (DRY) {
    actions.push({ action: 'create-txt(dry)', name, content });
    return actions;
  }
  const created = await api('/dns_records', {
    method: 'POST',
    body: JSON.stringify({ type: 'TXT', name, content, ttl: 3600 }),
  });
  actions.push({ id: created.id, action: 'created-txt', name, content });
  return actions;
}

async function main() {
  if (!CF_TOKEN && !DRY) {
    console.error('Defina CLOUDFLARE_API_TOKEN ou use --dry-run');
    process.exit(1);
  }

  const report = { domain: DOMAIN, dryRun: DRY, actions: [] };

  if (DRY && !CF_TOKEN) {
    report.actions.push({
      step: 'mx',
      items: GOOGLE_MX.map((mx) => ({ action: 'create-mx(dry)', ...mx })),
    });
    report.actions.push({ step: 'spf', items: [{ action: 'create-txt(dry)', name: DOMAIN, content: SPF_GOOGLE }] });
    report.actions.push({
      step: 'dmarc',
      items: [{ action: 'create-txt(dry)', name: `_dmarc.${DOMAIN}`, content: DMARC }],
    });
    report.dkimNote =
      'DKIM omitido. Após ativar Gmail (24–72h), gere em Admin → Apps → Gmail → Autenticar e-mails e rode com --dkim-value.';
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  report.actions.push({ step: 'mx', items: await upsertMx() });
  report.actions.push({
    step: 'spf',
    items: await replaceTxt(DOMAIN, (c) => /^v=spf1/i.test(c), SPF_GOOGLE),
  });
  report.actions.push({
    step: 'dmarc',
    items: await replaceTxt(`_dmarc.${DOMAIN}`, (c) => /^v=DMARC1/i.test(c), DMARC),
  });

  if (dkimValue) {
    report.actions.push({
      step: 'dkim',
      items: await replaceTxt(`${dkimSelector}._domainkey.${DOMAIN}`, (c) => /^v=DKIM1/i.test(c), dkimValue),
    });
  } else {
    report.dkimNote =
      'DKIM omitido. Após ativar Gmail (24–72h), gere em Admin → Apps → Gmail → Autenticar e-mails e rode com --dkim-value.';
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
