/**
 * @deprecated Use run-site-cleanup.mjs (remove todos os fix plugins, não reativa).
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
spawnSync(process.execPath, [path.join(dir, 'run-site-cleanup.mjs')], { stdio: 'inherit' });