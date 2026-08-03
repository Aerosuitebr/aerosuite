import fs from 'fs';
const i = process.argv[2];
const raw = fs.readFileSync(process.argv[3] || 0, 'utf8');
const parsed = JSON.parse(raw);
const result = parsed.result ?? parsed;
fs.writeFileSync(`.cdp-chunk-resp-${i}.json`, JSON.stringify({ result }));
