/**
 * Split large Runtime.evaluate expression into chunk uploads + final eval.
 * Usage: node mcp-cdp-chunked-invoke.mjs <argsJsonFile> [chunkSize]
 * Prints JSON array of browser_cdp argument objects.
 */
import fs from 'fs';

const file = process.argv[2];
const chunkSize = Number(process.argv[3] || 1800);
const args = JSON.parse(fs.readFileSync(file, 'utf8'));
const expr = args.params.expression;
const viewId = args.viewId;
const chunks = [];
for (let i = 0; i < expr.length; i += chunkSize) {
  chunks.push(expr.slice(i, i + chunkSize));
}
const out = [];
chunks.forEach((c, i) => {
  const esc = c.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push({
    viewId,
    method: 'Runtime.evaluate',
    params: {
      expression: `(function(){window.__exprChunks=window.__exprChunks||[];window.__exprChunks[${i}]="${esc}";return{chunk:${i},len:${c.length}};})()`,
      awaitPromise: false,
      returnByValue: true,
    },
  });
});
out.push({
  viewId,
  method: 'Runtime.evaluate',
  params: {
    expression: `(async()=>{const s=(window.__exprChunks||[]).join('');const v=eval(s);return await v;})()`,
    awaitPromise: true,
    returnByValue: true,
  },
});
console.log(JSON.stringify(out));
