import fs from 'fs';
const state = JSON.parse(fs.readFileSync('.cdp-run-all-state.json', 'utf8'));
const r = state.results || {};
const out = {
  viewId: 'a9930e',
  activeViewId: process.argv[2] || '7eacd5',
  cssFullRun: r[4] ?? null,
  cssVerify: r[5] ?? null,
  cssFinalize: r[6] ?? null,
  encInit: r[7] ?? null,
  enc0: r[13] ?? null,
  enc1: r[19] ?? null,
  enc2: r[25] ?? null,
  enc3: r[28] ?? null,
  encRun: r[29] ?? null,
  errors: state.errors || [],
};
fs.writeFileSync('.cdp-final-out.json', JSON.stringify(out));
console.log(JSON.stringify(out));
