/**
 * Sanitização de telas antes de capturas de marketing.
 * Exportado para recapture + validação pré-deploy.
 */

export const FORBIDDEN_PATTERNS = [
  /quick\s*mnt/i,
  /axial\s*aviation/i,
  /voar\s*t/i,
  /grupo\s*farroupil/i,
  /\bfarroupil\b/i,
  /common\.actions/i,
  /cliente\s+smoke/i,
  /servi[cç]o\s+smoke/i,
  /\bCONTENCAO\b/,
  /\bVERIFICACAO\b/,
  /gerar\s+os/i,
  /t\?\?xi/i,
  /a\?\?re/i,
];

/** @param {import('playwright-core').Page} page */
export async function sanitizePageForMarketing(page) {
  await page.evaluate(() => {
    const replacements = [
      [/grupo\s*farroupil/gi, 'Operação Demo MRO'],
      [/farroupil/gi, 'Demo MRO'],
      [/quick\s*mnt\s*anv\s*ltda?/gi, 'Cliente Demo 02'],
      [/axial\s*aviation/gi, 'Cliente Demo 03'],
      [/voar\s*t\?\?xi\s*a\?\?re[^\s]*/gi, 'Cliente Demo 04'],
      [/voar\s*t[aá]xi\s*a[eé]re[^\s]*/gi, 'Cliente Demo 04'],
      [/smoke\s*aviation/gi, 'Cliente Demo Aviação'],
      [/\bsmoke\b/gi, 'Demo'],
      [/king\s*do\s*rio/gi, 'Distribuidora Demo'],
      [/bellows/gi, 'Oficina Demo'],
      [/servi[cç]o(?!\s+aeron)/gi, 'Serviço'],
      [/conten[cç][aã]o/gi, 'Contenção'],
      [/verifica[cç][aã]o/gi, 'Verificação'],
      [/gerar\s+os/gi, 'demo operacional'],
      [/common\.actions\.\w+/g, ''],
      [/\bCONTENCAO\b/g, 'Contenção'],
      [/\bVERIFICACAO\b/g, 'Verificação'],
      [/\bREGISTRO\b/g, 'Registro'],
    ];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      let text = node.nodeValue || '';
      replacements.forEach(([pattern, value]) => {
        text = text.replace(pattern, value);
      });
      if (text !== node.nodeValue) node.nodeValue = text;
    });

    document.querySelectorAll('button, .p-button-label, label, span.p-tag, .p-tag').forEach((el) => {
      const t = (el.textContent || '').trim();
      if (/^common\.actions\./.test(t)) el.textContent = 'Atualizar';
      if (t === 'CONTENCAO') el.textContent = 'Contenção';
      if (t === 'VERIFICACAO') el.textContent = 'Verificação';
    });

    document
      .querySelectorAll(
        'app-os-list tbody tr td:nth-child(2), app-proposta-comercial-list tbody tr td:nth-child(2)'
      )
      .forEach((td, i) => {
        const v = (td.textContent || '').trim();
        if (/quick|axial|voar|smoke|farroupil|gerar/i.test(v)) {
          td.textContent = `Cliente Demo ${String(i + 1).padStart(2, '0')}`;
        }
      });
  });
}

/** @param {import('playwright-core').Page} page */
export async function assertMarketingClean(page, shotName = '') {
  const hits = await page.evaluate((patterns) => {
    const text = document.body?.innerText || '';
    return patterns.filter((p) => new RegExp(p, 'i').test(text));
  }, FORBIDDEN_PATTERNS.map((p) => p.source));

  if (hits.length) {
    throw new Error(
      `${shotName}: texto sensível após sanitização — ${hits.slice(0, 5).join(', ')}`
    );
  }
}
