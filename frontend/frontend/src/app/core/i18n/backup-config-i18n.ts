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
    'backup.title': L('Configurações de Backup', 'Backup settings', 'Configuración de copias de seguridad', 'Paramètres de sauvegarde', lang),
    'backup.subtitle': L(
      'Configure e gerencie backups automáticos do banco de dados',
      'Configure and manage automatic database backups',
      'Configure y gestione copias automáticas de la base de datos',
      'Configurez et gérez les sauvegardes automatiques de la base',
      lang
    ),
    'backup.btn.runNow': L('Executar backup agora', 'Run backup now', 'Ejecutar copia ahora', 'Lancer la sauvegarde', lang),
    'backup.loading': L('Carregando configurações…', 'Loading settings…', 'Cargando configuración…', 'Chargement des paramètres…', lang),
    'backup.tab.connection': L('Conexão com banco de dados', 'Database connection', 'Conexión a base de datos', 'Connexion base de données', lang),
    'backup.tab.schedule': L('Agendamento', 'Schedule', 'Programación', 'Planification', lang),
    'backup.tab.history': L('Histórico', 'History', 'Historial', 'Historique', lang),
    'backup.tab.storage': L('Armazenamento', 'Storage', 'Almacenamiento', 'Stockage', lang),
    'backup.tab.path': L('Caminho de backup', 'Backup path', 'Ruta de copia', 'Chemin de sauvegarde', lang),
    'backup.tab.notifications': L('Notificações', 'Notifications', 'Notificaciones', 'Notifications', lang),
    'backup.tab.historyFull': L('Histórico de backups', 'Backup history', 'Historial de copias', 'Historique des sauvegardes', lang),
    'backup.card.connection': L('Informações de conexão', 'Connection details', 'Datos de conexión', 'Informations de connexion', lang),
    'backup.card.pathLocation': L('Localização dos backups', 'Backup location', 'Ubicación de copias', 'Emplacement des sauvegardes', lang),
    'backup.card.scheduleConfig': L('Configuração de agendamento', 'Schedule configuration', 'Configuración de programación', 'Configuration de planification', lang),
    'backup.card.notifications': L('Configurações de notificação', 'Notification settings', 'Configuración de notificaciones', 'Paramètres de notification', lang),
    'backup.card.historyList': L('Últimos backups executados', 'Recent backups', 'Últimas copias ejecutadas', 'Dernières sauvegardes', lang),
    'backup.field.host': L('Host / servidor', 'Host / server', 'Host / servidor', 'Hôte / serveur', lang),
    'backup.field.port': L('Porta', 'Port', 'Puerto', 'Port', lang),
    'backup.field.database': L('Nome do banco de dados', 'Database name', 'Nombre de la base de datos', 'Nom de la base de données', lang),
    'backup.field.user': L('Usuário', 'User', 'Usuario', 'Utilisateur', lang),
    'backup.field.password': L('Senha', 'Password', 'Contraseña', 'Mot de passe', lang),
    'backup.password.show': L('Mostrar senha', 'Show password', 'Mostrar contraseña', 'Afficher le mot de passe', lang),
    'backup.password.hide': L('Ocultar senha', 'Hide password', 'Ocultar contraseña', 'Masquer le mot de passe', lang),
    'backup.field.backupPath': L('Caminho do diretório de backup', 'Backup directory path', 'Ruta del directorio de copia', 'Chemin du dossier de sauvegarde', lang),
    'backup.field.scheduleType': L('Tipo de agendamento', 'Schedule type', 'Tipo de programación', 'Type de planification', lang),
    'backup.field.scheduledDate': L('Data do backup', 'Backup date', 'Fecha de la copia', 'Date de sauvegarde', lang),
    'backup.field.scheduledTime': L('Horário', 'Time', 'Hora', 'Heure', lang),
    'backup.field.daysOfWeek': L('Dias da semana', 'Days of week', 'Días de la semana', 'Jours de la semaine', lang),
    'backup.field.dayOfMonth': L('Dia do mês', 'Day of month', 'Día del mes', 'Jour du mois', lang),
    'backup.field.retentionDays': L('Retenção (dias)', 'Retention (days)', 'Retención (días)', 'Rétention (jours)', lang),
    'backup.field.compress': L('Comprimir backup', 'Compress backup', 'Comprimir copia', 'Compresser la sauvegarde', lang),
    'backup.field.enableSchedule': L('Habilitar agendamento automático', 'Enable automatic schedule', 'Habilitar programación automática', 'Activer la planification automatique', lang),
    'backup.field.compressHint': L(
      'Comprimir backups (recomendado para economizar espaço)',
      'Compress backups (recommended to save space)',
      'Comprimir copias (recomendado para ahorrar espacio)',
      'Compresser les sauvegardes (recommandé pour économiser l’espace)',
      lang
    ),
    'backup.field.emailNotification': L('Notificar por e-mail', 'Email notification', 'Notificar por correo', 'Notification par e-mail', lang),
    'backup.field.emailRecipients': L('Destinatários', 'Recipients', 'Destinatarios', 'Destinataires', lang),
    'backup.field.required': L('Campo obrigatório', 'Required field', 'Campo obligatorio', 'Champ obligatoire', lang),
    'backup.err.hostRequired': L('Host é obrigatório', 'Host is required', 'El host es obligatorio', 'L’hôte est obligatoire', lang),
    'backup.err.portInvalid': L('Porta inválida', 'Invalid port', 'Puerto no válido', 'Port invalide', lang),
    'backup.err.databaseRequired': L('Nome do banco é obrigatório', 'Database name is required', 'El nombre de la base es obligatorio', 'Le nom de la base est obligatoire', lang),
    'backup.err.usernameRequired': L('Usuário é obrigatório', 'Username is required', 'El usuario es obligatorio', 'L’utilisateur est obligatoire', lang),
    'backup.err.passwordRequired': L('Senha é obrigatória', 'Password is required', 'La contraseña es obligatoria', 'Le mot de passe est obligatoire', lang),
    'backup.err.pathRequired': L('Caminho é obrigatório', 'Path is required', 'La ruta es obligatoria', 'Le chemin est obligatoire', lang),
    'backup.err.pathValidate': L('Erro ao validar caminho', 'Error validating path', 'Error al validar la ruta', 'Erreur de validation du chemin', lang),
    'backup.sslEnabled': L('Habilitar conexão SSL/TLS', 'Enable SSL/TLS connection', 'Habilitar conexión SSL/TLS', 'Activer la connexion SSL/TLS', lang),
    'backup.btn.testConnection': L('Testar conexão', 'Test connection', 'Probar conexión', 'Tester la connexion', lang),
    'backup.btn.save': L('Salvar configurações', 'Save settings', 'Guardar configuración', 'Enregistrer', lang),
    'backup.btn.cancel': L('Cancelar', 'Cancel', 'Cancelar', 'Annuler', lang),
    'backup.btn.create': L('Criar', 'Create', 'Crear', 'Créer', lang),
    'backup.btn.confirm': L('Confirmar', 'Confirm', 'Confirmar', 'Confirmer', lang),
    'backup.btn.selectCurrentFolder': L('Selecionar pasta atual', 'Select current folder', 'Seleccionar carpeta actual', 'Sélectionner le dossier actuel', lang),
    'backup.placeholder.host': L('localhost ou IP do servidor', 'localhost or server IP', 'localhost o IP del servidor', 'localhost ou IP du serveur', lang),
    'backup.placeholder.port': L('3306', '3306', '3306', '3306', lang),
    'backup.placeholder.database': L('nome_do_banco', 'database_name', 'nombre_base', 'nom_base', lang),
    'backup.placeholder.user': L('usuário', 'username', 'usuario', 'utilisateur', lang),
    'backup.placeholder.password': L('••••••••', '••••••••', '••••••••', '••••••••', lang),
    'backup.placeholder.backupPath': L(
      '/caminho/para/backups ou C:\\caminho\\para\\backups',
      '/path/to/backups or C:\\path\\to\\backups',
      '/ruta/copias o C:\\ruta\\copias',
      '/chemin/sauvegardes ou C:\\chemin\\sauvegardes',
      lang
    ),
    'backup.placeholder.scheduleType': L('Selecione o tipo', 'Select type', 'Seleccione el tipo', 'Sélectionnez le type', lang),
    'backup.placeholder.date': L('Selecione a data', 'Select date', 'Seleccione la fecha', 'Sélectionnez la date', lang),
    'backup.placeholder.dayOfMonth': L('1-31', '1-31', '1-31', '1-31', lang),
    'backup.placeholder.retention': L('30', '30', '30', '30', lang),
    'backup.placeholder.emails': L(
      'email1@exemplo.com, email2@exemplo.com',
      'email1@example.com, email2@example.com',
      'email1@ejemplo.com, email2@ejemplo.com',
      'email1@exemple.com, email2@exemple.com',
      lang
    ),
    'backup.placeholder.noFolderSelected': L('Nenhuma pasta selecionada', 'No folder selected', 'Ninguna carpeta seleccionada', 'Aucun dossier sélectionné', lang),
    'backup.placeholder.folderPath': L('C:\\Backups ou /var/backups', 'C:\\Backups or /var/backups', 'C:\\Backups o /var/backups', 'C:\\Backups ou /var/backups', lang),
    'backup.placeholder.folderName': L('nome-da-pasta', 'folder-name', 'nombre-carpeta', 'nom-dossier', lang),
    'backup.tooltip.selectFolder': L('Selecionar pasta', 'Select folder', 'Seleccionar carpeta', 'Sélectionner un dossier', lang),
    'backup.tooltip.createFolder': L('Criar nova pasta', 'Create new folder', 'Crear carpeta nueva', 'Créer un dossier', lang),
    'backup.validatingPath': L('Validando caminho…', 'Validating path…', 'Validando ruta…', 'Validation du chemin…', lang),
    'backup.tips.title': L('Dicas:', 'Tips:', 'Consejos:', 'Conseils :', lang),
    'backup.tips.absolutePath': L(
      'Use caminhos absolutos (ex.: /var/backups ou C:\\Backups)',
      'Use absolute paths (e.g. /var/backups or C:\\Backups)',
      'Use rutas absolutas (p. ej. /var/backups o C:\\Backups)',
      'Utilisez des chemins absolus (p. ex. /var/backups ou C:\\Backups)',
      lang
    ),
    'backup.tips.permissions': L(
      'Certifique-se de que o diretório existe e tem permissões de escrita',
      'Ensure the directory exists and is writable',
      'Asegúrese de que el directorio existe y tiene permisos de escritura',
      'Assurez-vous que le dossier existe et est accessible en écriture',
      lang
    ),
    'backup.tips.subdirs': L(
      'O sistema criará subdiretórios automaticamente se necessário',
      'The system will create subdirectories automatically if needed',
      'El sistema creará subdirectorios automáticamente si hace falta',
      'Le système créera des sous-dossiers automatiquement si nécessaire',
      lang
    ),
    'backup.schedule.previewLabel': L('Agendamento configurado:', 'Configured schedule:', 'Programación configurada:', 'Planification configurée :', lang),
    'backup.schedule.disabled': L('Agendamento desabilitado', 'Schedule disabled', 'Programación deshabilitada', 'Planification désactivée', lang),
    'backup.schedule.onceOn': L('Uma vez em {{date}} às {{time}}', 'Once on {{date}} at {{time}}', 'Una vez el {{date}} a las {{time}}', 'Une fois le {{date}} à {{time}}', lang),
    'backup.schedule.selectDate': L('Selecione uma data para o backup único', 'Select a date for the one-time backup', 'Seleccione una fecha para la copia única', 'Sélectionnez une date pour la sauvegarde unique', lang),
    'backup.schedule.dailyAt': L('Diariamente às {{time}}', 'Daily at {{time}}', 'Diariamente a las {{time}}', 'Quotidiennement à {{time}}', lang),
    'backup.schedule.weeklyOn': L('Toda(s) {{days}} às {{time}}', 'Every {{days}} at {{time}}', 'Cada {{days}} a las {{time}}', 'Chaque {{days}} à {{time}}', lang),
    'backup.schedule.selectWeekdays': L('Selecione os dias da semana', 'Select weekdays', 'Seleccione los días de la semana', 'Sélectionnez les jours de la semaine', lang),
    'backup.schedule.monthlyOn': L('Todo dia {{day}} de cada mês às {{time}}', 'Day {{day}} of every month at {{time}}', 'Cada día {{day}} del mes a las {{time}}', 'Le {{day}} de chaque mois à {{time}}', lang),
    'backup.schedule.selectMonthDay': L('Selecione o dia do mês', 'Select day of month', 'Seleccione el día del mes', 'Sélectionnez le jour du mois', lang),
    'backup.schedule.type.once': L('Uma vez', 'Once', 'Una vez', 'Une fois', lang),
    'backup.schedule.type.daily': L('Diário', 'Daily', 'Diario', 'Quotidien', lang),
    'backup.schedule.type.weekly': L('Semanal', 'Weekly', 'Semanal', 'Hebdomadaire', lang),
    'backup.schedule.type.monthly': L('Mensal', 'Monthly', 'Mensual', 'Mensuel', lang),
    'backup.weekday.0': L('Domingo', 'Sunday', 'Domingo', 'Dimanche', lang),
    'backup.weekday.1': L('Segunda-feira', 'Monday', 'Lunes', 'Lundi', lang),
    'backup.weekday.2': L('Terça-feira', 'Tuesday', 'Martes', 'Mardi', lang),
    'backup.weekday.3': L('Quarta-feira', 'Wednesday', 'Miércoles', 'Mercredi', lang),
    'backup.weekday.4': L('Quinta-feira', 'Thursday', 'Jueves', 'Jeudi', lang),
    'backup.weekday.5': L('Sexta-feira', 'Friday', 'Viernes', 'Vendredi', lang),
    'backup.weekday.6': L('Sábado', 'Saturday', 'Sábado', 'Samedi', lang),
    'backup.hint.retention': L(
      'Backups mais antigos serão excluídos automaticamente',
      'Older backups will be deleted automatically',
      'Las copias antiguas se eliminarán automáticamente',
      'Les anciennes sauvegardes seront supprimées automatiquement',
      lang
    ),
    'backup.hint.emails': L('Digite os e-mails separados por vírgula', 'Enter emails separated by commas', 'Escriba los correos separados por comas', 'Saisissez les e-mails séparés par des virgules', lang),
    'backup.hint.folderPathEmpty': L(
      'Deixe vazio para usar apenas o nome da pasta',
      'Leave empty to use only the folder name',
      'Deje vacío para usar solo el nombre de la carpeta',
      'Laissez vide pour n’utiliser que le nom du dossier',
      lang
    ),
    'backup.hint.folderNameOnly': L(
      'Digite apenas o nome da pasta (sem barras)',
      'Enter the folder name only (no slashes)',
      'Escriba solo el nombre (sin barras)',
      'Saisissez uniquement le nom (sans barres)',
      lang
    ),
    'backup.notifications.sentTitle': L('Notificações enviadas:', 'Notifications sent:', 'Notificaciones enviadas:', 'Notifications envoyées :', lang),
    'backup.notifications.onSuccess': L('Quando um backup é concluído com sucesso', 'When a backup completes successfully', 'Cuando una copia se completa con éxito', 'Lorsqu’une sauvegarde réussit', lang),
    'backup.notifications.onFail': L('Quando um backup falha', 'When a backup fails', 'Cuando una copia falla', 'Lorsqu’une sauvegarde échoue', lang),
    'backup.notifications.onSkipped': L(
      'Quando um backup agendado não pode ser executado',
      'When a scheduled backup cannot run',
      'Cuando una copia programada no puede ejecutarse',
      'Lorsqu’une sauvegarde planifiée ne peut pas s’exécuter',
      lang
    ),
    'backup.th.datetime': L('Data/hora', 'Date/time', 'Fecha/hora', 'Date/heure', lang),
    'backup.th.path': L('Caminho', 'Path', 'Ruta', 'Chemin', lang),
    'backup.th.size': L('Tamanho', 'Size', 'Tamaño', 'Taille', lang),
    'backup.th.status': L('Status', 'Status', 'Estado', 'Statut', lang),
    'backup.th.duration': L('Duração', 'Duration', 'Duración', 'Durée', lang),
    'backup.th.openFolder': L('Abrir pasta', 'Open folder', 'Abrir carpeta', 'Ouvrir le dossier', lang),
    'backup.th.actions': L('Ações', 'Actions', 'Acciones', 'Actions', lang),
    'backup.history.empty': L('Nenhum backup encontrado', 'No backups found', 'Ninguna copia encontrada', 'Aucune sauvegarde trouvée', lang),
    'backup.dialog.selectFolder.title': L('Selecionar pasta de backup', 'Select backup folder', 'Seleccionar carpeta de copia', 'Sélectionner le dossier de sauvegarde', lang),
    'backup.dialog.selectFolder.loading': L('Carregando diretórios…', 'Loading directories…', 'Cargando directorios…', 'Chargement des dossiers…', lang),
    'backup.dialog.selectFolder.empty': L('Nenhum diretório encontrado', 'No directories found', 'Ningún directorio encontrado', 'Aucun dossier trouvé', lang),
    'backup.dialog.createFolder.title': L('Criar nova pasta', 'Create new folder', 'Crear carpeta nueva', 'Créer un dossier', lang),
    'backup.dialog.createFolder.noteTitle': L('Nota:', 'Note:', 'Nota:', 'Note :', lang),
    'backup.dialog.createFolder.noteBody': L(
      'O sistema tentará criar a pasta no servidor ao salvar. Certifique-se de ter as permissões necessárias.',
      'The system will try to create the folder on the server when you save. Ensure you have the required permissions.',
      'El sistema intentará crear la carpeta al guardar. Asegúrese de tener los permisos necesarios.',
      'Le système tentera de créer le dossier à l’enregistrement. Vérifiez vos permissions.',
      lang
    ),
    'backup.toast.warn': L('Aviso', 'Warning', 'Aviso', 'Avertissement', lang),
    'backup.toast.attention': L('Atenção', 'Attention', 'Atención', 'Attention', lang),
    'backup.toast.success': L('Sucesso', 'Success', 'Éxito', 'Succès', lang),
    'backup.toast.error': L('Erro', 'Error', 'Error', 'Erreur', lang),
    'backup.toast.loadFailed': L(
      'Não foi possível carregar as configurações salvas. Use os valores padrão ou configure novamente.',
      'Could not load saved settings. Use defaults or configure again.',
      'No se pudieron cargar los ajustes guardados. Use valores predeterminados o configure de nuevo.',
      'Impossible de charger les paramètres. Utilisez les valeurs par défaut ou reconfigurez.',
      lang
    ),
    'backup.toast.fillConnection': L('Preencha todos os campos de conexão', 'Fill in all connection fields', 'Complete todos los campos de conexión', 'Remplissez tous les champs de connexion', lang),
    'backup.toast.fillRequired': L('Preencha todos os campos obrigatórios', 'Fill in all required fields', 'Complete todos los campos obligatorios', 'Remplissez tous les champs obligatoires', lang),
    'backup.toast.testConnectionError': L('Erro ao testar conexão', 'Error testing connection', 'Error al probar la conexión', 'Erreur lors du test de connexion', lang),
    'backup.toast.runBackupError': L('Erro ao executar backup', 'Error running backup', 'Error al ejecutar la copia', 'Erreur lors de la sauvegarde', lang),
    'backup.toast.saveSuccess': L('Configurações salvas com sucesso!', 'Settings saved successfully!', '¡Configuración guardada!', 'Paramètres enregistrés !', lang),
    'backup.toast.saveError': L('Erro ao salvar configurações', 'Error saving settings', 'Error al guardar', 'Erreur lors de l’enregistrement', lang),
    'backup.toast.deleteSuccess': L('Backup excluído com sucesso', 'Backup deleted successfully', 'Copia eliminada', 'Sauvegarde supprimée', lang),
    'backup.toast.deleteError': L('Erro ao excluir backup', 'Error deleting backup', 'Error al eliminar', 'Erreur lors de la suppression', lang),
    'backup.toast.pathUnavailable': L('Caminho do backup não disponível', 'Backup path unavailable', 'Ruta no disponible', 'Chemin indisponible', lang),
    'backup.toast.pathCopied': L('Caminho copiado', 'Path copied', 'Ruta copiada', 'Chemin copié', lang),
    'backup.toast.pathCopiedDetail': L(
      '{{path}} — Cole na barra de endereço do Windows Explorer (Win+E).',
      '{{path}} — Paste into the Windows Explorer address bar (Win+E).',
      '{{path}} — Pegue en la barra de dirección del Explorador (Win+E).',
      '{{path}} — Collez dans la barre d’adresse de l’Explorateur (Win+E).',
      lang
    ),
    'backup.toast.openFolderWindows': L('Abra esta pasta no Windows', 'Open this folder in Windows', 'Abra esta carpeta en Windows', 'Ouvrez ce dossier sous Windows', lang),
    'backup.toast.openFolderResult': L('{{message}}', '{{message}}', '{{message}}', '{{message}}', lang),
    'backup.toast.openFolderSuccessDefault': L('Pasta aberta com sucesso', 'Folder opened successfully', 'Carpeta abierta con éxito', 'Dossier ouvert avec succès', lang),
    'backup.toast.openFolderErrorDefault': L('Não foi possível abrir a pasta', 'Could not open folder', 'No fue posible abrir la carpeta', 'Impossible d’ouvrir le dossier', lang),
    'backup.toast.loadDirectoriesError': L('Erro ao carregar diretórios: {{error}}', 'Error loading directories: {{error}}', 'Error al cargar directorios: {{error}}', 'Erreur lors du chargement des dossiers : {{error}}', lang),
    'backup.toast.selectFolderRequired': L('Selecione uma pasta', 'Select a folder', 'Seleccione una carpeta', 'Sélectionnez un dossier', lang),
    'backup.toast.folderNameRequired': L('Digite um nome para a pasta', 'Enter a folder name', 'Ingrese un nombre para la carpeta', 'Saisissez un nom de dossier', lang),
    'backup.toast.folderCreatedTitle': L('Pasta criada', 'Folder created', 'Carpeta creada', 'Dossier créé', lang),
    'backup.toast.folderCreatedDetail': L('O caminho foi atualizado. Certifique-se de que a pasta existe no servidor.', 'Path updated. Ensure the folder exists on the server.', 'La ruta fue actualizada. Asegúrese de que la carpeta exista en el servidor.', 'Le chemin a été mis à jour. Assurez-vous que le dossier existe sur le serveur.', lang),
    'backup.progress.title': L('Backup em execução', 'Backup running', 'Respaldo en ejecución', 'Sauvegarde en cours', lang),
    'backup.progress.secondsShort': L('seg', 'sec', 'seg', 's', lang),
    'backup.progress.running': L('Backup em execução...', 'Backup running...', 'Respaldo en ejecución...', 'Sauvegarde en cours...', lang),
    'backup.progress.success': L('Backup concluído com sucesso!', 'Backup completed successfully!', '¡Respaldo completado con éxito!', 'Sauvegarde terminée avec succès !', lang),
    'backup.progress.runError': L('Erro ao executar backup', 'Error running backup', 'Error al ejecutar el respaldo', 'Erreur lors de l’exécution de la sauvegarde', lang),
    'backup.progress.timeout': L('Timeout: O backup não foi concluído no tempo esperado', 'Timeout: backup did not complete in the expected time', 'Tiempo de espera agotado: el respaldo no se completó en el tiempo esperado', 'Délai dépassé : la sauvegarde ne s’est pas terminée dans le temps attendu', lang),
    'backup.progress.checkStatusError': L('Erro ao verificar status do backup', 'Error checking backup status', 'Error al verificar el estado del respaldo', 'Erreur lors de la vérification de l’état de la sauvegarde', lang),
    'backup.schedule.configurePreview': L('Configure o agendamento', 'Configure the schedule', 'Configure la programación', 'Configurez la planification', lang),
    'backup.toggle.on': L('Ativo', 'On', 'Activo', 'Actif', lang),
    'backup.toggle.off': L('Inativo', 'Off', 'Inactivo', 'Inactif', lang),
    'backup.field.emailNotify': L('Enviar notificações por e-mail', 'Send email notifications', 'Enviar notificaciones por correo', 'Envoyer des notifications par e-mail', lang),
    'backup.field.emailRecipientsLabel': L(
      'Destinatários (separados por vírgula)',
      'Recipients (comma-separated)',
      'Destinatarios (separados por coma)',
      'Destinataires (séparés par des virgules)',
      lang
    ),
    'backup.status.success': L('Sucesso', 'Success', 'Éxito', 'Succès', lang),
    'backup.status.failed': L('Falhou', 'Failed', 'Falló', 'Échec', lang),
    'backup.btn.viewError': L('Ver erro', 'View error', 'Ver error', 'Voir l’erreur', lang),
    'backup.tooltip.openBackupFolder': L('Abrir pasta do backup', 'Open backup folder', 'Abrir carpeta de copia', 'Ouvrir le dossier de sauvegarde', lang),
    'backup.tooltip.deleteBackup': L('Excluir backup', 'Delete backup', 'Eliminar copia', 'Supprimer la sauvegarde', lang),
    'backup.tooltip.back': L('Voltar', 'Back', 'Volver', 'Retour', lang),
    'backup.tooltip.refresh': L('Atualizar', 'Refresh', 'Actualizar', 'Actualiser', lang),
    'backup.explorer.root': L('Raiz do sistema', 'System root', 'Raíz del sistema', 'Racine du système', lang),
    'backup.explorer.selectedFolder': L('Pasta selecionada:', 'Selected folder:', 'Carpeta seleccionada:', 'Dossier sélectionné :', lang),
    'backup.table.paginator': L(
      'Mostrando {{from}} a {{to}} de {{total}} registros',
      'Showing {{from}} to {{to}} of {{total}} records',
      'Mostrando {{from}} a {{to}} de {{total}} registros',
      'Affichage de {{from}} à {{to}} sur {{total}} enregistrements',
      lang
    ),
    'backup.history.loading': L('Carregando histórico…', 'Loading history…', 'Cargando historial…', 'Chargement de l’historique…', lang)
  };
}

export const BACKUP_CONFIG_PT_BR = dict('pt');
export const BACKUP_CONFIG_EN_US = dict('en');
export const BACKUP_CONFIG_ES_ES = dict('es');
export const BACKUP_CONFIG_FR_FR = dict('fr');
