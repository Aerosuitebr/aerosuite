import fs from 'fs';
import { execSync } from 'child_process';

const resp = {
  result: {
    result: {
      value: {
        ok: true,
        out: {
          4: { len: 34708, ok: true },
          5: { b64: 34708, dec: 26030, hasGrid: true },
          6: { ok: true, cssLen: 26030, hasHeroV2: true, footerLen: 38416 },
          7: { ok: true },
        },
      },
    },
  },
};
const raw = JSON.stringify(resp);
for (const n of [4, 5, 6, 7]) {
  execSync(`node .cdp-run-all-mcp-steps.mjs record ${n} ${JSON.stringify(raw)}`, {
    stdio: 'inherit',
  });
}
