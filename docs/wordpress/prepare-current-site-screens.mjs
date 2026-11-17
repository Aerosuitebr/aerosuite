import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const mapFile = process.argv[2];
const names = ['dashboard', 'os-list', 'estoque-itens', 'propostas-comerciais', 'conformidade-painel', 'fluxo-etapas', 'central-bipagem', 'gestao-estacoes', 'editor-etapas'];
const media = mapFile
  ? JSON.parse(await readFile(mapFile, 'utf8'))
  : Object.fromEntries(names.map(name => [name, `screenshots/current-2026-11-08/${name}.jpg`]));
for (const name of names) {
  if (typeof media[name] !== 'string' || !media[name]) throw new Error(`Imagem ausente: ${name}`);
}

let html = await readFile(join(dir, 'home-before-current-screens-2026-11-08.html'), 'utf8');
let feature = await readFile(join(dir, 'snippets/fluxo-os-destaque.html'), 'utf8');
const replacements = {
  'dashboard-web-6.webp': 'dashboard',
  'os-list-web-6.webp': 'os-list',
  'estoque-fifo-web-7.webp': 'estoque-itens',
  'propostas-comerciais-web-6.webp': 'propostas-comerciais',
  'conformidade-painel-web-5.webp': 'conformidade-painel',
  'portal-cliente-web-5.webp': 'fluxo-etapas',
};
for (const [old, key] of Object.entries(replacements)) {
  html = html.replaceAll(`https://aerosuite.com.br/wp-content/uploads/2026/06/${old}`, media[key]);
}
html = html.replace(/<img\b[^>]*>/g, img => {
  const name = names.find(key => img.includes(`src="${media[key]}"`));
  if (!name) return img;
  return img.replace(/width="\d+"/, 'width="1440"')
    .replace(/height="\d+"/, `height="${name === 'dashboard' ? 620 : 1000}"`)
    .replace(/sizes="[^"]*"/, 'sizes="(max-width:768px) 100vw, 1280px"');
});
html = html.replace('>05</span>Portal do cliente</button>', '>05</span>Etapas da OS</button>');
html = html.replace('alt="Transparência sem interromper o hangar"', 'alt="Painel atual do fluxo de etapas da OS"');
html = html.replace('<strong>Transparência sem interromper o hangar</strong><span>O cliente acompanha o que foi autorizado para sua visualização.</span>', '<strong>Fluxo de etapas da OS</strong><span>Acompanhe filas, permanência e vazão de cada etapa da oficina.</span>');
html = html.replace('OS e estoque conectados</li>', 'OS, etapas e bipagem conectadas</li>');
html = html.replaceAll('>app.aerosuite.com.br<', '>prod.aerosuite.com.br<');
html = html.replace('class="as-home-cover__secondary" href="#tour-interativo">Explorar a plataforma ↓', 'class="as-home-cover__secondary" href="#fluxo-os-home">Conhecer etapas e bipagem ↓');
for (const [token, key] of Object.entries({ FLUXO_ETAPAS: 'fluxo-etapas', EDITOR_ETAPAS: 'editor-etapas', CENTRAL_BIPAGEM: 'central-bipagem', GESTAO_ESTACOES: 'gestao-estacoes' })) {
  feature = feature.replaceAll(`{{${token}}}`, media[key]);
}
const insertion = html.indexOf('<!-- wp:html -->\n<section class="as-product-tour');
if (insertion < 0) throw new Error('Posição do tour não encontrada; preservar a página e revisar manualmente.');
html = html.slice(0, insertion) + feature + '\n' + html.slice(insertion);
if (/\{\{(?:FLUXO|EDITOR|CENTRAL|GESTAO)/.test(html)) throw new Error('Placeholder não resolvido.');
await writeFile(join(dir, 'home-current-screens-2026-11-08.html'), html);

const gallery = names.map(name => `<figure><img src="${media[name]}" alt="${name}" loading="lazy"><figcaption>${name}</figcaption></figure>`).join('\n');
const preview = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aero Suite — revisão das capturas atuais</title><style>body{margin:0;background:#f4f6fa;font-family:Arial,sans-serif}h1{margin:2rem;color:#10273e}.gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;padding:2rem}figure{margin:0;background:white;border:1px solid #ccdce8;border-radius:12px;overflow:hidden}img{display:block;width:100%;height:auto}figcaption{padding:1rem;font-weight:700;color:#10273e}@media(max-width:800px){.gallery{grid-template-columns:1fr}}.as-inline-conversion__cta{display:inline-block;background:#edc463;padding:1rem;border-radius:12px;text-decoration:none;color:#07182c}</style><body class="home"><h1>Capturas da versão local atual — 08/11/2026</h1><div class="gallery">${gallery}</div>${feature}</body></html>`;
await writeFile(join(dir, 'current-screens-preview.html'), preview);
console.log(JSON.stringify({ output: 'home-current-screens-2026-11-08.html', images: names.length, source: 'http://localhost:8081', deployed: false }));
