/**
 * Regenera favicon e LOGO_AERO a partir de assets/Aero_suite_logo.png.
 * Para importar logomark novo: node scripts/import-logomark.mjs [imagem.png]
 */
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const importScript = join(__dirname, 'import-logomark.mjs');

const child = spawn(process.execPath, [importScript, ...process.argv.slice(2)], {
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code ?? 1));
