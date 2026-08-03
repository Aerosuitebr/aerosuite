import { BrandingService } from '../../core/branding.service';
import { brandPalette } from '../../core/brand-colors.util';
import { TranslationService } from '../../core/translation.service';
import { escapeHtml } from '../../estoque/shared/etiqueta-padrao-100x45';
import { getDefaultAppLogoUrlAbsolute } from '../../shared/constants/logo.constant';
import { bustStaticAssetUrl } from '../../../environments/asset-cache-bust';

export interface OsPrintData {
  idOs?: string | number | null;
  clienteNome?: string | null;
  fabricanteNome?: string | null;
  pn?: string | null;
  partNumber?: string | null;
  modelo?: string | null;
  nome?: string | null;
  serialNumber?: string | null;
  tsn?: string | null;
  tso?: string | null;
  tipoServico?: string | null;
  numOsOriginal?: string | null;
  dtAbertura?: string | null;
  dataConclusaoServ?: string | null;
  dataFechamento?: string | null;
  manualPn?: string | null;
  numRevisao?: string | null;
  dataRevManual?: string | null;
  ataManual?: string | null;
  tituloAds?: string | null;
  tituloAfins?: string | null;
  boletinsServAfins?: string | null;
  obsIniServ?: string | null;
  obsConclusaoServ?: string | null;
  obsFimServ?: string | null;
}

export interface OsPrintLabels {
  osHeading: string;
  sectionArticle: string;
  sectionService: string;
  sectionReference: string;
  sectionNotes: string;
  osNumber: string;
  client: string;
  manufacturer: string;
  pn: string;
  model: string;
  name: string;
  serialNumber: string;
  tsn: string;
  tso: string;
  serviceType: string;
  originalOs: string;
  openDate: string;
  conclusionDate: string;
  closeDate: string;
  manualPn: string;
  revNumber: string;
  revDate: string;
  ata: string;
  adsTitle: string;
  relatedTitle: string;
  relatedBulletins: string;
  obsIni: string;
  obsConclusion: string;
  obsEnd: string;
  signatureTechnical: string;
  signatureClient: string;
}

export interface OsPrintContext {
  commercialName: string;
  tagline: string;
  copyrightEntity: string;
  logoUrl: string;
  primaryColor: string;
  primaryColorDeep: string;
  labels: OsPrintLabels;
  locale: string;
  dash: string;
}

