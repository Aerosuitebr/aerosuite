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
    'hangar.board.help': L('Arraste pela alça para uma coluna destacada ou use o botão no cartão. A conclusão exige as duas assinaturas; pendências de peças são tratadas no detalhe da OS. Movimentações exigem conexão.', 'Drag the handle to a highlighted column or use the card button. Completion requires both signatures; manage parts issues in the work-order detail. Moving requires a connection.', 'Arrastre el asa a una columna destacada o use el botón. Completar requiere ambas firmas; gestione piezas en el detalle. Se necesita conexión.', 'Glissez la poignée vers une colonne surlignée ou utilisez le bouton. Les deux signatures sont requises pour terminer ; gérez les pièces dans le détail. Une connexion est nécessaire.', lang),
    'hangar.board.toggle': L('Expandir ou recolher coluna vazia', 'Expand or collapse empty column', 'Expandir o contraer columna vacía', 'Développer ou réduire la colonne vide', lang),
    'hangar.board.drag': L('Arrastar', 'Drag', 'Arrastrar', 'Glisser', lang),
    'hangar.board.start': L('Iniciar execução', 'Start work', 'Iniciar ejecución', 'Démarrer', lang),
    'hangar.board.finish': L('Concluir execução', 'Complete work', 'Completar ejecución', 'Terminer', lang),
    'hangar.board.overdue': L('Prazo vencido', 'Overdue', 'Plazo vencido', 'Échéance dépassée', lang),
    'hangar.board.moved': L('OS movimentada.', 'Work order moved.', 'OS movida.', 'OT déplacé.', lang),
    'hangar.board.failed': L('Não foi possível mover. O quadro foi atualizado; confira as pendências e tente novamente.', 'Unable to move. The board was refreshed; check requirements and try again.', 'No se pudo mover. Revise los requisitos e intente de nuevo.', 'Déplacement impossible. Vérifiez les exigences et réessayez.', lang),
    'hangar.signature.pending': L('Aguardando sincronização', 'Awaiting sync', 'Pendiente de sincronización', 'Synchronisation en attente', lang),
    'hangar.signature.pendingHelp': L('Rubrica guardada neste dispositivo. Autor e horário serão confirmados pelo servidor após sincronizar.', 'Signature stored on this device. The server will confirm author and time after synchronization.', 'Firma guardada en este dispositivo. El servidor confirmará autor y hora al sincronizar.', 'Signature enregistrée sur cet appareil. Le serveur confirmera l’auteur et l’heure après synchronisation.', lang),
    'hangar.signature.editing': L('Nova assinatura em edição', 'Editing new signature', 'Editando nueva firma', 'Nouvelle signature en cours', lang),
    'hangar.signature.waiting': L('Aguardando assinatura', 'Awaiting signature', 'Pendiente de firma', 'Signature en attente', lang),
    'hangar.signature.replace': L('Assinar novamente', 'Sign again', 'Firmar de nuevo', 'Signer à nouveau', lang),
    'hangar.signature.replaceConfirm': L('A assinatura atual será mantida até salvar a nova. Deseja abrir uma nova captura?', 'The current signature remains until the new one is saved. Open a new capture?', 'La firma actual se mantiene hasta guardar la nueva. ¿Abrir una nueva captura?', 'La signature actuelle reste conservée jusqu’à l’enregistrement de la nouvelle. Ouvrir une nouvelle saisie ?', lang),
    'hangar.signature.drawHint': L('Desenhe sua assinatura aqui', 'Draw your signature here', 'Dibuje su firma aquí', 'Dessinez votre signature ici', lang),
    'hangar.signature.cancel': L('Cancelar', 'Cancel', 'Cancelar', 'Annuler', lang),
    'hangar.signature.clearTitle': L('Limpar desenho?', 'Clear drawing?', '¿Borrar el dibujo?', 'Effacer le dessin ?', lang),
    'hangar.signature.clearConfirm': L('O desenho ainda não salvo será apagado. Deseja continuar?', 'The unsaved drawing will be erased. Continue?', 'Se borrará el dibujo sin guardar. ¿Continuar?', 'Le dessin non enregistré sera effacé. Continuer ?', lang),
    'hangar.signature.discardConfirm': L('Descartar o novo desenho e manter a assinatura salva?', 'Discard the new drawing and keep the saved signature?', '¿Descartar el nuevo dibujo y mantener la firma guardada?', 'Abandonner le nouveau dessin et conserver la signature enregistrée ?', lang),
    'hangar.signature.discard': L('Descartar desenho', 'Discard drawing', 'Descartar dibujo', 'Abandonner le dessin', lang),
    'hangar.signature.continue': L('Continuar assinando', 'Keep signing', 'Seguir firmando', 'Continuer à signer', lang),
    'hangar.signature.integrity': L('Ver dados de integridade', 'View integrity data', 'Ver datos de integridad', 'Voir les données d’intégrité', lang),
    'hangar.hours.filtered': L('Horas registradas no recorte', 'Registered hours in this view', 'Horas registradas en esta vista', 'Heures enregistrées dans cette vue', lang),
    'hangar.hours.records': L('registros no recorte', 'records in this view', 'registros en esta vista', 'enregistrements dans cette vue', lang),
    'hangar.hours.user': L('Colaborador', 'Contributor', 'Colaborador', 'Collaborateur', lang),
    'hangar.hours.all': L('Todos', 'All', 'Todos', 'Tous', lang),
    'hangar.hours.group': L('Agrupar registros', 'Group records', 'Agrupar registros', 'Regrouper les enregistrements', lang),
    'hangar.hours.ungrouped': L('Sem agrupamento', 'No grouping', 'Sin agrupación', 'Sans regroupement', lang),
    'hangar.hours.byDay': L('Por dia', 'By day', 'Por día', 'Par jour', lang),
    'hangar.hours.byUser': L('Por colaborador', 'By contributor', 'Por colaborador', 'Par collaborateur', lang),
    'hangar.hours.clear': L('Limpar filtros', 'Clear filters', 'Limpiar filtros', 'Effacer les filtres', lang),
    'hangar.hours.history': L('Histórico de horas', 'Hours history', 'Historial de horas', 'Historique des heures', lang),
    'hangar.hours.duration': L('Duração', 'Duration', 'Duración', 'Durée', lang),
    'hangar.hours.state': L('Estado', 'State', 'Estado', 'État', lang),
    'hangar.hours.registered': L('Registrado no servidor', 'Recorded on server', 'Registrado en el servidor', 'Enregistré sur le serveur', lang),
    'hangar.hours.pendingShort': L('pendentes', 'pending', 'pendientes', 'en attente', lang),
    'hangar.hours.pendingUser': L('A confirmar após sincronizar', 'Confirmed after sync', 'Por confirmar al sincronizar', 'À confirmer après synchronisation', lang),
    'hangar.hours.unknownUser': L('Colaborador não informado', 'Contributor not specified', 'Colaborador no informado', 'Collaborateur non renseigné', lang),
    'hangar.hours.noResults': L('Nenhum registro para os filtros selecionados.', 'No records match these filters.', 'Sin registros para estos filtros.', 'Aucun enregistrement pour ces filtres.', lang),
    'hangar.hours.empty': L('Nenhuma hora registrada. Use o formulário abaixo para adicionar o primeiro bloco de trabalho.', 'No hours recorded. Use the form below to add the first work block.', 'Sin horas registradas. Use el formulario para añadir el primer bloque de trabajo.', 'Aucune heure enregistrée. Utilisez le formulaire pour ajouter le premier bloc de travail.', lang),
    'hangar.execution.state': L('Marcos registrados', 'Recorded milestones', 'Hitos registrados', 'Jalons enregistrés', lang),
    'hangar.execution.endRecorded': L('Término informado', 'End recorded', 'Fin informado', 'Fin renseignée', lang),
    'hangar.execution.started': L('Início informado', 'Start recorded', 'Inicio informado', 'Début renseigné', lang),
    'hangar.execution.waiting': L('Aguardando início', 'Awaiting start', 'Pendiente de inicio', 'En attente de démarrage', lang),
    'hangar.execution.origin': L('Origem do registro', 'Record source', 'Origen del registro', 'Origine de l’enregistrement', lang),
    'hangar.execution.help': L('Registre o início agora e preencha a conclusão ao finalizar o trabalho. O botão abaixo salva os dois blocos.', 'Record the start now and fill in completion when work is finished. The button below saves both sections.', 'Registre el inicio y complete el cierre al finalizar el trabajo. El botón guarda ambos bloques.', 'Renseignez le début puis la fin lorsque le travail est terminé. Le bouton enregistre les deux blocs.', lang),
    'hangar.execution.startBlock': L('Início do serviço', 'Service start', 'Inicio del servicio', 'Début du service', lang),
    'hangar.execution.endBlock': L('Conclusão do serviço', 'Service completion', 'Conclusión del servicio', 'Fin du service', lang),
    'hangar.execution.milestoneHint': L('Data, horário ou descrição do marco do serviço', 'Date, time or description of the service milestone', 'Fecha, hora o descripción del hito del servicio', 'Date, heure ou description du jalon du service', lang),
    'hangar.execution.saving': L('Salvando os dois blocos…', 'Saving both sections…', 'Guardando ambos bloques…', 'Enregistrement des deux blocs…', lang),
    'hangar.execution.unsaved': L('Alterações ainda não salvas', 'Unsaved changes', 'Cambios sin guardar', 'Modifications non enregistrées', lang),
    'hangar.execution.saved': L('Execução salva no servidor', 'Execution saved on server', 'Ejecución guardada en el servidor', 'Exécution enregistrée sur le serveur', lang),
    'hangar.execution.upToDate': L('Dados carregados · sem alterações', 'Data loaded · no changes', 'Datos cargados · sin cambios', 'Données chargées · aucune modification', lang),
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
