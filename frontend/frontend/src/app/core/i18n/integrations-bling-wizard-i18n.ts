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
    'integrations.bling.reconnectBtn': L(
      'Reconectar conta Bling',
      'Reconnect Bling account',
      'Reconectar cuenta Bling',
      'Reconnecter le compte Bling',
      lang
    ),
    'integrations.bling.page.kicker': L(
      'Aero Suite · Integrações',
      'Aero Suite · Integrations',
      'Aero Suite · Integraciones',
      'Aero Suite · Intégrations',
      lang
    ),
    'integrations.bling.page.subtitle': L(
      'Conecte sua conta Bling, configure dados fiscais e automatize pedidos, OS e NF-e a partir das propostas comerciais.',
      'Connect your Bling account, configure fiscal data, and automate orders, work orders, and invoices from commercial proposals.',
      'Conecte su cuenta Bling, configure datos fiscales y automatice pedidos, OS y facturas desde las propuestas comerciales.',
      'Connectez votre compte Bling, configurez les données fiscales et automatisez commandes, OS et factures depuis les propositions commerciales.',
      lang
    ),
    'integrations.bling.page.verifyBtn': L('Verificar status', 'Check status', 'Verificar estado', 'Vérifier le statut', lang),
    'integrations.bling.page.refreshBtn': L('Atualizar', 'Refresh', 'Actualizar', 'Actualiser', lang),
    'integrations.bling.page.statusLoading': L('Carregando…', 'Loading…', 'Cargando…', 'Chargement…', lang),
    'integrations.bling.page.statusUnavailable': L('Integração ainda não liberada', 'Integration not yet enabled', 'Integración aún no habilitada', 'Intégration pas encore activée', lang),
    'integrations.bling.page.statusReady': L('Pronto para conectar sua conta Bling', 'Ready to connect your Bling account', 'Listo para conectar su cuenta Bling', 'Prêt à connecter votre compte Bling', lang),
    'integrations.bling.page.statusConnected': L(
      'Conta conectada{{company}}',
      'Account connected{{company}}',
      'Cuenta conectada{{company}}',
      'Compte connecté{{company}}',
      lang
    ),
    'integrations.bling.settingsLinkTitle': L('Central de integração Bling', 'Bling integration hub', 'Centro de integración Bling', 'Hub d’intégration Bling', lang),
    'integrations.bling.settingsLinkDesc': L(
      'OAuth, certificado digital, sincronização e checklist de NF-e automática.',
      'OAuth, digital certificate, sync, and automatic invoice readiness checklist.',
      'OAuth, certificado digital, sincronización y lista de preparación de factura automática.',
      'OAuth, certificat numérique, synchronisation et checklist de facture automatique.',
      lang
    ),
    'integrations.bling.settingsLinkBtn': L('Abrir central Bling', 'Open Bling hub', 'Abrir centro Bling', 'Ouvrir le hub Bling', lang),
    'integrations.bling.wizard.loading': L('Carregando integração…', 'Loading integration…', 'Cargando integración…', 'Chargement de l’intégration…', lang),
    'integrations.bling.wizard.pill.integration': L('Integração', 'Integration', 'Integración', 'Intégration', lang),
    'integrations.bling.wizard.pill.account': L('Conta Bling', 'Bling account', 'Cuenta Bling', 'Compte Bling', lang),
    'integrations.bling.wizard.pill.sync': L('Sincronização', 'Sync', 'Sincronización', 'Synchronisation', lang),
    'integrations.bling.wizard.pill.cert': L('Certificado', 'Certificate', 'Certificado', 'Certificat', lang),
    'integrations.bling.wizard.status.ok': L('Liberada', 'Enabled', 'Habilitada', 'Activée', lang),
    'integrations.bling.wizard.status.pending': L('Pendente', 'Pending', 'Pendiente', 'En attente', lang),
    'integrations.bling.wizard.status.connected': L('Conectada', 'Connected', 'Conectada', 'Connectée', lang),
    'integrations.bling.wizard.status.notConnected': L('Não conectada', 'Not connected', 'No conectada', 'Non connectée', lang),
    'integrations.bling.wizard.status.sessionExpired': L('Sessão expirada', 'Session expired', 'Sesión expirada', 'Session expirée', lang),
    'integrations.bling.wizard.status.active': L('Ativa', 'Active', 'Activa', 'Active', lang),
    'integrations.bling.wizard.status.configured': L('Configurado', 'Configured', 'Configurado', 'Configuré', lang),
    'integrations.bling.wizard.notice.scopeRenewTitle': L(
      'Permissões do Bling precisam ser renovadas',
      'Bling permissions need to be renewed',
      'Los permisos de Bling deben renovarse',
      'Les autorisations Bling doivent être renouvelées',
      lang
    ),
    'integrations.bling.wizard.notice.scopeRenewBody': L(
      'Após alterar escopos no app OAuth da Bling, clique em «Reconectar conta Bling» e autorize novamente.',
      'After changing scopes in the Bling OAuth app, click «Reconnect Bling account» and authorize again.',
      'Tras cambiar los alcances en la app OAuth de Bling, haga clic en «Reconectar cuenta Bling» y autorice de nuevo.',
      'Après avoir modifié les scopes dans l’app OAuth Bling, cliquez sur «Reconnecter le compte Bling» et autorisez à nouveau.',
      lang
    ),
    'integrations.bling.wizard.notice.sessionExpiredTitle': L('Sessão OAuth expirada ou inválida', 'OAuth session expired or invalid', 'Sesión OAuth expirada o inválida', 'Session OAuth expirée ou invalide', lang),
    'integrations.bling.wizard.notice.sessionExpiredBody': L(
      'A conta foi vinculada antes, mas o token não funciona mais. Reconecte para continuar.',
      'The account was linked before, but the token no longer works. Reconnect to continue.',
      'La cuenta se vinculó antes, pero el token ya no funciona. Reconecte para continuar.',
      'Le compte a été lié auparavant, mais le jeton ne fonctionne plus. Reconnectez pour continuer.',
      lang
    ),
    'integrations.bling.wizard.notice.platformTitle': L('Integração ainda não disponível', 'Integration not yet available', 'Integración aún no disponible', 'Intégration pas encore disponible', lang),
    'integrations.bling.wizard.step1.title': L('Conectar sua conta Bling', 'Connect your Bling account', 'Conectar su cuenta Bling', 'Connecter votre compte Bling', lang),
    'integrations.bling.wizard.step1.desc': L(
      'Autorize o Aero Suite a sincronizar contatos, criar pedidos e emitir NF-e.',
      'Authorize Aero Suite to sync contacts, create orders, and issue invoices.',
      'Autorice Aero Suite a sincronizar contactos, crear pedidos y emitir facturas.',
      'Autorisez Aero Suite à synchroniser les contacts, créer des commandes et émettre des factures.',
      lang
    ),
    'integrations.bling.wizard.step2.title': L('Dados fiscais e certificado', 'Fiscal data and certificate', 'Datos fiscales y certificado', 'Données fiscales et certificat', lang),
    'integrations.bling.wizard.step2.desc': L(
      'Informe CFOP, NCM, alíquotas e envie o certificado digital da empresa.',
      'Enter CFOP, NCM, tax rates, and upload the company digital certificate.',
      'Indique CFOP, NCM, alícuotas y envíe el certificado digital de la empresa.',
      'Indiquez CFOP, NCM, taux et téléversez le certificat numérique de l’entreprise.',
      lang
    ),
    'integrations.bling.wizard.step3.title': L('Sincronização e webhooks', 'Sync and webhooks', 'Sincronización y webhooks', 'Synchronisation et webhooks', lang),
    'integrations.bling.wizard.step3.desc': L(
      'Mantenha clientes, pedidos e NF-e atualizados entre o Aero Suite e o Bling.',
      'Keep customers, orders, and invoices up to date between Aero Suite and Bling.',
      'Mantenga clientes, pedidos y facturas actualizados entre Aero Suite y Bling.',
      'Maintenez clients, commandes et factures à jour entre Aero Suite et Bling.',
      lang
    ),
    'integrations.bling.wizard.badge.done': L('Concluído', 'Done', 'Completado', 'Terminé', lang),
    'integrations.bling.wizard.badge.reconnect': L('Reconectar', 'Reconnect', 'Reconectar', 'Reconnecter', lang),
    'integrations.bling.wizard.badge.waiting': L('Aguardando você', 'Waiting for you', 'Esperando su acción', 'En attente de votre action', lang),
    'integrations.bling.wizard.badge.unavailable': L('Indisponível', 'Unavailable', 'No disponible', 'Indisponible', lang),
    'integrations.bling.wizard.badge.ready': L('Pronto', 'Ready', 'Listo', 'Prêt', lang),
    'integrations.bling.wizard.badge.pending': L('Pendente', 'Pending', 'Pendiente', 'En attente', lang),
    'integrations.bling.wizard.badge.upToDate': L('Em dia', 'Up to date', 'Al día', 'À jour', lang),
    'integrations.bling.wizard.badge.verify': L('Verificar', 'Verify', 'Verificar', 'Vérifier', lang),
    'integrations.bling.wizard.readiness.title': L('Prontidão para NF-e automática', 'Automatic invoice readiness', 'Preparación para factura automática', 'Préparation facture automatique', lang),
    'integrations.bling.wizard.readiness.desc': L(
      'Verifique pendências antes da emissão automática após conclusão da OS.',
      'Check blockers before automatic issuance after work order completion.',
      'Verifique pendientes antes de la emisión automática tras concluir la OS.',
      'Vérifiez les blocages avant l’émission automatique après clôture de l’OS.',
      lang
    ),
    'integrations.bling.wizard.readiness.checking': L('Verificando…', 'Checking…', 'Verificando…', 'Vérification…', lang),
    'integrations.bling.wizard.readiness.pending': L('Pendências', 'Blockers', 'Pendientes', 'Blocages', lang),
    'integrations.bling.wizard.readiness.productsTitle': L('Permissão de Produtos no Bling', 'Bling Products permission', 'Permiso de Productos en Bling', 'Permission Produits Bling', lang),
    'integrations.bling.wizard.readiness.productsBody': L(
      'Habilite Cadastros → Produtos → Gerenciar produtos no app Bling e reconecte a conta.',
      'Enable Records → Products → Manage products in the Bling app and reconnect the account.',
      'Habilite Registros → Productos → Gestionar productos en la app Bling y reconecte la cuenta.',
      'Activez Enregistrements → Produits → Gérer les produits dans l’app Bling et reconnectez le compte.',
      lang
    ),
    'integrations.bling.wizard.readiness.warningsTitle': L('Avisos', 'Warnings', 'Avisos', 'Avertissements', lang),
    'integrations.bling.wizard.readiness.recheckBtn': L('Verificar novamente', 'Check again', 'Verificar de nuevo', 'Vérifier à nouveau', lang),
    'integrations.bling.wizard.done.title': L('Tudo pronto!', 'All set!', '¡Todo listo!', 'Tout est prêt !', lang),
    'integrations.bling.wizard.done.body': L(
      'A integração está configurada. Emita NF-e pelas Propostas comerciais ou acompanhe o fluxo na OS vinculada.',
      'Integration is configured. Issue invoices from Commercial Proposals or follow the flow on the linked work order.',
      'La integración está configurada. Emita facturas desde Propuestas comerciales o siga el flujo en la OS vinculada.',
      'L’intégration est configurée. Émettez des factures depuis les Propositions commerciales ou suivez le flux sur l’OS liée.',
      lang
    ),
    'integrations.bling.wizard.connectBlocked.platform': L(
      'A integração ainda não foi liberada na plataforma. Contate o suporte Aero Suite.',
      'Integration is not enabled on the platform yet. Contact Aero Suite support.',
      'La integración aún no está habilitada en la plataforma. Contacte al soporte Aero Suite.',
      'L’intégration n’est pas encore activée sur la plateforme. Contactez le support Aero Suite.',
      lang
    ),
    'integrations.bling.wizard.connectBlocked.permission': L(
      'Sua conta não tem permissão para gerenciar integrações.',
      'Your account cannot manage integrations.',
      'Su cuenta no tiene permiso para gestionar integraciones.',
      'Votre compte ne peut pas gérer les intégrations.',
      lang
    ),
    'integrations.bling.scopesTitle': L(
      'Permissões da API Bling',
      'Bling API permissions',
      'Permisos de la API Bling',
      'Autorisations de l’API Bling',
      lang
    ),
    'integrations.bling.wizard.scopes.intro': L(
      'Marque estas permissões no app OAuth da Bling e reconecte a conta se algum teste falhar.',
      'Enable these permissions in the Bling OAuth app and reconnect if any test fails.',
      'Active estos permisos en la app OAuth de Bling y reconecte si alguna prueba falla.',
      'Activez ces autorisations dans l’app OAuth Bling et reconnectez si un test échoue.',
      lang
    ),
    'integrations.bling.wizard.scopes.recheckBtn': L('Verificar escopos', 'Check scopes', 'Verificar alcances', 'Vérifier les scopes', lang),
    'integrations.bling.wizard.productSync.title': L('Sincronizar NCM no produto Bling', 'Sync NCM to Bling product', 'Sincronizar NCM en producto Bling', 'Synchroniser le NCM sur le produit Bling', lang),
    'integrations.bling.wizard.productSync.desc': L(
      'Informe o ID do produto no Bling para gravar o NCM/unidade padrão da empresa.',
      'Enter the Bling product ID to save the company default NCM/unit.',
      'Indique el ID del producto en Bling para guardar el NCM/unidad predeterminados.',
      'Indiquez l’ID produit Bling pour enregistrer le NCM/unité par défaut.',
      lang
    ),
    'integrations.bling.wizard.productSync.placeholder': L('ID produto Bling', 'Bling product ID', 'ID producto Bling', 'ID produit Bling', lang),
    'integrations.bling.wizard.productSync.btn': L('Sincronizar produto', 'Sync product', 'Sincronizar producto', 'Synchroniser le produit', lang),
    'integrations.bling.wizard.productSync.invalidId': L('Informe um ID de produto Bling válido.', 'Enter a valid Bling product ID.', 'Indique un ID de producto Bling válido.', 'Indiquez un ID produit Bling valide.', lang),
    'integrations.bling.wizard.productSync.ok': L('NCM/unidade gravados no produto Bling.', 'NCM/unit saved on Bling product.', 'NCM/unidad guardados en el producto Bling.', 'NCM/unité enregistrés sur le produit Bling.', lang),
    'integrations.bling.wizard.productSync.partial': L('Sincronização enviada, mas o produto pode ainda estar incompleto.', 'Sync sent, but the product may still be incomplete.', 'Sincronización enviada, pero el producto puede seguir incompleto.', 'Synchronisation envoyée, mais le produit peut rester incomplet.', lang),
    'integrations.bling.wizard.productSync.error': L('Falha ao sincronizar produto: {{message}}', 'Failed to sync product: {{message}}', 'Error al sincronizar producto: {{message}}', 'Échec de la synchronisation du produit : {{message}}', lang),
    'menu.func.INTEGRACAO_BLING': L('Integração Bling', 'Bling integration', 'Integración Bling', 'Intégration Bling', lang),
    'menu.func.INTEGRACAO_BLING.desc': L(
      'OAuth, fiscal, sincronização e NF-e',
      'OAuth, fiscal, sync, and invoices',
      'OAuth, fiscal, sincronización y facturas',
      'OAuth, fiscal, synchro et factures',
      lang
    ),
  };
}

export const BLING_WIZARD_PT_BR = dict('pt');
export const BLING_WIZARD_EN_US = dict('en');
export const BLING_WIZARD_ES_ES = dict('es');
export const BLING_WIZARD_FR_FR = dict('fr');
