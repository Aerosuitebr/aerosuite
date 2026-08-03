import fs from 'fs';
const expected = Buffer.from(fs.readFileSync('aerosuite-premium.css', 'utf8')).toString('base64');
const parts = [];
for (let i = 0; i <= 19; i++) {
  let found = 0;
  for (let s = 0; s <= 3; s++) {
    const p = `.cdp-step-${s}.mcp-ready.json`;
    if (!fs.existsSync(p)) continue;
    const expr = JSON.parse(fs.readFileSync(p, 'utf8')).params.expression;
    const re = new RegExp(`__cssParts\\[${i}\\]="([^"]*)"`, 'g');
    let m;
    while ((m = re.exec(expr))) {
      parts[i] = m[1];
      found++;
    }
  }
  if (!found) console.log('missing part', i);
}
const joined = parts.join('');
console.log(
  JSON.stringify({
    expectedLen: expected.length,
    joinedLen: joined.length,
    delta: joined.length - expected.length,
    match: joined === expected,
  })
);
if (joined !== expected) {
  for (let i = 0; i < 20; i++) {
    const expPart = expected.slice(
      parts.slice(0, i).join('').length,
      parts.slice(0, i + 1).join('').length
    );
    if (parts[i] !== expPart) {
      console.log('diff at part', i, 'got', parts[i]?.length, 'exp', expPart?.length);
      if (parts[i] && expPart && parts[i].length === expPart.length) {
        for (let j = 0; j < parts[i].length; j++) {
          if (parts[i][j] !== expPart[j]) {
            console.log('  char', j, parts[i].slice(j, j + 20), 'vs', expPart.slice(j, j + 20));
            break;
          }
        }
      }
      break;
    }
  }
}
