import fs from 'fs';
const f = process.argv[2];
if (!f) {
  console.error('usage: node extract-mcp-args.mjs <mcp-json-file>');
  process.exit(1);
}
const j = JSON.parse(fs.readFileSync(f, 'utf8'));
const args = { ...j.arguments };
if (process.argv[3]) args.viewId = process.argv[3];
fs.writeFileSync('.last-mcp-args.json', JSON.stringify(args));
const expr = j.arguments?.params?.expression;
console.log(JSON.stringify({ file: f, exprLen: expr?.length ?? null }));
