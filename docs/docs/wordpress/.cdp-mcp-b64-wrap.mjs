/**
 * Build compact browser_cdp args: decode+eval exact expression from call file.
 * Usage: node .cdp-mcp-b64-wrap.mjs <n|chunk-file> [viewId]
 */
import fs from 'fs';

const arg = process.argv[2];
const viewId = process.argv[3] || 'f20479';
let expression;
if (arg.includes('-')) {
  const j = JSON.parse(fs.readFileSync(`.cdp-chunk-${arg}-mcp-args.json`, 'utf8'));
  expression = j.params.expression;
} else {
  const j = JSON.parse(fs.readFileSync(`.cdp-call-${arg}.json`, 'utf8'));
  expression = j.params.expression;
}
const b64 = Buffer.from(expression, 'utf8').toString('base64');
const wrapper = `(async()=>{const e=atob('${b64}');return await eval(e);})()`;
const out = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: wrapper, awaitPromise: true, returnByValue: true },
};
const file = arg.includes('-') ? `.cdp-mcp-b64-${arg}.json` : `.cdp-mcp-b64-step-${arg}.json`;
fs.writeFileSync(file, JSON.stringify(out));
console.log(JSON.stringify({ file, wrapperLen: wrapper.length, origLen: expression.length }));
