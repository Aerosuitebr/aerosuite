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
    'aero.diretriz.title': L('AD / SB e alertas', 'AD / SB and alerts', 'AD / SB y alertas', 'AD / SB et alertes', lang),
    'aero.diretriz.subtitle': L(
      'Diretrizes aeronáuticas com prazo de cumprimento e vínculo a FCU/P/N.',
      'Airworthiness directives with compliance deadlines linked to FCU/P/N.',
      'Directivas aeronáuticas con plazo de cumplimiento vinculadas a FCU/P/N.',
      'Directives aéronautiques avec échéance de conformité liées au FCU/P/N.',
      lang
    ),
    'aero.diretriz.alert.vencidas': L('Vencidas', 'Overdue', 'Vencidas', 'En retard', lang),
    'aero.diretriz.alert.proximas': L('Próximas ({{dias}} dias)', 'Upcoming ({{dias}} days)', 'Próximas ({{dias}} días)', 'À venir ({{dias}} jours)', lang),
    'aero.diretriz.alert.abertas': L('Em aberto', 'Open', 'Abiertas', 'Ouvertes', lang),
    'aero.diretriz.hero.kicker': L('Conformidade técnica', 'Technical compliance', 'Conformidad técnica', 'Conformité technique', lang),
    'aero.diretriz.usage.title': L('Para que serve', 'What it is for', 'Para qué sirve', 'À quoi ça sert', lang),
    'aero.diretriz.usage.ariaLabel': L(
      'Orientações de uso do módulo AD/SB',
      'AD/SB module usage guidance',
      'Orientación de uso del módulo AD/SB',
      'Guide d’utilisation du module AD/SB',
      lang
    ),
    'aero.diretriz.usage.p1': L(
      'Registra AD (Airworthiness Directive) e SB (Service Bulletin) com prazo de cumprimento, vinculados a P/N, S/N ou produto aeronáutico (FCU).',
      'Records ADs and SBs with compliance deadlines, linked to P/N, S/N or aeronautical product (FCU).',
      'Registra AD y SB con plazo de cumplimiento, vinculados a P/N, S/N o producto aeronáutico (FCU).',
      'Enregistre les AD et SB avec échéance, liés au P/N, S/N ou produit aéronautique (FCU).',
      lang
    ),
    'aero.diretriz.usage.p2': L(
      'Os cartões no topo mostram vencidas, próximas do prazo (janela configurável) e total em aberto — clique para filtrar a lista.',
      'Top cards show overdue, upcoming (configurable window) and open totals — click to filter the list.',
      'Las tarjetas muestran vencidas, próximas y abiertas — clic para filtrar.',
      'Les cartes affichent en retard, à venir et ouvertes — cliquez pour filtrer.',
      lang
    ),
    'aero.diretriz.usage.p3': L(
      'Na OS ou manutenção, consulte diretrizes aplicáveis ao FCU/P/N antes de liberar a aeronave.',
      'Before release, check applicable directives for the FCU/P/N on the work order.',
      'Antes de liberar, consulte directivas aplicables al FCU/P/N en la OS.',
      'Avant libération, vérifiez les directives applicables au FCU/P/N sur l\'OS.',
      lang
    ),
    'aero.diretriz.searchPlaceholder': L(
      'Buscar por número, título ou emissor…',
      'Search by number, title or issuer…',
      'Buscar por número, título o emisor…',
      'Rechercher par numéro, titre ou émetteur…',
      lang
    ),
    'aero.diretriz.btnSearch': L('Buscar', 'Search', 'Buscar', 'Rechercher', lang),
    'aero.diretriz.metric.hintVencidas': L('Prazo já passou', 'Deadline passed', 'Plazo vencido', 'Échéance dépassée', lang),
    'aero.diretriz.metric.hintProximas': L('Clique para ver na lista', 'Click to view in list', 'Clic para ver en lista', 'Cliquer pour voir', lang),
    'aero.diretriz.metric.hintAbertas': L('Aberta ou em andamento', 'Open or in progress', 'Abierta o en curso', 'Ouverte ou en cours', lang),
    'aero.diretriz.quickFilter.banner': L('Filtro rápido ativo', 'Quick filter active', 'Filtro rápido activo', 'Filtre rapide actif', lang),
    'aero.diretriz.quickFilter.clear': L('Ver todas', 'Show all', 'Ver todas', 'Tout afficher', lang),
    'aero.diretriz.col.acoes': L('Ações', 'Actions', 'Acciones', 'Actions', lang),
    'aero.diretriz.col.tipo': L('Tipo', 'Type', 'Tipo', 'Type', lang),
    'aero.diretriz.col.numero': L('Número', 'Number', 'Número', 'Numéro', lang),
    'aero.diretriz.col.titulo': L('Título', 'Title', 'Título', 'Titre', lang),
    'aero.diretriz.col.limite': L('Prazo', 'Due', 'Plazo', 'Échéance', lang),
    'aero.diretriz.col.status': L('Status', 'Status', 'Estado', 'Statut', lang),
    'aero.diretriz.col.pn': L('P/N', 'P/N', 'P/N', 'P/N', lang),
    'aero.diretriz.btn.novo': L('Nova diretriz', 'New directive', 'Nueva directiva', 'Nouvelle directive', lang),
    'aero.diretriz.btn.editar': L('Editar', 'Edit', 'Editar', 'Modifier', lang),
    'aero.diretriz.dialog.novo': L('Nova AD/SB', 'New AD/SB', 'Nueva AD/SB', 'Nouvelle AD/SB', lang),
    'aero.diretriz.dialog.editar': L('Editar diretriz', 'Edit directive', 'Editar directiva', 'Modifier la directive', lang),
    'aero.diretriz.field.tipo': L('Tipo', 'Type', 'Tipo', 'Type', lang),
    'aero.diretriz.field.numero': L('Número da diretriz', 'Directive number', 'Número de directiva', 'Numéro de directive', lang),
    'aero.diretriz.field.titulo': L('Título', 'Title', 'Título', 'Titre', lang),
    'aero.diretriz.field.emissor': L('Emissor', 'Issuer', 'Emisor', 'Émetteur', lang),
    'aero.diretriz.field.ata': L('ATA', 'ATA', 'ATA', 'ATA', lang),
    'aero.diretriz.field.fcuId': L('FCU', 'FCU', 'FCU', 'FCU', lang),
    'aero.diretriz.field.fcuSearchPh': L(
      'Buscar FCU por código ou descrição…',
      'Search FCU by code or description…',
      'Buscar FCU por código o descripción…',
      'Rechercher un FCU par code ou description…',
      lang
    ),
    'aero.diretriz.field.partNumber': L('Número de peça (P/N)', 'Part number (P/N)', 'Número de pieza (P/N)', 'Numéro de pièce (P/N)', lang),
    'aero.diretriz.field.serialNumber': L('Serial number', 'Serial number', 'Número de serie', 'Numéro de série', lang),
    'aero.diretriz.field.dataEmissao': L('Data emissão', 'Issue date', 'Fecha emisión', 'Date émission', lang),
    'aero.diretriz.field.dataLimite': L('Prazo cumprimento', 'Compliance due', 'Plazo cumplimiento', 'Échéance conformité', lang),
    'aero.diretriz.field.dataCumprimento': L('Data cumprimento', 'Compliance date', 'Fecha cumplimiento', 'Date conformité', lang),
    'aero.diretriz.field.status': L('Status', 'Status', 'Estado', 'Statut', lang),
    'aero.diretriz.field.osCumprimento': L('OS cumprimento (id interno)', 'Compliance WO (internal id)', 'OS cumplimiento (id interno)', 'OS conformité (id interne)', lang),
    'aero.diretriz.field.obs': L('Observações', 'Remarks', 'Observaciones', 'Observations', lang),
    'aero.diretriz.tipo.AD': L('AD', 'AD', 'AD', 'AD', lang),
    'aero.diretriz.tipo.SB': L('SB', 'SB', 'SB', 'SB', lang),
    'aero.diretriz.tipo.OUTRO': L('Outro', 'Other', 'Otro', 'Autre', lang),
    'aero.diretriz.status.ABERTA': L('Aberta', 'Open', 'Abierta', 'Ouverte', lang),
    'aero.diretriz.status.EM_ANDAMENTO': L('Em andamento', 'In progress', 'En curso', 'En cours', lang),
    'aero.diretriz.status.CUMPRIDA': L('Cumprida', 'Complied', 'Cumplida', 'Conforme', lang),
    'aero.diretriz.status.NAO_APLICAVEL': L('Não aplicável', 'Not applicable', 'No aplicable', 'Non applicable', lang),
    'aero.diretriz.sev.VENCIDA': L('Vencida', 'Overdue', 'Vencida', 'En retard', lang),
    'aero.diretriz.sev.PROXIMA': L('Próxima', 'Upcoming', 'Próxima', 'Proche', lang),
    'aero.diretriz.sev.OK': L('OK', 'OK', 'OK', 'OK', lang),
    'aero.diretriz.empty': L('Nenhuma diretriz registrada.', 'No directives registered.', 'Ninguna directiva registrada.', 'Aucune directive enregistrée.', lang),
    'aero.diretriz.toast.salvo': L('Diretriz salva.', 'Directive saved.', 'Directiva guardada.', 'Directive enregistrée.', lang),
    'aero.diretriz.toast.excluido': L('Diretriz excluída.', 'Directive deleted.', 'Directiva eliminada.', 'Directive supprimée.', lang),
    'aero.diretriz.err.salvar': L('Falha ao salvar.', 'Failed to save.', 'Error al guardar.', 'Échec de l\'enregistrement.', lang),
    'aero.diretriz.confirm.excluir': L('Excluir esta diretriz?', 'Delete this directive?', '¿Eliminar esta directiva?', 'Supprimer cette directive ?', lang),
    'aero.diretriz.tooltip.cancelClose': L(
      'Cancelar e fechar',
      'Cancel and close',
      'Cancelar y cerrar',
      'Annuler et fermer',
      lang
    ),
    'aero.diretriz.tooltip.save': L(
      'Salvar AD/SB',
      'Save AD/SB',
      'Guardar AD/SB',
      'Enregistrer AD/SB',
      lang
    ),
    'aero.diretriz.error.id_invalido': L('Identificador inválido.', 'Invalid identifier.', 'Identificador inválido.', 'Identifiant invalide.', lang),
    'aero.diretriz.error.nao_encontrada': L('Diretriz não encontrada.', 'Directive not found.', 'Directiva no encontrada.', 'Directive introuvable.', lang),
    'aero.diretriz.error.payload_vazio': L('Dados não enviados.', 'No data sent.', 'Datos no enviados.', 'Données non envoyées.', lang),
    'aero.diretriz.error.numero_obrigatorio': L('Informe o número da diretriz.', 'Enter the directive number.', 'Indique el número de la directiva.', 'Indiquez le numéro de directive.', lang),
    'aero.diretriz.error.titulo_obrigatorio': L('Informe o título.', 'Enter the title.', 'Indique el título.', 'Indiquez le titre.', lang),
    'aero.diretriz.error.tipo_invalido': L('Tipo inválido.', 'Invalid type.', 'Tipo inválido.', 'Type invalide.', lang),
    'aero.diretriz.error.status_invalido': L('Status inválido.', 'Invalid status.', 'Estado inválido.', 'Statut invalide.', lang),
    'aero.diretriz.error.fcu_invalido': L('Produto aeronáutico (FCU) inválido ou inativo.', 'Invalid or inactive FCU.', 'FCU inválido o inactivo.', 'FCU invalide ou inactif.', lang)
  };
}

export const AERO_DIRETRIZ_PT_BR = dict('pt');
export const AERO_DIRETRIZ_EN_US = dict('en');
export const AERO_DIRETRIZ_ES_ES = dict('es');
export const AERO_DIRETRIZ_FR_FR = dict('fr');
