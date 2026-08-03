/**
 * Configuração central do site institucional (WordPress).
 * IDs sensíveis: aerosuite-site-secrets.local.mjs (ver setup-marketing-ids.mjs).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));

let secrets = {};
const secretsPath = path.join(dir, 'aerosuite-site-secrets.local.mjs');
if (fs.existsSync(secretsPath)) {
  const mod = await import('./aerosuite-site-secrets.local.mjs');
  secrets = mod.SECRETS ?? {};
}

export const SITE = {
  origin: 'https://aerosuite.com.br',
  appUrl: 'https://app.aerosuite.com.br',
  brand: 'Aero Suite',
  legalName: 'Aero Suite',
  locale: 'pt-BR',
  email: 'contato@aerosuite.com.br',
};

export const GA4_MEASUREMENT_ID =
  (secrets.ga4MeasurementId || process.env.AEROSUITE_GA4 || '').trim();

export const CALENDLY_EMBED_URL =
  (secrets.calendlyEmbedUrl || process.env.AEROSUITE_CALENDLY || '').trim();

/** Opcional, remarketing só após consentimento LGPD (ver aerosuite-consent.js) */
export const META_PIXEL_ID = (secrets.metaPixelId || process.env.AEROSUITE_META_PIXEL || '').trim();
export const LINKEDIN_PARTNER_ID = (
  secrets.linkedInPartnerId || process.env.AEROSUITE_LINKEDIN_PARTNER || ''
).trim();

export const WHATSAPP_PHONE = '5521990403514';

export const WHATSAPP_MESSAGE =
  'Olá! Gostaria de agendar uma demonstração da Aero Suite para minha oficina aeronáutica.';

/** Link estático (WhatsApp Web), cliques são refinados em aerosuite-analytics.js */
export function buildWhatsAppHref(
  phone = WHATSAPP_PHONE,
  text = WHATSAPP_MESSAGE
) {
  return `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}

export function isGa4Configured() {
  const id = GA4_MEASUREMENT_ID;
  return Boolean(id && /^G-[A-Z0-9]+$/i.test(id) && !/X{4,}/i.test(id));
}

export function isCalendlyConfigured() {
  const u = CALENDLY_EMBED_URL;
  if (!u || !u.startsWith('https://calendly.com/') || u.length < 29) return false;
  if (/X{4,}/i.test(u)) return false;
  if (/calendly\.com\/aerosuite\/demo-aero-suite/i.test(u)) return false;
  return true;
}

function readFaviconUrl() {
  try {
    const jsonPath = path.join(dir, 'aerosuite-favicon-media.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (data.ok && data.mediaUrl) return data.mediaUrl;
    }
  } catch (err) {
    /* fallback */
  }
  return `${SITE.origin}/wp-content/uploads/2026/06/aerosuite-site-icon-512.png`;
}

function readLogoUrl() {
  try {
    const jsonPath = path.join(dir, 'aerosuite-logo-media.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (data.hero) return data.hero;
      if (data.ok && data.url) return data.url;
    }
  } catch (err) {
    /* fallback */
  }
  return `${SITE.origin}/wp-content/uploads/2026/06/aero-colorido-logo.png`;
}

function readLogoLightUrl() {
  try {
    const jsonPath = path.join(dir, 'aerosuite-logo-media.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (data.logoLight) return data.logoLight;
    }
  } catch (err) {
    /* fallback */
  }
  return `${SITE.origin}/wp-content/uploads/2026/06/aero-claro-logo.png`;
}

function readTourVideoMedia() {
  try {
    const jsonPath = path.join(dir, 'aerosuite-tour-video-media.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (data.videoMp4 && data.poster) {
        return {
          videoMp4: data.videoMp4,
          poster: data.poster,
          durationLabel: data.durationLabel || '5 min',
          title: data.title || 'Tour Aero Suite — gestão MRO em ação',
        };
      }
    }
  } catch (err) {
    /* fallback */
  }
  return null;
}

export const TOUR_VIDEO = readTourVideoMedia();

export function isTourVideoConfigured() {
  const tv = TOUR_VIDEO;
  return Boolean(tv?.videoMp4?.startsWith('https://') && tv?.poster?.startsWith('https://'));
}

export const MEDIA = {
  /** Fundo claro (header institucional). */
  logo: readLogoUrl(),
  /** Fundo escuro (hero, rodapé, painéis navy). */
  logoLight: readLogoLightUrl(),
  /** Logo quadrado para schema Organization / Google (site icon 512×512). */
  logoBrand: readFaviconUrl(),
  favicon: readFaviconUrl(),
  faviconSvg: `${SITE.origin}/wp-content/uploads/2026/06/aerosuite-favicon.svg`,
  os: 'https://aerosuite.com.br/wp-content/uploads/2026/06/os-list-web-6.webp',
  estoque: 'https://aerosuite.com.br/wp-content/uploads/2026/06/estoque-fifo-web-7.webp',
  propostas: 'https://aerosuite.com.br/wp-content/uploads/2026/06/propostas-comerciais-web-6.webp',
  dashboard: 'https://aerosuite.com.br/wp-content/uploads/2026/06/dashboard-web-6.webp',
  conformidade: 'https://aerosuite.com.br/wp-content/uploads/2026/06/conformidade-painel-web-5.webp',
  portal: 'https://aerosuite.com.br/wp-content/uploads/2026/06/portal-cliente-web-5.webp',
  tourVideoPoster: TOUR_VIDEO?.poster ?? '',
  tourVideoMp4: TOUR_VIDEO?.videoMp4 ?? '',
};

export const WP_PAGE_IDS = {
  home: 21,
  solucoes: 20,
  sobre: 16,
  contato: 18,
};

export const LINKS = {
  home: `${SITE.origin}/`,
  contato: `${SITE.origin}/contato/`,
  contatoAgendar: `${SITE.origin}/contato/#agendar-demo`,
  recursos: `${SITE.origin}/#recursos`,
  videoTour: `${SITE.origin}/#video-tour`,
  prontidaoRegulatoria: `${SITE.origin}/#prontidao-regulatoria`,
  conformidade: `${SITE.origin}/conformidade-regulatoria/`,
  solucoes: `${SITE.origin}/solucoes/`,
  sobre: `${SITE.origin}/sobre/`,
  blog: `${SITE.origin}/blog/`,
  comparativo: `${SITE.origin}/aero-suite-vs-planilhas/`,
  obrigado: `${SITE.origin}/obrigado/`,
  privacidade: `${SITE.origin}/politica-de-privacidade/`,
  termos: `${SITE.origin}/termos-de-uso/`,
  seguranca: `${SITE.origin}/seguranca-e-dados/`,
  casos: `${SITE.origin}/casos/`,
  casoBellows: `${SITE.origin}/casos/bellows-servicos-aeronauticos/`,
  casoKingDoRio: `${SITE.origin}/casos/king-do-rio-pecas-aeronauticas/`,
  whatsapp: buildWhatsAppHref(),
};

