import { AeroStudioIdentity, AeroStudioTemplate } from '../core/aero-studio.service';
import { newElementId, StudioCanvasDocument, StudioCanvasElement } from './models/studio-canvas.model';

export function emptyCanvasDoc(template: AeroStudioTemplate, bg = '#ffffff'): StudioCanvasDocument {
  return {
    version: 1,
    widthMm: template.widthMm,
    heightMm: template.heightMm,
    bleedMm: template.bleedMm,
    backgroundColor: bg,
    elements: []
  };
}

export function seedCanvasFromIdentity(
  identity: AeroStudioIdentity,
  template: AeroStudioTemplate,
  primary: string,
  secondary: string,
  tagline: string,
  servicesText: string,
  includeQr: boolean
): StudioCanvasDocument {
  const doc = emptyCanvasDoc(template, '#ffffff');
  const w = template.widthMm;
  const h = template.heightMm;
  let z = 1;
  const els: StudioCanvasElement[] = [];

  els.push({
    id: newElementId(),
    type: 'shape',
    x: 0,
    y: 0,
    width: w,
    height: Math.min(18, h * 0.35),
    zIndex: z++,
    fill: primary
  });

  if (identity.logoUrl) {
    els.push({
      id: newElementId(),
      type: 'logo',
      x: 4,
      y: 4,
      width: Math.min(32, w * 0.35),
      height: 12,
      zIndex: z++
    });
  }

  els.push({
    id: newElementId(),
    type: 'text',
    x: 4,
    y: identity.logoUrl ? 18 : 6,
    width: w - 8,
    height: 10,
    zIndex: z++,
    text: identity.displayName || '—',
    fontSizePt: template.widthMm <= 100 ? 12 : 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'left'
  });

  if (tagline) {
    els.push({
      id: newElementId(),
      type: 'text',
      x: 4,
      y: identity.logoUrl ? 28 : 16,
      width: w - 8,
      height: 8,
      zIndex: z++,
      text: tagline,
      fontSizePt: 9,
      color: '#f8fafc',
      textAlign: 'left'
    });
  }

  const contactY = Math.max(h * 0.55, 30);
  const contact = [identity.supportEmail, identity.telefone, identity.siteUrl].filter(Boolean).join(' · ');
  if (contact) {
    els.push({
      id: newElementId(),
      type: 'text',
      x: 4,
      y: contactY,
      width: w - (includeQr ? 28 : 8),
      height: 12,
      zIndex: z++,
      text: contact,
      fontSizePt: 8,
      color: secondary,
      textAlign: 'left'
    });
  }

  if (servicesText?.trim()) {
    els.push({
      id: newElementId(),
      type: 'text',
      x: 4,
      y: contactY + 14,
      width: w - 8,
      height: Math.min(40, h - contactY - 16),
      zIndex: z++,
      text: servicesText.trim(),
      fontSizePt: 8,
      color: '#334155',
      textAlign: 'left'
    });
  }

  if (includeQr) {
    els.push({
      id: newElementId(),
      type: 'qr',
      x: w - 22,
      y: h - 24,
      width: 18,
      height: 18,
      zIndex: z++
    });
  }

  doc.elements = els;
  return doc;
}
