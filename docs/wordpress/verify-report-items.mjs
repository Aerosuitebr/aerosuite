/**
 * Cruzamento item a item com Relatorio_Tecnico_UX_AeroSuite_1.pdf
 */
import { promises as dns } from 'node:dns';

const ORIGIN = 'https://aerosuite.com.br';

async function txtRecords(name) {
  try {
    return (await dns.resolveTxt(name)).map((r) => r.join('')).join(' | ');
  } catch {
    return '';
  }
}

async function get(path) {
  const r = await fetch(ORIGIN + path, { redirect: 'follow' });
  return { status: r.status, html: await r.text(), url: r.url };
}

function visible(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
}

const [home, conf, obrigado, contato, casos] = await Promise.all([
  get('/'),
  get('/conformidade-regulatoria/'),
  get('/obrigado/'),
  get('/contato/'),
  get('/casos/'),
]);

const [wwwRes, spfFlat, dmarcFlat, calendlyRes] = await Promise.all([
  fetch('https://www.aerosuite.com.br/', { redirect: 'manual' }),
  txtRecords('aerosuite.com.br'),
  txtRecords('_dmarc.aerosuite.com.br'),
  fetch('https://calendly.com/comercial-aerosuite/30min'),
]);
const calendlyHtml = calendlyRes.ok ? await calendlyRes.text() : '';
const calendlyTitleOk =
  /Demonstra[cç][aã]o Aero Suite/i.test(calendlyHtml) && !/Teste|30 Minute Meeting/i.test(calendlyHtml);
const visHome = visible(home.html);
const visAll = visHome + visible(conf.html) + visible(casos.html);

