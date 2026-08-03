import fs from 'fs';
let total = 0;
for (const s of ['enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-4']) {
  const e = JSON.parse(fs.readFileSync(`.invoke-${s}.json`, 'utf8')).expression;
  const m = e.match(/\+\"([^\"]+)\"/);
  const chunk = m ? m[1].length : 0;
  total += chunk;
  console.log(s, chunk, 'total', total);
}