export function isMetaPixelConfigured() {
  const id = META_PIXEL_ID;
  return Boolean(id && /^\d{8,20}$/.test(id));
}

export function isLinkedInPartnerConfigured() {
  const id = LINKEDIN_PARTNER_ID;
  return Boolean(id && /^\d{5,10}$/.test(id));
}

export const PILLAR_PAGES = [
  {
    slug: 'software-gestao-oficina-aeronautica-mro',
    path: '/software-gestao-oficina-aeronautica-mro/',
    title: 'Software de gestão para oficina aeronáutica e MRO',
    focus: 'Como escolher e implantar um sistema integrado para oficinas e MRO no Brasil.',
  },
  {
    slug: 'estoque-pecas-aeronauticas-rastreabilidade',
    path: '/estoque-pecas-aeronauticas-rastreabilidade/',
    title: 'Estoque de peças aeronáuticas com rastreabilidade e FIFO',
    focus: 'Controle de peças, reservas e rastreio FIFO do almoxarifado à OS.',
  },
  {
    slug: 'ordem-servico-manutencao-aeronaves',
    path: '/ordem-servico-manutencao-aeronaves/',
    title: 'Ordem de serviço para manutenção de aeronaves',
    focus: 'Fluxo completo da OS: abertura, job cards, documentos e fechamento.',
  },
  {
    slug: 'portal-cliente-oficina-aviacao',
    path: '/portal-cliente-oficina-aviacao/',
    title: 'Portal do cliente para oficinas de aviação',
    focus: 'Transparência para o cliente acompanhar serviço, status e documentos.',
  },
  {
    slug: 'propostas-comerciais-servicos-aeronauticos',
    path: '/propostas-comerciais-servicos-aeronauticos/',
    title: 'Propostas comerciais para serviços aeronáuticos',
    focus: 'Propostas versionadas alinhadas ao estoque e à execução no hangar.',
  },
];

PILLAR_PAGES.forEach((p) => {
  p.url = `${SITE.origin}${p.path}`;
});
