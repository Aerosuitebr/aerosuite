import fs from 'fs';
const i = Number(process.argv[2]);
const j = JSON.parse(fs.readFileSync(`.cdp-up-${i}.json`, 'utf8'));
fs.writeFileSync('.cdp-mcp-invoke-now.json', JSON.stringify(j));
console.log(JSON.stringify({ i, exprLen: j.params?.expression?.length ?? 0 }));
