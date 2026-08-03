/**
 * Builds MCP browser_cdp payloads for deploy chunks.
 * Output: deploy-results.json (run manually via agent CallMcpTool)
 */
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const viewId = process.argv[2] || '44c6d7';
const steps = ['init', 0, 1, 2, 3, 4, 'run'];
const payloads = steps.map((n) => {
  const exprPath =
    n === 'init'
      ? path.join(dir, 'deploy-expr-init.txt')
      : path.join(dir, `deploy-expr-${n}.txt`);
  const expression = fs.readFileSync(exprPath, 'utf8').trim();
  return {
    step: n,
    server: 'cursor-ide-browser',
    toolName: 'browser_cdp',
    arguments: {
      method: 'Runtime.evaluate',
      params: { expression, awaitPromise: true, returnByValue: true },
      viewId,
    },
  };
});
fs.writeFileSync(path.join(dir, 'deploy-mcp-payloads.json'), JSON.stringify(payloads, null, 0));
console.log(JSON.stringify(payloads.map((p) => p.step)));
