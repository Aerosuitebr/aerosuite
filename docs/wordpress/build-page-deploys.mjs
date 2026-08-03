import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const p = JSON.parse(fs.readFileSync(path.join(dir, 'pages-data.json'), 'utf8'));
const hero = 'https://aerosuite.com.br/wp-content/uploads/2026/06/Pictureandletter.png';

const pages = {
  '21-home': p.home.replace(/\{\{HERO_LOGO\}\}/g, hero).replace(/\{\{MARK_LOGO\}\}/g, hero),
  '20-sol': p.solucoes,
  '16-sobre': p.sobre.replace(/\{\{MARK_LOGO\}\}/g, hero),
  '18-cont': p.contato,
};

for (const [key, content] of Object.entries(pages)) {
  const [id, label] = key.split('-');
  const data = { content, status: 'publish' };
  if (id === '20') data.title = 'Soluções';
  const ex = `(async () => {
    await wp.apiFetch({ path: '/wp/v2/pages/${id}', method: 'POST', data: ${JSON.stringify(data)} });
    return { ok: true, page: '${label}' };
  })()`;
  fs.writeFileSync(path.join(dir, `deploy-page-${id}.js`), ex);
  console.log(id, ex.length);
}
