/**
 * Gera aerosuite-critical.css (hero above-the-fold) a partir do premium.
 * Uso: node build-critical-css.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const rootOnly = css.match(/:root\s*\{[\s\S]*?\}/)[0];
const heroStart = css.indexOf('/* Hero v2');
const heroEnd = css.indexOf('.as-hero-device__caption {');
const heroChunk = css.slice(heroStart, heroEnd);
const btnStart = css.indexOf('.as-btn {');
const btnEnd = css.indexOf('.as-hero-v2__trust {');
const btnChunk = css.slice(btnStart, btnEnd);
const navHide =
  'nav.wp-block-navigation:not(.as-supplemental-nav),.wp-block-navigation:not(.as-supplemental-nav){display:none!important;visibility:hidden!important;height:0!important;overflow:hidden!important;pointer-events:none!important}.as-supplemental-nav{display:block!important;visibility:visible!important;height:auto!important;pointer-events:auto!important}header.wp-block-template-part .is-style-ext-preset--group--natural-1--header-1{display:none!important;height:0!important;overflow:hidden!important;padding:0!important;margin:0!important}.as-supplemental-nav__inner{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;padding:16px 5%;gap:1rem 1.5rem}.as-supplemental-nav__links{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:.35rem 1.25rem}';
const merged = `${rootOnly}\n${heroChunk}\n${btnChunk}\n${navHide}`;
const min = merged
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>+~])\s*/g, '$1')
  .trim();
const out = path.join(dir, 'aerosuite-critical.css');
fs.writeFileSync(out, min);
console.log('critical-css', min.length, 'bytes ->', out);
