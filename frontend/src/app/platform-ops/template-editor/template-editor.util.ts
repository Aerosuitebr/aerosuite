const VAR_PATTERN = /\{\{(\w+)\}\}/g;
const HERO_COMMENT_PATTERN = /^<!--aerosuite-hero:([A-Za-z0-9+/=_-]+)-->\s*/;

export const TEMPLATE_VARIABLE_KEYS = [
  'contatoNome',
  'organizacaoNome',
  'organizacaoCodigo',
  'operadorNome',
  'operadorEmail',
  'portalUrl',
  'onboardingFormUrl'
] as const;

export type TemplateVariableKey = (typeof TEMPLATE_VARIABLE_KEYS)[number];

export type HeroLayoutMode = 'classic' | 'overlay';

export interface TemplateHeroConfig {
  enabled: boolean;
  layout: HeroLayoutMode;
  headline: string;
  imageDataUrl: string | null;
  sourceImageDataUrl?: string | null;
  cropZoom?: number;
  cropFocusX?: number;
  cropFocusY?: number;
}

export interface TemplateContentBlock {
  type: 'paragraph' | 'bullets';
  text?: string;
  items?: string[];
}

export const HERO_TARGET_WIDTH = 600;
export const HERO_TARGET_HEIGHT = 250;
export const HERO_TARGET_RATIO = HERO_TARGET_WIDTH / HERO_TARGET_HEIGHT;
export const HERO_PREVIEW_HEIGHT = 168;
export const HERO_CROP_ZOOM_MIN = 0.15;
export const HERO_CROP_ZOOM_MAX = 3;

export const DEFAULT_HERO_HEADLINE =
  'Seja bem-vindo à nova era da sua gestão aeronáutica, {{organizacaoNome}}.';

export const DEFAULT_HERO: TemplateHeroConfig = {
  enabled: false,
  layout: 'classic',
  headline: '',
  imageDataUrl: null
};

export const DEFAULT_PREVIEW_VARS: Record<string, string> = {
  contatoNome: 'Maria Silva',
  organizacaoNome: 'FW Solutions',
  organizacaoCodigo: 'fw-solutions',
  operadorNome: 'Equipe Aero Suite',
  operadorEmail: 'suporte@aerosuite.com.br',
  portalUrl: 'https://app.aerosuite.com.br',
  onboardingFormUrl: 'https://app.aerosuite.com.br/onboarding/exemplo'
};

