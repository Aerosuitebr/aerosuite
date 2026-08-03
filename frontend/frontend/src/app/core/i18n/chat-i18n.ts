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
    'chat.title': L('Chat', 'Chat', 'Chat', 'Chat', lang),
    'chat.searchUsers': L('Buscar usuários…', 'Search users…', 'Buscar usuarios…', 'Rechercher des utilisateurs…', lang),
    'chat.searchUserByNameOrEmail': L(
      'Buscar usuário por nome ou email...',
      'Search user by name or email...',
      'Buscar usuario por nombre o email...',
      'Rechercher un utilisateur par nom ou e-mail...',
      lang
    ),
    'chat.noConversations': L('Nenhuma conversa', 'No conversations', 'Sin conversaciones', 'Aucune conversation', lang),
    'chat.typeMessage': L('Digite uma mensagem…', 'Type a message…', 'Escriba un mensaje…', 'Saisissez un message…', lang),
    'chat.send': L('Enviar', 'Send', 'Enviar', 'Envoyer', lang),
    'chat.online': L('Online', 'Online', 'En línea', 'En ligne', lang),
    'chat.offline': L('Offline', 'Offline', 'Desconectado', 'Hors ligne', lang),
    'chat.newConversation': L('Nova conversa', 'New conversation', 'Nueva conversación', 'Nouvelle conversation', lang),
    'chat.search.loading': L('Buscando…', 'Searching…', 'Buscando…', 'Recherche…', lang),
    'chat.search.noUsers': L(
      'Nenhum usuário encontrado',
      'No users found',
      'Ningún usuario encontrado',
      'Aucun utilisateur trouvé',
      lang
    ),
    'chat.search.minChars': L(
      'Digite pelo menos 2 caracteres para buscar',
      'Type at least 2 characters to search',
      'Escriba al menos 2 caracteres para buscar',
      'Saisissez au moins 2 caractères pour rechercher',
      lang
    ),
    'chat.call.stableConnection': L(
      'Conexão estável',
      'Stable connection',
      'Conexión estable',
      'Connexion stable',
      lang
    ),
    'chat.call.incoming': L(
      'Chamada de voz recebida…',
      'Incoming voice call…',
      'Llamada de voz entrante…',
      'Appel vocal entrant…',
      lang
    ),
    'chat.call.calling': L('Chamando…', 'Calling…', 'Llamando…', 'Appel en cours…', lang),
    'chat.call.connecting': L('Conectando…', 'Connecting…', 'Conectando…', 'Connexion…', lang),
    'chat.call.mute': L('Mudo', 'Mute', 'Silencio', 'Muet', lang),
    'chat.call.speaker': L('Alto-falante', 'Speaker', 'Altavoz', 'Haut-parleur', lang),
    'chat.attachFile': L('Anexar arquivo', 'Attach file', 'Adjuntar archivo', 'Joindre un fichier', lang),
    'chat.call': L('Chamada', 'Call', 'Llamada', 'Appel', lang),
    'chat.empty.title': L('Selecione uma conversa', 'Select a conversation', 'Seleccione una conversación', 'Sélectionnez une conversation', lang),
    'chat.empty.description': L(
      'Escolha um contato à esquerda ou inicie uma nova conversa.',
      'Choose a contact on the left or start a new conversation.',
      'Elija un contacto a la izquierda o inicie una conversación.',
      'Choisissez un contact à gauche ou démarrez une conversation.',
      lang
    ),
    'chat.brand.name': L('Aero Suite Chat', 'Aero Suite Chat', 'Aero Suite Chat', 'Aero Suite Chat', lang),
    'chat.brand.subtitle': L(
      'Sistema de comunicação interna',
      'Internal communication system',
      'Sistema de comunicación interna',
      'Système de communication interne',
      lang
    ),
    'chat.btn.backToSystem': L('Voltar ao sistema', 'Back to system', 'Volver al sistema', 'Retour au système', lang),
    'chat.tooltip.openMain': L('Abrir sistema principal', 'Open main application', 'Abrir sistema principal', 'Ouvrir l’application principale', lang),
    'chat.tooltip.close': L('Fechar chat', 'Close chat', 'Cerrar chat', 'Fermer le chat', lang),
    'chat.logo.alt': L('Aero Suite', 'Aero Suite', 'Aero Suite', 'Aero Suite', lang),
    'chat.icon.open': L(
      'Abrir chat (nova janela)',
      'Open chat (new window)',
      'Abrir chat (nueva ventana)',
      'Ouvrir le chat (nouvelle fenêtre)',
      lang
    ),
    'chat.layout.conversations': L('Conversas', 'Conversations', 'Conversaciones', 'Conversations', lang),
    'chat.layout.searchPlaceholder': L(
      'Buscar ou iniciar nova conversa',
      'Search or start a new conversation',
      'Buscar o iniciar una conversación',
      'Rechercher ou démarrer une conversation',
      lang
    ),
    'chat.layout.tooltip.newConversation': L(
      'Iniciar nova conversa',
      'Start new conversation',
      'Iniciar conversación',
      'Démarrer une conversation',
      lang
    ),
    'chat.layout.welcome.title': L(
      'Bem-vindo ao Chat!',
      'Welcome to Chat!',
      '¡Bienvenido al Chat!',
      'Bienvenue sur le Chat !',
      lang
    ),
    'chat.layout.welcome.noConversations': L(
      'Você ainda não possui conversas.',
      'You have no conversations yet.',
      'Aún no tiene conversaciones.',
      'Vous n’avez pas encore de conversations.',
      lang
    ),
    'chat.layout.welcome.hint': L(
      'Clique no botão abaixo para buscar um colega e iniciar sua primeira conversa.',
      'Click the button below to find a colleague and start your first conversation.',
      'Haga clic abajo para buscar un colega e iniciar su primera conversación.',
      'Cliquez ci-dessous pour trouver un collègue et démarrer votre première conversation.',
      lang
    ),
    'chat.layout.btn.startConversation': L(
      'Iniciar nova conversa',
      'Start new conversation',
      'Iniciar conversación',
      'Démarrer une conversation',
      lang
    ),
    'chat.layout.btn.startConversationLong': L(
      'Iniciar Nova Conversa',
      'Start New Conversation',
      'Iniciar Nueva Conversación',
      'Démarrer une nouvelle conversation',
      lang
    ),
    'chat.layout.btn.searchUser': L('Buscar usuário', 'Search user', 'Buscar usuario', 'Rechercher un utilisateur', lang),
    'chat.layout.tooltip.newChat': L('Nova conversa', 'New conversation', 'Nueva conversación', 'Nouvelle conversation', lang),
    'chat.layout.tooltip.call': L('Ligar', 'Call', 'Llamar', 'Appeler', lang),
    'chat.layout.tooltip.searchInChat': L(
      'Buscar na conversa',
      'Search in conversation',
      'Buscar en la conversación',
      'Rechercher dans la conversation',
      lang
    ),
    'chat.layout.tooltip.options': L('Opções', 'Options', 'Opciones', 'Options', lang),
    'chat.layout.empty.title': L('AEROSUITE CHAT', 'AEROSUITE CHAT', 'AEROSUITE CHAT', 'AEROSUITE CHAT', lang),
    'chat.layout.empty.welcomeText': L(
      'Envie e receba mensagens de forma rápida e segura.<br>Mantenha seu computador conectado para não perder nenhuma mensagem.',
      'Send and receive messages quickly and securely.<br>Keep your computer connected so you don\'t miss any messages.',
      'Envíe y reciba mensajes de forma rápida y segura.<br>Mantenga su computadora conectada para no perder ningún mensaje.',
      'Envoyez et recevez des messages rapidement et en toute sécurité.<br>Gardez votre ordinateur connecté pour ne manquer aucun message.',
      lang
    ),
    'chat.layout.feature.secure': L('Mensagens Seguras', 'Secure Messages', 'Mensajes Seguros', 'Messages sécurisés', lang),
    'chat.layout.feature.files': L('Compartilhe Arquivos', 'Share Files', 'Compartir Archivos', 'Partager des fichiers', lang),
    'chat.layout.feature.groups': L('Crie Grupos', 'Create Groups', 'Crear Grupos', 'Créer des groupes', lang),
    'chat.layout.hint.startFirst': L(
      'Clique em "Iniciar Nova Conversa" para começar',
      'Click "Start New Conversation" to begin',
      'Haga clic en "Iniciar Nueva Conversación" para comenzar',
      'Cliquez sur « Démarrer une nouvelle conversation » pour commencer',
      lang
    ),
    'chat.layout.hint.selectConversation': L(
      'Selecione uma conversa ao lado para continuar',
      'Select a conversation on the side to continue',
      'Seleccione una conversación al lado para continuar',
      'Sélectionnez une conversation sur le côté pour continuer',
      lang
    ),
    'chat.layout.search.noResults': L(
      'Nenhuma conversa encontrada para "{{termo}}"',
      'No conversation found for "{{termo}}"',
      'Ninguna conversación encontrada para "{{termo}}"',
      'Aucune conversation trouvée pour « {{termo}} »',
      lang
    ),
    'chat.layout.status.online': L('Online', 'Online', 'En línea', 'En ligne', lang),
    'chat.layout.status.participants': L(
      '{{count}} participantes',
      '{{count}} participants',
      '{{count}} participantes',
      '{{count}} participants',
      lang
    ),
    'chat.layout.defaultConversationName': L('Conversa', 'Conversation', 'Conversación', 'Conversation', lang),
    'chat.toast.error': L('Erro', 'Error', 'Error', 'Erreur', lang),
    'chat.toast.sent': L('Enviado', 'Sent', 'Enviado', 'Envoyé', lang),
    'chat.toast.messageSent': L(
      'Mensagem enviada',
      'Message sent',
      'Mensaje enviado',
      'Message envoyé',
      lang
    ),
    'chat.toast.messageSendFailed': L(
      'Não foi possível enviar a mensagem',
      'Could not send the message',
      'No se pudo enviar el mensaje',
      'Impossible d’envoyer le message',
      lang
    ),
    'chat.toast.fileSent': L('Arquivo enviado', 'File sent', 'Archivo enviado', 'Fichier envoyé', lang),
    'chat.toast.fileSendFailed': L(
      'Não foi possível enviar o arquivo',
      'Could not send the file',
      'No se pudo enviar el archivo',
      'Impossible d’envoyer le fichier',
      lang
    ),
    'chat.toast.conversationStartFailed': L(
      'Não foi possível iniciar a conversa',
      'Could not start the conversation',
      'No se pudo iniciar la conversación',
      'Impossible de démarrer la conversation',
      lang
    ),
    'chat.toast.warn': L('Aviso', 'Warning', 'Aviso', 'Avertissement', lang),
    'chat.toast.voiceCallDirectOnly': L(
      'Chamadas de voz estão disponíveis apenas para conversas diretas',
      'Voice calls are only available for direct conversations',
      'Las llamadas de voz solo están disponibles en conversaciones directas',
      'Les appels vocaux ne sont disponibles que pour les conversations directes',
      lang
    ),
    'chat.toast.callStarted': L('Ligação', 'Call', 'Llamada', 'Appel', lang),
    'chat.toast.callStartFailed': L(
      'Não foi possível iniciar a chamada',
      'Could not start the call',
      'No se pudo iniciar la llamada',
      'Impossible de démarrer l’appel',
      lang
    ),
    'chat.audioCall.error.callInProgress': L(
      'Já existe uma chamada em andamento',
      'A call is already in progress',
      'Ya hay una llamada en curso',
      'Un appel est déjà en cours',
      lang
    ),
    'chat.audioCall.error.sessionNotLoaded': L(
      'Sessão não carregada. Recarregue o chat e tente novamente.',
      'Session not loaded. Reload the chat and try again.',
      'Sesión no cargada. Recargue el chat e inténtelo de nuevo.',
      'Session non chargée. Rechargez le chat et réessayez.',
      lang
    ),
    'chat.audioCall.error.micDenied': L(
      'Microfone negou permissão. Libere o microfone para o site (ícone na barra de endereço).',
      'Microphone permission denied. Allow microphone access for this site (icon in the address bar).',
      'El micrófono denegó el permiso. Permita el micrófono para este sitio (icono en la barra de direcciones).',
      'Le microphone a refusé l’autorisation. Autorisez le micro pour ce site (icône dans la barre d’adresse).',
      lang
    ),
    'chat.toast.callContactNotFound': L(
      'Não foi possível identificar o contato desta conversa. Abra a conversa de novo ou recarregue a página.',
      'Could not identify the contact for this conversation. Reopen the conversation or reload the page.',
      'No se pudo identificar el contacto de esta conversación. Vuelva a abrir la conversación o recargue la página.',
      'Impossible d’identifier le contact de cette conversation. Rouvrez la conversation ou rechargez la page.',
      lang
    ),
    'chat.you': L('Você', 'You', 'Usted', 'Vous', lang),
    'chat.preview.fileAttached': L('📎 Arquivo anexado', '📎 File attached', '📎 Archivo adjunto', '📎 Fichier joint', lang),
    'chat.preview.fileShort': L('📎 Arquivo', '📎 File', '📎 Archivo', '📎 Fichier', lang),
    'chat.preview.youPrefix': L('Você: ', 'You: ', 'Usted: ', 'Vous : ', lang),
    'chat.preview.fileSent': L('📎 Enviou um arquivo', '📎 Sent a file', '📎 Envió un archivo', '📎 A envoyé un fichier', lang),
    'chat.preview.noMessage': L('Nenhuma mensagem', 'No messages', 'Sin mensajes', 'Aucun message', lang),
    'chat.preview.sendingFile': L('📎 Enviando {{file}}…', '📎 Sending {{file}}…', '📎 Enviando {{file}}…', '📎 Envoi de {{file}}…', lang),
    'chat.date.today': L('Hoje', 'Today', 'Hoy', 'Aujourd’hui', lang),
    'chat.date.yesterday': L('Ontem', 'Yesterday', 'Ayer', 'Hier', lang),
    'chat.avatar.fallbackInitial': L('U', 'U', 'U', 'U', lang),
  };
}

export const CHAT_I18N_PT_BR = dict('pt');
export const CHAT_I18N_EN_US = dict('en');
export const CHAT_I18N_ES_ES = dict('es');
export const CHAT_I18N_FR_FR = dict('fr');
