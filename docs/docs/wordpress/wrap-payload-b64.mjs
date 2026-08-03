/**
 * Wrap .mcp-payload-N expression in atob eval for safer MCP JSON transport.
 * Usage: node wrap-payload-b64.mjs <index> [viewId] [outFile]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const idx = Number(process.argv[2]);
const viewId = process.argv[3] || 'f29abe';
const outFile = process.argv[4] || path.join(dir, '.mcp-cdp-args-only.json');

const p = path.join(dir, `.mcp-payload-${idx}.json`);
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
const inner = j.arguments?.params?.expression ?? j.params?.expression;
const b64 = Buffer.from(inner, 'utf8').toString('base64');
const wrapper = `(async()=>{const e=atob('${b64}');return await eval(e);})()`;
const args = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: wrapper, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync(outFile, JSON.stringify(args));
console.log(JSON.stringify({ idx, viewId, origLen: inner.length, wrapperLen: wrapper.length, outFile }));