export const DEFAULT_HERO_PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="250">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0c4a6e"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </linearGradient>
      </defs>
      <rect width="600" height="250" fill="url(#g)"/>
    </svg>`
  );

export function parseBodyWithHero(source: string): { hero: TemplateHeroConfig; contentHtml: string } {
  const raw = source ?? '';
  const match = raw.match(HERO_COMMENT_PATTERN);
  if (!match) {
    return { hero: { ...DEFAULT_HERO }, contentHtml: raw };
  }
  try {
    const json = decodeBase64Utf8(match[1]);
    const parsed = JSON.parse(json) as Partial<TemplateHeroConfig>;
    return {
      hero: normalizeHeroConfig(parsed),
      contentHtml: raw.slice(match[0].length)
    };
  } catch {
    return { hero: { ...DEFAULT_HERO }, contentHtml: raw.slice(match[0].length) };
  }
}

export function composeBodyWithHero(hero: TemplateHeroConfig, contentHtml: string): string {
  const payload = encodeBase64Utf8(JSON.stringify(normalizeHeroConfig(hero)));
  return `<!--aerosuite-hero:${payload}-->\n${contentHtml}`;
}

export function normalizeHeroConfig(hero: Partial<TemplateHeroConfig>): TemplateHeroConfig {
  return {
    enabled: !!hero.enabled,
    layout: hero.layout === 'overlay' ? 'overlay' : 'classic',
    headline: hero.headline ?? '',
    imageDataUrl: hero.imageDataUrl ?? null,
    sourceImageDataUrl: hero.sourceImageDataUrl ?? hero.imageDataUrl ?? null,
    cropZoom: clampNumber(hero.cropZoom ?? 1, HERO_CROP_ZOOM_MIN, HERO_CROP_ZOOM_MAX),
    cropFocusX: clampNumber(hero.cropFocusX ?? 50, 0, 100),
    cropFocusY: clampNumber(hero.cropFocusY ?? 50, 0, 100)
  };
}

export function heroCropObjectPosition(hero: TemplateHeroConfig): string {
  const normalized = normalizeHeroConfig(hero);
  return `${normalized.cropFocusX}% ${normalized.cropFocusY}%`;
}

export interface HeroPanLayout {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
}

export function computeHeroPanLayout(
  imgW: number,
  imgH: number,
  zoom: number,
  focusX: number,
  focusY: number
): HeroPanLayout {
  const z = clampNumber(zoom, HERO_CROP_ZOOM_MIN, HERO_CROP_ZOOM_MAX);
  const fx = clampNumber(focusX, 0, 100);
  const fy = clampNumber(focusY, 0, 100);

  if (shouldUseHeroContainFit(imgW, imgH) && z <= 1) {
    const fitScale = Math.min(HERO_TARGET_WIDTH / imgW, HERO_TARGET_HEIGHT / imgH);
    const drawW = imgW * fitScale * z;
    const drawH = imgH * fitScale * z;
    const maxDx = Math.max(0, HERO_TARGET_WIDTH - drawW);
    const maxDy = Math.max(0, HERO_TARGET_HEIGHT - drawH);
    const dx = maxDx * (fx / 100);
    const dy = maxDy * (fy / 100);
    return {
      leftPct: (dx / HERO_TARGET_WIDTH) * 100,
      topPct: (dy / HERO_TARGET_HEIGHT) * 100,
      widthPct: (drawW / HERO_TARGET_WIDTH) * 100,
      heightPct: (drawH / HERO_TARGET_HEIGHT) * 100
    };
  }

  if (z <= 1) {
    const destW = HERO_TARGET_WIDTH * z;
    const destH = HERO_TARGET_HEIGHT * z;
    const maxDx = Math.max(0, HERO_TARGET_WIDTH - destW);
    const maxDy = Math.max(0, HERO_TARGET_HEIGHT - destH);
    const dx = maxDx * (fx / 100);
    const dy = maxDy * (fy / 100);
    return {
      leftPct: (dx / HERO_TARGET_WIDTH) * 100,
      topPct: (dy / HERO_TARGET_HEIGHT) * 100,
      widthPct: (destW / HERO_TARGET_WIDTH) * 100,
      heightPct: (destH / HERO_TARGET_HEIGHT) * 100
    };
  }

  if (shouldUseHeroContainFit(imgW, imgH)) {
    const visibleW = imgW / z;
    const visibleH = imgH / z;
    const maxX = Math.max(0, imgW - visibleW);
    const maxY = Math.max(0, imgH - visibleH);
    const sx = maxX * (fx / 100);
    const sy = maxY * (fy / 100);
    return {
      leftPct: visibleW > 0 ? (-sx / visibleW) * 100 : 0,
      topPct: visibleH > 0 ? (-sy / visibleH) * 100 : 0,
      widthPct: visibleW > 0 ? (imgW / visibleW) * 100 : 100,
      heightPct: visibleH > 0 ? (imgH / visibleH) * 100 : 100
    };
  }

  const crop = computeHeroCropRect(imgW, imgH, z, fx, fy);
  return {
    leftPct: crop.cropW > 0 ? (-crop.sx / crop.cropW) * 100 : 0,
    topPct: crop.cropH > 0 ? (-crop.sy / crop.cropH) * 100 : 0,
    widthPct: crop.cropW > 0 ? (imgW / crop.cropW) * 100 : 100,
    heightPct: crop.cropH > 0 ? (imgH / crop.cropH) * 100 : 100
  };
}

export function applyHeroPanDelta(
  imgW: number,
  imgH: number,
  zoom: number,
  startFocusX: number,
  startFocusY: number,
  deltaFrameX: number,
  deltaFrameY: number,
  frameWidth: number,
  frameHeight: number
): { focusX: number; focusY: number } {
  const z = clampNumber(zoom, HERO_CROP_ZOOM_MIN, HERO_CROP_ZOOM_MAX);
  const scaleX = frameWidth > 0 ? HERO_TARGET_WIDTH / frameWidth : 1;
  const scaleY = frameHeight > 0 ? HERO_TARGET_HEIGHT / frameHeight : 1;
  const deltaX = deltaFrameX * scaleX;
  const deltaY = deltaFrameY * scaleY;

  if (shouldUseHeroContainFit(imgW, imgH) && z <= 1) {
    const fitScale = Math.min(HERO_TARGET_WIDTH / imgW, HERO_TARGET_HEIGHT / imgH);
    const drawW = imgW * fitScale * z;
    const drawH = imgH * fitScale * z;
    const maxDx = Math.max(0, HERO_TARGET_WIDTH - drawW);
    const maxDy = Math.max(0, HERO_TARGET_HEIGHT - drawH);
    const startDx = maxDx * (clampNumber(startFocusX, 0, 100) / 100);
    const startDy = maxDy * (clampNumber(startFocusY, 0, 100) / 100);
    const newDx = clampNumber(startDx - deltaX, 0, maxDx);
    const newDy = clampNumber(startDy - deltaY, 0, maxDy);
    return {
      focusX: maxDx > 0 ? (newDx / maxDx) * 100 : 50,
      focusY: maxDy > 0 ? (newDy / maxDy) * 100 : 50
    };
  }

  if (z <= 1) {
    const destW = HERO_TARGET_WIDTH * z;
    const destH = HERO_TARGET_HEIGHT * z;
    const maxDx = Math.max(0, HERO_TARGET_WIDTH - destW);
    const maxDy = Math.max(0, HERO_TARGET_HEIGHT - destH);
    const startDx = maxDx * (clampNumber(startFocusX, 0, 100) / 100);
    const startDy = maxDy * (clampNumber(startFocusY, 0, 100) / 100);
    const newDx = clampNumber(startDx - deltaX, 0, maxDx);
    const newDy = clampNumber(startDy - deltaY, 0, maxDy);
    return {
      focusX: maxDx > 0 ? (newDx / maxDx) * 100 : 50,
      focusY: maxDy > 0 ? (newDy / maxDy) * 100 : 50
    };
  }

  if (shouldUseHeroContainFit(imgW, imgH)) {
    const visibleW = imgW / z;
    const visibleH = imgH / z;
    const maxX = Math.max(0, imgW - visibleW);
    const maxY = Math.max(0, imgH - visibleH);
    const startSx = maxX * (clampNumber(startFocusX, 0, 100) / 100);
    const startSy = maxY * (clampNumber(startFocusY, 0, 100) / 100);
    const pxPerSrcX = frameWidth > 0 ? visibleW / frameWidth : 1;
    const pxPerSrcY = frameHeight > 0 ? visibleH / frameHeight : 1;
    const newSx = clampNumber(startSx - deltaFrameX * pxPerSrcX, 0, maxX);
    const newSy = clampNumber(startSy - deltaFrameY * pxPerSrcY, 0, maxY);
    return {
      focusX: maxX > 0 ? (newSx / maxX) * 100 : 50,
      focusY: maxY > 0 ? (newSy / maxY) * 100 : 50
    };
  }

  const crop = computeHeroCropRect(imgW, imgH, z, startFocusX, startFocusY);
  const maxX = Math.max(0, imgW - crop.cropW);
  const maxY = Math.max(0, imgH - crop.cropH);
  const pxPerSrcX = frameWidth > 0 ? crop.cropW / frameWidth : 1;
  const pxPerSrcY = frameHeight > 0 ? crop.cropH / frameHeight : 1;
  const newSx = clampNumber(crop.sx - deltaFrameX * pxPerSrcX, 0, maxX);
  const newSy = clampNumber(crop.sy - deltaFrameY * pxPerSrcY, 0, maxY);
  return {
    focusX: maxX > 0 ? (newSx / maxX) * 100 : 50,
    focusY: maxY > 0 ? (newSy / maxY) * 100 : 50
  };
}

export function readHeroImageSize(sourceDataUrl: string): Promise<{ width: number; height: number }> {
  return loadImage(sourceDataUrl).then(img => ({ width: img.width, height: img.height }));
}

export function shouldUseHeroContainFit(width: number, height: number): boolean {
  if (!width || !height) {
    return false;
  }
  // Logos e artes quadradas/verticais (ex.: Aero_Claro.png) — caber inteiras no banner.
  return width / height < HERO_TARGET_RATIO;
}

export function computeSmartCropSettings(width: number, height: number): Pick<TemplateHeroConfig, 'cropZoom' | 'cropFocusX' | 'cropFocusY'> {
  const ratio = width / height;
  if (shouldUseHeroContainFit(width, height)) {
    return { cropZoom: 1, cropFocusX: 50, cropFocusY: 50 };
  }
  if (ratio >= 4.5) {
    return { cropZoom: 1.25, cropFocusX: 50, cropFocusY: 50 };
  }
  if (ratio >= HERO_TARGET_RATIO) {
    return { cropZoom: 1, cropFocusX: 50, cropFocusY: 50 };
  }
  return { cropZoom: 1, cropFocusX: 50, cropFocusY: 50 };
}

export function readHeroSourceFromFile(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      loadImage(reader.result as string)
        .then(img => resolve({ dataUrl: reader.result as string, width: img.width, height: img.height }))
        .catch(reject);
    };
    reader.readAsDataURL(file);
  });
}

export function renderHeroCrop(sourceDataUrl: string, zoom: number, focusX: number, focusY: number): Promise<string> {
  const z = clampNumber(zoom, HERO_CROP_ZOOM_MIN, HERO_CROP_ZOOM_MAX);
  const fx = clampNumber(focusX, 0, 100);
  const fy = clampNumber(focusY, 0, 100);

  return loadImage(sourceDataUrl).then(img => {
    const canvas = document.createElement('canvas');
    canvas.width = HERO_TARGET_WIDTH;
    canvas.height = HERO_TARGET_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('canvas unavailable');
    }

    if (shouldUseHeroContainFit(img.width, img.height)) {
      paintHeroContain(ctx, img, z, fx, fy);
    } else {
      paintHeroCover(ctx, img, z, fx, fy);
    }

    return canvas.toDataURL('image/jpeg', 0.88);
  });
}

function paintHeroCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  z: number,
  fx: number,
  fy: number
): void {
  ctx.fillStyle = '#0c1929';
  ctx.fillRect(0, 0, HERO_TARGET_WIDTH, HERO_TARGET_HEIGHT);

  const crop = computeHeroCropRect(img.width, img.height, z, fx, fy);
  const destScale = z <= 1 ? z : 1;
  const destW = HERO_TARGET_WIDTH * destScale;
  const destH = HERO_TARGET_HEIGHT * destScale;
  const maxDx = Math.max(0, HERO_TARGET_WIDTH - destW);
  const maxDy = Math.max(0, HERO_TARGET_HEIGHT - destH);
  const dx = maxDx * (fx / 100);
  const dy = maxDy * (fy / 100);

  ctx.drawImage(img, crop.sx, crop.sy, crop.cropW, crop.cropH, dx, dy, destW, destH);
}

function paintHeroContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  z: number,
  fx: number,
  fy: number
): void {
  ctx.fillStyle = '#0c1929';
  ctx.fillRect(0, 0, HERO_TARGET_WIDTH, HERO_TARGET_HEIGHT);

  const fitScale = Math.min(HERO_TARGET_WIDTH / img.width, HERO_TARGET_HEIGHT / img.height);

  if (z <= 1) {
    const drawW = img.width * fitScale * z;
    const drawH = img.height * fitScale * z;
    const maxDx = Math.max(0, HERO_TARGET_WIDTH - drawW);
    const maxDy = Math.max(0, HERO_TARGET_HEIGHT - drawH);
    const dx = maxDx * (fx / 100);
    const dy = maxDy * (fy / 100);
    ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, drawW, drawH);
    return;
  }

  const visibleW = img.width / z;
  const visibleH = img.height / z;
  const maxX = Math.max(0, img.width - visibleW);
  const maxY = Math.max(0, img.height - visibleH);
  const sx = maxX * (fx / 100);
  const sy = maxY * (fy / 100);
  ctx.drawImage(img, sx, sy, visibleW, visibleH, 0, 0, HERO_TARGET_WIDTH, HERO_TARGET_HEIGHT);
}

/** @deprecated use readHeroSourceFromFile + renderHeroCrop */
export function cropImageToHeroAspect(file: File): Promise<string> {
  return readHeroSourceFromFile(file).then(({ dataUrl, width, height }) => {
    const crop = computeSmartCropSettings(width, height);
    return renderHeroCrop(dataUrl, crop.cropZoom ?? 1, crop.cropFocusX ?? 50, crop.cropFocusY ?? 50);
  });
}

export function parseBodyToBlocks(source: string): TemplateContentBlock[] {
  const { contentHtml } = parseBodyWithHero(source);
  const raw = contentHtml?.trim() ?? '';
  if (!raw) {
    return [{ type: 'paragraph', text: '' }];
  }

  if (!/<[a-z][\s\S]*>/i.test(raw)) {
    const parts = raw.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    if (!parts.length) {
      return [{ type: 'paragraph', text: raw }];
    }
    return parts.map(text => ({ type: 'paragraph', text }));
  }

  const container = document.createElement('div');
  container.innerHTML = raw;
  const blocks: TemplateContentBlock[] = [];

  container.childNodes.forEach(node => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    const el = node as HTMLElement;
    if (el.tagName === 'P') {
      blocks.push({ type: 'paragraph', text: elementToPlainWithVars(el) });
    } else if (el.tagName === 'UL') {
      const items = Array.from(el.querySelectorAll(':scope > li')).map(li => elementToPlainWithVars(li as HTMLElement));
      if (items.length) {
        blocks.push({ type: 'bullets', items });
      }
    }
  });

  return blocks.length ? blocks : [{ type: 'paragraph', text: htmlToPlainWithVars(raw) }];
}

export function composeBodyFromBlocks(blocks: TemplateContentBlock[], plainText = false): string {
  const parts: string[] = [];

  for (const block of blocks) {
    if (block.type === 'bullets') {
      const items = (block.items ?? []).map(i => i.trim()).filter(Boolean);
      if (!items.length) {
        continue;
      }
      if (plainText) {
        parts.push(items.map(i => `• ${i}`).join('\n'));
      } else {
        parts.push(`<ul>${items.map(i => `<li>${textToInlineHtml(i)}</li>`).join('')}</ul>`);
      }
      continue;
    }

    const text = (block.text ?? '').trim();
    if (!text) {
      continue;
    }
    if (plainText) {
      parts.push(text);
    } else {
      parts.push(`<p>${textToInlineHtml(text)}</p>`);
    }
  }

  return parts.join(plainText ? '\n\n' : '');
}

export function interpolateTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(VAR_PATTERN, (_, key: string) => vars[key] ?? `{{${key}}}`);
}

export function renderInlinePreviewHtml(text: string, vars: Record<string, string>): string {
  const segments = text.split(/(\{\{\w+\}\})/g);
  return segments
    .map(segment => {
      const match = segment.match(/^\{\{(\w+)\}\}$/);
      if (match) {
        const key = match[1];
        const value = vars[key] ?? key;
        return `<span class="preview-var-pill" data-var="${escapeAttr(key)}">${escapeHtml(value)}</span>`;
      }
      return escapeHtml(segment).replace(/\n/g, '<br>');
    })
    .join('');
}

export function buildPreviewBodyHtml(blocks: TemplateContentBlock[], vars: Record<string, string>): string {
  return blocks
    .map(block => {
      if (block.type === 'bullets') {
        const items = (block.items ?? []).filter(i => i.trim());
        if (!items.length) {
          return '';
        }
        return `<ul>${items.map(i => `<li>${renderInlinePreviewHtml(i, vars)}</li>`).join('')}</ul>`;
      }
      const text = (block.text ?? '').trim();
      return text ? `<p>${renderInlinePreviewHtml(text, vars)}</p>` : '';
    })
    .filter(Boolean)
    .join('');
}

export function buildHeroPreviewHtml(hero: TemplateHeroConfig, vars: Record<string, string>): string {
  if (!hero.enabled) {
    return '';
  }
  const normalized = normalizeHeroConfig(hero);
  const headlineHtml = renderInlinePreviewHtml(normalized.headline || DEFAULT_HERO_HEADLINE, vars);
  const imageUrl = normalized.imageDataUrl || DEFAULT_HERO_PLACEHOLDER;
  const pos = heroCropObjectPosition(normalized);
  if (normalized.layout === 'overlay') {
    return `<div class="email-hero email-hero--overlay" style="background-image:url('${escapeAttr(imageUrl)}');background-position:${pos};background-size:100% 100%;background-repeat:no-repeat;">
      <div class="email-hero__overlay"></div>
      <div class="email-hero__headline">${headlineHtml}</div>
    </div>`;
  }
  return `<div class="email-hero email-hero--classic">
    <img class="email-hero__image" src="${escapeAttr(imageUrl)}" alt="" style="object-position:${pos};" />
    <div class="email-hero__band"><div class="email-hero__headline">${headlineHtml}</div></div>
  </div>`;
}

function baseCropRect(width: number, height: number): { width: number; height: number } {
  const ratio = width / height;
  if (ratio >= HERO_TARGET_RATIO) {
    return { width: height * HERO_TARGET_RATIO, height };
  }
  return { width, height: width / HERO_TARGET_RATIO };
}

function computeHeroCropRect(
  imgW: number,
  imgH: number,
  zoom: number,
  focusX: number,
  focusY: number
): { sx: number; sy: number; cropW: number; cropH: number } {
  const base = baseCropRect(imgW, imgH);
  let cropW = base.width / zoom;
  let cropH = cropW / HERO_TARGET_RATIO;

  if (cropW > imgW) {
    cropW = imgW;
    cropH = Math.min(imgW / HERO_TARGET_RATIO, imgH);
  }
  if (cropH > imgH) {
    cropH = imgH;
    cropW = Math.min(imgH * HERO_TARGET_RATIO, imgW);
  }

  const maxX = Math.max(0, imgW - cropW);
  const maxY = Math.max(0, imgH - cropH);
  return {
    sx: maxX * (focusX / 100),
    sy: maxY * (focusY / 100),
    cropW,
    cropH
  };
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('image load failed'));
    img.onload = () => resolve(img);
    img.src = source;
  });
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function elementToPlainWithVars(el: HTMLElement): string {
  return (el.innerText ?? el.textContent ?? '').replace(/\u00a0/g, ' ').trim();
}

function htmlToPlainWithVars(html: string): string {
  const container = document.createElement('div');
  container.innerHTML = html;
  return (container.innerText ?? '').replace(/\u00a0/g, ' ').trim();
}

function textToInlineHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach(b => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function decodeBase64Utf8(value: string): string {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}