function resolveBrandingLogoUrl(logoUrl: string, fallback: string): string {
  const raw = logoUrl?.trim() || fallback;
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
    return raw;
  }
  if (typeof window === 'undefined') {
    return bustStaticAssetUrl(raw.startsWith('/') ? raw : `/${raw}`);
  }
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${window.location.origin}${path}`;
}

function localeForLanguage(lang: string): string {
  if (lang === 'en-US' || lang === 'es-ES' || lang === 'fr-FR') return lang;
  return 'pt-BR';
}

export function buildOsPrintContext(
  i18n: TranslationService,
  branding: BrandingService,
  logoFallback: string
): OsPrintContext {
  const b = branding.snapshot();
  const palette = brandPalette(b.primaryColor);
  const commercialName = escapeHtml(b.commercialName);
  const tagline = escapeHtml(b.commercialTagline);
  const copyrightEntity = escapeHtml(b.copyrightEntity);
  const locale = localeForLanguage(i18n.getCurrentLanguage());
  const dash = escapeHtml(i18n.translate('os.print.empty'));
  const t = (key: string) => escapeHtml(i18n.translate(key));

  return {
    commercialName,
    tagline,
    copyrightEntity,
    logoUrl: resolveBrandingLogoUrl(b.logoUrl, logoFallback),
    primaryColor: palette.primary,
    primaryColorDeep: palette.primaryDeep,
    locale,
    dash,
    labels: {
      osHeading: t('os.print.osHeading'),
      sectionArticle: t('os.print.section.article'),
      sectionService: t('os.print.section.service'),
      sectionReference: t('os.print.section.reference'),
      sectionNotes: t('os.print.section.notes'),
      osNumber: t('os.print.label.osNumber'),
      client: t('os.form.field.client'),
      manufacturer: t('os.form.field.manufacturer'),
      pn: t('os.form.field.pn'),
      model: t('os.form.field.model'),
      name: t('os.form.field.name'),
      serialNumber: t('os.form.field.serialNumber'),
      tsn: t('os.form.field.tsn'),
      tso: t('os.form.field.tso'),
      serviceType: t('os.form.field.serviceType'),
      originalOs: t('os.form.field.originalOs'),
      openDate: t('os.form.field.openDate'),
      conclusionDate: t('os.form.field.conclusionDate'),
      closeDate: t('os.form.field.closeDate'),
      manualPn: t('os.form.field.manualPn'),
      revNumber: t('os.form.field.revNumber'),
      revDate: t('os.form.field.revDate'),
      ata: t('os.form.field.ata'),
      adsTitle: t('os.form.field.adsTitle'),
      relatedTitle: t('os.form.field.relatedTitle'),
      relatedBulletins: t('os.form.field.relatedBulletins'),
      obsIni: t('os.print.label.obsIni'),
      obsConclusion: t('os.print.label.obsConclusion'),
      obsEnd: t('os.print.label.obsEnd'),
      signatureTechnical: t('os.print.signature.technical'),
      signatureClient: t('os.print.signature.client')
    }
  };
}

function formatPrintDate(dateStr: string | null | undefined, locale: string, dash: string): string {
  if (!dateStr) return dash;
  try {
    return new Date(dateStr).toLocaleDateString(locale);
  } catch {
    return escapeHtml(String(dateStr));
  }
}

function val(raw: string | null | undefined, dash: string): string {
  const s = raw != null && String(raw).trim() !== '' ? String(raw).trim() : '';
  return s ? escapeHtml(s) : dash;
}

function infoItem(label: string, value: string, fullWidth = false): string {
  const cls = fullWidth ? 'info-item full-width' : 'info-item';
  const valueCls = fullWidth ? 'info-value' : 'info-value';
  return `<div class="${cls}">
    <div class="info-label">${label}</div>
    <div class="${valueCls}">${value}</div>
  </div>`;
}

function buildPrintStyles(primary: string, primaryDeep: string): string {
  return `
  @page { size: A4; margin: 1.5cm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #333;
    background: white;
  }
  .print-container { max-width: 100%; margin: 0 auto; }
  .print-header {
    border-bottom: 3px solid ${primary};
    padding-bottom: 20px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .header-left { flex: 1; }
  .logo-section { display: flex; align-items: center; gap: 15px; margin-bottom: 10px; }
  .logo-section img { height: 48px; width: auto; max-width: 140px; object-fit: contain; }
  .logo-text { font-size: 22pt; font-weight: bold; color: ${primary}; letter-spacing: 1px; }
  .company-info { font-size: 10pt; color: #666; margin-top: 5px; }
  .os-number { text-align: right; }
  .os-number-label {
    font-size: 10pt; color: #666; text-transform: uppercase;
    letter-spacing: 1px; margin-bottom: 5px;
  }
  .os-number-value { font-size: 36pt; font-weight: bold; color: ${primary}; line-height: 1; }
  .print-section { margin-bottom: 25px; page-break-inside: avoid; }
  .section-title {
    font-size: 14pt; font-weight: bold; color: ${primary};
    border-bottom: 2px solid ${primaryDeep}; padding-bottom: 8px; margin-bottom: 15px;
    text-transform: uppercase; letter-spacing: 1px;
  }
  .info-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 15px; margin-bottom: 15px;
  }
  .info-item { display: flex; flex-direction: column; }
  .info-label {
    font-size: 9pt; color: #666; text-transform: uppercase;
    font-weight: bold; margin-bottom: 4px; letter-spacing: 0.5px;
  }
  .info-value {
    font-size: 11pt; color: #333; padding: 6px 10px; background: #f8f9fa;
    border-left: 3px solid ${primary}; min-height: 30px;
    display: flex; align-items: center;
  }
  .info-item.full-width { grid-column: 1 / -1; }
  .info-item.full-width .info-value { min-height: 60px; }
  .signature-section { margin-top: 50px; page-break-inside: avoid; }
  .signature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-top: 30px; }
  .signature-box { border-top: 2px solid #333; padding-top: 10px; text-align: center; }
  .signature-label { font-size: 10pt; font-weight: bold; color: #333; margin-top: 5px; }
  .print-footer {
    margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;
    text-align: center; font-size: 9pt; color: #666;
  }
  .no-break { page-break-inside: avoid; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .print-section, .no-break { page-break-inside: avoid; }
  }
`;
}

export function buildOsPrintDocument(
  ctx: OsPrintContext,
  os: OsPrintData,
  formattedOsId: string,
  i18n: TranslationService,
  branding: BrandingService
): string {
  const L = ctx.labels;
  const b = branding.snapshot();
  const idEsc = escapeHtml(formattedOsId);
  const pageTitle = escapeHtml(
    i18n.translate('os.print.pageTitle', { id: formattedOsId, brand: b.commercialName })
  );
  const pn = val(os.pn || os.partNumber, ctx.dash);
  const now = new Date();
  const generatedAt = now.toLocaleString(ctx.locale);
  const year = String(now.getFullYear());
  const footerGen = escapeHtml(i18n.translate('os.print.footer.generated', { datetime: generatedAt }));
  const footerCopy = escapeHtml(
    i18n.translate('os.print.footer.copyright', {
      year,
      entity: b.copyrightEntity,
      tagline: b.commercialTagline
    })
  );

  const notesBlock =
    os.obsIniServ || os.obsConclusaoServ || os.obsFimServ
      ? `<div class="print-section no-break">
          <div class="section-title">${L.sectionNotes}</div>
          <div class="info-grid">
            ${
              os.obsIniServ
                ? infoItem(L.obsIni, val(os.obsIniServ, ctx.dash), true)
                : ''
            }
            ${
              os.obsConclusaoServ
                ? infoItem(L.obsConclusion, val(os.obsConclusaoServ, ctx.dash), true)
                : ''
            }
            ${os.obsFimServ ? infoItem(L.obsEnd, val(os.obsFimServ, ctx.dash), true) : ''}
          </div>
        </div>`
      : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${pageTitle}</title>
<style>${buildPrintStyles(ctx.primaryColor, ctx.primaryColorDeep)}</style>
</head>
<body>
<div class="print-container">
  <div class="print-header">
    <div class="header-left">
      <div class="logo-section">
        <img src="${ctx.logoUrl}" alt="${ctx.commercialName}">
        <div>
          <div class="logo-text">${ctx.commercialName}</div>
          <div class="company-info">${ctx.tagline}</div>
        </div>
      </div>
    </div>
    <div class="os-number">
      <div class="os-number-label">${L.osHeading}</div>
      <div class="os-number-value">${idEsc}</div>
    </div>
  </div>

  <div class="print-section no-break">
    <div class="section-title">${L.sectionArticle}</div>
    <div class="info-grid">
      ${infoItem(L.client, val(os.clienteNome, ctx.dash))}
      ${infoItem(L.manufacturer, val(os.fabricanteNome, ctx.dash))}
      ${infoItem(L.pn, pn)}
      ${infoItem(L.model, val(os.modelo, ctx.dash))}
      ${infoItem(L.name, val(os.nome, ctx.dash))}
      ${infoItem(L.serialNumber, val(os.serialNumber, ctx.dash))}
      ${infoItem(L.tsn, val(os.tsn, ctx.dash))}
      ${infoItem(L.tso, val(os.tso, ctx.dash))}
    </div>
  </div>

  <div class="print-section no-break">
    <div class="section-title">${L.sectionService}</div>
    <div class="info-grid">
      ${infoItem(L.osNumber, val(os.idOs != null ? String(os.idOs) : '', ctx.dash))}
      ${infoItem(L.serviceType, val(os.tipoServico, ctx.dash))}
      ${infoItem(L.originalOs, val(os.numOsOriginal, ctx.dash))}
      ${infoItem(L.openDate, formatPrintDate(os.dtAbertura, ctx.locale, ctx.dash))}
      ${infoItem(L.conclusionDate, formatPrintDate(os.dataConclusaoServ, ctx.locale, ctx.dash))}
      ${infoItem(L.closeDate, formatPrintDate(os.dataFechamento, ctx.locale, ctx.dash))}
    </div>
  </div>

  <div class="print-section no-break">
    <div class="section-title">${L.sectionReference}</div>
    <div class="info-grid">
      ${infoItem(L.manualPn, val(os.manualPn, ctx.dash))}
      ${infoItem(L.revNumber, val(os.numRevisao, ctx.dash))}
      ${infoItem(L.revDate, formatPrintDate(os.dataRevManual, ctx.locale, ctx.dash))}
      ${infoItem(L.ata, val(os.ataManual, ctx.dash))}
      ${infoItem(L.adsTitle, val(os.tituloAds, ctx.dash), true)}
      ${infoItem(L.relatedTitle, val(os.tituloAfins, ctx.dash), true)}
      ${infoItem(L.relatedBulletins, val(os.boletinsServAfins, ctx.dash), true)}
    </div>
  </div>

  ${notesBlock}

  <div class="signature-section no-break">
    <div class="signature-grid">
      <div class="signature-box"><div class="signature-label">${L.signatureTechnical}</div></div>
      <div class="signature-box"><div class="signature-label">${L.signatureClient}</div></div>
    </div>
  </div>

  <div class="print-footer">
    <p>${footerGen}</p>
    <p>${footerCopy}</p>
  </div>
</div>
</body>
</html>`;
}
