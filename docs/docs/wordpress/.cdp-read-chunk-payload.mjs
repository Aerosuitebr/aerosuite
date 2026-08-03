import fs from 'fs';
const i = process.argv[2];
const viewId = process.argv[3];
const p = JSON.parse(fs.readFileSync(`.cdp-chunk-payload-${i}.json`, 'utf8'));
if (viewId) p.viewId = viewId;
process.stdout.write(JSON.stringify({ method: p.method, params: p.params, viewId: p.viewId }));
