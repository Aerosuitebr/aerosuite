import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

const ports = [9222, 9223, 9229, 9333, 8315, 9400, 9515, 9220];
for (const port of ports) {
  try {
    const b = await pw.chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    const pages = b.contexts().flatMap((c) => c.pages());
    console.log('OK', port, pages.map((p) => p.url()).slice(0, 3));
    await b.close();
  } catch (e) {
    console.log('FAIL', port);
  }
}
