import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-calendly-chunks.json'), 'utf8'));
const viewId = '8b4728';

function write(name, expression) {
  fs.writeFileSync(
    path.join(dir, name),
    JSON.stringify({
      viewId,
      method: 'Runtime.evaluate',
      params: { expression, awaitPromise: true, returnByValue: true },
    })
  );
}

j.chunks.forEach((c, i) => write(`.cdp-calendly-arg-${i}.json`, c));
write('.cdp-calendly-arg-run.json', j.run);
