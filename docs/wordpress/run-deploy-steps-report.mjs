/**
 * Prints ordered deploy step file paths (one per line) for CDP execution.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const steps = [
  'deploy-step-0.js',
  'deploy-step-1.js',
  'deploy-step-2.js',
  'deploy-step-3.js',
  'deploy-css-step-0.js',
  'deploy-css-step-1.js',
  'deploy-css-step-2.js',
  'deploy-css-step-3.js',
  'deploy-css-step-4.js',
  'deploy-css-step-5.js',
  'deploy-upload-hero.js',
  'deploy-upload-phone.js',
  'deploy-upload-zoom.js',
  'deploy-finalize-v2.js',
];

for (const name of steps) {
  const full = path.join(dir, name);
  if (!fs.existsSync(full)) {
    console.error('MISSING', name);
    process.exit(1);
  }
  console.log(JSON.stringify({ name, full, len: fs.statSync(full).size }));
}
