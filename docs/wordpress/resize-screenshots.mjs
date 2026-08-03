import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'screenshots');
const out = join(dir, 'web');
await mkdir(out, { recursive: true });

const files = (await readdir(dir)).filter((f) => f.endsWith('.png') && !f.includes('-web'));
for (const f of files) {
  const dest = join(out, f.replace('.png', '-web.webp'));
  await sharp(join(dir, f))
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(dest);
  console.log('OK', dest);
}
