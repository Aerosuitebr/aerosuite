import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const stepList = [
  { name: 'css-q1', file: '.mcp-step-css-q1.json', nested: true },
  { name: 'css-q2', file: '.params-css-q2.json' },
  { name: 'css-q3', file: '.params-css-q3.json' },
  { name: 'css-q4', file: '.params-css-q4.json' },
  { name: 'css-verify', file: '.params-css-verify.json', key: 'cssVerify' },
  { name: 'css-finalize', file: '.params-css-finalize.json', key: 'cssFinalize' },
  { name: 'enc-init', file: '.params-enc-init.json' },
  { name: 'enc-0', file: '.params-enc-0.json' },
  { name: 'enc-1', file: '.params-enc-1.json' },
  { name: 'enc-2', file: '.params-enc-2.json' },
  { name: 'enc-3', file: '.params-enc-3.json' },
  { name: 'enc-run', file: '.params-enc-run.json', key: 'encRun' },
];

function loadBody(step) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, step.file), 'utf8'));
  const params = step.nested ? raw.params : raw;
  const m = params.expression.match(/^\(async\(\)=>\{(.*)\}\)\(\)$/s);
  if (!m) throw new Error(`bad expression ${step.name}`);
  return m[1];
}

const parts = stepList.map((s) => {
  const body = loadBody(s);
  return `try{const __r=await (async()=>{${body}})();__steps['${s.name}']=__r;${s.key ? `__out['${s.key}']=__r;` : ''}}catch(e){__errors.push({step:'${s.name}',message:String(e&&(e.message||e))});throw e;}`;
});

const combined = `(async()=>{const __steps={};const __out={};const __errors=[];${parts.join('')}return{...__out,steps:__steps,errors:__errors};})()`;

const payload = {
  method: 'Runtime.evaluate',
  params: { expression: combined, awaitPromise: true, returnByValue: true },
  viewId: process.argv[2] || '9a6000',
};
fs.writeFileSync(path.join(dir, '.cdp-combined-payload.json'), JSON.stringify(payload));
console.log(JSON.stringify({ exprLen: combined.length, steps: stepList.length }));
