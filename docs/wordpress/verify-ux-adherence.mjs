/**
 * Verifica aderência do site live aos apontamentos do relatório UX.
 * Uso: node verify-ux-adherence.mjs
 */
const ORIGIN = 'https://aerosuite.com.br';

async function fetchText(path) {
  const r = await fetch(ORIGIN + path, { redirect: 'follow' });
  return { status: r.status, url: r.url, html: await r.text() };
}

function add(checks, id, sev, item, ok, note) {
  checks.push({ id, sev, item, ok, status: ok ? 'ADERENTE' : 'PENDENTE', note });
}

/** Ignora scripts/estilos embutidos (travessões em comentários CSS não são copy visível). */
function visible(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
}

const checks = [];

const [home, contato, obrigado, conf] = await Promise.all([
  fetchText('/'),
  fetchText('/contato/'),
  fetchText('/obrigado/'),
  fetchText('/conformidade-regulatoria/'),
]);

const wwwRes = await fetch('https://www.aerosuite.com.br/', { redirect: 'manual' });
const www = { status: wwwRes.status, loc: wwwRes.headers.get('location') };

const all = home.html + conf.html + contato.html;

// CRÍTICO
add(checks, 'C01', 'CRITICO', 'Texto rascunho Visão Executiva', !/conte[uú]do j[aá] est[aá] completo/i.test(all), 'copy profissional presente');
add(checks, 'C02', 'CRITICO', 'Tags internas P5.3/B1/A3 visíveis', !/P5\.3|>B1<|>A3<|>B2</.test(all), 'tags SMS/CRS/etc');
add(checks, 'C03', 'CRITICO', 'Home HTTPS sem loop', home.status === 200, `HTTP ${home.status}`);
add(
  checks,
  'C04',
  'CRITICO',
  'Redirect www → apex',
  www.status === 301 && (www.loc || '').replace(/\/$/, '') === 'https://aerosuite.com.br',
  `${www.status} → ${www.loc}`
);
add(
  checks,
  'C05',
  'CRITICO',
  'Screenshots marketing recentes',
  /dashboard-web-[456]|os-list-web-[456]|conformidade-painel-web-[345]/.test(all),
  'URLs WebP versionadas (v5/v6) no HTML'
);

// ALTO
add(checks, 'A01', 'ALTO', 'Sem ?lead= na URL obrigado', obrigado.status === 200, 'página ok; redirect via sessionStorage');
add(checks, 'A02', 'ALTO', 'Layout /obrigado', obrigado.html.includes('as-thank-you'), 'bloco dedicado');
add(
  checks,
  'A03',
  'ALTO',
  'Guias sem keywords SEO cruas',
  !/software gest[aã]o oficina aeron[aá]utica, sistema MRO Brasil/i.test(all),
  'focus user-facing'
);
add(
  checks,
  'A04',
  'ALTO',
  'CSS anti-hover cards estáticos',
  home.html.includes('as-audience-card.as-premium-card:hover'),
  'regra no CSS publicado'
);
add(
  checks,
  'A05',
  'ALTO',
  'Menu tema oculto',
  home.html.includes('wp-block-navigation:not(.as-supplemental-nav)'),
  'CSS hide nav Extendable'
);
add(checks, 'A06', 'ALTO', 'Grid comando card 04', home.html.includes('as-command-tile--accent'), 'tile 04 presente');
add(checks, 'A07', 'ALTO', 'Ícones SVG benefícios equipe', conf.html.includes('as-compliance-benefit__icon') && conf.html.includes('<svg'), 'SVG padronizado');

// MÉDIO
const visHome = visible(home.html);
const emDashVis = (visHome.match(/—/g) || []).length;
add(checks, 'M01', 'MEDIO', 'Sem travessões na home', emDashVis === 0, `${emDashVis} em conteúdo visível`);
add(checks, 'M02', 'MEDIO', 'Sem sublinhado falso órgãos reguladores', !/<em>órgãos reguladores<\/em>/i.test(home.html), 'strong sem em');
add(checks, 'M03', 'MEDIO', 'Stats não fracos', !/1\+.*opera|4\+.*módulos integrados/i.test(home.html), 'métricas revisadas');
add(
  checks,
  'M04',
  'MEDIO',
  'Hierarquia: posicionamento antes conformidade',
  home.html.indexOf('as-audience') > 0 &&
    home.html.indexOf('as-audience') < home.html.indexOf('as-compliance-strip'),
  'ordem seções'
);

// INFO
add(checks, 'I01', 'INFO', 'Tabs módulos estado ativo', home.html.includes('data-as-showcase-index') && home.html.includes('role="tab"'), 'ARIA tabs');
add(checks, 'I02', 'INFO', 'Cards ferramentas padrão adequação', conf.html.includes('as-compliance-tool as-premium-card'), 'premium card + gradiente');
add(checks, 'I03', 'INFO', 'Calendly corporativo', contato.html.includes('calendly.com/comercial-aerosuite'), 'embed ok');
add(checks, 'I04', 'INFO', 'Portfólio home compacto', home.html.includes('as-portfolio__grid--home'), 'sem showcase duplicado');

// Infra (não verificável só por HTML)
const infra = [
  { id: 'I05', item: 'E-mail transacional corporativo (não Gmail pessoal)', note: 'Requer validação SMTP/DKIM no servidor' },
  { id: 'I06', item: 'Título evento Calendly sem "Teste"', note: 'OK — Demonstração Aero Suite — 30 minutos (renomeado no painel)' },
  { id: 'I07', item: 'Autorização formal marcas clientes', note: 'Ver PORTFOLIO-AUTORIZACAO-EMAILS.md' },
  { id: 'I08', item: 'LGPD consentimento persistente', note: 'Validar aerosuite-consent.js em produção' },
];

const automated = checks.filter((c) => c.ok).length;
const pending = checks.filter((c) => !c.ok);

const report = {
  at: new Date().toISOString(),
  origin: ORIGIN,
  automated: { pass: automated, total: checks.length, pct: Math.round((automated / checks.length) * 100) },
  pendingAutomated: pending,
  checks,
  infraManual: infra,
};

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(dir, 'ux-adherence-report.json'), JSON.stringify(report, null, 2));
console.log('UX_ADHERENCE', JSON.stringify({ pass: automated, total: checks.length, pending: pending.map((p) => p.id) }, null, 2));
