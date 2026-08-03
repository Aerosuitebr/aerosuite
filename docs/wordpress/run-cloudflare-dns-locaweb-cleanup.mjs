/**
 * Remove registros DNS obsoletos da Locaweb (pós-migração Gmail).
 * Mantém _domainconnect (Cloudflare) e registros Google/MX atuais.
 *
 * Uso:
 *   node run-cloudflare-dns-locaweb-cleanup.mjs --dry-run
 *   CLOUDFLARE_API_TOKEN=... node run-cloudflare-dns-locaweb-cleanup.mjs
 */
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '44a7c31ca337648abef38dea0c599e79';
const DOMAIN = 'aerosuite.com.br';
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const DRY = process.argv.includes('--dry-run');

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

function isLocawebObsolete(record) {
  const blob = JSON.stringify(record).toLowerCase();
  if (/locaweb|email-ssl\.com\.br|smtplw/i.test(blob)) return true;
  if (record.type === 'SRV' && /autodiscover/i.test(record.name) && /locaweb/i.test(record.data?.target || record.content || '')) {
    return true;
  }
  for (const host of ['pop', 'imap', 'smtp', 'webmail']) {
    if (record.name === `${host}.${DOMAIN}` || record.name === host) return true;
  }
  if (record.type === 'TXT' && /^email-locaweb=/i.test(record.content)) return true;
  if (record.name === `_domainconnect.${DOMAIN}` || record.name === '_domainconnect') {
    const target = String(record.content || record.data?.target || '').toLowerCase();
    if (/locaweb/i.test(target)) return true;
  }
  return false;
}

async function main() {
  if (!CF_TOKEN && !DRY) {
    console.log(
      JSON.stringify({
        ok: false,
        skipped: true,
        reason: 'CLOUDFLARE_API_TOKEN ausente',
        manual: [
          'Remover no painel DNS: pop, imap, smtp, webmail, email-locaweb (TXT), _autodiscover._tcp SRV Locaweb',
          'Remover _domainconnect CNAME → domainconnect.locaweb.com.br (manter TXT _domainconnect do Cloudflare)',
        ],
      }, null, 2)
    );
    process.exit(0);
  }

  const all = await api(`/dns_records?per_page=100`);
  const targets = all.filter(isLocawebObsolete);
  const actions = [];

  for (const r of targets) {
    if (DRY) {
      actions.push({ id: r.id, action: 'delete(dry)', type: r.type, name: r.name, content: r.content });
      continue;
    }
    await api(`/dns_records/${r.id}`, { method: 'DELETE' });
    actions.push({ id: r.id, action: 'deleted', type: r.type, name: r.name, content: r.content });
  }

  const result = { ok: true, dryRun: DRY, removed: actions.length, actions };
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
