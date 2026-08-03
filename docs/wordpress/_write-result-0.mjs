import fs from 'fs';
const r = { result: { type: 'object', value: { batch: 0, from: 0, to: 4 } } };
fs.writeFileSync('.cdp-step-result-0.json', JSON.stringify(r));
