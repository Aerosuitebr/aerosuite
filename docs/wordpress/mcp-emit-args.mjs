/**
 * Emit browser_cdp args for step N to stdout (full JSON, no truncation).
 * node mcp-emit-args.mjs <index> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const idx = Number(process.argv[2]);
const viewId = process.argv[3] || 'f29abe';
const j = JSON.parse(fs.readFileSync(path.join(dir, `.mcp-payload-${idx}.json`), 'utf8'));
const args = j.arguments ? { ...j.arguments, viewId } : { ...j, viewId };
const out = process.argv[4];
if (out) {
  fs.writeFileSync(path.resolve(out), JSON.stringify(args));
  console.log(JSON.stringify({ idx, exprLen: args.params?.expression?.length ?? 0, out }));
} else {
  process.stdout.write(JSON.stringify(args));
}
