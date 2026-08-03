import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'a9930e';
const steps = [
  'css-q3', 'css-q4', 'css-verify', 'css-finalize',
  'enc-init', 'enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run',
];
const map = {
  'css-q1': { file: '.mcp-step-css-q1.json', nested: true },
  'css-q2': { file: '.params-css-q2.json' },
  'css-q3': { file: '.params-css-q3.json' },
  'css-q4': { file: '.params-css-q4.json' },
  'css-verify': { file: '.params-css-verify.json' },
  'css-finalize': { file: '.params-css-finalize.json' },
  'enc-init': { file: '.params-enc-init.json' },
  'enc-0': { file: '.params-enc-0.json' },
  'enc-1': { file: '.params-enc-1.json' },
  'enc-2': { file: '.params-enc-2.json' },
  'enc-3': { file: '.params-enc-3.json' },
  'enc-run': { file: '.params-enc-run.json' },
};

function b64Wrap(inner) {
  const b64 = Buffer.from(inner, 'utf8').toString('base64');
  const chunkSize = 2000;
  const chunks = [];
  for (let i = 0; i < b64.length; i += chunkSize) chunks.push(b64.slice(i, i + chunkSize));
  return `(async()=>{const b64=${JSON.stringify(chunks)}.join('');const src=atob(b64);return await eval(src);})()`;
}

const payloads = steps.map((name) => {
  const cfg = map[name];
  const raw = JSON.parse(fs.readFileSync(path.join(dir, cfg.file), 'utf8'));
  const inner = cfg.nested ? raw.params.expression : raw.expression;
  return {
    name,
    payload: {
      method: 'Runtime.evaluate',
      params: { expression: b64Wrap(inner), awaitPromise: true, returnByValue: true },
      viewId,
    },
  };
});
fs.writeFileSync(path.join(dir, '.cdp-all-payloads.json'), JSON.stringify(payloads, null, 2));
console.log('payloads', payloads.length);
