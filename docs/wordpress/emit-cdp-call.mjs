import fs from 'fs';
const n = process.argv[2];
const viewId = process.argv[3] || '041fe0';
const a = JSON.parse(fs.readFileSync(`.cdp-step-${n}.call.json`, 'utf8'));
a.viewId = viewId;
process.stdout.write(JSON.stringify(a));
