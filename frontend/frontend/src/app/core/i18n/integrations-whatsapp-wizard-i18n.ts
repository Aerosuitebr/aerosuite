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
    'integrations.whatsapp.title': L(
      'WhatsApp (Evolution API)',
      'WhatsApp (Evolution API)',
      'WhatsApp (Evolution API)',
      'WhatsApp (Evolution API)',
      lang
    ),
    'integrations.whatsapp.intro': L(
      'Conecte o WhatsApp da oficina para enviar propostas, alertas de OS e notificações com anexos automaticamente.',
      'Connect your shop WhatsApp to send proposals, work order alerts, and notifications with attachments automatically.',
      'Conecte el WhatsApp del taller para enviar propuestas, alertas de OS y notificaciones con adjuntos automáticamente.',
      'Connectez le WhatsApp de l’atelier pour envoyer propositions, alertes OS et notifications avec pièces jointes automatiquement.',
      lang
    ),
    'integrations.whatsapp.page.kicker': L(
      'Aero Suite · Integrações',
      'Aero Suite · Integrations',
      'Aero Suite · Integraciones',
      'Aero Suite · Intégrations',
      lang
    ),
    'integrations.whatsapp.page.subtitle': L(
      'Ative uma instância dedicada, escaneie o QR Code e envie PDFs de propostas e mensagens de status pelo WhatsApp.',
      'Activate a dedicated instance, scan the QR code, and send proposal PDFs and status messages via WhatsApp.',
      'Active una instancia dedicada, escanee el código QR y envíe PDF de propuestas y mensajes de estado por WhatsApp.',
      'Activez une instance dédiée, scannez le QR code et envoyez les PDF de propositions et messages de statut via WhatsApp.',
      lang
    ),
    'integrations.whatsapp.page.refreshBtn': L('Atualizar', 'Refresh', 'Actualizar', 'Actualiser', lang),
    'integrations.whatsapp.page.qrcodeBtn': L('Obter QR Code', 'Get QR code', 'Obtener código QR', 'Obtenir le QR code', lang),
    'integrations.whatsapp.page.statusLoading': L('Carregando…', 'Loading…', 'Cargando…', 'Chargement…', lang),
    'integrations.whatsapp.page.statusUnavailable': L(
      'Evolution API não configurada no servidor',
      'Evolution API not configured on server',
      'Evolution API no configurada en el servidor',
      'Evolution API non configurée sur le serveur',
      lang
    ),
    'integrations.whatsapp.page.statusReady': L(
      'Pronto para ativar o WhatsApp',
      'Ready to activate WhatsApp',
      'Listo para activar WhatsApp',
      'Prêt à activer WhatsApp',
      lang
    ),
    'integrations.whatsapp.page.statusConnecting': L(
      'Aguardando leitura do QR Code…',
      'Waiting for QR code scan…',
      'Esperando lectura del código QR…',
      'En attente du scan du QR code…',
      lang
    ),
    'integrations.whatsapp.page.statusConnected': L(
      'WhatsApp conectado{{instance}}',
      'WhatsApp connected{{instance}}',
      'WhatsApp conectado{{instance}}',
      'WhatsApp connecté{{instance}}',
      lang
    ),
    'integrations.whatsapp.settingsLinkTitle': L(
      'Integração WhatsApp',
      'WhatsApp integration',
      'Integración WhatsApp',
      'Intégration WhatsApp',
      lang
    ),
    'integrations.whatsapp.settingsLinkDesc': L(
      'Configure a conexão WhatsApp da oficina para envio automático de mensagens e anexos.',
      'Set up your shop WhatsApp connection for automatic messages and attachments.',
      'Configure la conexión WhatsApp del taller para envío automático de mensajes y adjuntos.',
      'Configurez la connexion WhatsApp de l’atelier pour l’envoi automatique de messages et pièces jointes.',
      lang
    ),
    'integrations.whatsapp.settingsLinkBtn': L(
      'Abrir configuração WhatsApp',
      'Open WhatsApp settings',
      'Abrir configuración WhatsApp',
      'Ouvrir la configuration WhatsApp',
      lang
    ),
    'integrations.whatsapp.wizard.loading': L(
      'Carregando status do WhatsApp…',
      'Loading WhatsApp status…',
      'Cargando estado de WhatsApp…',
      'Chargement du statut WhatsApp…',
      lang
    ),
    'integrations.whatsapp.wizard.pill.platform': L('Plataforma', 'Platform', 'Plataforma', 'Plateforme', lang),
    'integrations.whatsapp.wizard.pill.connection': L('Conexão', 'Connection', 'Conexión', 'Connexion', lang),
    'integrations.whatsapp.wizard.status.ok': L('Disponível', 'Available', 'Disponible', 'Disponible', lang),
    'integrations.whatsapp.wizard.status.pending': L('Pendente', 'Pending', 'Pendiente', 'En attente', lang),
    'integrations.whatsapp.wizard.status.connected': L('Conectado', 'Connected', 'Conectado', 'Connecté', lang),
    'integrations.whatsapp.wizard.status.connecting': L('Conectando…', 'Connecting…', 'Conectando…', 'Connexion…', lang),
    'integrations.whatsapp.wizard.status.disconnected': L('Desconectado', 'Disconnected', 'Desconectado', 'Déconnecté', lang),
    'integrations.whatsapp.wizard.status.notActivated': L('Não ativado', 'Not activated', 'No activado', 'Non activé', lang),
    'integrations.whatsapp.activateBtn': L('Ativar WhatsApp', 'Activate WhatsApp', 'Activar WhatsApp', 'Activer WhatsApp', lang),
    'integrations.whatsapp.qrcodeTitle': L('Escaneie o QR Code', 'Scan the QR code', 'Escanee el código QR', 'Scannez le QR code', lang),
    'integrations.whatsapp.qrcodeHint': L(
      'Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo e escaneie o código abaixo.',
      'Open WhatsApp on your phone → Linked devices → Link a device and scan the code below.',
      'Abra WhatsApp en el móvil → Dispositivos vinculados → Vincular dispositivo y escanee el código.',
      'Ouvrez WhatsApp sur le téléphone → Appareils connectés → Associer un appareil et scannez le code.',
      lang
    ),
    'integrations.whatsapp.pairingCode': L(
      'Código de pareamento: {{code}}',
      'Pairing code: {{code}}',
      'Código de emparejamiento: {{code}}',
      'Code d’appairage : {{code}}',
      lang
    ),
    'integrations.whatsapp.instanceName': L(
      'Instância: {{name}}',
      'Instance: {{name}}',
      'Instancia: {{name}}',
      'Instance : {{name}}',
      lang
    ),
    'integrations.whatsapp.connectedAt': L(
      'Conectado em {{date}}',
      'Connected on {{date}}',
      'Conectado el {{date}}',
      'Connecté le {{date}}',
      lang
    ),
    'integrations.whatsapp.disconnectBtn': L('Desconectar', 'Disconnect', 'Desconectar', 'Déconnecter', lang),
    'integrations.whatsapp.disconnectConfirm': L(
      'Desconectar o WhatsApp desta oficina? Os envios automáticos deixarão de funcionar até reconectar.',
      'Disconnect WhatsApp for this shop? Automatic sends will stop until you reconnect.',
      '¿Desconectar WhatsApp de este taller? Los envíos automáticos dejarán de funcionar hasta reconectar.',
      'Déconnecter WhatsApp pour cet atelier ? Les envois automatiques s’arrêteront jusqu’à reconnexion.',
      lang
    ),
    'integrations.whatsapp.readOnly': L(
      'Somente administradores podem alterar esta integração.',
      'Only administrators can change this integration.',
      'Solo administradores pueden modificar esta integración.',
      'Seuls les administrateurs peuvent modifier cette intégration.',
      lang
    ),
    'integrations.whatsapp.retryBtn': L('Tentar novamente', 'Try again', 'Reintentar', 'Réessayer', lang),
    'integrations.whatsapp.notice.platformTitle': L(
      'Evolution API indisponível',
      'Evolution API unavailable',
      'Evolution API no disponible',
      'Evolution API indisponible',
      lang
    ),
    'integrations.whatsapp.notice.disconnectedTitle': L(
      'WhatsApp desconectado',
      'WhatsApp disconnected',
      'WhatsApp desconectado',
      'WhatsApp déconnecté',
      lang
    ),
    'integrations.whatsapp.notice.disconnectedBody': L(
      'Gere um novo QR Code e escaneie novamente para restabelecer o envio automático.',
      'Generate a new QR code and scan again to restore automatic sending.',
      'Genere un nuevo código QR y escanéelo de nuevo para restablecer el envío automático.',
      'Générez un nouveau QR code et scannez-le à nouveau pour rétablir l’envoi automatique.',
      lang
    ),
    'integrations.whatsapp.notice.connectingHint': L(
      'Após escanear, o status atualiza automaticamente em alguns segundos.',
      'After scanning, status updates automatically within a few seconds.',
      'Tras escanear, el estado se actualiza automáticamente en unos segundos.',
      'Après le scan, le statut se met à jour automatiquement en quelques secondes.',
      lang
    ),
    'integrations.whatsapp.toast.activated': L(
      'WhatsApp ativado. Escaneie o QR Code para conectar.',
      'WhatsApp activated. Scan the QR code to connect.',
      'WhatsApp activado. Escanee el código QR para conectar.',
      'WhatsApp activé. Scannez le QR code pour vous connecter.',
      lang
    ),
    'integrations.whatsapp.toast.activateError': L(
      'Falha ao ativar WhatsApp',
      'Failed to activate WhatsApp',
      'Error al activar WhatsApp',
      'Échec d’activation WhatsApp',
      lang
    ),
    'integrations.whatsapp.toast.activateErrorDetail': L(
      '{{message}}',
      '{{message}}',
      '{{message}}',
      '{{message}}',
      lang
    ),
    'integrations.whatsapp.toast.disconnected': L(
      'WhatsApp desconectado.',
      'WhatsApp disconnected.',
      'WhatsApp desconectado.',
      'WhatsApp déconnecté.',
      lang
    ),
    'integrations.whatsapp.toast.disconnectError': L(
      'Falha ao desconectar WhatsApp.',
      'Failed to disconnect WhatsApp.',
      'Error al desconectar WhatsApp.',
      'Échec de déconnexion WhatsApp.',
      lang
    ),
    'integrations.whatsapp.toast.qrcodeError': L(
      'Falha ao obter QR Code',
      'Failed to get QR code',
      'Error al obtener código QR',
      'Échec d’obtention du QR code',
      lang
    ),
    'integrations.whatsapp.toast.qrcodeErrorDetail': L(
      '{{message}}',
      '{{message}}',
      '{{message}}',
      '{{message}}',
      lang
    ),
    'menu.func.INTEGRACAO_WHATSAPP.desc': L(
      'Configurar WhatsApp da oficina',
      'Configure shop WhatsApp',
      'Configurar WhatsApp del taller',
      'Configurer WhatsApp de l’atelier',
      lang
    ),
    'menu.func.INTEGRACAO_WHATSAPP': L(
      'Integração WhatsApp',
      'WhatsApp integration',
      'Integración WhatsApp',
      'Intégration WhatsApp',
      lang
    ),
  };
}

export const WHATSAPP_WIZARD_PT_BR = dict('pt');
export const WHATSAPP_WIZARD_EN_US = dict('en');
export const WHATSAPP_WIZARD_ES_ES = dict('es');
export const WHATSAPP_WIZARD_FR_FR = dict('fr');
