import fs from 'fs';

const bodies = [];
for (let n = 0; n <= 3; n++) {
  bodies.push(fs.readFileSync(`.cdp-body-${n}.js`, 'utf8'));
}
const combined =
  '(async()=>{window.__cssParts=[];' +
  bodies.join('') +
  'window.__cssb64=(window.__cssParts||[]).join("");window.__cssParts=null;return{len:window.__cssb64.length,ok:window.__cssb64.length===34708,rebuilt:true,parts:window.__cssb64?undefined:0};})()';
fs.writeFileSync(
  '.cdp-combined-0-3-check.json',
  JSON.stringify({
    viewId: '06e2fc',
    method: 'Runtime.evaluate',
    params: { expression: combined, awaitPromise: true, returnByValue: true },
  })
);
console.log('len', combined.length);
