import type { AeroStudioIdentity, AeroStudioTemplate } from '../core/aero-studio.service';
import { newElementId, StudioCanvasDocument, StudioCanvasElement } from './models/studio-canvas.model';

import type { LetterheadPresetId } from './studio-letterhead-presets';

export interface LetterheadFormModel {
  presetId: LetterheadPresetId;
  displayName: string;
  tagline: string;
  supportEmail: string;
  telefone: string;
  siteUrl: string;
  endereco: string;
  primaryColor: string;
  secondaryColor: string;
  includeCropMarks: boolean;
  includeQrPortal: boolean;
}

/** IDs estáveis para sincronizar formulário ↔ canvas. */
export const LH_ID = {
  LOGO: 'lh-logo',
  RULE_TOP: 'lh-rule-top',
  TITLE: 'lh-title',
  TAGLINE: 'lh-tagline',
  QR: 'lh-qr',
  BODY: 'lh-body',
  RULE_FOOTER: 'lh-rule-footer',
  FOOTER_ADDR: 'lh-footer-addr',
  FOOTER_CONTACT: 'lh-footer-contact'
} as const;

const LH_PROTECTED_IDS = new Set<string>(Object.values(LH_ID));

/** Elementos do modelo base do timbrado não podem ser removidos com Delete. */
export function isLetterheadProtectedElementId(id: string): boolean {
  return LH_PROTECTED_IDS.has(id);
}

export function seedLetterheadCanvas(
  template: AeroStudioTemplate,
  model: LetterheadFormModel,
  identity: AeroStudioIdentity | null,
  includeQr: boolean
): StudioCanvasDocument {
  const w = template.widthMm;
  const h = template.heightMm;
  const primary = model.primaryColor || '#0ea5e9';
  const secondary = model.secondaryColor || '#1e293b';
  const logoW = 48;
  const logoH = 18;
  const logoX = (w - logoW) / 2;

  const els: StudioCanvasElement[] = [
    {
      id: LH_ID.LOGO,
      type: 'logo',
      x: logoX,
      y: 6,
      width: logoW,
      height: logoH,
      zIndex: 20
    },
    {
      id: LH_ID.RULE_TOP,
      type: 'line',
      x: 4,
      y: 26,
      width: w - 8,
      height: 0.6,
      zIndex: 5,
      strokeColor: primary,
      strokeWidthMm: 0.6
    },
    {
      id: LH_ID.TITLE,
      type: 'text',
      x: 6,
      y: 28,
      width: 72,
      height: 10,
      zIndex: 15,
      text: model.displayName || '—',
      fontSizePt: 14,
      fontWeight: 'bold',
      color: primary,
      textAlign: 'left'
    },
    {
      id: LH_ID.TAGLINE,
      type: 'text',
      x: 80,
      y: 29,
      width: 98,
      height: 9,
      zIndex: 15,
      text: model.tagline || '',
      fontSizePt: 9,
      color: '#555555',
      textAlign: 'left'
    },
    {
      id: LH_ID.BODY,
      type: 'shape',
      shapeKind: 'rect',
      x: 4,
      y: 40,
      width: w - 8,
      height: 228,
      zIndex: 1,
      fill: 'transparent',
      strokeColor: '#dddddd',
      strokeWidthMm: 0.25
    },
    {
      id: LH_ID.RULE_FOOTER,
      type: 'line',
      x: 4,
      y: 272,
      width: w - 8,
      height: 0.6,
      zIndex: 5,
      strokeColor: secondary,
      strokeWidthMm: 0.6
    },
    {
      id: LH_ID.FOOTER_ADDR,
      type: 'text',
      x: 4,
      y: 275,
      width: w - 8,
      height: 6,
      zIndex: 12,
      text: model.endereco || '',
      fontSizePt: 7,
      color: '#555555',
      textAlign: 'center'
    },
    {
      id: LH_ID.FOOTER_CONTACT,
      type: 'text',
      x: 4,
      y: 281,
      width: w - 8,
      height: 6,
      zIndex: 12,
      text: footerContactLine(model),
      fontSizePt: 7,
      color: '#555555',
      textAlign: 'center'
    }
  ];

  if (includeQr) {
    els.push({
      id: LH_ID.QR,
      type: 'qr',
      x: w - 20,
      y: 27,
      width: 14,
      height: 14,
      zIndex: 25
    });
  }

  if (!identity?.logoUrl) {
    return {
      version: 1,
      widthMm: w,
      heightMm: h,
      bleedMm: template.bleedMm,
      backgroundColor: '#ffffff',
      elements: els.filter(e => e.id !== LH_ID.LOGO)
    };
  }

  return {
    version: 1,
    widthMm: w,
    heightMm: h,
    bleedMm: template.bleedMm,
    backgroundColor: '#ffffff',
    elements: els
  };
}

function footerContactLine(model: LetterheadFormModel): string {
  return [model.supportEmail, model.telefone, model.siteUrl].filter(Boolean).join(' · ');
}

export function syncLetterheadCanvasFromModel(
  doc: StudioCanvasDocument,
  model: LetterheadFormModel,
  includeQr: boolean
): StudioCanvasDocument {
  const primary = model.primaryColor || '#0ea5e9';
  const secondary = model.secondaryColor || '#1e293b';
  const next = doc.elements.map(e => ({ ...e }));

  const patch = (id: string, patchFn: (el: StudioCanvasElement) => void): void => {
    const el = next.find(x => x.id === id);
    if (el) patchFn(el);
  };

  patch(LH_ID.TITLE, el => {
    el.text = model.displayName || '—';
    el.color = primary;
  });
  patch(LH_ID.TAGLINE, el => {
    el.text = model.tagline || '';
  });
  patch(LH_ID.FOOTER_ADDR, el => {
    el.text = model.endereco || '';
  });
  patch(LH_ID.FOOTER_CONTACT, el => {
    el.text = footerContactLine(model);
  });
  patch(LH_ID.RULE_TOP, el => {
    el.strokeColor = primary;
  });
  patch(LH_ID.RULE_FOOTER, el => {
    el.strokeColor = secondary;
  });

  let elements = [...next];
  const hasQr = elements.some(e => e.id === LH_ID.QR);
  if (includeQr && !hasQr) {
    elements.push({
      id: LH_ID.QR,
      type: 'qr',
      x: doc.widthMm - 20,
      y: 27,
      width: 14,
      height: 14,
      zIndex: 25
    });
  } else if (!includeQr) {
    elements = elements.filter(e => e.id !== LH_ID.QR);
  }

  return { ...doc, elements };
}

export function syncModelFromLetterheadCanvas(
  doc: StudioCanvasDocument,
  model: LetterheadFormModel
): LetterheadFormModel {
  const getText = (id: string): string | undefined => doc.elements.find(e => e.id === id)?.text;
  return {
    ...model,
    displayName: getText(LH_ID.TITLE) ?? model.displayName,
    tagline: getText(LH_ID.TAGLINE) ?? model.tagline,
    endereco: getText(LH_ID.FOOTER_ADDR) ?? model.endereco
  };
}

export function addLetterheadTextElement(doc: StudioCanvasDocument): StudioCanvasDocument {
  const el: StudioCanvasElement = {
    id: newElementId(),
    type: 'text',
    x: 20,
    y: 50,
    width: 60,
    height: 12,
    zIndex: 30,
    text: '',
    fontSizePt: 10,
    color: '#111111',
    textAlign: 'left'
  };
  return {
    ...doc,
    elements: [...doc.elements.map(e => ({ ...e })), el]
  };
}
