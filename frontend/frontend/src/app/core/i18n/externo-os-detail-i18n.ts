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
    'externo.osDetail.btnBack': L('Voltar', 'Back', 'Volver', 'Retour', lang),
    'externo.osDetail.loading': L('Carregando detalhes…', 'Loading details…', 'Cargando detalles…', 'Chargement des détails…', lang),
    'externo.osDetail.errorTitle': L('Erro ao carregar', 'Load error', 'Error al cargar', 'Erreur de chargement', lang),
    'externo.osDetail.btnRetry': L('Tentar novamente', 'Try again', 'Intentar de nuevo', 'Réessayer', lang),
    'externo.osDetail.title': L('Ordem de Serviço OS {{id}}', 'Work order WO {{id}}', 'Orden de servicio OS {{id}}', 'Ordre de service OS {{id}}', lang),
    'externo.osDetail.readOnlyBadge': L('Somente visualização', 'Read only', 'Solo lectura', 'Lecture seule', lang),
    'externo.osDetail.section.client': L('Informações do cliente', 'Customer information', 'Información del cliente', 'Informations client', lang),
    'externo.osDetail.field.clientName': L('Nome do cliente', 'Customer name', 'Nombre del cliente', 'Nom du client', lang),
    'externo.osDetail.section.product': L('Informações do produto', 'Product information', 'Información del producto', 'Informations produit', lang),
    'externo.osDetail.field.partNumber': L('Part Number', 'Part number', 'Part number', 'Part number', lang),
    'externo.osDetail.field.serialNumber': L('Serial Number', 'Serial number', 'Número de serie', 'Numéro de série', lang),
    'externo.osDetail.field.manufacturer': L('Fabricante', 'Manufacturer', 'Fabricante', 'Fabricant', lang),
    'externo.osDetail.field.fcuModel': L('Modelo FCU', 'FCU model', 'Modelo FCU', 'Modèle FCU', lang),
    'externo.osDetail.section.service': L('Informações do serviço', 'Service information', 'Información del servicio', 'Informations service', lang),
    'externo.osDetail.field.serviceType': L('Tipo de serviço', 'Service type', 'Tipo de servicio', 'Type de service', lang),
    'externo.osDetail.field.tsn': L('TSN', 'TSN', 'TSN', 'TSN', lang),
    'externo.osDetail.field.tso': L('TSO', 'TSO', 'TSO', 'TSO', lang),
    'externo.osDetail.section.dates': L('Datas', 'Dates', 'Fechas', 'Dates', lang),
    'externo.osDetail.field.openDate': L('Data de abertura', 'Open date', 'Fecha de apertura', 'Date d’ouverture', lang),
    'externo.osDetail.field.conclusionDate': L('Data de conclusão', 'Completion date', 'Fecha de conclusión', 'Date de clôture service', lang),
    'externo.osDetail.field.closeDate': L('Data de fechamento', 'Close date', 'Fecha de cierre', 'Date de fermeture', lang),
    'externo.osDetail.section.manual': L('Informações do manual', 'Manual information', 'Información del manual', 'Informations manuel', lang),
    'externo.osDetail.field.ataManual': L('ATA Manual', 'ATA manual', 'ATA manual', 'ATA manuel', lang),
    'externo.osDetail.field.revNumber': L('Número da revisão', 'Revision number', 'Número de revisión', 'Numéro de révision', lang),
    'externo.osDetail.field.revDate': L('Data revisão manual', 'Manual revision date', 'Fecha revisión manual', 'Date révision manuel', lang),
    'externo.osDetail.section.ads': L('ADS/DAS', 'ADS/DAS', 'ADS/DAS', 'ADS/DAS', lang),
    'externo.osDetail.field.adsDas': L('ADS/DAS', 'ADS/DAS', 'ADS/DAS', 'ADS/DAS', lang),
    'externo.osDetail.field.adsTitle': L('Título ADS', 'ADS title', 'Título ADS', 'Titre ADS', lang),
    'externo.osDetail.field.relatedTitle': L('Título afins', 'Related title', 'Título afines', 'Titre connexe', lang),
    'externo.osDetail.section.observations': L('Observações', 'Notes', 'Observaciones', 'Observations', lang),
    'externo.osDetail.obs.conclusion': L('Observações da conclusão', 'Completion notes', 'Observaciones de conclusión', 'Notes de clôture', lang),
    'externo.osDetail.obs.bulletins': L('Boletins de serviço afins', 'Related service bulletins', 'Boletines de servicio afines', 'Bulletins de service connexes', lang),
    'externo.osDetail.documents.title': L(
      'Documentos disponíveis ({{count}})',
      'Available documents ({{count}})',
      'Documentos disponibles ({{count}})',
      'Documents disponibles ({{count}})',
      lang
    ),
    'externo.osDetail.doc.avulsoTooltip': L(
      'Documento enviado diretamente pelo administrador',
      'Document sent directly by the administrator',
      'Documento enviado directamente por el administrador',
      'Document envoyé directement par l’administrateur',
      lang
    ),
    'externo.osDetail.doc.avulsoBadge': L('Documento avulso', 'Standalone document', 'Documento suelto', 'Document isolé', lang),
    'externo.osDetail.doc.download': L('Baixar documento', 'Download document', 'Descargar documento', 'Télécharger le document', lang),
    'externo.osDetail.doc.view': L('Visualizar documento', 'View document', 'Ver documento', 'Voir le document', lang),
    'externo.osDetail.documents.empty': L(
      'Nenhum documento disponível para esta OS',
      'No documents available for this work order',
      'Ningún documento disponible para esta OS',
      'Aucun document disponible pour cet OS',
      lang
    ),
    'externo.osDetail.docViewer.loading': L('Carregando documento…', 'Loading document…', 'Cargando documento…', 'Chargement du document…', lang),
    'externo.osDetail.error.noOsId': L('ID da OS não informado', 'Work order ID not provided', 'ID de OS no informado', 'ID OS non fourni', lang),
    'externo.osDetail.error.forbidden': L(
      'Você não tem permissão para visualizar esta OS',
      'You do not have permission to view this work order',
      'No tiene permiso para ver esta OS',
      'Vous n’avez pas la permission de voir cet OS',
      lang
    ),
    'externo.osDetail.error.notFound': L(
      'Ordem de serviço não encontrada',
      'Work order not found',
      'Orden de servicio no encontrada',
      'Ordre de service introuvable',
      lang
    ),
    'externo.osDetail.error.loadOs': L(
      'Erro ao carregar os detalhes da ordem de serviço',
      'Could not load work order details',
      'Error al cargar los detalles de la orden de servicio',
      'Erreur lors du chargement des détails de l’ordre de service',
      lang
    ),
    'externo.osDetail.error.noFileRef': L(
      'Documento sem referência ao arquivo',
      'Document has no file reference',
      'Documento sin referencia al archivo',
      'Document sans référence de fichier',
      lang
    ),
    'externo.osDetail.error.loadDoc': L(
      'Erro ao carregar documento. Tente fazer o download.',
      'Could not load document. Try downloading instead.',
      'Error al cargar documento. Intente descargarlo.',
      'Erreur de chargement. Essayez le téléchargement.',
      lang
    ),
    'externo.osDetail.error.loadDocConnection': L(
      'Erro ao carregar documento. Verifique a conexão ou tente o download.',
      'Could not load document. Check your connection or try download.',
      'Error al cargar documento. Verifique la conexión o descargue.',
      'Erreur de chargement. Vérifiez la connexion ou téléchargez.',
      lang
    ),
    'externo.osDetail.timeline.title': L(
      'Acompanhamento da ordem de serviço',
      'Work order progress',
      'Seguimiento de la orden de servicio',
      'Suivi de l’ordre de service',
      lang
    ),
    'externo.osDetail.timeline.open': L('Abertura', 'Opened', 'Apertura', 'Ouverture', lang),
    'externo.osDetail.timeline.conclusion': L('Conclusão do serviço', 'Service completed', 'Conclusión del servicio', 'Clôture du service', lang),
    'externo.osDetail.timeline.close': L('Fechamento', 'Closed', 'Cierre', 'Fermeture', lang),
    'externo.osDetail.timeline.pending': L('Pendente', 'Pending', 'Pendiente', 'En attente', lang),
    'externo.osDetail.propostaOrigin.title': L('Proposta comercial de origem', 'Source commercial proposal', 'Propuesta comercial de origen', 'Proposition commerciale d’origine', lang),
    'externo.osDetail.propostaOrigin.link': L(
      'Ver proposta {{numero}}',
      'View proposal {{numero}}',
      'Ver propuesta {{numero}}',
      'Voir la proposition {{numero}}',
      lang
    ),
  };
}

export const EXTERNO_OS_DETAIL_I18N_PT_BR = dict('pt');
export const EXTERNO_OS_DETAIL_I18N_EN_US = dict('en');
export const EXTERNO_OS_DETAIL_I18N_ES_ES = dict('es');
export const EXTERNO_OS_DETAIL_I18N_FR_FR = dict('fr');
