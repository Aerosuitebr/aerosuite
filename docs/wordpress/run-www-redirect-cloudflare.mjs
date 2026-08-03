/**
 * Cria regra Cloudflare: www.aerosuite.com.br → aerosuite.com.br (301).
 * Uso: CLOUDFLARE_API_TOKEN=... node run-www-redirect-cloudflare.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '44a7c31ca337648abef38dea0c599e79';
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const outPath = path.join(dir, 'www-redirect-result.json');
const RULE_DESC = 'Aero Suite www → apex (301)';

async function cf(pathSuffix, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}${pathSuffix}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const json = await res.json();
  return { status: res.status, json };
}

function hasWwwRule(rules) {
  return (rules || []).some(
    (r) =>
      JSON.stringify(r).includes('www.aerosuite.com.br') ||
      (r.description || '').includes(RULE_DESC)
  );
}

async function ensureDynamicRedirect() {
  const get = await cf('/rulesets/phases/http_request_dynamic_redirect/entrypoint');
  const existing = get.json?.result;
  const rules = [...(existing?.rules || [])];

  if (hasWwwRule(rules)) {
    return { ok: true, already: true, method: 'dynamic_redirect', id: existing?.id };
  }

  rules.unshift({
    expression: '(http.host eq "www.aerosuite.com.br")',
    description: RULE_DESC,
    action: 'redirect',
    action_parameters: {
      from_value: {
        target_url: {
          expression: 'concat("https://aerosuite.com.br", http.request.uri.path)',
        },
        status_code: 301,
        preserve_query_string: true,
      },
    },
  });

  const put = await cf('/rulesets/phases/http_request_dynamic_redirect/entrypoint', {
    method: 'PUT',
    body: JSON.stringify({ rules }),
  });

  return {
    ok: put.json?.success === true,
    method: 'dynamic_redirect',
    status: put.status,
    id: put.json?.result?.id,
    errors: put.json?.errors,
  };
}

async function main() {
  if (!CF_TOKEN) {
    const result = {
      ok: false,
      skipped: true,
      reason: 'CLOUDFLARE_API_TOKEN ausente',
      manual:
        'Cloudflare → aerosuite.com.br → Rules → Redirect Rules → Create: If hostname equals www.aerosuite.com.br → Dynamic → https://aerosuite.com.br${http.request.uri.path} (301)',
    };
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  const result = await ensureDynamicRedirect();
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
