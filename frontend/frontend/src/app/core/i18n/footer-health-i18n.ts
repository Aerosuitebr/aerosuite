/** Rodapé — diagnóstico de saúde dos serviços (PT / EN / ES / FR) */

export const FOOTER_HEALTH_I18N_PT_BR: Record<string, string> = {

  'footer.statusChecking': 'Verificando…',

  'footer.health.statusClickHint': 'Ver detalhes dos serviços com problema',

  'footer.health.servicesChecking': 'Verificando serviços…',

  'footer.health.servicesLoaded': '{{operational}} de {{total}} serviços operacionais',

  'footer.health.dialogTitle': 'Situação dos serviços',

  'footer.health.dialogBriefTitle': 'Serviços com problema',

  'footer.health.dialogBriefSubtitle': '{{count}} serviço(s) precisam de atenção',

  'footer.health.dialogAllOperational': 'Todos os serviços monitorados estão operacionais.',

  'footer.health.statsAria': 'Resumo de serviços',

  'footer.health.stat.operational': 'Operacionais',

  'footer.health.stat.problematic': 'Com problema',

  'footer.health.stat.total': 'Monitorados',

  'footer.health.autoCloseHint': 'Fecha automaticamente em {{seconds}}s',

  'footer.health.dialogIntro.network':

    'Não foi possível contatar o servidor da Aero Suite. A aplicação pode parecer aberta, mas operações que dependem do backend não funcionarão até a conexão ser restabelecida.',

  'footer.health.dialogIntro.database':

    'O servidor responde, mas o banco de dados não está acessível. Dados não podem ser gravados ou consultados; funcionalidades críticas ficam indisponíveis.',

  'footer.health.dialogIntro.server':

    'O servidor reportou indisponibilidade. Alguns serviços essenciais estão fora do ar.',

  'footer.health.lastCheck': 'Última verificação: {{time}}',

  'footer.health.httpDetail': 'Resposta HTTP: {{code}}',

  'footer.health.servicesTitle': 'Serviços e funcionalidades',

  'footer.health.impactsTitle': 'O que isso significa',

  'footer.health.table.service': 'Serviço',

  'footer.health.table.category': 'Área',

  'footer.health.table.status': 'Status',

  'footer.health.table.impact': 'Impacto',

  'footer.health.category.infrastructure': 'Infraestrutura',

  'footer.health.category.platform': 'Plataforma',

  'footer.health.category.operations': 'Operações',

  'footer.health.status.up': 'Operacional',

  'footer.health.status.down': 'Indisponível',

  'footer.health.status.unknown': 'Desconhecido',

  'footer.health.status.unverified': 'Não verificado',

  'footer.health.service.api': 'API / servidor da aplicação',

  'footer.health.service.database': 'Banco de dados',

  'footer.health.service.auth': 'Login e sessões',

  'footer.health.service.mro': 'MRO / Ordens de serviço',

  'footer.health.service.estoque': 'Estoque e movimentações',

  'footer.health.service.comercial': 'Comercial e propostas',

  'footer.health.service.integrations': 'Integrações e notificações',

  'footer.health.impact.row.api': 'Backend inacessível; nenhuma operação persiste no servidor.',

  'footer.health.impact.row.database': 'Consultas e gravações de dados ficam comprometidas.',

  'footer.health.impact.row.auth': 'Login, logout e troca de organização podem falhar.',

  'footer.health.impact.row.mro': 'Ordens de serviço não podem ser criadas ou atualizadas.',

  'footer.health.impact.row.estoque': 'Entradas, saídas e consultas de estoque suspensas.',

  'footer.health.impact.row.comercial': 'Propostas e fluxo comercial indisponíveis.',

  'footer.health.impact.row.integrations': 'E-mails, integrações e alertas suspensos.',

  'footer.health.impact.network.1': 'Salvar, editar ou consultar registros pode falhar ou não refletir no servidor.',

  'footer.health.impact.network.2': 'Login, logout e troca de organização podem não funcionar.',

  'footer.health.impact.network.3': 'Relatórios, impressões e integrações ficam suspensos.',

  'footer.health.impact.database.1': 'Dados existentes podem não ser exibidos; novos registros não serão persistidos.',

  'footer.health.impact.database.2': 'Ordens de serviço, estoque, comercial e conformidade ficam comprometidos.',

  'footer.health.impact.database.3': 'Contate o suporte se o problema persistir após reiniciar o ambiente.',

  'footer.health.contactSupport': 'Se o problema continuar, contate o suporte.',

  'footer.health.close': 'Fechar',

};



