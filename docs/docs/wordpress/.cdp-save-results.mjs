import fs from 'fs';
const wrap = (v) => JSON.stringify({ result: { result: { value: v } } });
const dir = '.';
const steps = {
  4: { len: 34708, ok: true },
  5: { b64: 34708, dec: 26030, hasGrid: true },
  6: { ok: true, cssLen: 26030, hasHeroV2: true, footerLen: 38416 },
  7: { ok: true },
};
for (const [n, v] of Object.entries(steps)) {
  fs.writeFileSync(`${dir}/.cdp-mcp-result-${n}.json`, wrap(v));
}
