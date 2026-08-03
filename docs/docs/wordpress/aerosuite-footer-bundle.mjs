/**
 * Lista de JS e snippet AEROSUITE_SITE compartilhado entre deploys.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GA4_MEASUREMENT_ID,
  CALENDLY_EMBED_URL,
  WHATSAPP_PHONE,
  WHATSAPP_MESSAGE,
  META_PIXEL_ID,
  LINKEDIN_PARTNER_ID,
  LINKS,
  isGa4Configured,
  isCalendlyConfigured,
  isMetaPixelConfigured,
  isLinkedInPartnerConfigured,
} from './aerosuite-site-config.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));

export const FOOTER_JS_FILES = [
  'aerosuite-consent.js',
  'aerosuite-analytics.js',
  'aerosuite-marketing-pixels.js',
  'aerosuite-sticky-cta.js',
  'aerosuite-hero.js',
  'aerosuite-tour-video.js',
  'aerosuite-showcase-zoom.js',
  'aerosuite-phone-mask.js',
  'aerosuite-wpforms-helper.js',
];

/** IDs legados no footer WP — removidos no deploy para evitar JS duplicado. */
export const FOOTER_LEGACY_SCRIPT_IDS = [
  'aerosuite-phone-mask-js',
  'aerosuite-showcase-zoom-js',
  'aerosuite-hero-js',
  'aerosuite-tour-video-js',
];

export function buildSiteConfigSnippet() {
  return `window.AEROSUITE_SITE=${JSON.stringify({
    ga4: isGa4Configured() ? GA4_MEASUREMENT_ID : '',
    calendly: isCalendlyConfigured() ? CALENDLY_EMBED_URL : '',
    whatsappPhone: WHATSAPP_PHONE,
    whatsappText: WHATSAPP_MESSAGE,
    thankYouUrl: LINKS.obrigado,
    privacyUrl: LINKS.privacidade,
    contatoAgendar: LINKS.contatoAgendar,
    metaPixel: isMetaPixelConfigured() ? META_PIXEL_ID : '',
    linkedInPartner: isLinkedInPartnerConfigured() ? LINKEDIN_PARTNER_ID : '',
  })};`;
}

export function loadFooterJsParts() {
  return FOOTER_JS_FILES.map((f) => {
    const body = fs.readFileSync(path.join(dir, f), 'utf8');
    const id = f.replace('.js', '').replace(/\./g, '-');
    if (body.includes('&&')) {
      console.warn('WARN: && in', f, '— risco no WordPress');
    }
    return { id, body };
  });
}

export function readPremiumCss() {
  return fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
}
