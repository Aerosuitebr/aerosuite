/**
 * Gera versão web do tour (H.264 1080p, CRF 26, faststart, AAC 128k).
 *
 * Uso:
 *   node compress-tour-video.mjs
 *   node compress-tour-video.mjs "D:\caminho\origem.mp4"
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const defaultIn = path.join(
  'D:',
  'Desenvolvimento',
  'Aero_videos',
  'drive-download-20260708T210407Z-3-001',
  'AeroSuiteVideo com intro e end.mp4',
);
const input = process.argv[2] ? path.resolve(process.argv[2]) : defaultIn;
const output = path.join(dir, 'static', 'aerosuite-tour-cinematic.web.mp4');

if (!fs.existsSync(input)) {
  console.error('MISSING input:', input);
  process.exit(2);
}

const args = [
  '-y',
  '-i',
  input,
  '-c:v',
  'libx264',
  '-crf',
  '26',
  '-preset',
  'slow',
  '-profile:v',
  'high',
  '-level',
  '4.1',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  '-c:a',
  'aac',
  '-b:a',
  '128k',
  '-ac',
  '2',
  '-ar',
  '48000',
  output,
];

console.log('ffmpeg', args.join(' '));
const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status || 1);

const mb = (fs.statSync(output).size / (1024 * 1024)).toFixed(1);
console.log('OK', output, `(${mb} MB)`);
