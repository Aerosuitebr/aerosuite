import type { TranslationDictionary } from '../translation.service';

function L(pt: string, en: string, es: string, fr: string, lang: 'pt' | 'en' | 'es' | 'fr'): string {
  switch (lang) {
    case 'pt':
      return pt;
    case 'en':
      return en;
    case 'es':
      return es;
    case 'fr':
      return fr;
  }
}

function dict(lang: 'pt' | 'en' | 'es' | 'fr'): TranslationDictionary {
  return {
    'dossie.title': L(
      'Dossiê de auditoria',
      'Audit dossier',
      'Dosier de auditoría',
      'Dossier d\'audit',
      lang
    ),
    'dossie.subtitle': L(
      'Exporte um PDF consolidado com dados da OS, anexos, movimentos de estoque e trilhas de acesso.',
      'Export a consolidated PDF with WO data, attachments, inventory movements and access trails.',
      'Exporte un PDF con datos de la OS, anexos, movimientos de inventario y trazas de acceso.',
      'Exportez un PDF avec les données OS, pièces jointes, mouvements de stock et traces d\'accès.',
      lang
    ),
    'dossie.osNumber': L('Número da OS', 'WO number', 'Número de OS', 'Numéro OS', lang),
    'dossie.osNumberPh': L('Ex.: 2229', 'E.g. 2229', 'Ej.: 2229', 'Ex. : 2229', lang),
    'dossie.btnPreview': L('Pré-visualizar resumo', 'Preview summary', 'Vista previa del resumen', 'Aperçu du résumé', lang),
    'dossie.btnExport': L('Exportar PDF', 'Export PDF', 'Exportar PDF', 'Exporter PDF', lang),
    'dossie.emptyHint': L(
      'Informe o número da OS e pré-visualize o resumo ou exporte o PDF diretamente.',
      'Enter the WO number and preview the summary or export the PDF directly.',
      'Indique el número de OS y previsualice el resumen o exporte el PDF directamente.',
      'Indiquez le numéro OS, prévisualisez le résumé ou exportez le PDF directement.',
      lang
    ),
    'dossie.resumoTitle': L('Conteúdo do dossiê', 'Dossier contents', 'Contenido del dosier', 'Contenu du dossier', lang),
    'dossie.resumo.anexos': L('Anexos', 'Attachments', 'Anexos', 'Pièces jointes', lang),
    'dossie.resumo.estoque': L('Mov. estoque', 'Stock mov.', 'Mov. inventario', 'Mouv. stock', lang),
    'dossie.resumo.auditoriaOs': L('Auditoria OS', 'WO audit', 'Auditoría OS', 'Audit OS', lang),
    'dossie.resumo.acessoExterno': L('Acesso externo', 'External access', 'Acceso externo', 'Accès externe', lang),
    'dossie.resumo.acessoInterno': L('Acesso interno (tenant)', 'Internal access (tenant)', 'Acceso interno (tenant)', 'Accès interne (tenant)', lang),
    'dossie.err.osRequired': L('Informe o número da OS.', 'Enter the WO number.', 'Indique el número de OS.', 'Indiquez le numéro OS.', lang),
    'dossie.err.notFound': L('OS não encontrada.', 'WO not found.', 'OS no encontrada.', 'OS introuvable.', lang),
    'dossie.err.export': L('Falha ao gerar o PDF.', 'Failed to generate PDF.', 'Error al generar el PDF.', 'Échec de génération du PDF.', lang),
    'dossie.ok.export': L('PDF gerado com sucesso.', 'PDF generated successfully.', 'PDF generado correctamente.', 'PDF généré avec succès.', lang),
    'dossie.linkFromAuditoria': L('Exportar dossiê desta OS', 'Export dossier for this WO', 'Exportar dosier de esta OS', 'Exporter le dossier pour cette OS', lang),
    'dossie.pacote.title': L('Pacote de auditoria (organização)', 'Organization audit package', 'Paquete de auditoría (organización)', 'Paquet d\'audit (organisation)', lang),
    'dossie.pacote.subtitle': L(
      'ZIP com dossiê PDF, CRS (se emitido), anexos binários e pasta sgq/ por OS.',
      'ZIP with dossier PDF, CRS (if issued), binary attachments and sgq/ folder per WO.',
      'ZIP con dosier PDF, CRS (si emitido), anexos binarios y carpeta sgq/ por OS.',
      'ZIP avec dossier PDF, CRS (si émis), pièces jointes binaires et dossier sgq/ par OS.',
      lang
    ),
    'dossie.pacote.sgqHint': L(
      'O pacote inclui sgq/resumo.csv e sgq/snapshot.json (NC, treinos, calibração, documentos controlados e ASL).',
      'The package includes sgq/resumo.csv and sgq/snapshot.json (NCs, training, calibration, controlled docs and ASL).',
      'El paquete incluye sgq/resumo.csv y sgq/snapshot.json (NC, formación, calibración, documentos controlados y ASL).',
      'Le paquet inclut sgq/resumo.csv et sgq/snapshot.json (NC, formations, étalonnage, documents maîtrisés et ASL).',
      lang
    ),
    'dossie.pacote.dataInicio': L('Abertura a partir de', 'Opened from', 'Apertura desde', 'Ouverture à partir du', lang),
    'dossie.pacote.dataFim': L('Abertura até', 'Opened until', 'Apertura hasta', 'Ouverture jusqu\'au', lang),
    'dossie.pacote.limite': L('Máx. OS no pacote', 'Max WOs in package', 'Máx. OS en paquete', 'Max OS dans le paquet', lang),
    'dossie.pacote.numeros': L('Números OS (opcional, separados por vírgula)', 'WO numbers (optional, comma-separated)', 'Números OS (opcional, separados por coma)', 'Numéros OS (facultatif, séparés par virgule)', lang),
    'dossie.pacote.btnPreview': L('Pré-visualizar pacote', 'Preview package', 'Vista previa del paquete', 'Aperçu du paquet', lang),
    'dossie.pacote.btnZip': L('Baixar ZIP', 'Download ZIP', 'Descargar ZIP', 'Télécharger ZIP', lang),
    'dossie.pacote.previewCount': L('{{count}} OS serão incluídas (limite {{max}})', '{{count}} WOs included (limit {{max}})', '{{count}} OS incluidas (límite {{max}})', '{{count}} OS incluses (limite {{max}})', lang),
    'dossie.pacote.previewLine': L(
      'OS {{numero}} — {{cliente}} · {{anexos}} anexo(s){{crs}}',
      'WO {{numero}} — {{cliente}} · {{anexos}} attachment(s){{crs}}',
      'OS {{numero}} — {{cliente}} · {{anexos}} anexo(s){{crs}}',
      'OS {{numero}} — {{cliente}} · {{anexos}} pièce(s) jointe(s){{crs}}',
      lang
    ),
    'dossie.pacote.previewCrsSuffix': L(' · CRS emitido', ' · CRS issued', ' · CRS emitido', ' · CRS émis', lang),
    'dossie.pacote.ok.zip': L('Pacote ZIP gerado.', 'ZIP package generated.', 'Paquete ZIP generado.', 'Paquet ZIP généré.', lang),
    'dossie.pacote.err.zip': L('Falha ao gerar o pacote ZIP.', 'Failed to generate ZIP package.', 'Error al generar el ZIP.', 'Échec de génération du ZIP.', lang)
  };
}

export const DOSSIE_AUDITORIA_PT_BR = dict('pt');
export const DOSSIE_AUDITORIA_EN_US = dict('en');
export const DOSSIE_AUDITORIA_ES_ES = dict('es');
export const DOSSIE_AUDITORIA_FR_FR = dict('fr');
