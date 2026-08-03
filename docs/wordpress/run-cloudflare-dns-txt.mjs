/**
 * Adiciona registro TXT no Cloudflare (ex.: verificação Google Workspace).
 * Uso:
 *   CLOUDFLARE_API_TOKEN=... node run-cloudflare-dns-txt.mjs \
 *     --name aerosuite.com.br \
 *     --content "google-site-verification=TOKEN"
 */
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '44a7c31ca337648abef38dea0c599e79';
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

function arg(name, fallback = '') {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const name = arg('name', 'aerosuite.com.br');
const content = arg('content', '');

if (!CF_TOKEN) {
  console.error('Defina CLOUDFLARE_API_TOKEN (permissão Zone.DNS Edit).');
  process.exit(1);
}
if (!content) {
  console.error('Passe --content "google-site-verification=..."');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${CF_TOKEN}`,
  'Content-Type': 'application/json',
};

const listUrl = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=TXT&name=${encodeURIComponent(name)}`;
const listRes = await fetch(listUrl, { headers });
const listJson = await listRes.json();
if (!listJson.success) {
  console.error('List failed:', listJson.errors);
  process.exit(1);
}

const existing = (listJson.result || []).find((r) => r.content === content);
if (existing) {
  console.log(JSON.stringify({ ok: true, action: 'exists', id: existing.id, name, content }, null, 2));
  process.exit(0);
}

const createRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ type: 'TXT', name, content, ttl: 3600 }),
});
const createJson = await createRes.json();
if (!createJson.success) {
  console.error('Create failed:', createJson.errors);
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, action: 'created', id: createJson.result.id, name, content }, null, 2));
