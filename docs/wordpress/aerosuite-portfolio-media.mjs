import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SITE } from './aerosuite-site-config.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const bellowsJson = path.join(dir, 'bellows-media.json');
const kingJson = path.join(dir, 'kingdorio-media.json');

/** URL publicada no WordPress (gerada por run-upload-bellows-logo.mjs). */
const FALLBACK_BELOW_LOGO = `${SITE.origin}/wp-content/uploads/2026/06/bellows-logo-redondo.png`;
const FALLBACK_KING_LOGO = `${SITE.origin}/wp-content/uploads/2026/06/kingdorio-logo.png`;

function readMediaUrl(jsonPath, fallback) {
  if (fs.existsSync(jsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (data.ok && data.url) return data.url;
    } catch (err) {
      /* use fallback */
    }
  }
  return fallback;
}

export function getBellowsLogoUrl() {
  return readMediaUrl(bellowsJson, FALLBACK_BELOW_LOGO);
}

export function getKingDoRioLogoUrl() {
  return readMediaUrl(kingJson, FALLBACK_KING_LOGO);
}