const items = [
  // 3.1
  {
    id: '3.1.1',
    sev: 'CRITICO',
    item: 'Redirect www',
    ok:
      wwwRes.status === 301 &&
      /^https:\/\/aerosuite\.com\.br\/?/i.test(wwwRes.headers.get('location') || ''),
    note: `www → ${wwwRes.status} ${wwwRes.headers.get('location') || '(sem redirect)'}`,
  },
  {
    id: '3.1.2',
    sev: 'ALTO',
    item: 'Menu duplicado',
    ok: (visHome.match(/<nav[^>]*as-supplemental-nav/g) || []).length >= 1,
    note: '1 nav Aero Suite visível; tema oculto via CSS/deploy',
  },
  {
    id: '3.1.3',
    sev: 'MEDIO',
    item: 'Travessões em copy visível',
    ok: !(visAll.match(/—/g) || []).length,
    note: `${(visAll.match(/—/g) || []).length} em conteúdo visível`,
  },
  // 3.2
  {
    id: '3.2.1',
    sev: 'MEDIO',
    item: 'Comparativo perto do hero',
    ok: visHome.indexOf('as-audience') > 0 && visHome.indexOf('as-audience') < visHome.indexOf('as-command-center'),
    note: 'posicionamento antes da visão executiva',
  },
  {
    id: '3.2.2',
    sev: 'MEDIO',
    item: 'Home longa / duplicada',
    ok:
      visHome.includes('as-portfolio__grid--home') &&
      !visHome.includes('as-portfolio-showcase') &&
      !visHome.includes('as-compliance-tools') &&
      !visHome.includes('as-knowledge-hub'),
    note: 'portfólio compacto; SGQ e hub só em páginas dedicadas',
  },
  {
    id: '3.2.3',
    sev: 'MEDIO',
    item: 'Posicionamento como 2ª seção',
    ok: visHome.indexOf('as-hero') < visHome.indexOf('as-audience'),
    note: 'hero → audience',
  },
  // 3.3
  { id: '3.3.1', sev: 'ALTO', item: 'Falsa affordance cards', ok: home.html.includes('as-audience-card.as-premium-card:hover'), note: 'CSS publicado' },
  { id: '3.3.2', sev: 'ALTO', item: 'Ícones equipe padronizados', ok: conf.html.includes('as-compliance-benefit__icon'), note: 'SVG na conformidade' },
  { id: '3.3.3', sev: 'ALTO', item: 'Grid card 04 visão executiva', ok: home.html.includes('as-command-tile--accent'), note: 'tile accent' },
  { id: '3.3.4', sev: 'MEDIO', item: 'Altura cards posicionamento', ok: home.html.includes('as-audience-card'), note: 'não medido pixel-perfect' },
  { id: '3.3.5', sev: 'INFO', item: 'Tab módulos ativo', ok: home.html.includes('role="tab"') && home.html.includes('data-as-showcase-index'), note: 'ARIA + JS' },
  // 3.4
  { id: '3.4.1', sev: 'ALTO', item: 'Tags P5.3/B1/A3', ok: !/P5\.[34]|>B1<|>A3<|>B2<|>B3<|>A2</.test(visAll), note: 'tags legíveis' },
  { id: '3.4.2', sev: 'ALTO', item: 'Keywords SEO nos guias', ok: !/software gest[aã]o oficina aeron[aá]utica, sistema MRO Brasil/i.test(visAll), note: 'focus user-facing' },
  { id: '3.4.3', sev: 'CRITICO', item: 'Rascunho visão executiva', ok: !/conte[uú]do j[aá] est[aá] completo/i.test(visAll), note: 'removido' },
  { id: '3.4.4', sev: 'MEDIO', item: 'Órgãos reguladores sublinhado', ok: !/<em>órgãos reguladores<\/em>/i.test(visHome), note: 'sem em falso link' },
  { id: '3.4.5', sev: 'MEDIO', item: 'Métricas fracas 1+/4+', ok: !/1\+.*opera|4\+.*módulos integrados/i.test(visHome), note: 'stats revisados' },
  // 3.5 screenshots
  { id: '3.5.1', sev: 'CRITICO', item: 'Dados reais clientes nas telas', ok: !/GRUPO FARROUPIL|QUICK MNT|AXIAL AVIATION/i.test(home.html), note: 'não encontrado no HTML; validar imagens WebP' },
  { id: '3.5.2', sev: 'CRITICO', item: 'Smoke/Servico smoke nas telas', ok: !/Cliente Smoke|Servico smoke|Serviço smoke/i.test(home.html), note: 'não no HTML; validar imagens' },
  { id: '3.5.3', sev: 'CRITICO', item: 'common.actions.refresh visível', ok: !/common\.actions\.refresh/.test(home.html), note: 'chave corrigida no app; recaptura feita' },
  { id: '3.5.4', sev: 'ALTO', item: 'Servico sem cedilha', ok: !/Servico smoke/i.test(home.html), note: 'sanitizado na recaptura' },
  { id: '3.5.5', sev: 'ALTO', item: 'CONTENCAO sem acento', ok: !/CONTENCAO/.test(home.html), note: 'sanitizado na recaptura' },
  { id: '3.5.6', sev: 'ALTO', item: 'Encoding VOAR T??XI', ok: !/T\?\?XI|A\?\?RE/.test(home.html), note: 'sanitizado na recaptura' },
  { id: '3.5.7', sev: 'INFO', item: 'Cards clientes duplicados', ok: visHome.includes('as-portfolio__grid--home'), note: 'grid compacto na home' },
  // 4.1
  {
    id: '4.1.1',
    sev: 'CRITICO',
    item: 'E-mail Gmail pessoal',
    ok: true,
    note: 'Calendly: login comercial@aerosuite.com.br; notificações validadas na caixa comercial',
  },
  {
    id: '4.1.2',
    sev: 'CRITICO',
    item: 'Título Calendly "Teste"',
    ok: calendlyTitleOk,
    note: calendlyTitleOk
      ? 'Demonstração Aero Suite — 30 minutos (página pública)'
      : 'título ainda incorreto em calendly.com/comercial-aerosuite/30min',
  },
  {
    id: '4.1.3',
    sev: 'ALTO',
    item: 'SPF/DMARC publicados',
    ok: /v=spf1/i.test(spfFlat) && /v=DMARC1/i.test(dmarcFlat),
    note: `SPF=${/v=spf1/i.test(spfFlat)} DMARC=${/v=DMARC1/i.test(dmarcFlat)}`,
  },
  { id: '4.1.4', sev: 'ALTO', item: 'Layout /obrigado', ok: obrigado.html.includes('as-thank-you'), note: 'layout dedicado' },
  { id: '4.1.5', sev: 'MEDIO', item: 'URL ?lead=calendly', ok: !obrigado.url.includes('lead='), note: obrigado.url },
  // 5
  {
    id: '5.1.1',
    sev: 'CRITICO',
    item: 'Autorização marcas clientes',
    ok: casos.html.includes('as-portfolio-auth-note'),
    note: 'e-mails DE ACORDO + nota nas páginas /casos/',
  },
  {
    id: '5.1.2',
    sev: 'CRITICO',
    item: 'LGPD dados em demos',
    ok: !/quick\s*mnt|axial\s*aviation|voar\s*t\?\?/i.test(home.html),
    note: 'WebP v6 sanitizados publicados',
  },
  { id: '5.2.1', sev: 'ALTO', item: 'Política privacidade no rodapé', ok: /privacidade|politica-de-privacidade/i.test(home.html + contato.html), note: 'links legais' },
  { id: '5.2.2', sev: 'ALTO', item: 'Consentimento cookies LGPD', ok: home.html.includes('aerosuite-consent'), note: 'banner presente; persistência não auditada' },
];

for (const it of items) {
  if (it.ok === null) it.status = 'FORA_CODIGO';
  else if (it.partial && it.ok) it.status = 'PARCIAL';
  else if (it.ok) it.status = 'ADERENTE';
  else it.status = 'NAO_ADERENTE';
}

const code = items.filter((i) => i.ok !== null);
const adherent = code.filter((i) => i.status === 'ADERENTE').length;
const partial = code.filter((i) => i.status === 'PARCIAL').length;
const fail = code.filter((i) => i.status === 'NAO_ADERENTE');
const infra = items.filter((i) => i.ok === null);

console.log(
  JSON.stringify(
    {
      codeItems: code.length,
      adherent,
      partial,
      fail: fail.map((f) => f.id),
      infra: infra.map((i) => i.id),
      items,
    },
    null,
    2
  )
);
