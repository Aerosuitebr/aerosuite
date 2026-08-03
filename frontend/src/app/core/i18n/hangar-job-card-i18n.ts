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
    'hangar.title': L('Hangar — Job card', 'Hangar — Job card', 'Hangar — Job card', 'Hangar — Fiche de travail', lang),
    'hangar.crsSegregacao.aviso': L(
      'Você registrou execução nesta OS. Por segregação Part 145, outro perfil autorizado (RT/inspetor) deve emitir o CRS.',
      'You logged execution on this WO. Under Part 145 segregation, another authorized profile (AM/inspector) must issue the CRS.',
      'Registró ejecución en esta OS. Por segregación Part 145, otro perfil autorizado (RT/inspector) debe emitir el CRS.',
      'Vous avez enregistré l\'exécution sur cette OS. Selon la ségrégation Part 145, un autre profil autorisé (RT/inspecteur) doit émettre le CRS.',
      lang
    ),
    'hangar.offline.banner': L(
      'Modo offline — dados em cache{{pending}}.',
      'Offline mode — cached data{{pending}}.',
      'Modo sin conexión — datos en caché{{pending}}.',
      'Mode hors ligne — données en cache{{pending}}.',
      lang
    ),
    'hangar.offline.pendingSuffix': L(
      '; {{count}} alteração(ões) aguardando sincronização',
      '; {{count}} change(s) pending sync',
      '; {{count}} cambio(s) pendiente(s) de sincronización',
      '; {{count}} modification(s) en attente de synchronisation',
      lang
    ),
    'hangar.toast.offlineQueued': L(
      'Salvo localmente. Será sincronizado quando a rede voltar.',
      'Saved locally. It will sync when the network is back.',
      'Guardado localmente. Se sincronizará cuando vuelva la red.',
      'Enregistré localement. Synchronisation à la reconnexion.',
      lang
    ),
    'hangar.toast.offlineSyncOk': L(
      '{{count}} alteração(ões) sincronizada(s) com sucesso.',
      '{{count}} change(s) synced successfully.',
      '{{count}} cambio(s) sincronizado(s) correctamente.',
      '{{count}} modification(s) synchronisée(s) avec succès.',
      lang
    ),
    'hangar.toast.offlineSyncPartial': L(
      'Sincronização parcial: {{ok}} ok, {{fail}} falha(s).',
      'Partial sync: {{ok}} ok, {{fail}} failed.',
      'Sincronización parcial: {{ok}} ok, {{fail}} fallo(s).',
      'Synchronisation partielle : {{ok}} ok, {{fail}} échec(s).',
      lang
    ),
    'hangar.offline.syncNow': L(
      'Sincronizar agora',
      'Sync now',
      'Sincronizar ahora',
      'Synchroniser maintenant',
      lang
    ),
    'hangar.offline.pwaHint': L(
      'Instale pelo navegador (Adicionar à tela inicial) para abrir o hangar offline.',
      'Install from the browser (Add to Home Screen) to open hangar offline.',
      'Instale desde el navegador (Añadir a pantalla de inicio) para abrir el hangar sin conexión.',
      'Installez depuis le navigateur (Ajouter à l\'écran d\'accueil) pour ouvrir le hangar hors ligne.',
      lang
    ),
    'hangar.subtitle': L(
      'Consulta e registro no chão de oficina (OS abertas).',
      'Shop-floor lookup and logging (open work orders).',
      'Consulta y registro en taller (OS abiertas).',
      'Consultation et saisie en atelier (OS ouvertes).',
      lang
    ),
    'hangar.search': L('Buscar OS, cliente, matrícula, PN ou SN', 'Search WO, customer, registration, PN or SN', 'Buscar OS, cliente, matrícula, PN o SN', 'Rechercher OS, client, immatriculation, PN ou SN', lang),
    'hangar.empty': L('Nenhuma OS aberta encontrada.', 'No open work orders found.', 'Ninguna OS abierta encontrada.', 'Aucune OS ouverte trouvée.', lang),
    'hangar.list.count': L('{{count}} OS aberta(s)', '{{count}} open work order(s)', '{{count}} OS abierta(s)', '{{count}} OS ouverte(s)', lang),
    'hangar.fase.todo': L('A fazer', 'To do', 'Por hacer', 'À faire', lang),
    'hangar.fase.inProgress': L('Em andamento', 'In progress', 'En curso', 'En cours', lang),
    'hangar.fase.waitingParts': L('Aguardando peça', 'Waiting for parts', 'Esperando pieza', 'En attente de pièce', lang),
    'hangar.fase.done': L('Concluído', 'Completed', 'Completado', 'Terminé', lang),
    'hangar.card.registration': L('Matrícula', 'Registration', 'Matrícula', 'Immatriculation', lang),
    'hangar.card.internalId': L('Ref. interna {{id}}', 'Internal ref. {{id}}', 'Ref. interna {{id}}', 'Réf. interne {{id}}', lang),
    'hangar.card.progress': L('Progresso do job', 'Job progress', 'Progreso del trabajo', 'Progression du travail', lang),
    'hangar.card.opened': L('Aberta em {{date}}', 'Opened on {{date}}', 'Abierta el {{date}}', 'Ouverte le {{date}}', lang),
    'hangar.card.line': L('OS {{numero}} — {{cliente}}', 'WO {{numero}} — {{cliente}}', 'OS {{numero}} — {{cliente}}', 'OS {{numero}} — {{cliente}}', lang),
    'hangar.back': L('Voltar à lista', 'Back to list', 'Volver a la lista', 'Retour à la liste', lang),
    'hangar.tab.execucao': L('Execução', 'Execution', 'Ejecución', 'Exécution', lang),
    'hangar.tab.horas': L('Horas', 'Hours', 'Horas', 'Heures', lang),
    'hangar.tab.fotos': L('Fotos', 'Photos', 'Fotos', 'Photos', lang),
    'hangar.tab.assinatura': L('Assinatura', 'Signature', 'Firma', 'Signature', lang),
    'hangar.field.inicio': L('Início do serviço', 'Service start', 'Inicio del servicio', 'Début du service', lang),
    'hangar.field.fim': L('Fim do serviço', 'Service end', 'Fin del servicio', 'Fin du service', lang),
    'hangar.field.obsIni': L('Obs. início', 'Start remarks', 'Obs. inicio', 'Obs. début', lang),
    'hangar.field.obsFim': L('Obs. conclusão', 'Completion remarks', 'Obs. cierre', 'Obs. fin', lang),
    'hangar.btn.salvarExecucao': L('Salvar execução', 'Save execution', 'Guardar ejecución', 'Enregistrer exécution', lang),
    'hangar.horas.total': L('Total registrado', 'Total logged', 'Total registrado', 'Total enregistré', lang),
    'hangar.horas.data': L('Data do trabalho', 'Work date', 'Fecha del trabajo', 'Date du travail', lang),
    'hangar.horas.qtd': L('Horas', 'Hours', 'Horas', 'Heures', lang),
    'hangar.horas.desc': L('Descrição', 'Description', 'Descripción', 'Description', lang),
    'hangar.horas.ferramenta': L('Ferramenta / instrumento', 'Tool / instrument', 'Herramienta / instrumento', 'Outil / instrument', lang),
    'hangar.horas.ferramentaPh': L('Tag ou código calibrado (opcional)', 'Calibrated tag or code (optional)', 'Etiqueta o código calibrado (opcional)', 'Étiquette ou code étalonné (facultatif)', lang),
    'hangar.btn.addHoras': L('Registrar horas', 'Log hours', 'Registrar horas', 'Enregistrer heures', lang),
    'hangar.fotos.hint': L('Fotos da OS (câmera ou galeria).', 'WO photos (camera or gallery).', 'Fotos de la OS (cámara o galería).', 'Photos OS (appareil ou galerie).', lang),
    'hangar.btn.foto': L('Enviar foto', 'Upload photo', 'Enviar foto', 'Envoyer photo', lang),
    'hangar.assinatura.exec': L('Mecânico / execução', 'Mechanic / execution', 'Mecánico / ejecución', 'Mécanicien / exécution', lang),
    'hangar.assinatura.insp': L('Inspeção', 'Inspection', 'Inspección', 'Inspection', lang),
    'hangar.assinatura.clear': L('Limpar', 'Clear', 'Limpiar', 'Effacer', lang),
    'hangar.assinatura.save': L('Salvar assinatura', 'Save signature', 'Guardar firma', 'Enregistrer signature', lang),
    'hangar.assinatura.ok': L('Assinatura registrada', 'Signature saved', 'Firma registrada', 'Signature enregistrée', lang),
    'hangar.assinatura.hash': L('SHA-256', 'SHA-256', 'SHA-256', 'SHA-256', lang),
    'hangar.assinatura.serverTs': L('Carimbo servidor', 'Server timestamp', 'Sello del servidor', 'Horodatage serveur', lang),
    'hangar.assinatura.integridadeOk': L('Integridade verificada', 'Integrity verified', 'Integridad verificada', 'Intégrité vérifiée', lang),
    'hangar.assinatura.integridadeFail': L('Integridade comprometida', 'Integrity compromised', 'Integridad comprometida', 'Intégrité compromise', lang),
    'hangar.toast.execucao': L('Dados de execução salvos.', 'Execution data saved.', 'Datos de ejecución guardados.', 'Données d\'exécution enregistrées.', lang),
    'hangar.toast.horas': L('Horas registradas.', 'Hours logged.', 'Horas registradas.', 'Heures enregistrées.', lang),
    'hangar.toast.foto': L('Foto enviada.', 'Photo uploaded.', 'Foto enviada.', 'Photo envoyée.', lang),
    'hangar.err.load': L('Falha ao carregar.', 'Failed to load.', 'Error al cargar.', 'Échec du chargement.', lang),
    'hangar.err.save': L('Falha ao salvar.', 'Failed to save.', 'Error al guardar.', 'Échec de l\'enregistrement.', lang),
    'hangar.jobcard.error.horas_invalidas': L('Informe horas válidas.', 'Enter valid hours.', 'Indique horas válidas.', 'Indiquez des heures valides.', lang),
    'hangar.jobcard.error.data_obrigatoria': L('Informe a data do trabalho.', 'Enter the work date.', 'Indique la fecha del trabajo.', 'Indiquez la date du travail.', lang),
    'hangar.jobcard.error.assinatura_vazia': L('Desenhe a assinatura antes de salvar.', 'Draw the signature before saving.', 'Dibuje la firma antes de guardar.', 'Dessinez la signature avant d\'enregistrer.', lang),
    'hangar.jobcard.error.papel_obrigatorio': L('Informe o papel da assinatura.', 'Enter the signature role.', 'Indique el rol de la firma.', 'Indiquez le rôle de la signature.', lang),
    'hangar.jobcard.error.papel_invalido': L('Papel de assinatura inválido.', 'Invalid signature role.', 'Rol de firma inválido.', 'Rôle de signature invalide.', lang),
    'hangar.jobcard.error.assinatura_grande': L('Assinatura muito grande.', 'Signature file too large.', 'Firma demasiado grande.', 'Signature trop volumineuse.', lang),
    'hangar.jobcard.error.os_invalida': L('OS inválida.', 'Invalid work order.', 'OS inválida.', 'OS invalide.', lang),
    'hangar.jobcard.error.os_nao_encontrada': L('OS não encontrada.', 'Work order not found.', 'OS no encontrada.', 'OS introuvable.', lang),
    'hangar.jobcard.error.assinatura_invalida': L('Assinatura inválida.', 'Invalid signature.', 'Firma inválida.', 'Signature invalide.', lang)
  };
}

export const HANGAR_JOB_CARD_PT_BR = dict('pt');
export const HANGAR_JOB_CARD_EN_US = dict('en');
export const HANGAR_JOB_CARD_ES_ES = dict('es');
export const HANGAR_JOB_CARD_FR_FR = dict('fr');
