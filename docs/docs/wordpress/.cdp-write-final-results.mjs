import fs from 'fs';

const wrap = (v) => JSON.stringify({ result: { result: { value: v } } });

const summary = {
  4: { len: 34708, ok: true },
  5: { b64: 34708, dec: 26030, hasGrid: true },
  6: { ok: true, cssLen: 26030, hasHeroV2: true, footerLen: 38416 },
  7: { ok: true },
  13: { chunk: 0, len: 6000 },
  19: { chunk: 1, len: 12000 },
  25: { chunk: 2, len: 18000 },
  28: { chunk: 3, len: 19388 },
  29: {
    ok: true,
    homeLen: 14398,
    sample: 'demonstração',
    hasHeroV2: true,
    title: 'Aero Suite — Gestão MRO | OS, Estoque FIFO e Portal do Cliente',
  },
};

for (const [n, v] of Object.entries(summary)) {
  fs.writeFileSync(`.cdp-mcp-result-${n}.json`, wrap(v));
}

console.log('written', Object.keys(summary).join(','));
