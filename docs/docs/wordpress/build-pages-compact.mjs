import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const p = JSON.parse(fs.readFileSync(path.join(dir, 'pages-data.json'), 'utf8'));
const hero = 'https://aerosuite.com.br/wp-content/uploads/2026/06/Pictureandletter.png';
const home = p.home.replace(/\{\{HERO_LOGO\}\}/g, hero).replace(/\{\{MARK_LOGO\}\}/g, hero);
const sobre = p.sobre.replace(/\{\{MARK_LOGO\}\}/g, hero);

const ex = `(async () => {
  await wp.apiFetch({ path: '/wp/v2/pages/21', method: 'POST', data: { content: ${JSON.stringify(home)}, status: 'publish' } });
  await wp.apiFetch({ path: '/wp/v2/pages/20', method: 'POST', data: { content: ${JSON.stringify(p.solucoes)}, title: 'Soluções', status: 'publish' } });
  await wp.apiFetch({ path: '/wp/v2/pages/16', method: 'POST', data: { content: ${JSON.stringify(sobre)}, status: 'publish' } });
  await wp.apiFetch({ path: '/wp/v2/pages/18', method: 'POST', data: { content: ${JSON.stringify(p.contato)}, status: 'publish' } });
  return { ok: true, hero: ${JSON.stringify(hero)} };
})()`;

fs.writeFileSync(path.join(dir, 'deploy-pages-compact.js'), ex);
console.log('size', ex.length);
