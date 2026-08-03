import { bustStaticAssetUrl } from '../../../environments/asset-cache-bust';

/**
 * URL do logo em `assets` (absoluta no browser). Nome comercial exibido: configurar em `branding.json` (Aero Suite por omissão).
 */

/** URL do ícone circular em `assets` (LOGO_AERO por omissão). */
export function getDefaultAppLogoUrlAbsolute(): string {
  if (typeof window === 'undefined') return bustStaticAssetUrl('/assets/LOGO_AERO.png');
  return bustStaticAssetUrl(`${window.location.origin}/assets/LOGO_AERO.png`);
}

// SVG genérico (letra "A") para fallback em HTML/emails quando não há imagem
export const FALLBACK_BRAND_LOGO_SVG = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style="width: 60px; height: 60px;">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9"/>
      <stop offset="100%" style="stop-color:#0284c7"/>
    </linearGradient>
  </defs>
  <rect width="80" height="80" rx="12" fill="url(#brandGrad)"/>
  <text x="40" y="52" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle">A</text>
</svg>`;

export const FALLBACK_BRAND_LOGO_DATA_URI = `data:image/svg+xml,${encodeURIComponent(`<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9"/>
      <stop offset="100%" style="stop-color:#0284c7"/>
    </linearGradient>
  </defs>
  <rect width="80" height="80" rx="12" fill="url(#brandGrad)"/>
  <text x="40" y="52" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle">A</text>
</svg>`)}`;

export const FALLBACK_BRAND_LOGO_HTML = `<div style="width: 60px; height: 60px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
  <span style="color: white; font-size: 32px; font-weight: bold; font-family: Arial, sans-serif;">A</span>
</div>`;

export const FALLBACK_BRAND_LOGO_EMAIL_HTML = `<div style="width: 60px; height: 60px; background-color: #0ea5e9; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
  <span style="color: white; font-size: 32px; font-weight: bold; font-family: Arial, sans-serif;">A</span>
</div>`;
