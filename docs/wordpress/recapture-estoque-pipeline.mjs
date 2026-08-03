/**
 * Captura /estoque/itens → webp → prepara deploy WP (build-hero-estoque2).
 * Uso: node recapture-estoque-pipeline.mjs
 */
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dir = dirname(fileURLToPath(import.meta.url));
const shots = join(dir, 'screenshots');
const web = join(shots, 'web');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: dir, stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

await mkdir(web, { recursive: true });

const useMock =
  process.env.AEROSUITE_CAPTURE_MOCK === '1' ||
  process.env.AEROSUITE_APP_URL?.includes('localhost');
const captureScript = useMock ? 'capture-estoque-local-mock.mjs' : 'capture-estoque-only.mjs';
run('node', [captureScript]);

for (const base of ['estoque-itens', 'estoque-fifo']) {
  const src = join(shots, `${base}.png`);
  const dest = join(web, `${base}-web.webp`);
  await sharp(src)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(dest);
  console.log('webp', dest);
}

await copyFile(join(web, 'estoque-fifo-web.webp'), join(web, 'estoque-itens-web.webp'));
run('node', ['build-hero-estoque2.mjs']);
console.log('\nPróximo: executar steps em steps-hero-estoque2/ no wp-admin (post 21) via CDP.\n');
