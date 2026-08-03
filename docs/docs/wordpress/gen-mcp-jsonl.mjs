import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(dir, '.invoke-steps-manifest.json'), 'utf8'));
const lines = [];
for (let i = 0; i < manifest.count; i++) {
  const args = fs.readFileSync(path.join(dir, `.invoke-step-${i}.json`), 'utf8');
  lines.push(JSON.stringify({ index: i, file: manifest.steps[i], args: JSON.parse(args) }));
}
fs.writeFileSync(path.join(dir, 'mcp-commands.jsonl'), lines.join('\n'));
console.log('wrote', lines.length, 'lines');
