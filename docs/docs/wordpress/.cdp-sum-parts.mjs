import fs from 'fs';
let t = 0;
for (let i = 0; i <= 19; i++) {
  const p = JSON.parse(fs.readFileSync(`.cdp-step-${i}.mcp-ready.json`, 'utf8'));
  const m = p.params.expression.match(/__cssParts\[\d+\]="([^"]*)"/);
  if (m) t += m[1].length;
  else console.log('missing', i);
}
console.log(JSON.stringify({ sum: t, expected: 34708, delta: 34708 - t }));