export const FOOTER_HEALTH_I18N_EN_US: Record<string, string> = {

  'footer.statusChecking': 'Checking…',

  'footer.health.statusClickHint': 'View services with issues',

  'footer.health.servicesChecking': 'Checking services…',

  'footer.health.servicesLoaded': '{{operational}} of {{total}} services operational',

  'footer.health.dialogTitle': 'Service status',

  'footer.health.dialogBriefTitle': 'Services with issues',

  'footer.health.dialogBriefSubtitle': '{{count}} service(s) need attention',

  'footer.health.dialogAllOperational': 'All monitored services are operational.',

  'footer.health.statsAria': 'Service summary',

  'footer.health.stat.operational': 'Operational',

  'footer.health.stat.problematic': 'With issues',

  'footer.health.stat.total': 'Monitored',

  'footer.health.autoCloseHint': 'Closes automatically in {{seconds}}s',

  'footer.health.dialogIntro.network':

    'Could not reach the Aero Suite server. The app may look open, but operations that depend on the backend will not work until connectivity is restored.',

  'footer.health.dialogIntro.database':

    'The server responds, but the database is not reachable. Data cannot be saved or queried; critical features are unavailable.',

  'footer.health.dialogIntro.server':

    'The server reported unavailability. Some essential services are down.',

  'footer.health.lastCheck': 'Last check: {{time}}',

  'footer.health.httpDetail': 'HTTP response: {{code}}',

  'footer.health.servicesTitle': 'Services and features',

  'footer.health.impactsTitle': 'What this means',

  'footer.health.table.service': 'Service',

  'footer.health.table.category': 'Area',

  'footer.health.table.status': 'Status',

  'footer.health.table.impact': 'Impact',

  'footer.health.category.infrastructure': 'Infrastructure',

  'footer.health.category.platform': 'Platform',

  'footer.health.category.operations': 'Operations',

  'footer.health.status.up': 'Operational',

  'footer.health.status.down': 'Unavailable',

  'footer.health.status.unknown': 'Unknown',

  'footer.health.status.unverified': 'Not verified',

  'footer.health.service.api': 'API / application server',

  'footer.health.service.database': 'Database',

  'footer.health.service.auth': 'Sign-in and sessions',

  'footer.health.service.mro': 'MRO / Work orders',

  'footer.health.service.estoque': 'Inventory and movements',

  'footer.health.service.comercial': 'Commercial and proposals',

  'footer.health.service.integrations': 'Integrations and notifications',

  'footer.health.impact.row.api': 'Backend unreachable; no operation persists on the server.',

  'footer.health.impact.row.database': 'Data reads and writes are compromised.',

  'footer.health.impact.row.auth': 'Sign-in, sign-out, and org switching may fail.',

  'footer.health.impact.row.mro': 'Work orders cannot be created or updated.',

  'footer.health.impact.row.estoque': 'Inventory entries, exits, and lookups suspended.',

  'footer.health.impact.row.comercial': 'Proposals and commercial flow unavailable.',

  'footer.health.impact.row.integrations': 'Email, integrations, and alerts suspended.',

  'footer.health.impact.network.1': 'Saving, editing, or querying records may fail or not reach the server.',

  'footer.health.impact.network.2': 'Sign-in, sign-out, and organization switching may not work.',

  'footer.health.impact.network.3': 'Reports, printing, and integrations are suspended.',

  'footer.health.impact.database.1': 'Existing data may not display; new records will not be persisted.',

  'footer.health.impact.database.2': 'Work orders, inventory, commercial, and compliance are affected.',

  'footer.health.impact.database.3': 'Contact support if the issue persists after restarting the environment.',

  'footer.health.contactSupport': 'If the problem continues, contact support.',

  'footer.health.close': 'Close',

};



