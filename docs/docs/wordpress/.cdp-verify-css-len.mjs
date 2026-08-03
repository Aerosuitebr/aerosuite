import fs from 'fs';
let t = 0;
for (let i = 0; i <= 19; i++) {
  const p = JSON.parse(fs.readFileSync(`.cdp-mcp-payload-${i}.json`, 'utf8'));
  const e = p.params.expression;
  const re = /__cssParts\[(\d+)\]="([^"]*)"/g;
  let m;
  while ((m = re.exec(e)) !== null) t += m[2].length;
}
console.log(JSON.stringify({ sum: t, expected: 34708, ok: t === 34708 }));
