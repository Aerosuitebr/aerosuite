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
    'suporte.layout.brandUser': L('Central de Suporte', 'Support center', 'Centro de soporte', 'Centre de support', lang),
    'suporte.layout.brandAgent': L('Central de Atendimento', 'Service desk', 'Centro de atención', 'Centre de service', lang),
    'suporte.layout.taglineUser': L(
      'Acompanhe chamados e fale com nossa equipe',
      'Track tickets and reach our team',
      'Siga tickets y contacte al equipo',
      'Suivez les tickets et contactez l’équipe',
      lang
    ),
    'suporte.layout.taglineAgent': L(
      'Fila, SLA e resolução em um só lugar',
      'Queue, SLA and resolution in one place',
      'Cola, SLA y resolución en un solo lugar',
      'File, SLA et résolution au même endroit',
      lang
    ),
    'suporte.layout.agentDesk': L('Fila de atendimento', 'Service queue', 'Cola de atención', 'File d’attente', lang),
    'suporte.layout.myAssigned': L('Meus assumidos', 'My assigned', 'Mis asignados', 'Mes assignés', lang),
    'suporte.layout.backPortal': L('Área do solicitante', 'Requester area', 'Área del solicitante', 'Espace demandeur', lang),
    'suporte.layout.trustTitle': L('Atendimento dedicado', 'Dedicated support', 'Atención dedicada', 'Support dédié', lang),
    'suporte.layout.trustSla': L('SLA por prioridade', 'SLA by priority', 'SLA por prioridad', 'SLA par priorité', lang),
    'suporte.layout.trustTrack': L('Rastreio por número', 'Track by ticket number', 'Seguimiento por número', 'Suivi par numéro', lang),

    'suporte.ticketList.heroTitle': L('Como podemos ajudar?', 'How can we help?', '¿Cómo podemos ayudar?', 'Comment pouvons-nous aider ?', lang),
    'suporte.ticketList.heroSubtitle': L(
      'Abra um chamado com contexto e anexos. Acompanhe cada etapa até a resolução.',
      'Open a ticket with context and attachments. Follow every step until resolution.',
      'Abra un ticket con contexto y adjuntos. Siga cada paso hasta la resolución.',
      'Ouvrez un ticket avec contexte et pièces jointes. Suivez chaque étape jusqu’à la résolution.',
      lang
    ),
    'suporte.ticketList.scopeMine': L('Exibindo apenas seus chamados', 'Showing only your tickets', 'Mostrando solo sus tickets', 'Affichage de vos tickets uniquement', lang),
    'suporte.ticketList.pageReport': L(
      '{first} - {last} de {totalRecords}',
      '{first} - {last} of {totalRecords}',
      '{first} - {last} de {totalRecords}',
      '{first} - {last} sur {totalRecords}',
      lang
    ),

    'suporte.atendimentoList.heroKicker': L('Operação', 'Operations', 'Operación', 'Opérations', lang),
    'suporte.atendimentoList.stat.totalActive': L('Ativos', 'Active', 'Activos', 'Actifs', lang),
    'suporte.atendimentoList.stat.unassigned': L('Sem atendente', 'Unassigned', 'Sin agente', 'Non assignés', lang),
    'suporte.atendimentoList.stat.myQueue': L('Meus em fila', 'My in progress', 'Mis en curso', 'Mes en cours', lang),
    'suporte.atendimentoList.stat.myAssigned': L('Atribuídos a mim', 'Assigned to me', 'Asignados a mí', 'Assignés à moi', lang),
    'suporte.atendimentoList.stat.resolved': L('Resolvidos', 'Resolved', 'Resueltos', 'Résolus', lang),
    'suporte.atendimentoList.panelQueue': L('Fila de chamados', 'Ticket queue', 'Cola de tickets', 'File des tickets', lang),
    'suporte.atendimentoList.loading': L('Carregando fila...', 'Loading queue...', 'Cargando cola...', 'Chargement de la file...', lang),
    'suporte.atendimentoList.empty.filters': L(
      'Tente ajustar os filtros de busca.',
      'Try adjusting your search filters.',
      'Intente ajustar los filtros.',
      'Essayez d’ajuster les filtres.',
      lang
    ),
    'suporte.atendimentoList.empty.clear': L(
      'Nenhum chamado pendente na fila.',
      'No pending tickets in the queue.',
      'Ningún ticket pendiente en la cola.',
      'Aucun ticket en attente dans la file.',
      lang
    ),
    'suporte.atendimentoList.sla.breached': L('SLA estourado', 'SLA breached', 'SLA incumplido', 'SLA dépassé', lang),
    'suporte.atendimentoList.sla.firstResponse': L('primeira resposta', 'first response', 'primera respuesta', 'première réponse', lang),
    'suporte.atendimentoList.sla.resolution': L('resolução', 'resolution', 'resolución', 'résolution', lang),

    'suporte.ticketNew.title': L('Abrir chamado', 'Open ticket', 'Abrir ticket', 'Ouvrir un ticket', lang),
    'suporte.ticketNew.subtitle': L(
      'Descreva o problema com o máximo de detalhes para agilizar o atendimento.',
      'Describe the issue in detail to speed up resolution.',
      'Describa el problema con detalle para agilizar la atención.',
      'Décrivez le problème en détail pour accélérer le traitement.',
      lang
    ),
    'suporte.ticketNew.cancel': L('Cancelar', 'Cancel', 'Cancelar', 'Annuler', lang),
    'suporte.ticketNew.submit': L('Enviar chamado', 'Submit ticket', 'Enviar ticket', 'Envoyer le ticket', lang),
    'suporte.ticketNew.section.classification': L('Classificação', 'Classification', 'Clasificación', 'Classification', lang),
    'suporte.ticketNew.section.classificationHint': L(
      'Tipo e urgência definem o SLA de resposta.',
      'Type and urgency define the response SLA.',
      'El tipo y la urgencia definen el SLA.',
      'Le type et l’urgence définissent le SLA.',
      lang
    ),
    'suporte.ticketNew.section.details': L('Detalhes do chamado', 'Ticket details', 'Detalles del ticket', 'Détails du ticket', lang),
    'suporte.ticketNew.section.detailsHint': L(
      'Título claro e descrição objetiva.',
      'Clear title and objective description.',
      'Título claro y descripción objetiva.',
      'Titre clair et description objective.',
      lang
    ),
    'suporte.ticketNew.section.bug': L('Informações técnicas', 'Technical information', 'Información técnica', 'Informations techniques', lang),
    'suporte.ticketNew.section.bugHint': L(
      'Obrigatório para erros e melhorias.',
      'Required for bugs and improvements.',
      'Obligatorio para errores y mejoras.',
      'Obligatoire pour bugs et améliorations.',
      lang
    ),
    'suporte.ticketNew.section.attachments': L('Anexos', 'Attachments', 'Adjuntos', 'Pièces jointes', lang),
    'suporte.ticketNew.section.attachmentsHint': L(
      'Capturas, logs ou documentos (máx. 10 MB).',
      'Screenshots, logs or documents (max 10 MB).',
      'Capturas, logs o documentos (máx. 10 MB).',
      'Captures, logs ou documents (max. 10 Mo).',
      lang
    ),
    'suporte.ticketNew.label.type': L('Tipo do chamado', 'Ticket type', 'Tipo de ticket', 'Type de ticket', lang),
    'suporte.ticketNew.label.priority': L('Prioridade', 'Priority', 'Prioridad', 'Priorité', lang),
    'suporte.ticketNew.label.category': L('Categoria', 'Category', 'Categoría', 'Catégorie', lang),
    'suporte.ticketNew.label.title': L('Título', 'Title', 'Título', 'Titre', lang),
    'suporte.ticketNew.label.description': L('Descrição', 'Description', 'Descripción', 'Description', lang),
    'suporte.ticketNew.label.steps': L('Passos para reproduzir', 'Steps to reproduce', 'Pasos para reproducir', 'Étapes pour reproduire', lang),
    'suporte.ticketNew.label.expected': L('Comportamento esperado', 'Expected behavior', 'Comportamiento esperado', 'Comportement attendu', lang),
    'suporte.ticketNew.label.actual': L('Comportamento atual', 'Actual behavior', 'Comportamiento actual', 'Comportement actuel', lang),
    'suporte.ticketNew.label.environment': L('Ambiente', 'Environment', 'Entorno', 'Environnement', lang),
    'suporte.ticketNew.placeholder.title': L(
      'Resumo do problema em uma linha',
      'One-line summary of the issue',
      'Resumen del problema en una línea',
      'Résumé du problème en une ligne',
      lang
    ),
    'suporte.ticketNew.placeholder.description': L(
      'O que aconteceu? Quando? Qual impacto?',
      'What happened? When? What is the impact?',
      '¿Qué pasó? ¿Cuándo? ¿Qué impacto?',
      'Que s’est-il passé ? Quand ? Quel impact ?',
      lang
    ),
    'suporte.ticketNew.dropzone': L(
      'Arraste arquivos ou clique para selecionar',
      'Drag files or click to select',
      'Arrastre archivos o haga clic',
      'Glissez des fichiers ou cliquez',
      lang
    ),
    'suporte.ticketNew.required': L('obrigatório', 'required', 'obligatorio', 'obligatoire', lang),
    'suporte.ticketNew.sidebar.title': L('Antes de enviar', 'Before you submit', 'Antes de enviar', 'Avant d’envoyer', lang),
    'suporte.ticketNew.sidebar.tip1': L(
      'Inclua prints ou logs quando possível.',
      'Include screenshots or logs when possible.',
      'Incluya capturas o logs cuando sea posible.',
      'Incluez des captures ou logs si possible.',
      lang
    ),
    'suporte.ticketNew.sidebar.tip2': L(
      'Chamados críticos têm SLA de 4h para primeira resposta.',
      'Critical tickets have a 4h first-response SLA.',
      'Los tickets críticos tienen SLA de 4 h.',
      'Les tickets critiques ont un SLA de 4 h.',
      lang
    ),
    'suporte.ticketNew.sidebar.tip3': L(
      'Você receberá o número do chamado por e-mail.',
      'You will receive the ticket number by email.',
      'Recibirá el número del ticket por correo.',
      'Vous recevrez le numéro par e-mail.',
      lang
    ),

    'suporte.ticketNew.placeholder.steps': L(
      '1. Acessar a tela X\n2. Clicar no botão Y\n3. ...',
      '1. Open screen X\n2. Click button Y\n3. ...',
      '1. Abrir la pantalla X\n2. Hacer clic en el botón Y\n3. ...',
      '1. Ouvrir l’écran X\n2. Cliquer sur le bouton Y\n3. ...',
      lang
    ),
    'suporte.ticketNew.attach.maxSize': L('Máximo 10 MB por arquivo', 'Maximum 10 MB per file', 'Máximo 10 MB por archivo', 'Maximum 10 Mo par fichier', lang),
    'suporte.ticketNew.sla.title': L('Tempo de resposta', 'Response time', 'Tiempo de respuesta', 'Délai de réponse', lang),
    'suporte.ticketNew.sla.critical': L('Resposta em 1 h | Resolução em 4 h', 'Response in 1 h | Resolution in 4 h', 'Respuesta en 1 h | Resolución en 4 h', 'Réponse en 1 h | Résolution en 4 h', lang),
    'suporte.ticketNew.sla.high': L('Resposta em 4 h | Resolução em 24 h', 'Response in 4 h | Resolution in 24 h', 'Respuesta en 4 h | Resolución en 24 h', 'Réponse en 4 h | Résolution en 24 h', lang),
    'suporte.ticketNew.sla.medium': L('Resposta em 8 h | Resolução em 48 h', 'Response in 8 h | Resolution in 48 h', 'Respuesta en 8 h | Resolución en 48 h', 'Réponse en 8 h | Résolution en 48 h', lang),
    'suporte.ticketNew.sla.low': L('Resposta em 24 h | Resolução em 72 h', 'Response in 24 h | Resolution in 72 h', 'Respuesta en 24 h | Resolución en 72 h', 'Réponse en 24 h | Résolution en 72 h', lang),
    'suporte.ticketNew.sla.line': L(
      'Resposta em {{first}} | Resolução em {{resolution}}',
      'Response in {{first}} | Resolution in {{resolution}}',
      'Respuesta en {{first}} | Resolución en {{resolution}}',
      'Réponse en {{first}} | Résolution en {{resolution}}',
      lang
    ),
    'suporte.ticketNew.sla.priorityHint': L(
      'Prazos calculados com base na prioridade, ambiente e categoria.',
      'Deadlines are calculated from priority, environment and category.',
      'Los plazos se calculan según prioridad, ambiente y categoría.',
      'Les délais sont calculés selon la priorité, l’environnement et la catégorie.',
      lang
    ),
    'suporte.ticketNew.sla.modifier.production': L(
      'Produção — SLA acelerado',
      'Production — accelerated SLA',
      'Producción — SLA acelerado',
      'Production — SLA accéléré',
      lang
    ),
    'suporte.ticketNew.sla.modifier.standard': L(
      'Homologação — SLA padrão',
      'Staging — standard SLA',
      'Homologación — SLA estándar',
      'Homologation — SLA standard',
      lang
    ),
    'suporte.ticketNew.sla.modifier.development': L(
      'Desenvolvimento — SLA ampliado',
      'Development — extended SLA',
      'Desarrollo — SLA ampliado',
      'Développement — SLA élargi',
      lang
    ),
    'suporte.sla.duration.minutes': L('{{count}} min', '{{count}} min', '{{count}} min', '{{count}} min', lang),
    'suporte.sla.duration.hours': L('{{count}} h', '{{count}} h', '{{count}} h', '{{count}} h', lang),
    'suporte.sla.duration.days': L('{{count}} d', '{{count}} d', '{{count}} d', '{{count}} j', lang),
    'suporte.sla.duration.hoursMinutes': L(
      '{{hours}} h {{minutes}} min',
      '{{hours}} h {{minutes}} min',
      '{{hours}} h {{minutes}} min',
      '{{hours}} h {{minutes}} min',
      lang
    ),
    'suporte.ticketNew.sla.loading': L(
      'Calculando prazos…',
      'Calculating deadlines…',
      'Calculando plazos…',
      'Calcul des délais…',
      lang
    ),

    'suporte.ticketDetail.back': L('Voltar aos chamados', 'Back to tickets', 'Volver a tickets', 'Retour aux tickets', lang),
    'suporte.ticketDetail.section.timeline': L('Histórico', 'Timeline', 'Historial', 'Historique', lang),
    'suporte.ticketDetail.section.comments': L('Comentários', 'Comments', 'Comentarios', 'Commentaires', lang),
    'suporte.ticketDetail.section.attachments': L('Anexos', 'Attachments', 'Adjuntos', 'Pièces jointes', lang),
    'suporte.ticketDetail.placeholder.comment': L(
      'Escreva uma mensagem para o suporte...',
      'Write a message to support...',
      'Escriba un mensaje al soporte...',
      'Écrivez un message au support...',
      lang
    ),
    'suporte.ticketDetail.btn.send': L('Enviar', 'Send', 'Enviar', 'Envoyer', lang),
    'suporte.ticketDetail.btn.rate': L('Avaliar atendimento', 'Rate support', 'Evaluar atención', 'Évaluer le support', lang),
    'suporte.ticketDetail.opened': L('Aberto em', 'Opened on', 'Abierto el', 'Ouvert le', lang),
    'suporte.ticketDetail.assigned': L('Atendente', 'Agent', 'Agente', 'Agent', lang),
    'suporte.ticketDetail.unassigned': L('Aguardando atribuição', 'Awaiting assignment', 'Esperando asignación', 'En attente d’assignation', lang),

    'suporte.ticketAtendimento.back': L('Voltar à fila', 'Back to queue', 'Volver a la cola', 'Retour à la file', lang),
    'suporte.ticketAtendimento.assume': L('Assumir chamado', 'Take ticket', 'Asumir ticket', 'Prendre le ticket', lang),
    'suporte.ticketAtendimento.reply': L('Responder ao usuário', 'Reply to user', 'Responder al usuario', 'Répondre à l’utilisateur', lang),
    'suporte.ticketAtendimento.returnUser': L('Devolver ao usuário', 'Return to user', 'Devolver al usuario', 'Renvoyer à l’utilisateur', lang),
    'suporte.ticketAtendimento.resolve': L('Marcar resolvido', 'Mark resolved', 'Marcar resuelto', 'Marquer résolu', lang),
    'suporte.ticketAtendimento.internalNote': L('Nota interna', 'Internal note', 'Nota interna', 'Note interne', lang),
    'suporte.ticketAtendimento.panel.requester': L('Solicitante', 'Requester', 'Solicitante', 'Demandeur', lang),
    'suporte.ticketAtendimento.panel.sla': L('SLA', 'SLA', 'SLA', 'SLA', lang),
    'suporte.ticketAtendimento.panel.meta': L('Metadados', 'Metadata', 'Metadatos', 'Métadonnées', lang),
    'suporte.ticketAtendimento.kicker': L('Atendimento', 'Service desk', 'Atención', 'Service', lang),
    'suporte.ticketAtendimento.loading': L('Carregando chamado...', 'Loading ticket...', 'Cargando ticket...', 'Chargement du ticket...', lang),
    'suporte.ticketAtendimento.startService': L('Iniciar atendimento', 'Start handling', 'Iniciar atención', 'Démarrer le traitement', lang),
    'suporte.ticketAtendimento.resumeService': L('Retomar atendimento', 'Resume handling', 'Reanudar atención', 'Reprendre le traitement', lang),
    'suporte.ticketAtendimento.closeTicket': L('Fechar chamado', 'Close ticket', 'Cerrar ticket', 'Fermer le ticket', lang),
    'suporte.ticketAtendimento.reopen': L('Reabrir', 'Reopen', 'Reabrir', 'Rouvrir', lang),
    'suporte.ticketAtendimento.section.details': L('Detalhes do chamado', 'Ticket details', 'Detalles del ticket', 'Détails du ticket', lang),
    'suporte.ticketAtendimento.label.type': L('Tipo', 'Type', 'Tipo', 'Type', lang),
    'suporte.ticketAtendimento.label.category': L('Categoria', 'Category', 'Categoría', 'Catégorie', lang),
    'suporte.ticketAtendimento.label.environment': L('Ambiente', 'Environment', 'Entorno', 'Environnement', lang),
    'suporte.ticketAtendimento.label.openedAt': L('Data de abertura', 'Opened on', 'Fecha de apertura', 'Date d’ouverture', lang),
    'suporte.ticketAtendimento.notInformed': L('Não informado', 'Not provided', 'No informado', 'Non renseigné', lang),
    'suporte.ticketAtendimento.label.description': L('Descrição', 'Description', 'Descripción', 'Description', lang),
    'suporte.ticketAtendimento.label.steps': L('Passos para reproduzir', 'Steps to reproduce', 'Pasos para reproducir', 'Étapes pour reproduire', lang),
    'suporte.ticketAtendimento.section.reply': L('Adicionar resposta', 'Add reply', 'Añadir respuesta', 'Ajouter une réponse', lang),
    'suporte.ticketAtendimento.placeholder.reply': L(
      'Digite sua resposta para o usuário...',
      'Type your reply to the user...',
      'Escriba su respuesta al usuario...',
      'Saisissez votre réponse à l’utilisateur...',
      lang
    ),
    'suporte.ticketAtendimento.btn.sendReply': L('Enviar resposta', 'Send reply', 'Enviar respuesta', 'Envoyer la réponse', lang),
    'suporte.ticketAtendimento.section.timeline': L('Histórico de interações', 'Interaction history', 'Historial de interacciones', 'Historique des interactions', lang),
    'suporte.ticketAtendimento.empty.timeline': L('Nenhuma interação registrada', 'No interactions yet', 'Ninguna interacción registrada', 'Aucune interaction enregistrée', lang),
    'suporte.ticketAtendimento.agentSuffix': L('(Atendente)', '(Agent)', '(Agente)', '(Agent)', lang),
    'suporte.ticketAtendimento.actor.system': L('Sistema', 'System', 'Sistema', 'Système', lang),
    'suporte.ticketAtendimento.panel.assignee': L('Atendente', 'Agent', 'Agente', 'Agent', lang),
    'suporte.ticketAtendimento.panel.attachments': L('Anexos', 'Attachments', 'Adjuntos', 'Pièces jointes', lang),
    'suporte.ticketAtendimento.sla.firstResponse': L('Primeira resposta', 'First response', 'Primera respuesta', 'Première réponse', lang),
    'suporte.ticketAtendimento.sla.resolution': L('Resolução', 'Resolution', 'Resolución', 'Résolution', lang),
    'suporte.ticketAtendimento.sla.breached': L('SLA estourado', 'SLA breached', 'SLA incumplido', 'SLA dépassé', lang),
    'suporte.ticketAtendimento.sla.fulfilled': L('Cumprido', 'Met', 'Cumplido', 'Respecté', lang),
    'suporte.ticketAtendimento.dialog.return.title': L('Devolver ao usuário', 'Return to user', 'Devolver al usuario', 'Renvoyer à l’utilisateur', lang),
    'suporte.ticketAtendimento.dialog.return.info': L(
      'O usuário será notificado por e-mail que o chamado requer sua ação.',
      'The user will be notified by email that the ticket requires their action.',
      'El usuario recibirá un correo indicando que el ticket requiere su acción.',
      'L’utilisateur sera notifié par e-mail que le ticket nécessite son action.',
      lang
    ),
    'suporte.ticketAtendimento.dialog.return.label': L('Motivo da devolução', 'Return reason', 'Motivo de la devolución', 'Motif du renvoi', lang),
    'suporte.ticketAtendimento.dialog.return.placeholder': L(
      'Descreva o motivo da devolução e o que o usuário precisa fazer...',
      'Describe why you are returning the ticket and what the user must do...',
      'Describa el motivo de la devolución y qué debe hacer el usuario...',
      'Décrivez le motif du renvoi et ce que l’utilisateur doit faire...',
      lang
    ),
    'suporte.ticketAtendimento.dialog.resolve.title': L('Resolver chamado', 'Resolve ticket', 'Resolver ticket', 'Résoudre le ticket', lang),
    'suporte.ticketAtendimento.dialog.resolve.info': L(
      'O usuário será notificado por e-mail sobre a resolução do chamado.',
      'The user will be notified by email about the ticket resolution.',
      'El usuario recibirá un correo sobre la resolución del ticket.',
      'L’utilisateur sera notifié par e-mail de la résolution du ticket.',
      lang
    ),
    'suporte.ticketAtendimento.dialog.resolve.label': L('Descrição da solução', 'Solution description', 'Descripción de la solución', 'Description de la solution', lang),
    'suporte.ticketAtendimento.dialog.resolve.placeholder': L(
      'Descreva como o problema foi resolvido...',
      'Describe how the issue was resolved...',
      'Describa cómo se resolvió el problema...',
      'Décrivez comment le problème a été résolu...',
      lang
    ),
    'suporte.ticketAtendimento.dialog.btn.cancel': L('Cancelar', 'Cancel', 'Cancelar', 'Annuler', lang),
    'suporte.ticketAtendimento.dialog.btn.return': L('Devolver', 'Return', 'Devolver', 'Renvoyer', lang),
    'suporte.ticketAtendimento.dialog.btn.resolve': L('Resolver', 'Resolve', 'Resolver', 'Résoudre', lang),

    'suporte.ticketDetail.loading': L('Carregando chamado...', 'Loading ticket...', 'Cargando ticket...', 'Chargement du ticket...', lang),
    'suporte.ticketDetail.kicker': L('Chamado', 'Ticket', 'Ticket', 'Ticket', lang),
    'suporte.ticketDetail.btn.changeStatus': L('Alterar status', 'Change status', 'Cambiar estado', 'Modifier le statut', lang),
    'suporte.ticketDetail.section.details': L('Detalhes do chamado', 'Ticket details', 'Detalles del ticket', 'Détails du ticket', lang),
    'suporte.ticketDetail.label.type': L('Tipo', 'Type', 'Tipo', 'Type', lang),
    'suporte.ticketDetail.label.priority': L('Prioridade', 'Priority', 'Prioridad', 'Priorité', lang),
    'suporte.ticketDetail.label.module': L('Módulo', 'Module', 'Módulo', 'Module', lang),
    'suporte.ticketDetail.label.environment': L('Ambiente', 'Environment', 'Entorno', 'Environnement', lang),
    'suporte.ticketDetail.label.description': L('Descrição', 'Description', 'Descripción', 'Description', lang),
    'suporte.ticketDetail.label.steps': L('Passos para reproduzir', 'Steps to reproduce', 'Pasos para reproducir', 'Étapes pour reproduire', lang),
    'suporte.ticketDetail.btn.addAttachment': L('Adicionar anexo', 'Add attachment', 'Añadir adjunto', 'Ajouter une pièce jointe', lang),
    'suporte.ticketDetail.section.rating.title': L('Como foi seu atendimento?', 'How was your support experience?', '¿Cómo fue su atención?', 'Comment s’est passé le support ?', lang),
    'suporte.ticketDetail.section.rating.subtitle': L(
      'Sua avaliação nos ajuda a melhorar',
      'Your rating helps us improve',
      'Su valoración nos ayuda a mejorar',
      'Votre évaluation nous aide à nous améliorer',
      lang
    ),
    'suporte.ticketDetail.section.rating.placeholder': L('Comentário (opcional)', 'Comment (optional)', 'Comentario (opcional)', 'Commentaire (facultatif)', lang),
    'suporte.ticketDetail.btn.submitRating': L('Enviar avaliação', 'Submit rating', 'Enviar valoración', 'Envoyer l’évaluation', lang),
    'suporte.ticketDetail.ratingSent': L('Avaliação enviada:', 'Rating submitted:', 'Valoración enviada:', 'Évaluation envoyée :', lang),
    'suporte.ticketDetail.section.dates': L('Datas', 'Dates', 'Fechas', 'Dates', lang),
    'suporte.ticketDetail.label.opened': L('Abertura', 'Opened', 'Apertura', 'Ouverture', lang),
    'suporte.ticketDetail.label.firstResponse': L('Primeira resposta', 'First response', 'Primera respuesta', 'Première réponse', lang),
    'suporte.ticketDetail.label.resolution': L('Resolução', 'Resolution', 'Resolución', 'Résolution', lang),
    'suporte.ticketDetail.section.responsible': L('Responsáveis', 'People', 'Responsables', 'Responsables', lang),
    'suporte.ticketDetail.label.requester': L('Solicitante', 'Requester', 'Solicitante', 'Demandeur', lang),
    'suporte.ticketDetail.dialog.status.title': L('Alterar status', 'Change status', 'Cambiar estado', 'Modifier le statut', lang),
    'suporte.ticketDetail.dialog.status.placeholder': L('Selecione o status', 'Select status', 'Seleccione el estado', 'Sélectionnez le statut', lang),
    'suporte.ticketDetail.dialog.btn.cancel': L('Cancelar', 'Cancel', 'Cancelar', 'Annuler', lang),
    'suporte.ticketDetail.dialog.btn.confirm': L('Confirmar', 'Confirm', 'Confirmar', 'Confirmer', lang),
    'suporte.ticketDetail.event.opened': L('Chamado aberto', 'Ticket opened', 'Ticket abierto', 'Ticket ouvert', lang),

    'suporte.ticketAtendimentoList.toast.loadError': L(
      'Não foi possível carregar a fila de chamados.',
      'Could not load the ticket queue.',
      'No se pudo cargar la cola de tickets.',
      'Impossible de charger la file des tickets.',
      lang
    )
  };
}

export const SUPORTE_SCREENS_PT_BR = dict('pt');
export const SUPORTE_SCREENS_EN_US = dict('en');
export const SUPORTE_SCREENS_ES_ES = dict('es');
export const SUPORTE_SCREENS_FR_FR = dict('fr');