export const FOOTER_HEALTH_I18N_ES_ES: Record<string, string> = {

  'footer.statusChecking': 'Verificando…',

  'footer.health.statusClickHint': 'Ver servicios con problemas',

  'footer.health.servicesChecking': 'Verificando servicios…',

  'footer.health.servicesLoaded': '{{operational}} de {{total}} servicios operativos',

  'footer.health.dialogTitle': 'Estado de los servicios',

  'footer.health.dialogBriefTitle': 'Servicios con problemas',

  'footer.health.dialogBriefSubtitle': '{{count}} servicio(s) requieren atención',

  'footer.health.dialogAllOperational': 'Todos los servicios monitoreados están operativos.',

  'footer.health.statsAria': 'Resumen de servicios',

  'footer.health.stat.operational': 'Operativos',

  'footer.health.stat.problematic': 'Con problemas',

  'footer.health.stat.total': 'Monitoreados',

  'footer.health.autoCloseHint': 'Se cierra automáticamente en {{seconds}}s',

  'footer.health.dialogIntro.network':

    'No se pudo contactar con el servidor de Aero Suite. La aplicación puede parecer abierta, pero las operaciones que dependen del backend no funcionarán hasta restablecer la conexión.',

  'footer.health.dialogIntro.database':

    'El servidor responde, pero la base de datos no está accesible. Los datos no se pueden guardar ni consultar; las funciones críticas quedan indisponibles.',

  'footer.health.dialogIntro.server':

    'El servidor reportó indisponibilidad. Algunos servicios esenciales están fuera de servicio.',

  'footer.health.lastCheck': 'Última verificación: {{time}}',

  'footer.health.httpDetail': 'Respuesta HTTP: {{code}}',

  'footer.health.servicesTitle': 'Servicios y funcionalidades',

  'footer.health.impactsTitle': 'Qué significa esto',

  'footer.health.table.service': 'Servicio',

  'footer.health.table.category': 'Área',

  'footer.health.table.status': 'Estado',

  'footer.health.table.impact': 'Impacto',

  'footer.health.category.infrastructure': 'Infraestructura',

  'footer.health.category.platform': 'Plataforma',

  'footer.health.category.operations': 'Operaciones',

  'footer.health.status.up': 'Operativo',

  'footer.health.status.down': 'No disponible',

  'footer.health.status.unknown': 'Desconocido',

  'footer.health.status.unverified': 'No verificado',

  'footer.health.service.api': 'API / servidor de la aplicación',

  'footer.health.service.database': 'Base de datos',

  'footer.health.service.auth': 'Inicio de sesión y sesiones',

  'footer.health.service.mro': 'MRO / Órdenes de servicio',

  'footer.health.service.estoque': 'Inventario y movimientos',

  'footer.health.service.comercial': 'Comercial y propuestas',

  'footer.health.service.integrations': 'Integraciones y notificaciones',

  'footer.health.impact.row.api': 'Backend inaccesible; ninguna operación persiste en el servidor.',

  'footer.health.impact.row.database': 'Lecturas y escrituras de datos comprometidas.',

  'footer.health.impact.row.auth': 'Inicio de sesión, cierre y cambio de organización pueden fallar.',

  'footer.health.impact.row.mro': 'Órdenes de servicio no se pueden crear ni actualizar.',

  'footer.health.impact.row.estoque': 'Entradas, salidas y consultas de inventario suspendidas.',

  'footer.health.impact.row.comercial': 'Propuestas y flujo comercial no disponibles.',

  'footer.health.impact.row.integrations': 'Correo, integraciones y alertas suspendidos.',

  'footer.health.impact.network.1': 'Guardar, editar o consultar registros puede fallar o no llegar al servidor.',

  'footer.health.impact.network.2': 'Inicio de sesión, cierre y cambio de organización pueden no funcionar.',

  'footer.health.impact.network.3': 'Informes, impresiones e integraciones quedan suspendidos.',

  'footer.health.impact.database.1': 'Los datos existentes pueden no mostrarse; los nuevos registros no se persistirán.',

  'footer.health.impact.database.2': 'Órdenes de servicio, inventario, comercial y conformidad se ven afectados.',

  'footer.health.impact.database.3': 'Contacte soporte si el problema persiste tras reiniciar el entorno.',

  'footer.health.contactSupport': 'Si el problema continúa, contacte soporte.',

  'footer.health.close': 'Cerrar',

};



