import fs from 'fs';

const input = process.argv[2] ?? 'frontend/src/app/core/page-help.service.ts';
let src = fs.readFileSync(input, 'utf8');
if (src.charCodeAt(0) === 0xfeff) src = src.slice(1);

function unescape(s) {
  return s.replace(/\\'/g, "'");
}

function extractStrings(arrayBody) {
  const items = [];
  const re = /'((?:\\'|[^'])*)'/g;
  let m;
  while ((m = re.exec(arrayBody)) !== null) {
    items.push(unescape(m[1]));
  }
  return items;
}

const routes = [];
const marker = 'this.helpContent.set(';
let pos = 0;
while (true) {
  const start = src.indexOf(marker, pos);
  if (start < 0) break;
  const routeStart = start + marker.length + 1;
  const routeEnd = src.indexOf("',", routeStart);
  if (routeEnd < 0) break;
  const route = src.slice(routeStart, routeEnd);
  const blockStart = routeEnd + 2;
  const blockEnd = src.indexOf('\n    });', blockStart);
  if (blockEnd < 0) break;
  const block = src.slice(blockStart, blockEnd);

  const titleM = block.match(/title:\s*'((?:\\'|[^'])*)'/);
  const title = titleM ? unescape(titleM[1]) : '';

  const sections = [];
  const secRe =
    /title:\s*'((?:\\'|[^'])*)',\s*\n\s*icon:\s*'([^']*)',\s*\n\s*content:\s*\[([\s\S]*?)\n\s*\]/g;
  let sm;
  while ((sm = secRe.exec(block)) !== null) {
    sections.push({
      title: unescape(sm[1]),
      icon: sm[2],
      content: extractStrings(sm[3]),
    });
  }

  routes.push({ route, title, sections });
  pos = blockEnd + 1;
}

function slug(route) {
  const s = route.replace(/^\//, '').replace(/\//g, '-');
  return s || 'home';
}

const keys = {};
const defs = [];
for (const r of routes) {
  const s = slug(r.route);
  const titleKey = `pageHelp.${s}.title`;
  keys[titleKey] = r.title;
  const secDefs = [];
  r.sections.forEach((sec, si) => {
    const stKey = `pageHelp.${s}.s${si}.title`;
    keys[stKey] = sec.title;
    const cKeys = sec.content.map((c, ci) => {
      const ck = `pageHelp.${s}.s${si}.c${ci}`;
      keys[ck] = c;
      return ck;
    });
    secDefs.push({ titleKey: stKey, icon: sec.icon, contentKeys: cKeys });
  });
  defs.push({ route: r.route, titleKey, sections: secDefs });
}

const out = 'frontend/src/app/core/i18n/.page-help-keys.json';
fs.writeFileSync(out, JSON.stringify({ keys, defs }, null, 2));
console.log(`routes=${routes.length} keys=${Object.keys(keys).length} -> ${out}`);