export const FOOTER_HEALTH_I18N_FR_FR: Record<string, string> = {

  'footer.statusChecking': 'Vérification…',

  'footer.health.statusClickHint': 'Voir les services en difficulté',

  'footer.health.servicesChecking': 'Vérification des services…',

  'footer.health.servicesLoaded': '{{operational}} sur {{total}} services opérationnels',

  'footer.health.dialogTitle': 'État des services',

  'footer.health.dialogBriefTitle': 'Services en difficulté',

  'footer.health.dialogBriefSubtitle': '{{count}} service(s) nécessitent une attention',

  'footer.health.dialogAllOperational': 'Tous les services surveillés sont opérationnels.',

  'footer.health.statsAria': 'Résumé des services',

  'footer.health.stat.operational': 'Opérationnels',

  'footer.health.stat.problematic': 'En difficulté',

  'footer.health.stat.total': 'Surveillés',

  'footer.health.autoCloseHint': 'Fermeture automatique dans {{seconds}}s',

  'footer.health.dialogIntro.network':

    'Impossible de joindre le serveur Aero Suite. L’application peut sembler ouverte, mais les opérations dépendant du backend ne fonctionneront pas tant que la connexion n’est pas rétablie.',

  'footer.health.dialogIntro.database':

    'Le serveur répond, mais la base de données est inaccessible. Les données ne peuvent être ni enregistrées ni consultées ; les fonctions critiques sont indisponibles.',

  'footer.health.dialogIntro.server':

    'Le serveur a signalé une indisponibilité. Certains services essentiels sont hors service.',

  'footer.health.lastCheck': 'Dernière vérification : {{time}}',

  'footer.health.httpDetail': 'Réponse HTTP : {{code}}',

  'footer.health.servicesTitle': 'Services et fonctionnalités',

  'footer.health.impactsTitle': 'Ce que cela signifie',

  'footer.health.table.service': 'Service',

  'footer.health.table.category': 'Domaine',

  'footer.health.table.status': 'Statut',

  'footer.health.table.impact': 'Impact',

  'footer.health.category.infrastructure': 'Infrastructure',

  'footer.health.category.platform': 'Plateforme',

  'footer.health.category.operations': 'Opérations',

  'footer.health.status.up': 'Opérationnel',

  'footer.health.status.down': 'Indisponible',

  'footer.health.status.unknown': 'Inconnu',

  'footer.health.status.unverified': 'Non vérifié',

  'footer.health.service.api': 'API / serveur applicatif',

  'footer.health.service.database': 'Base de données',

  'footer.health.service.auth': 'Connexion et sessions',

  'footer.health.service.mro': 'MRO / Ordres de service',

  'footer.health.service.estoque': 'Stock et mouvements',

  'footer.health.service.comercial': 'Commercial et propositions',

  'footer.health.service.integrations': 'Intégrations et notifications',

  'footer.health.impact.row.api': 'Backend inaccessible ; aucune opération persiste sur le serveur.',

  'footer.health.impact.row.database': 'Lecture et écriture des données compromises.',

  'footer.health.impact.row.auth': 'Connexion, déconnexion et changement d’organisation peuvent échouer.',

  'footer.health.impact.row.mro': 'Les ordres de service ne peuvent être créés ni mis à jour.',

  'footer.health.impact.row.estoque': 'Entrées, sorties et consultations de stock suspendues.',

  'footer.health.impact.row.comercial': 'Propositions et flux commercial indisponibles.',

  'footer.health.impact.row.integrations': 'E-mails, intégrations et alertes suspendus.',

  'footer.health.impact.network.1': 'Enregistrer, modifier ou consulter des données peut échouer ou ne pas atteindre le serveur.',

  'footer.health.impact.network.2': 'Connexion, déconnexion et changement d’organisation peuvent ne pas fonctionner.',

  'footer.health.impact.network.3': 'Rapports, impressions et intégrations sont suspendus.',

  'footer.health.impact.database.1': 'Les données existantes peuvent ne pas s’afficher ; les nouveaux enregistrements ne seront pas persistés.',

  'footer.health.impact.database.2': 'Ordres de service, stock, commercial et conformité sont affectés.',

  'footer.health.impact.database.3': 'Contactez le support si le problème persiste après redémarrage de l’environnement.',

  'footer.health.contactSupport': 'Si le problème continue, contactez le support.',

  'footer.health.close': 'Fermer',

};


