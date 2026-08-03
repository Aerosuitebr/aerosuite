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
    'api.ticket.notFound': L(
      'Chamado não encontrado',
      'Ticket not found',
      'Ticket no encontrado',
      'Ticket introuvable',
      lang
    ),
    'api.ticket.fileSaveError': L(
      'Erro ao salvar arquivo: {{detail}}',
      'Failed to save file: {{detail}}',
      'Error al guardar el archivo: {{detail}}',
      'Échec de l’enregistrement du fichier : {{detail}}',
      lang
    ),
    'api.ticket.fileNotFound': L(
      'Arquivo não encontrado',
      'File not found',
      'Archivo no encontrado',
      'Fichier introuvable',
      lang
    ),
    'api.ticket.fileReadError': L(
      'Erro ao ler arquivo: {{detail}}',
      'Failed to read file: {{detail}}',
      'Error al leer el archivo: {{detail}}',
      'Échec de la lecture du fichier : {{detail}}',
      lang
    ),
    'api.ticket.operationError': L('{{detail}}', '{{detail}}', '{{detail}}', '{{detail}}', lang),

    'api.bling.jobNotFound': L(
      'Job não encontrado ou já processado',
      'Job not found or already processed',
      'Job no encontrado o ya procesado',
      'Tâche introuvable ou déjà traitée',
      lang
    ),
    'api.bling.importContactFailed': L(
      'Falha ao importar contato: {{detail}}',
      'Failed to import contact: {{detail}}',
      'Error al importar contacto: {{detail}}',
      'Échec de l’import du contact : {{detail}}',
      lang
    ),
    'api.bling.linkContactFailed': L('{{detail}}', '{{detail}}', '{{detail}}', '{{detail}}', lang),
    'api.bling.createOrderFailed': L(
      'Falha ao criar pedido: {{detail}}',
      'Failed to create order: {{detail}}',
      'Error al crear pedido: {{detail}}',
      'Échec de la création de la commande : {{detail}}',
      lang
    ),
    'api.bling.createBlingOrderFailed': L(
      'Falha ao criar pedido Bling: {{detail}}',
      'Failed to create Bling order: {{detail}}',
      'Error al crear pedido Bling: {{detail}}',
      'Échec de la création de la commande Bling : {{detail}}',
      lang
    ),
    'api.bling.emitNfeFailed': L(
      'Falha ao emitir NF-e: {{detail}}',
      'Failed to issue invoice: {{detail}}',
      'Error al emitir NF-e: {{detail}}',
      'Échec de l’émission de la NF-e : {{detail}}',
      lang
    ),
    'api.bling.noPropostaLinkedToOs': L(
      'Nenhuma proposta Bling vinculada a esta OS',
      'No Bling proposal linked to this work order',
      'Ninguna propuesta Bling vinculada a esta OS',
      'Aucune proposition Bling liée à cette OS',
      lang
    ),
    'api.bling.retryAutomationsFailed': L(
      'Falha ao reprocessar automações: {{detail}}',
      'Failed to retry automations: {{detail}}',
      'Error al reprocesar automatizaciones: {{detail}}',
      'Échec du relancement des automatisations : {{detail}}',
      lang
    ),
    'api.bling.saveConfigFailed': L(
      'Falha ao salvar configuração: {{detail}}',
      'Failed to save configuration: {{detail}}',
      'Error al guardar configuración: {{detail}}',
      'Échec de l’enregistrement de la configuration : {{detail}}',
      lang
    ),
    'api.bling.certRequired': L(
      'Arquivo .pfx/.p12 obrigatório',
      '.pfx/.p12 file is required',
      'Archivo .pfx/.p12 obligatorio',
      'Fichier .pfx/.p12 obligatoire',
      lang
    ),
    'api.bling.certUploadFailed': L(
      'Falha ao enviar certificado: {{detail}}',
      'Failed to upload certificate: {{detail}}',
      'Error al enviar certificado: {{detail}}',
      'Échec du téléversement du certificat : {{detail}}',
      lang
    ),
    'api.bling.adminOnly': L(
      'Apenas perfil administrativo pode gerir a integração Bling',
      'Only administrative profiles can manage Bling integration',
      'Solo perfiles administrativos pueden gestionar la integración Bling',
      'Seuls les profils administratifs peuvent gérer l’intégration Bling',
      lang
    ),
    'api.bling.oauthStartFailed': L('{{detail}}', '{{detail}}', '{{detail}}', '{{detail}}', lang),
    'api.bling.fluxoRetryNothing': L(
      'Nenhuma automação pendente para reprocessar',
      'No pending automation to retry',
      'Ninguna automatización pendiente para reprocesar',
      'Aucune automatisation en attente à relancer',
      lang
    ),
    'api.bling.fluxoRetryActions': L('{{detail}}', '{{detail}}', '{{detail}}', '{{detail}}', lang),
    'api.bling.noPedidoLinked': L(
      'Proposta sem pedido Bling vinculado',
      'Proposal has no linked Bling order',
      'Propuesta sin pedido Bling vinculado',
      'Proposition sans commande Bling liée',
      lang
    ),
    'api.bling.certNotConfigured': L(
      'Certificado digital não configurado. Envie o arquivo A1/A3 em Configurações > Bling e instale o mesmo certificado no painel Bling.',
      'Digital certificate not configured. Upload the A1/A3 file in Settings > Bling and install the same certificate in the Bling panel.',
      'Certificado digital no configurado. Envíe el archivo A1/A3 en Configuración > Bling e instale el mismo certificado en el panel Bling.',
      'Certificat numérique non configuré. Téléversez le fichier A1/A3 dans Paramètres > Bling et installez le même certificat dans le panneau Bling.',
      lang
    ),
    'api.bling.nfeNotReturned': L(
      'Bling não retornou NF-e após emissão',
      'Bling did not return an invoice after issuance',
      'Bling no devolvió NF-e tras la emisión',
      'Bling n’a pas renvoyé de NF-e après l’émission',
      lang
    ),
    'api.bling.nfeJsonBuildFailed': L(
      'Falha ao montar JSON da NF-e Bling',
      'Failed to build Bling invoice JSON',
      'Error al montar el JSON de NF-e Bling',
      'Échec de la construction du JSON NF-e Bling',
      lang
    ),
    'api.bling.nfeWebhookNoId': L(
      'Webhook NF-e sem ID',
      'Invoice webhook without ID',
      'Webhook NF-e sin ID',
      'Webhook NF-e sans ID',
      lang
    ),
    'api.bling.nfeAlreadyRegistered': L(
      'NF-e já registrada para esta proposta — emissão idempotente ignorada',
      'Invoice already registered for this proposal — idempotent issuance skipped',
      'NF-e ya registrada para esta propuesta — emisión idempotente omitida',
      'NF-e déjà enregistrée pour cette proposition — émission idempotente ignorée',
      lang
    ),
    'api.bling.nfeEmitted': L(
      'NF-e emitida via Bling (certificado deve estar ativo no painel Bling)',
      'Invoice issued via Bling (certificate must be active in the Bling panel)',
      'NF-e emitida vía Bling (el certificado debe estar activo en el panel Bling)',
      'NF-e émise via Bling (le certificat doit être actif dans le panneau Bling)',
      lang
    ),
    'api.bling.platformDisabled': L(
      'Integração Bling desativada na plataforma',
      'Bling integration disabled on the platform',
      'Integración Bling desactivada en la plataforma',
      'Intégration Bling désactivée sur la plateforme',
      lang
    ),
    'api.bling.oauthNotConfigured': L(
      'OAuth Bling não configurado (client_id / client_secret / redirect_uri)',
      'Bling OAuth not configured (client_id / client_secret / redirect_uri)',
      'OAuth Bling no configurado (client_id / client_secret / redirect_uri)',
      'OAuth Bling non configuré (client_id / client_secret / redirect_uri)',
      lang
    ),
    'api.bling.oauthStateInvalid': L(
      'State OAuth inválido ou expirado',
      'Invalid or expired OAuth state',
      'State OAuth no válido o expirado',
      'État OAuth invalide ou expiré',
      lang
    ),
    'api.bling.oauthCodeMissing': L(
      'Código de autorização ausente',
      'Authorization code missing',
      'Código de autorización ausente',
      'Code d’autorisation manquant',
      lang
    ),
    'api.bling.noRefreshToken': L(
      'Bling não retornou refresh_token',
      'Bling did not return refresh_token',
      'Bling no devolvió refresh_token',
      'Bling n’a pas renvoyé refresh_token',
      lang
    ),

    'api.common.notAuthenticated': L(
      'Não autenticado',
      'Not authenticated',
      'No autenticado',
      'Non authentifié',
      lang
    ),
    'api.common.forbidden': L(
      'Sem permissão',
      'Permission denied',
      'Sin permiso',
      'Permission refusée',
      lang
    ),
    'api.common.notFound': L(
      'Registro não encontrado',
      'Record not found',
      'Registro no encontrado',
      'Enregistrement introuvable',
      lang
    ),
    'api.common.badRequest': L(
      'Requisição inválida',
      'Invalid request',
      'Solicitud no válida',
      'Requête invalide',
      lang
    ),
    'api.common.operationError': L('{{detail}}', '{{detail}}', '{{detail}}', '{{detail}}', lang),

    'api.notification.usuarioIdRequired': L(
      'usuarioId é obrigatório',
      'usuarioId is required',
      'usuarioId es obligatorio',
      'usuarioId est obligatoire',
      lang
    ),
    'api.notification.markedRead': L(
      'Notificação marcada como lida',
      'Notification marked as read',
      'Notificación marcada como leída',
      'Notification marquée comme lue',
      lang
    ),
    'api.notification.allMarkedRead': L(
      'Todas as notificações foram marcadas como lidas',
      'All notifications were marked as read',
      'Todas las notificaciones fueron marcadas como leídas',
      'Toutes les notifications ont été marquées comme lues',
      lang
    ),
    'api.notification.deficitNotFound': L(
      'Notificação não encontrada',
      'Notification not found',
      'Notificación no encontrada',
      'Notification introuvable',
      lang
    ),

    'api.empresa.invalidRequest': L('{{detail}}', '{{detail}}', '{{detail}}', '{{detail}}', lang),
    'api.empresa.fileRequired': L(
      'Arquivo obrigatório',
      'File is required',
      'Archivo obligatorio',
      'Fichier obligatoire',
      lang
    ),
    'api.empresa.imageTooLarge': L(
      'Imagem muito grande (máximo 4 MB)',
      'Image too large (max. 4 MB)',
      'Imagen demasiado grande (máx. 4 MB)',
      'Image trop volumineuse (max. 4 Mo)',
      lang
    ),
    'api.empresa.imageOnly': L(
      'Envie apenas arquivos de imagem',
      'Send image files only',
      'Envíe solo archivos de imagen',
      'Envoyez uniquement des fichiers image',
      lang
    ),
    'api.empresa.uploadFailed': L('{{detail}}', '{{detail}}', '{{detail}}', '{{detail}}', lang),
    'api.empresa.forbidden': L(
      'Sem permissão para alterar a configuração da empresa',
      'No permission to change company settings',
      'Sin permiso para cambiar la configuración de la empresa',
      'Pas d’autorisation pour modifier la configuration de l’entreprise',
      lang
    ),

    'api.backup.configNotFound': L(
      'Nenhuma configuração encontrada',
      'No configuration found',
      'Ninguna configuración encontrada',
      'Aucune configuration trouvée',
      lang
    ),
    'api.backup.hostEmpty': L('Host não pode estar vazio', 'Host cannot be empty', 'El host no puede estar vacío', 'L’hôte ne peut pas être vide', lang),
    'api.backup.portInvalid': L(
      'Porta inválida (deve estar entre 1 e 65535)',
      'Invalid port (must be between 1 and 65535)',
      'Puerto no válido (debe estar entre 1 y 65535)',
      'Port invalide (doit être entre 1 et 65535)',
      lang
    ),
    'api.backup.databaseEmpty': L(
      'Nome do banco de dados não pode estar vazio',
      'Database name cannot be empty',
      'El nombre de la base de datos no puede estar vacío',
      'Le nom de la base de données ne peut pas être vide',
      lang
    ),
    'api.backup.userEmpty': L(
      'Usuário não pode estar vazio',
      'Username cannot be empty',
      'El usuario no puede estar vacío',
      'L’utilisateur ne peut pas être vide',
      lang
    ),
    'api.backup.connectSuccess': L(
      'Conexão estabelecida com sucesso!',
      'Connection established successfully!',
      '¡Conexión establecida con éxito!',
      'Connexion établie avec succès !',
      lang
    ),
    'api.backup.connectInvalid': L(
      'Conexão estabelecida mas não está válida',
      'Connection established but is not valid',
      'Conexión establecida pero no es válida',
      'Connexion établie mais non valide',
      lang
    ),
    'api.backup.accessDenied': L(
      'Acesso negado. Verifique usuário e senha.',
      'Access denied. Check username and password.',
      'Acceso denegado. Verifique usuario y contraseña.',
      'Accès refusé. Vérifiez l’utilisateur et le mot de passe.',
      lang
    ),
    'api.backup.dbNotFound': L(
      'Banco de dados não encontrado: {{database}}',
      'Database not found: {{database}}',
      'Base de datos no encontrada: {{database}}',
      'Base de données introuvable : {{database}}',
      lang
    ),
    'api.backup.connectionFailed': L(
      'Não foi possível conectar ao servidor. Verifique host e porta.',
      'Could not connect to the server. Check host and port.',
      'No fue posible conectar al servidor. Verifique host y puerto.',
      'Impossible de se connecter au serveur. Vérifiez l’hôte et le port.',
      lang
    ),
    'api.backup.timeout': L(
      'Timeout ao conectar. Verifique se o servidor está acessível.',
      'Connection timed out. Check if the server is reachable.',
      'Tiempo de espera agotado. Verifique si el servidor está accesible.',
      'Délai de connexion dépassé. Vérifiez si le serveur est accessible.',
      lang
    ),
    'api.backup.connectError': L(
      'Erro ao conectar: {{detail}}',
      'Connection error: {{detail}}',
      'Error al conectar: {{detail}}',
      'Erreur de connexion : {{detail}}',
      lang
    ),
    'api.backup.unexpectedError': L(
      'Erro inesperado: {{detail}}',
      'Unexpected error: {{detail}}',
      'Error inesperado: {{detail}}',
      'Erreur inattendue : {{detail}}',
      lang
    ),
    'api.backup.started': L(
      'Backup iniciado com sucesso',
      'Backup started successfully',
      'Copia de seguridad iniciada con éxito',
      'Sauvegarde démarrée avec succès',
      lang
    ),
    'api.backup.inProgress': L(
      'Backup em execução...',
      'Backup in progress...',
      'Copia de seguridad en ejecución...',
      'Sauvegarde en cours...',
      lang
    ),
    'api.backup.completed': L(
      'Backup concluído com sucesso',
      'Backup completed successfully',
      'Copia de seguridad completada con éxito',
      'Sauvegarde terminée avec succès',
      lang
    ),
    'api.backup.failed': L(
      'Backup falhou: {{detail}}',
      'Backup failed: {{detail}}',
      'Copia de seguridad fallida: {{detail}}',
      'Échec de la sauvegarde : {{detail}}',
      lang
    ),
    'api.backup.statusNotFound': L(
      'Status do backup não encontrado',
      'Backup status not found',
      'Estado de la copia no encontrado',
      'État de la sauvegarde introuvable',
      lang
    ),
    'api.backup.pathValid': L(
      'Caminho válido e com permissões de escrita',
      'Valid path with write permissions',
      'Ruta válida con permisos de escritura',
      'Chemin valide avec droits d’écriture',
      lang
    ),
    'api.backup.pathError': L('Erro: {{detail}}', 'Error: {{detail}}', 'Error: {{detail}}', 'Erreur : {{detail}}', lang),
    'api.backup.folderCopyHint': L(
      'Copie o caminho e abra no Windows Explorer (Win+E → barra de endereço).',
      'Copy the path and open it in Windows Explorer (Win+E → address bar).',
      'Copie la ruta y ábrala en el Explorador de Windows (Win+E → barra de direcciones).',
      'Copiez le chemin et ouvrez-le dans l’Explorateur Windows (Win+E → barre d’adresse).',
      lang
    ),
    'api.backup.folderNotFound': L(
      'Pasta não encontrada: {{path}}',
      'Folder not found: {{path}}',
      'Carpeta no encontrada: {{path}}',
      'Dossier introuvable : {{path}}',
      lang
    ),
    'api.backup.folderNotDir': L(
      'Caminho não é uma pasta: {{path}}',
      'Path is not a folder: {{path}}',
      'La ruta no es una carpeta: {{path}}',
      'Le chemin n’est pas un dossier : {{path}}',
      lang
    ),
    'api.backup.folderOpenUnavailable': L(
      'Não foi possível abrir a pasta neste servidor (xdg-open indisponível). Caminho: {{path}}',
      'Could not open the folder on this server (xdg-open unavailable). Path: {{path}}',
      'No fue posible abrir la carpeta en este servidor (xdg-open no disponible). Ruta: {{path}}',
      'Impossible d’ouvrir le dossier sur ce serveur (xdg-open indisponible). Chemin : {{path}}',
      lang
    ),
    'api.backup.folderOpened': L(
      'Pasta aberta com sucesso',
      'Folder opened successfully',
      'Carpeta abierta con éxito',
      'Dossier ouvert avec succès',
      lang
    ),
    'api.backup.folderOpenError': L(
      'Erro ao abrir pasta: {{detail}}',
      'Error opening folder: {{detail}}',
      'Error al abrir carpeta: {{detail}}',
      'Erreur lors de l’ouverture du dossier : {{detail}}',
      lang
    ),

    'api.os.operationError': L('{{detail}}', '{{detail}}', '{{detail}}', '{{detail}}', lang),
    'api.os.deactivated': L(
      'Ordem de Serviço inativada com sucesso',
      'Work order deactivated successfully',
      'Orden de servicio inactivada con éxito',
      'Ordre de service désactivé avec succès',
      lang
    ),
    'api.os.fileRemoved': L(
      'Arquivo removido com sucesso',
      'File removed successfully',
      'Archivo eliminado con éxito',
      'Fichier supprimé avec succès',
      lang
    ),
    'api.os.dtoNull': L(
      'DTO não pode ser nulo',
      'DTO cannot be null',
      'El DTO no puede ser nulo',
      'Le DTO ne peut pas être nul',
      lang
    ),
    'api.os.fcuNotFound': L(
      'FCU com ID {{id}} não encontrado no banco de dados. Verifique se o FCU existe e está ativo.',
      'FCU with ID {{id}} not found in the database. Check that the FCU exists and is active.',
      'FCU con ID {{id}} no encontrado en la base de datos. Verifique que el FCU exista y esté activo.',
      'FCU avec l’ID {{id}} introuvable en base. Vérifiez que le FCU existe et est actif.',
      lang
    ),
    'api.os.fcuInactive': L(
      'FCU com ID {{id}} está inativo. Selecione um FCU ativo.',
      'FCU with ID {{id}} is inactive. Select an active FCU.',
      'FCU con ID {{id}} está inactivo. Seleccione un FCU activo.',
      'Le FCU avec l’ID {{id}} est inactif. Sélectionnez un FCU actif.',
      lang
    ),
    'api.os.fabricanteNotFound': L(
      'Fabricante com ID {{id}} não encontrado no banco de dados. Verifique se o Fabricante existe e está ativo.',
      'Manufacturer with ID {{id}} not found in the database. Check that the manufacturer exists and is active.',
      'Fabricante con ID {{id}} no encontrado en la base de datos. Verifique que el fabricante exista y esté activo.',
      'Fabricant avec l’ID {{id}} introuvable en base. Vérifiez que le fabricant existe et est actif.',
      lang
    ),
    'api.os.fabricanteInactive': L(
      'Fabricante com ID {{id}} está inativo. Selecione um Fabricante ativo.',
      'Manufacturer with ID {{id}} is inactive. Select an active manufacturer.',
      'Fabricante con ID {{id}} está inactivo. Seleccione un fabricante activo.',
      'Le fabricant avec l’ID {{id}} est inactif. Sélectionnez un fabricant actif.',
      lang
    ),
    'api.os.dtAberturaRequired': L(
      'Campo obrigatório \'dtAbertura\' não pode ser nulo',
      'Required field \'dtAbertura\' cannot be null',
      'El campo obligatorio \'dtAbertura\' no puede ser nulo',
      'Le champ obligatoire « dtAbertura » ne peut pas être nul',
      lang
    ),
    'api.os.idOsRequired': L(
      'Campo obrigatório \'idOs\' não pode ser nulo ou zero',
      'Required field \'idOs\' cannot be null or zero',
      'El campo obligatorio \'idOs\' no puede ser nulo ni cero',
      'Le champ obligatoire « idOs » ne peut pas être nul ou zéro',
      lang
    ),
    'api.os.idOsDuplicate': L(
      'Já existe uma OS com o número {{idOs}} nesta organização.',
      'A work order with number {{idOs}} already exists in this organization.',
      'Ya existe una OS con el número {{idOs}} en esta organización.',
      'Un OT portant le numéro {{idOs}} existe déjà dans cette organisation.',
      lang
    ),
    'api.os.createFailed': L(
      'Erro ao criar OS. Verifique os campos obrigatórios e as referências (Fabricante/FCU) e tente novamente.',
      'Failed to create work order. Check required fields and references (Manufacturer/FCU) and try again.',
      'Error al crear la OS. Verifique los campos obligatorios y las referencias (Fabricante/FCU) e intente de nuevo.',
      'Échec de la création de l’OS. Vérifiez les champs obligatoires et les références (Fabricant/FCU) puis réessayez.',
      lang
    ),
    'api.os.createFromPropostaFailed': L(
      'Falha ao criar ordem de serviço a partir da proposta {{propostaId}}.',
      'Failed to create work order from proposal {{propostaId}}.',
      'Error al crear la orden de servicio desde la propuesta {{propostaId}}.',
      'Échec de la création de l’ordre de service à partir de la proposition {{propostaId}}.',
      lang
    ),

    'api.product.deactivated': L(
      'Produto inativado com sucesso',
      'Product deactivated successfully',
      'Producto desactivado con éxito',
      'Produit désactivé avec succès',
      lang
    ),
    'api.product.notFound': L(
      'Produto não encontrado: {{id}}',
      'Product not found: {{id}}',
      'Producto no encontrado: {{id}}',
      'Produit introuvable : {{id}}',
      lang
    ),
    'api.product.filesNotSent': L(
      "Arquivo(s) 'file' não enviado(s).",
      "File(s) 'file' not uploaded.",
      "Archivo(s) 'file' no enviado(s).",
      "Fichier(s) 'file' non téléversé(s).",
      lang
    ),
    'api.product.noPhoto': L(
      'Produto sem foto cadastrada: {{id}}',
      'Product has no photo: {{id}}',
      'Producto sin foto registrada: {{id}}',
      'Produit sans photo enregistrée : {{id}}',
      lang
    ),
    'api.product.invalidFilename': L(
      'Nome de arquivo inválido.',
      'Invalid file name.',
      'Nombre de archivo no válido.',
      'Nom de fichier invalide.',
      lang
    ),
    'api.product.photoNotFound': L(
      'Foto não encontrada: {{fileName}}',
      'Photo not found: {{fileName}}',
      'Foto no encontrada: {{fileName}}',
      'Photo introuvable : {{fileName}}',
      lang
    ),
    'api.product.noBarcode': L(
      'Produto sem código de barras: {{id}}',
      'Product has no barcode: {{id}}',
      'Producto sin código de barras: {{id}}',
      'Produit sans code-barres : {{id}}',
      lang
    ),
    'api.product.invalidBarcode': L(
      'Código de barras inválido.',
      'Invalid barcode.',
      'Código de barras no válido.',
      'Code-barres invalide.',
      lang
    ),
    'api.product.deactivateFailed': L(
      'Erro ao inativar produto',
      'Failed to deactivate product',
      'Error al desactivar producto',
      'Échec de la désactivation du produit',
      lang
    ),
    'api.product.imageSaveFailed': L(
      'Erro ao salvar imagem: {{detail}}',
      'Failed to save image: {{detail}}',
      'Error al guardar imagen: {{detail}}',
      'Échec de l’enregistrement de l’image : {{detail}}',
      lang
    ),
    'api.product.imageReadFailed': L(
      'Erro ao ler imagem: {{detail}}',
      'Failed to read image: {{detail}}',
      'Error al leer imagen: {{detail}}',
      'Échec de la lecture de l’image : {{detail}}',
      lang
    ),
    'api.product.barcodeGenerateFailed': L(
      'Erro ao gerar códigos de barras',
      'Failed to generate barcodes',
      'Error al generar códigos de barras',
      'Échec de la génération des codes-barres',
      lang
    ),
    'api.product.pnDuplicate': L(
      'Este Part Number ({{pn}}) já está cadastrado. Verifique o código ou edite o produto existente.',
      'This part number ({{pn}}) is already registered. Check the code or edit the existing product.',
      'Este número de parte ({{pn}}) ya está registrado. Verifique el código o edite el producto existente.',
      'Ce numéro de pièce ({{pn}}) est déjà enregistré. Vérifiez le code ou modifiez le produit existant.',
      lang
    ),
    'api.product.barcodeImageFailed': L(
      'Erro ao gerar imagem do código de barras',
      'Failed to generate barcode image',
      'Error al generar imagen del código de barras',
      'Échec de la génération de l’image du code-barres',
      lang
    ),
    'api.fcu.deactivated': L(
      'FCU inativado com sucesso',
      'FCU deactivated successfully',
      'FCU desactivado con éxito',
      'FCU désactivé avec succès',
      lang
    ),
    'api.user.deactivated': L(
      'Usuário inativado com sucesso',
      'User deactivated successfully',
      'Usuario desactivado con éxito',
      'Utilisateur désactivé avec succès',
      lang
    ),

    'api.estoque.operationError': L('{{detail}}', '{{detail}}', '{{detail}}', '{{detail}}', lang),

    'api.testEmail.sent': L(
      'E-mail de teste enviado com sucesso',
      'Test email sent successfully',
      'Correo de prueba enviado con éxito',
      'E-mail de test envoyé avec succès',
      lang
    ),
    'api.testEmail.serviceMissing': L(
      'EmailService não está injetado',
      'EmailService is not injected',
      'EmailService no está inyectado',
      'EmailService n’est pas injecté',
      lang
    ),
    'api.audit.testRecordCreated': L(
      'Registro de teste criado com sucesso!',
      'Test record created successfully!',
      '¡Registro de prueba creado con éxito!',
      'Enregistrement de test créé avec succès !',
      lang
    ),

    'api.proposta.emailSentSuccess': L(
      'Proposta enviada com sucesso para {{email}}',
      'Proposal sent successfully to {{email}}',
      'Propuesta enviada con éxito a {{email}}',
      'Proposition envoyée avec succès à {{email}}',
      lang
    ),
    'api.proposta.emailSendFailed': L(
      'Falha ao enviar e-mail. Verifique as configurações do servidor de e-mail.',
      'Failed to send email. Check the mail server settings.',
      'Error al enviar el correo. Verifique la configuración del servidor de correo.',
      'Échec de l’envoi de l’e-mail. Vérifiez la configuration du serveur mail.',
      lang
    ),
    'api.proposta.emailSendError': L(
      'Erro ao enviar e-mail: {{detail}}',
      'Error sending email: {{detail}}',
      'Error al enviar correo: {{detail}}',
      'Erreur lors de l’envoi de l’e-mail : {{detail}}',
      lang
    ),
    'api.proposta.whatsappSentSuccess': L(
      'Proposta enviada com sucesso via WhatsApp para {{phone}}',
      'Proposal sent successfully via WhatsApp to {{phone}}',
      'Propuesta enviada con éxito por WhatsApp a {{phone}}',
      'Proposition envoyée avec succès via WhatsApp au {{phone}}',
      lang
    ),
    'api.proposta.whatsappLinkGenerated': L(
      'Link do WhatsApp gerado. Abra o link para enviar manualmente.',
      'WhatsApp link generated. Open the link to send manually.',
      'Enlace de WhatsApp generado. Abra el enlace para enviar manualmente.',
      'Lien WhatsApp généré. Ouvrez le lien pour envoyer manuellement.',
      lang
    ),
    'api.proposta.whatsappSendError': L(
      'Erro ao enviar proposta via WhatsApp: {{detail}}',
      'Error sending proposal via WhatsApp: {{detail}}',
      'Error al enviar propuesta por WhatsApp: {{detail}}',
      'Erreur lors de l’envoi de la proposition via WhatsApp : {{detail}}',
      lang
    ),
    'api.proposta.wrongTenant': L(
      'Proposta não pertence ao tenant atual',
      'Proposal does not belong to the current tenant',
      'La propuesta no pertenece al tenant actual',
      'La proposition n’appartient pas au tenant actuel',
      lang
    ),

    'api.os.externalPortalOnly': L(
      'Acesso negado: use o portal de usuário externo para acessar suas ordens de serviço',
      'Access denied: use the external user portal to access your work orders',
      'Acceso denegado: use el portal de usuario externo para acceder a sus órdenes de servicio',
      'Accès refusé : utilisez le portail utilisateur externe pour accéder à vos ordres de service',
      lang
    ),
    'api.os.trocaPagamentoForbidden': L(
      'Apenas perfis Suprimento, Administrador ou Diretor podem consultar pendências de pagamento da Solicitação de Troca Eventual',
      'Only Supply, Administrator or Director profiles can view pending payments for Eventual Exchange Requests',
      'Solo los perfiles de Abastecimiento, Administrador o Director pueden consultar pagos pendientes de la Solicitud de Cambio Eventual',
      'Seuls les profils Approvisionnement, Administrateur ou Directeur peuvent consulter les paiements en attente de la Demande d’Échange Éventuel',
      lang
    ),

    'api.tenant.invalidRequestBody': L(
      'Corpo da requisição inválido',
      'Invalid request body',
      'Cuerpo de la solicitud no válido',
      'Corps de requête invalide',
      lang
    ),
    'api.tenant.cannotSuspendDefault': L(
      'Não é possível suspender a organização da plataforma (default).',
      'Cannot suspend the platform organization (default).',
      'No es posible suspender la organización de la plataforma (default).',
      'Impossible de suspendre l’organisation de la plateforme (default).',
      lang
    ),
    'api.tenant.noAdminFound': L(
      'Nenhum administrador ativo encontrado nesta organização. Informe adminEmail.',
      'No active administrator found in this organization. Provide adminEmail.',
      'Ningún administrador activo en esta organización. Indique adminEmail.',
      'Aucun administrateur actif dans cette organisation. Indiquez adminEmail.',
      lang
    ),
    'api.tenant.codeRequired': L(
      'Código da organização é obrigatório',
      'Organization code is required',
      'El código de la organización es obligatorio',
      'Le code de l’organisation est obligatoire',
      lang
    ),
    'api.tenant.nameRequired': L(
      'Nome da organização é obrigatório',
      'Organization name is required',
      'El nombre de la organización es obligatorio',
      'Le nom de l’organisation est obligatoire',
      lang
    ),
    'api.tenant.invalidCodeFormat': L(
      'Código inválido. Use 2–63 caracteres: letras minúsculas, números, hífen ou underscore.',
      'Invalid code. Use 2–63 characters: lowercase letters, numbers, hyphen or underscore.',
      'Código no válido. Use 2–63 caracteres: letras minúsculas, números, guion o guion bajo.',
      'Code invalide. Utilisez 2–63 caractères : lettres minuscules, chiffres, tiret ou underscore.',
      lang
    ),
    'api.tenant.reservedCode': L(
      'Código reservado: {{codigo}}',
      'Reserved code: {{codigo}}',
      'Código reservado: {{codigo}}',
      'Code réservé : {{codigo}}',
      lang
    ),
    'api.tenant.codeInUse': L(
      'Já existe uma organização com o código: {{codigo}}',
      'An organization with this code already exists: {{codigo}}',
      'Ya existe una organización con el código: {{codigo}}',
      'Une organisation avec ce code existe déjà : {{codigo}}',
      lang
    ),
    'api.tenant.notFound': L(
      'Organização não encontrada: {{id}}',
      'Organization not found: {{id}}',
      'Organización no encontrada: {{id}}',
      'Organisation introuvable : {{id}}',
      lang
    ),
    'api.tenant.fileRequired': L(
      'Arquivo obrigatório',
      'File is required',
      'Archivo obligatorio',
      'Fichier obligatoire',
      lang
    ),
    'api.tenant.logoSaveFailed': L(
      'Falha ao gravar logo: {{detail}}',
      'Failed to save logo: {{detail}}',
      'Error al guardar logo: {{detail}}',
      'Échec de l’enregistrement du logo : {{detail}}',
      lang
    ),
    'api.tenant.adminEmailExists': L(
      'E-mail já cadastrado nesta organização: {{email}}',
      'Email already registered in this organization: {{email}}',
      'Correo ya registrado en esta organización: {{email}}',
      'E-mail déjà enregistré dans cette organisation : {{email}}',
      lang
    ),
    'api.tenant.adminProfileNotFound': L(
      'Perfil ADMIN não encontrado no sistema',
      'ADMIN profile not found in the system',
      'Perfil ADMIN no encontrado en el sistema',
      'Profil ADMIN introuvable dans le système',
      lang
    ),
    'api.tenant.welcomeEmailSent': L(
      'E-mail enviado com sucesso.',
      'Email sent successfully.',
      'Correo enviado con éxito.',
      'E-mail envoyé avec succès.',
      lang
    ),
    'api.tenant.welcomeEmailFailed': L(
      'Falha ao enviar e-mail (verifique SMTP/SendGrid).',
      'Failed to send email (check SMTP/SendGrid).',
      'Error al enviar correo (verifique SMTP/SendGrid).',
      'Échec de l’envoi de l’e-mail (vérifiez SMTP/SendGrid).',
      lang
    ),
    'api.tenant.provisioningForbidden': L(
      'Provisão de organizações restrita ao operador da plataforma',
      'Organization provisioning is restricted to the platform operator',
      'El aprovisionamiento de organizaciones está restringido al operador de la plataforma',
      'L’approvisionnement des organisations est réservé à l’opérateur de la plateforme',
      lang
    ),
    'api.platform.opsForbidden': L(
      'Sessão elevada do plano de controle necessária',
      'Control plane elevated session required',
      'Se requiere sesión elevada del plano de control',
      'Session élevée du plan de contrôle requise',
      lang
    ),
    'api.platform.opsLoginDenied': L(
      'Acesso ao plano de controle negado',
      'Control plane access denied',
      'Acceso al plano de control denegado',
      'Accès au plan de contrôle refusé',
      lang
    ),
    'api.platform.ops.operatorUserInactive': L(
      'Usuário inativo não pode receber acesso ao plano de controle',
      'Inactive user cannot receive control plane access',
      'Usuario inactivo no puede recibir acceso al plano de control',
      'Un utilisateur inactif ne peut pas recevoir l\'accès au plan de contrôle',
      lang
    ),
    'api.platform.ops.operatorConfigProtected': L(
      'Operador definido na configuração do servidor não pode ser revogado por aqui',
      'Operator listed in server configuration cannot be revoked here',
      'Operador definido en la configuración del servidor no puede revocarse aquí',
      'Un opérateur défini dans la configuration serveur ne peut pas être révoqué ici',
      lang
    ),
    'api.platform.ops.operatorNotGranted': L(
      'Este usuário não possui elevação de operador para revogar',
      'This user has no operator elevation to revoke',
      'Este usuario no tiene elevación de operador para revocar',
      'Cet utilisateur n\'a pas d\'élévation opérateur à révoquer',
      lang
    ),
    'api.tenant.signupDisabled': L(
      'Cadastro público desativado',
      'Public registration is disabled',
      'Registro público desactivado',
      'Inscription publique désactivée',
      lang
    ),
    'api.empresa.onboardingAdminOnly': L(
      'Apenas perfil administrativo pode concluir a publicação da marca (onboarding)',
      'Only administrative profiles can complete brand publication (onboarding)',
      'Solo perfiles administrativos pueden completar la publicación de la marca (onboarding)',
      'Seuls les profils administratifs peuvent finaliser la publication de la marque (onboarding)',
      lang
    ),

    'api.externo.propostaDenied': L(
      'Acesso negado a esta proposta',
      'Access denied to this proposal',
      'Acceso denegado a esta propuesta',
      'Accès refusé à cette proposition',
      lang
    ),
    'api.externo.userInvalid': L(
      'Usuário externo inválido',
      'Invalid external user',
      'Usuario externo no válido',
      'Utilisateur externe non valide',
      lang
    ),
    'api.externo.osAccessDenied': L(
      'Acesso negado a esta ordem de serviço',
      'Access denied to this work order',
      'Acceso denegado a esta orden de servicio',
      'Accès refusé à cet ordre de service',
      lang
    ),
    'api.externo.osNotFound': L(
      'Ordem de serviço não encontrada',
      'Work order not found',
      'Orden de servicio no encontrada',
      'Ordre de service introuvable',
      lang
    ),
    'api.externo.otherUserDataDenied': L(
      'Acesso negado a dados de outro usuário',
      'Access denied to another user’s data',
      'Acceso denegado a datos de otro usuario',
      'Accès refusé aux données d’un autre utilisateur',
      lang
    ),
    'api.externo.managePermissionRequired': L(
      'Sem permissão para consultar usuário externo',
      'No permission to view external user',
      'Sin permiso para consultar usuario externo',
      'Pas d’autorisation pour consulter l’utilisateur externe',
      lang
    ),

    'api.user.emailRequired': L(
      'E-mail obrigatório',
      'Email is required',
      'Correo obligatorio',
      'E-mail obligatoire',
      lang
    ),
    'api.user.nameRequired': L(
      'Nome obrigatório',
      'Name is required',
      'Nombre obligatorio',
      'Nom obligatoire',
      lang
    ),
    'api.user.emailAlreadyRegistered': L(
      'E-mail {{email}} já cadastrado',
      'Email {{email}} is already registered',
      'Correo {{email}} ya registrado',
      'E-mail {{email}} déjà enregistré',
      lang
    ),
    'api.user.profileNotFound': L(
      'Perfil {{id}} não encontrado',
      'Profile {{id}} not found',
      'Perfil {{id}} no encontrado',
      'Profil {{id}} introuvable',
      lang
    ),
    'api.user.emailServiceUnavailable': L(
      'Serviço de e-mail indisponível',
      'Email service unavailable',
      'Servicio de correo no disponible',
      'Service e-mail indisponible',
      lang
    ),
    'api.user.notAuthenticated': L(
      'Usuário não autenticado',
      'User not authenticated',
      'Usuario no autenticado',
      'Utilisateur non authentifié',
      lang
    ),
    'api.user.notFound': L(
      'Usuário {{id}} não encontrado',
      'User {{id}} not found',
      'Usuario {{id}} no encontrado',
      'Utilisateur {{id}} introuvable',
      lang
    ),
    'api.user.idRequired': L(
      'ID do usuário obrigatório',
      'User ID is required',
      'ID de usuario obligatorio',
      'ID utilisateur obligatoire',
      lang
    ),
    'api.user.noEmail': L(
      'Usuário sem e-mail cadastrado',
      'User has no email on file',
      'Usuario sin correo registrado',
      'Utilisateur sans e-mail enregistré',
      lang
    ),
    'api.user.externoNotFound': L(
      'Usuário externo não encontrado',
      'External user not found',
      'Usuario externo no encontrado',
      'Utilisateur externe introuvable',
      lang
    ),
    'api.user.featureNotFound': L(
      'Recurso ou funcionalidade não encontrada',
      'Feature or resource not found',
      'Recurso o funcionalidad no encontrada',
      'Fonctionnalité ou ressource introuvable',
      lang
    ),

    'api.auth.invalidCredentials': L(
      'E-mail ou senha incorretos',
      'Incorrect email or password',
      'Correo o contraseña incorrectos',
      'E-mail ou mot de passe incorrect',
      lang
    ),
    'api.auth.userInactive': L(
      'Usuário inativo',
      'User is inactive',
      'Usuario inactivo',
      'Utilisateur inactif',
      lang
    ),
    'api.auth.subscriptionInactive': L(
      'Assinatura inativa ou expirada',
      'Subscription inactive or expired',
      'Suscripción inactiva o expirada',
      'Abonnement inactif ou expiré',
      lang
    ),
    'api.auth.tenantRequired': L(
      'Este e-mail existe em mais de uma organização. Informe o código da organização.',
      'This email exists in more than one organization. Enter the organization code.',
      'Este correo existe en más de una organización. Indique el código de la organización.',
      'Cet e-mail existe dans plusieurs organisations. Indiquez le code de l’organisation.',
      lang
    ),
    'api.auth.tenantNotFound': L(
      'Organização não encontrada',
      'Organization not found',
      'Organización no encontrada',
      'Organisation introuvable',
      lang
    ),
    'api.auth.tokenInvalid': L(
      'Token inválido ou expirado',
      'Invalid or expired token',
      'Token no válido o expirado',
      'Jeton invalide ou expiré',
      lang
    ),
    'api.auth.passwordMinLength': L(
      'A senha deve ter no mínimo 8 caracteres',
      'Password must be at least 8 characters',
      'La contraseña debe tener al menos 8 caracteres',
      'Le mot de passe doit comporter au moins 8 caractères',
      lang
    ),
    'api.auth.passwordPolicy': L(
      'A senha não atende aos requisitos de segurança',
      'Password does not meet security requirements',
      'La contraseña no cumple los requisitos de seguridad',
      'Le mot de passe ne respecte pas les exigences de sécurité',
      lang
    ),
    'api.auth.userNotFound': L(
      'Usuário não encontrado',
      'User not found',
      'Usuario no encontrado',
      'Utilisateur introuvable',
      lang
    ),
    'api.auth.passwordReused': L(
      'A nova senha não pode ser igual à senha anterior',
      'New password cannot match the previous password',
      'La nueva contraseña no puede ser igual a la anterior',
      'Le nouveau mot de passe ne peut pas être identique à l’ancien',
      lang
    ),
    'api.auth.currentPasswordWrong': L(
      'Senha atual incorreta',
      'Current password is incorrect',
      'Contraseña actual incorrecta',
      'Mot de passe actuel incorrect',
      lang
    ),
    'api.auth.noPasswordChangeRequired': L(
      'Troca de senha não é necessária',
      'Password change is not required',
      'No es necesario cambiar la contraseña',
      'Le changement de mot de passe n’est pas requis',
      lang
    ),
    'api.auth.tempPasswordWrong': L(
      'Senha temporária incorreta',
      'Temporary password is incorrect',
      'Contraseña temporal incorrecta',
      'Mot de passe temporaire incorrect',
      lang
    ),
    'api.auth.emailRequired': L(
      'E-mail obrigatório',
      'Email is required',
      'Correo obligatorio',
      'E-mail obligatoire',
      lang
    ),
    'api.auth.tokenRequired': L(
      'Token obrigatório',
      'Token is required',
      'Token obligatorio',
      'Jeton obligatoire',
      lang
    ),
    'api.auth.newPasswordRequired': L(
      'Nova senha obrigatória',
      'New password is required',
      'Nueva contraseña obligatoria',
      'Nouveau mot de passe obligatoire',
      lang
    ),
    'api.auth.currentPasswordRequired': L(
      'Senha atual obrigatória',
      'Current password is required',
      'Contraseña actual obligatoria',
      'Mot de passe actuel obligatoire',
      lang
    ),
    'api.auth.tempPasswordRequired': L(
      'Senha temporária obrigatória',
      'Temporary password is required',
      'Contraseña temporal obligatoria',
      'Mot de passe temporaire obligatoire',
      lang
    ),
    'api.auth.serviceUnavailable': L(
      'Serviço de autenticação indisponível',
      'Authentication service unavailable',
      'Servicio de autenticación no disponible',
      'Service d’authentification indisponible',
      lang
    ),
    'api.auth.invalidRequest': L(
      'Requisição inválida',
      'Invalid request',
      'Solicitud no válida',
      'Requête invalide',
      lang
    ),
    'api.auth.resetFailed': L(
      'Falha ao redefinir senha',
      'Failed to reset password',
      'Error al restablecer la contraseña',
      'Échec de la réinitialisation du mot de passe',
      lang
    ),
    'api.auth.changePasswordFailed': L(
      'Falha ao alterar senha',
      'Failed to change password',
      'Error al cambiar la contraseña',
      'Échec du changement de mot de passe',
      lang
    ),
    'api.auth.processRequestFailed': L(
      'Erro ao processar solicitação',
      'Failed to process request',
      'Error al procesar la solicitud',
      'Échec du traitement de la demande',
      lang
    ),
    'api.auth.validateTokenFailed': L(
      'Erro ao validar token',
      'Failed to validate token',
      'Error al validar el token',
      'Échec de la validation du jeton',
      lang
    ),
    'api.auth.validateCurrentPasswordFailed': L(
      'Erro ao validar senha atual',
      'Failed to validate current password',
      'Error al validar la contraseña actual',
      'Échec de la validation du mot de passe actuel',
      lang
    ),
    'api.auth.oauthRefreshFailed': L(
      'Erro ao renovar token OAuth2: {{detail}}',
      'Failed to refresh OAuth2 token: {{detail}}',
      'Error al renovar el token OAuth2: {{detail}}',
      'Échec du renouvellement du jeton OAuth2 : {{detail}}',
      lang
    ),
    'api.auth.listUsersFailed': L(
      'Erro ao buscar usuários: {{detail}}',
      'Failed to fetch users: {{detail}}',
      'Error al buscar usuarios: {{detail}}',
      'Échec de la récupération des utilisateurs : {{detail}}',
      lang
    ),
    'api.auth.createUserFailed': L(
      'Erro ao criar usuário: {{detail}}',
      'Failed to create user: {{detail}}',
      'Error al crear usuario: {{detail}}',
      'Échec de la création de l’utilisateur : {{detail}}',
      lang
    ),
    'api.auth.forgotPasswordAck': L(
      'Se o e-mail estiver cadastrado, você receberá um link de recuperação.',
      'If the email is registered, you will receive a recovery link.',
      'Si el correo está registrado, recibirá un enlace de recuperación.',
      'Si l’e-mail est enregistré, vous recevrez un lien de récupération.',
      lang
    ),
    'api.auth.loginAgain': L(
      'Faça login novamente.',
      'Please sign in again.',
      'Inicie sesión de nuevo.',
      'Veuillez vous reconnecter.',
      lang
    ),
    'api.auth.mfaRequired': L(
      'Informe o código do autenticador (6 dígitos).',
      'Enter your authenticator code (6 digits).',
      'Introduzca el código del autenticador (6 dígitos).',
      'Saisissez le code de l’authentificateur (6 chiffres).',
      lang
    ),
    'api.auth.mfaEnrollmentRequired': L(
      'Cadastre a autenticação de dois fatores antes de continuar.',
      'Set up two-factor authentication before continuing.',
      'Configure la autenticación de dos factores antes de continuar.',
      'Configurez l’authentification à deux facteurs avant de continuer.',
      lang
    ),
    'api.auth.mfaCodeInvalid': L(
      'Código de autenticação inválido ou expirado.',
      'Invalid or expired authentication code.',
      'Código de autenticación no válido o caducado.',
      'Code d’authentification invalide ou expiré.',
      lang
    ),
    'api.auth.mfaCodeRequired': L(
      'Informe o código de autenticação.',
      'Enter the authentication code.',
      'Introduzca el código de autenticación.',
      'Saisissez le code d’authentification.',
      lang
    ),
    'api.auth.mfaDisabled': L(
      'Autenticação de dois fatores desativada.',
      'Two-factor authentication disabled.',
      'Autenticación de dos factores desactivada.',
      'Authentification à deux facteurs désactivée.',
      lang
    ),
    'api.auth.oauthRefreshSuccess': L(
      'Token OAuth2 renovado com sucesso',
      'OAuth2 token refreshed successfully',
      'Token OAuth2 renovado con éxito',
      'Jeton OAuth2 renouvelé avec succès',
      lang
    ),
    'api.auth.userNotFoundOrInactive': L(
      'Usuário não encontrado ou inativo',
      'User not found or inactive',
      'Usuario no encontrado o inactivo',
      'Utilisateur introuvable ou inactif',
      lang
    ),
    'api.auth.adminUserCreated': L(
      'Usuário admin criado com sucesso',
      'Admin user created successfully',
      'Usuario admin creado con éxito',
      'Utilisateur admin créé avec succès',
      lang
    ),
    'api.auth.adminUserExists': L(
      'Usuário admin já existe',
      'Admin user already exists',
      'El usuario admin ya existe',
      'L’utilisateur admin existe déjà',
      lang
    ),
    'api.auth.testEndpointOk': L(
      'Endpoint de autenticação operacional',
      'Auth endpoint is working',
      'Endpoint de autenticación operativo',
      'Point de terminaison d’authentification opérationnel',
      lang
    ),

    'api.fcu.notFound': L(
      'FCU não encontrado: {{id}}',
      'FCU not found: {{id}}',
      'FCU no encontrado: {{id}}',
      'FCU introuvable : {{id}}',
      lang
    ),
    'api.fabricante.notFound': L(
      'Fabricante não encontrado: {{id}}',
      'Manufacturer not found: {{id}}',
      'Fabricante no encontrado: {{id}}',
      'Fabricant introuvable : {{id}}',
      lang
    ),
    'api.tipoServico.notFound': L(
      'Tipo de serviço não encontrado: {{id}}',
      'Service type not found: {{id}}',
      'Tipo de servicio no encontrado: {{id}}',
      'Type de service introuvable : {{id}}',
      lang
    ),
    'api.user.notFoundById': L(
      'Usuário não encontrado: {{id}}',
      'User not found: {{id}}',
      'Usuario no encontrado: {{id}}',
      'Utilisateur introuvable : {{id}}',
      lang
    ),
    'api.tenant.notIdentified': L(
      'Organização não identificada',
      'Organization not identified',
      'Organización no identificada',
      'Organisation non identifiée',
      lang
    ),

    'api.chat.conversationNotFound': L(
      'Conversa não encontrada',
      'Conversation not found',
      'Conversación no encontrada',
      'Conversation introuvable',
      lang
    ),
    'api.chat.notParticipant': L(
      'Você não participa desta conversa',
      'You are not a participant in this conversation',
      'No participa en esta conversación',
      'Vous ne participez pas à cette conversation',
      lang
    ),

    'api.tenant.signup.reservedCode': L(
      'Código de organização reservado',
      'Organization code is reserved',
      'Código de organización reservado',
      'Code d’organisation réservé',
      lang
    ),
    'api.tenant.signup.emailExists': L(
      'E-mail já cadastrado',
      'Email is already registered',
      'Correo ya registrado',
      'E-mail déjà enregistré',
      lang
    ),
    'api.tenant.signup.invalidRequest': L(
      'Requisição de cadastro inválida',
      'Invalid signup request',
      'Solicitud de registro no válida',
      'Requête d’inscription invalide',
      lang
    ),
    'api.tenant.signup.invalidOrgCode': L(
      'Código da organização inválido',
      'Invalid organization code',
      'Código de organización no válido',
      'Code d’organisation invalide',
      lang
    ),
    'api.tenant.signup.orgNameRequired': L(
      'Nome da organização obrigatório',
      'Organization name is required',
      'Nombre de la organización obligatorio',
      'Nom de l’organisation obligatoire',
      lang
    ),
    'api.tenant.signup.adminEmailRequired': L(
      'E-mail do administrador obrigatório',
      'Administrator email is required',
      'Correo del administrador obligatorio',
      'E-mail de l’administrateur obligatoire',
      lang
    ),
    'api.tenant.signup.adminPasswordMin': L(
      'Senha do administrador deve ter no mínimo 8 caracteres',
      'Administrator password must be at least 8 characters',
      'La contraseña del administrador debe tener al menos 8 caracteres',
      'Le mot de passe administrateur doit comporter au moins 8 caractères',
      lang
    ),
    'api.tenant.signup.termsRequired': L(
      'Aceite dos termos é obrigatório',
      'Acceptance of terms is required',
      'La aceptación de los términos es obligatoria',
      'L’acceptation des conditions est obligatoire',
      lang
    ),
    'api.tenant.signup.lgpdVersionInvalid': L(
      'Versão dos documentos LGPD inválida',
      'Invalid LGPD document version',
      'Versión de documentos LGPD no válida',
      'Version des documents LGPD invalide',
      lang
    ),
    'api.tenant.signup.orgCodeInUse': L(
      'Código da organização já está em uso',
      'Organization code is already in use',
      'Código de organización ya en uso',
      'Code d’organisation déjà utilisé',
      lang
    ),
    'api.tenant.signup.modulosRequired': L(
      'Selecione ao menos um módulo no cadastro trial.',
      'Select at least one module during trial signup.',
      'Seleccione al menos un módulo en el registro trial.',
      'Sélectionnez au moins un module lors de l’inscription d’essai.',
      lang
    ),
    'api.product.pnInvalid': L(
      'Código do produto inválido. Use apenas letras, números, hífen ou ponto, sem espaços.',
      'Invalid product code. Use letters, numbers, hyphen or dot only, no spaces.',
      'Código de producto inválido. Use solo letras, números, guion o punto, sin espacios.',
      'Code produit invalide. Utilisez uniquement lettres, chiffres, tiret ou point, sans espaces.',
      lang
    ),

    'api.studio.jobNotComplete': L(
      'Trabalho ainda não concluído (status: {{status}})',
      'Job not complete yet (status: {{status}})',
      'Trabajo aún no completado (estado: {{status}})',
      'Travail pas encore terminé (statut : {{status}})',
      lang
    ),
    'api.studio.previewUnavailable': L(
      'Pré-visualização indisponível',
      'Preview unavailable',
      'Vista previa no disponible',
      'Aperçu indisponible',
      lang
    ),
    'api.studio.previewFileNotFound': L(
      'Arquivo de pré-visualização não encontrado',
      'Preview file not found',
      'Archivo de vista previa no encontrado',
      'Fichier d’aperçu introuvable',
      lang
    ),
    'api.studio.jobNotFound': L(
      'Trabalho não encontrado',
      'Job not found',
      'Trabajo no encontrado',
      'Travail introuvable',
      lang
    ),
    'api.studio.fileRequired': L(
      'Arquivo obrigatório',
      'File is required',
      'Archivo obligatorio',
      'Fichier obligatoire',
      lang
    ),
    'api.studio.sessionRequired': L(
      'Sessão obrigatória',
      'Session is required',
      'Sesión obligatoria',
      'Session obligatoire',
      lang
    ),
    'api.studio.documentRequired': L(
      'Documento obrigatório',
      'Document is required',
      'Documento obligatorio',
      'Document obligatoire',
      lang
    ),
    'api.studio.templateIdRequired': L(
      'Modelo obrigatório',
      'Template is required',
      'Plantilla obligatoria',
      'Modèle obligatoire',
      lang
    ),
    'api.studio.templateInvalid': L(
      'Modelo inválido: {{templateId}}',
      'Invalid template: {{templateId}}',
      'Plantilla no válida: {{templateId}}',
      'Modèle invalide : {{templateId}}',
      lang
    ),
    'api.studio.customLayoutRequired': L(
      'Layout personalizado obrigatório',
      'Custom layout is required',
      'Diseño personalizado obligatorio',
      'Mise en page personnalisée obligatoire',
      lang
    ),
    'api.studio.dimensionsMin': L(
      'Dimensões mínimas: 10 × 10 mm',
      'Minimum dimensions: 10 × 10 mm',
      'Dimensiones mínimas: 10 × 10 mm',
      'Dimensions minimales : 10 × 10 mm',
      lang
    ),
    'api.studio.dimensionsMax': L(
      'Dimensões máximas: 3000 × 3000 mm',
      'Maximum dimensions: 3000 × 3000 mm',
      'Dimensiones máximas: 3000 × 3000 mm',
      'Dimensions maximales : 3000 × 3000 mm',
      lang
    ),
    'api.studio.elementInvalid': L(
      'Elemento do layout inválido',
      'Invalid layout element',
      'Elemento del diseño no válido',
      'Élément de mise en page invalide',
      lang
    ),
    'api.studio.elementTypeInvalid': L(
      'Tipo de elemento inválido: {{type}}',
      'Invalid element type: {{type}}',
      'Tipo de elemento no válido: {{type}}',
      'Type d’élément invalide : {{type}}',
      lang
    ),
    'api.studio.textTooLong': L(
      'Texto excede o limite de 4000 caracteres',
      'Text exceeds the 4000 character limit',
      'El texto supera el límite de 4000 caracteres',
      'Le texte dépasse la limite de 4000 caractères',
      lang
    ),
    'api.studio.visualEditorRequiresLayout': L(
      'O editor visual exige um layout personalizado',
      'The visual editor requires a custom layout',
      'El editor visual requiere un diseño personalizado',
      'L’éditeur visuel exige une mise en page personnalisée',
      lang
    ),

    'api.backup.connectionDataRequired': L(
      'Dados de conexão obrigatórios',
      'Connection data is required',
      'Datos de conexión obligatorios',
      'Données de connexion obligatoires',
      lang
    ),
    'api.backup.pathRequired': L(
      'Caminho de backup obrigatório',
      'Backup path is required',
      'Ruta de copia de seguridad obligatoria',
      'Chemin de sauvegarde obligatoire',
      lang
    ),
    'api.backup.persistFailed': L(
      'Falha ao persistir configuração: {{detail}}',
      'Failed to persist configuration: {{detail}}',
      'Error al persistir configuración: {{detail}}',
      'Échec de la persistance de la configuration : {{detail}}',
      lang
    ),
    'api.backup.dirNotWritable': L(
      'Diretório sem permissão de escrita: {{path}}',
      'Directory is not writable: {{path}}',
      'Directorio sin permiso de escritura: {{path}}',
      'Répertoire non accessible en écriture : {{path}}',
      lang
    ),
    'api.backup.fileNotCreated': L(
      'Arquivo de backup não foi criado: {{path}}',
      'Backup file was not created: {{path}}',
      'Archivo de copia no creado: {{path}}',
      'Fichier de sauvegarde non créé : {{path}}',
      lang
    ),
    'api.backup.fileEmpty': L(
      'Arquivo de backup vazio',
      'Backup file is empty',
      'Archivo de copia vacío',
      'Fichier de sauvegarde vide',
      lang
    ),
    'api.backup.deleteFailed': L(
      'Falha ao excluir backup: {{detail}}',
      'Failed to delete backup: {{detail}}',
      'Error al eliminar copia de seguridad: {{detail}}',
      'Échec de la suppression de la sauvegarde : {{detail}}',
      lang
    ),
    'api.backup.listDirFailed': L(
      'Falha ao listar diretório: {{detail}}',
      'Failed to list directory: {{detail}}',
      'Error al listar directorio: {{detail}}',
      'Échec du listage du répertoire : {{detail}}',
      lang
    ),
    'api.backup.pathNotInformed': L(
      'Caminho não informado',
      'Path not provided',
      'Ruta no informada',
      'Chemin non renseigné',
      lang
    ),
    'api.backup.pathInvalid': L(
      'Caminho inválido: {{path}}',
      'Invalid path: {{path}}',
      'Ruta no válida: {{path}}',
      'Chemin invalide : {{path}}',
      lang
    ),
    'api.backup.pathOutsideDrive': L(
      'Caminho fora da unidade {{drive}}',
      'Path is outside drive {{drive}}',
      'Ruta fuera de la unidad {{drive}}',
      'Chemin en dehors du lecteur {{drive}}',
      lang
    ),
    'api.backup.driveNotMounted': L(
      'Unidade {{drive}} não montada',
      'Drive {{drive}} is not mounted',
      'Unidad {{drive}} no montada',
      'Lecteur {{drive}} non monté',
      lang
    ),
    'api.backup.saveFailed': L(
      'Falha ao salvar configuração: {{detail}}',
      'Failed to save configuration: {{detail}}',
      'Error al guardar configuración: {{detail}}',
      'Échec de l’enregistrement de la configuration : {{detail}}',
      lang
    ),

    'api.user.deleteHasRelations': L(
      'Não é possível excluir o usuário pois ele possui registros relacionados no sistema.',
      'Cannot delete the user because they have related records in the system.',
      'No es posible eliminar el usuario porque tiene registros relacionados en el sistema.',
      'Impossible de supprimer l’utilisateur car il possède des enregistrements liés dans le système.',
      lang
    ),
    'api.user.deleteCannotDelete': L(
      'Não é possível excluir o usuário. Verifique se existem registros relacionados.',
      'Cannot delete the user. Check for related records.',
      'No es posible eliminar el usuario. Verifique si hay registros relacionados.',
      'Impossible de supprimer l’utilisateur. Vérifiez s’il existe des enregistrements liés.',
      lang
    ),
    'api.user.deleteConstraint': L(
      'Erro ao excluir usuário: violação de constraint de integridade referencial.',
      'Error deleting user: referential integrity constraint violation.',
      'Error al eliminar usuario: violación de restricción de integridad referencial.',
      'Erreur lors de la suppression de l’utilisateur : violation de contrainte d’intégrité référentielle.',
      lang
    ),
    'api.user.deleteServerError': L(
      'Erro ao excluir usuário. Verifique os logs do servidor.',
      'Error deleting user. Check the server logs.',
      'Error al eliminar usuario. Verifique los registros del servidor.',
      'Erreur lors de la suppression de l’utilisateur. Consultez les journaux du serveur.',
      lang
    ),
    'api.user.deleteUnexpected': L(
      'Erro inesperado ao excluir usuário. Verifique os logs do servidor.',
      'Unexpected error deleting user. Check the server logs.',
      'Error inesperado al eliminar usuario. Verifique los registros del servidor.',
      'Erreur inattendue lors de la suppression de l’utilisateur. Consultez les journaux du serveur.',
      lang
    ),
    'api.user.deleteUnknown': L(
      'Erro desconhecido ao excluir usuário',
      'Unknown error deleting user',
      'Error desconocido al eliminar usuario',
      'Erreur inconnue lors de la suppression de l’utilisateur',
      lang
    ),

    'api.studio.invalidPath': L(
      'Caminho inválido',
      'Invalid path',
      'Ruta no válida',
      'Chemin invalide',
      lang
    ),
    'api.studio.assetAccessDenied': L(
      'Acesso negado ao asset',
      'Access denied to asset',
      'Acceso denegado al recurso',
      'Accès refusé à la ressource',
      lang
    ),
    'api.studio.assetNotFound': L(
      'Asset não encontrado',
      'Asset not found',
      'Recurso no encontrado',
      'Ressource introuvable',
      lang
    ),

    'api.common.operationNotAllowed': L(
      'Operação não permitida',
      'Operation not allowed',
      'Operación no permitida',
      'Opération non autorisée',
      lang
    ),
    'api.common.resourceNotFound': L(
      'O recurso solicitado não foi encontrado',
      'The requested resource was not found',
      'El recurso solicitado no fue encontrado',
      'La ressource demandée est introuvable',
      lang
    ),
    'api.common.internalError': L(
      'Erro interno do servidor',
      'Internal server error',
      'Error interno del servidor',
      'Erreur interne du serveur',
      lang
    ),
    'api.common.unexpectedError': L(
      'Ocorreu um erro inesperado',
      'An unexpected error occurred',
      'Ocurrió un error inesperado',
      'Une erreur inattendue s’est produite',
      lang
    ),
    'api.common.validation': L('Validação', 'Validation', 'Validación', 'Validation', lang),
    'api.common.fieldTooLong': L(
      'O campo {{field}} excede o limite de {{max}} caracteres. Reduza o texto e tente novamente.',
      'Field {{field}} exceeds the {{max}} character limit. Shorten the text and try again.',
      'El campo {{field}} supera el límite de {{max}} caracteres. Acorte el texto e intente de nuevo.',
      'Le champ {{field}} dépasse la limite de {{max}} caractères. Raccourcissez le texte et réessayez.',
      lang
    ),

    'api.email.sendFailed': L(
      'Falha ao enviar e-mail',
      'Failed to send email',
      'Error al enviar correo',
      'Échec de l’envoi de l’e-mail',
      lang
    ),

    'api.lgpd.userInvalid': L(
      'Usuário inválido',
      'Invalid user',
      'Usuario no válido',
      'Utilisateur invalide',
      lang
    ),
    'api.lgpd.termsRequired': L(
      'É necessário aceitar os termos e a política de privacidade',
      'You must accept the terms and privacy policy',
      'Debe aceptar los términos y la política de privacidad',
      'Vous devez accepter les conditions et la politique de confidentialité',
      lang
    ),
    'api.lgpd.versionOutdated': L(
      'Versão dos documentos desatualizada. Recarregue a página.',
      'Document version is outdated. Reload the page.',
      'Versión de los documentos desactualizada. Recargue la página.',
      'Version des documents obsolète. Rechargez la page.',
      lang
    ),
    'api.lgpd.requestTypeRequired': L(
      'Tipo de solicitação obrigatório (EXPORT ou DELETE)',
      'Request type is required (EXPORT or DELETE)',
      'Tipo de solicitud obligatorio (EXPORT o DELETE)',
      'Type de demande obligatoire (EXPORT ou DELETE)',
      lang
    ),
    'api.lgpd.requestTypeInvalid': L(
      'Tipo inválido',
      'Invalid type',
      'Tipo no válido',
      'Type invalide',
      lang
    ),
    'api.lgpd.requestNotFound': L(
      'Solicitação não encontrada',
      'Request not found',
      'Solicitud no encontrada',
      'Demande introuvable',
      lang
    ),
    'api.lgpd.exportNotReady': L(
      'Exportação ainda não disponível',
      'Export not yet available',
      'Exportación aún no disponible',
      'Exportation pas encore disponible',
      lang
    ),
    'api.lgpd.exportFileNotFound': L(
      'Arquivo de exportação não encontrado',
      'Export file not found',
      'Archivo de exportación no encontrado',
      'Fichier d’exportation introuvable',
      lang
    ),
    'api.lgpd.fileUnavailable': L(
      'Arquivo indisponível',
      'File unavailable',
      'Archivo no disponible',
      'Fichier indisponible',
      lang
    ),
    'api.lgpd.notAuthenticated': L(
      'Não autenticado',
      'Not authenticated',
      'No autenticado',
      'Non authentifié',
      lang
    ),
    'api.lgpd.userNotFound': L(
      'Usuário não encontrado',
      'User not found',
      'Usuario no encontrado',
      'Utilisateur introuvable',
      lang
    ),
    'api.lgpd.exportUserNotFound': L(
      'Usuário não encontrado',
      'User not found',
      'Usuario no encontrado',
      'Utilisateur introuvable',
      lang
    ),
    'api.lgpd.exportWriteFailed': L(
      'Falha ao gravar exportação LGPD',
      'Failed to save LGPD export',
      'Error al guardar exportación LGPD',
      'Échec de l’enregistrement de l’exportation LGPD',
      lang
    ),
    'api.lgpd.artifactInvalid': L(
      'Artefato inválido',
      'Invalid artifact',
      'Artefacto no válido',
      'Artefact invalide',
      lang
    ),

    'api.oauth.notEnabled': L(
      'OAuth2 não está habilitado',
      'OAuth2 is not enabled',
      'OAuth2 no está habilitado',
      'OAuth2 n’est pas activé',
      lang
    ),
    'api.oauth.credentialsNotConfigured': L(
      'Credenciais OAuth2 não configuradas',
      'OAuth2 credentials not configured',
      'Credenciales OAuth2 no configuradas',
      'Identifiants OAuth2 non configurés',
      lang
    ),
    'api.oauth.credentialsNotInitialized': L(
      'Credenciais OAuth2 não foram inicializadas',
      'OAuth2 credentials were not initialized',
      'Credenciales OAuth2 no inicializadas',
      'Identifiants OAuth2 non initialisés',
      lang
    ),
    'api.oauth.refreshFailed': L(
      'Erro ao renovar token OAuth2',
      'Failed to refresh OAuth2 token',
      'Error al renovar token OAuth2',
      'Échec du renouvellement du jeton OAuth2',
      lang
    ),
    'api.oauth.refreshWrongClient': L(
      'Falha ao renovar token OAuth2. O Refresh Token pode ter sido gerado com um Client ID diferente. Gere um novo Refresh Token usando o Client ID correto: {{clientId}}',
      'Failed to refresh OAuth2 token. The refresh token may have been generated with a different Client ID. Generate a new refresh token using the correct Client ID: {{clientId}}',
      'Error al renovar token OAuth2. El refresh token puede haberse generado con un Client ID distinto. Genere un nuevo refresh token con el Client ID correcto: {{clientId}}',
      'Échec du renouvellement du jeton OAuth2. Le refresh token a peut-être été généré avec un Client ID différent. Générez un nouveau refresh token avec le bon Client ID : {{clientId}}',
      lang
    ),
    'api.oauth.smtpUnexpected': L(
      'Resposta SMTP inesperada: {{detail}}',
      'Unexpected SMTP response: {{detail}}',
      'Respuesta SMTP inesperada: {{detail}}',
      'Réponse SMTP inattendue : {{detail}}',
      lang
    ),

    'api.bling.parseContactFailed': L('Falha ao interpretar contato Bling: {{detail}}', 'Failed to parse Bling contact: {{detail}}', 'Error al interpretar contacto Bling: {{detail}}', 'Échec de l’analyse du contact Bling : {{detail}}', lang),
    'api.bling.searchContactsFailed': L('Falha ao pesquisar contatos Bling: {{detail}}', 'Failed to search Bling contacts: {{detail}}', 'Error al buscar contactos Bling: {{detail}}', 'Échec de la recherche de contacts Bling : {{detail}}', lang),
    'api.bling.contactIdNotReturned': L('Bling não retornou id do contato criado', 'Bling did not return created contact id', 'Bling no devolvió id del contacto creado', 'Bling n’a pas renvoyé l’id du contact créé', lang),
    'api.bling.createContactApiFailed': L('Falha ao criar contato Bling: {{detail}}', 'Failed to create Bling contact: {{detail}}', 'Error al crear contacto Bling: {{detail}}', 'Échec de la création du contact Bling : {{detail}}', lang),
    'api.bling.productIdNotReturned': L('Bling não retornou id do produto criado', 'Bling did not return created product id', 'Bling no devolvió id del producto creado', 'Bling n’a pas renvoyé l’id du produit créé', lang),
    'api.bling.createProductFailed': L('Falha ao criar produto Bling: {{detail}}', 'Failed to create Bling product: {{detail}}', 'Error al crear producto Bling: {{detail}}', 'Échec de la création du produit Bling : {{detail}}', lang),
    'api.bling.fetchCompanyFailed': L('Falha ao obter dados da empresa Bling: {{detail}}', 'Failed to fetch Bling company data: {{detail}}', 'Error al obtener datos de la empresa Bling: {{detail}}', 'Échec de la récupération des données entreprise Bling : {{detail}}', lang),
    'api.bling.parsePedidoFailed': L('Falha ao interpretar pedido Bling: {{detail}}', 'Failed to parse Bling order: {{detail}}', 'Error al interpretar pedido Bling: {{detail}}', 'Échec de l’analyse de la commande Bling : {{detail}}', lang),
    'api.bling.pedidoIdNotReturned': L('Bling não retornou id do pedido criado', 'Bling did not return created order id', 'Bling no devolvió id del pedido creado', 'Bling n’a pas renvoyé l’id de la commande créée', lang),
    'api.bling.createPedidoApiFailed': L('Falha ao criar pedido Bling: {{detail}}', 'Failed to create Bling order: {{detail}}', 'Error al crear pedido Bling: {{detail}}', 'Échec de la création de la commande Bling : {{detail}}', lang),
    'api.bling.parseNfeFailed': L('Falha ao interpretar NF-e Bling: {{detail}}', 'Failed to parse Bling invoice: {{detail}}', 'Error al interpretar NF-e Bling: {{detail}}', 'Échec de l’analyse de la NF-e Bling : {{detail}}', lang),
    'api.bling.nfeIdNotReturned': L('Bling não retornou id da NF-e criada', 'Bling did not return created invoice id', 'Bling no devolvió id de la NF-e creada', 'Bling n’a pas renvoyé l’id de la NF-e créée', lang),
    'api.bling.emitNfeApiFailed': L('Falha ao emitir NF-e Bling: {{detail}}', 'Failed to issue Bling invoice: {{detail}}', 'Error al emitir NF-e Bling: {{detail}}', 'Échec de l’émission de la NF-e Bling : {{detail}}', lang),
    'api.bling.tenantNoToken': L('Tenant {{tenantId}} sem token Bling', 'Tenant {{tenantId}} has no Bling token', 'Tenant {{tenantId}} sin token Bling', 'Tenant {{tenantId}} sans jeton Bling', lang),
    'api.bling.httpError': L('Bling HTTP {{detail}}', 'Bling HTTP {{detail}}', 'Bling HTTP {{detail}}', 'Bling HTTP {{detail}}', lang),
    'api.bling.postFailed': L('Falha ao chamar Bling POST: {{detail}}', 'Failed to call Bling POST: {{detail}}', 'Error al llamar Bling POST: {{detail}}', 'Échec de l’appel Bling POST : {{detail}}', lang),
    'api.bling.getFailed': L('Falha ao chamar Bling: {{detail}}', 'Failed to call Bling: {{detail}}', 'Error al llamar Bling: {{detail}}', 'Échec de l’appel Bling : {{detail}}', lang),
    'api.bling.oauthNoAccessToken': L('Resposta Bling sem access_token', 'Bling response missing access_token', 'Respuesta Bling sin access_token', 'Réponse Bling sans access_token', lang),
    'api.bling.oauthTokenFailed': L('Falha ao obter token Bling: {{detail}}', 'Failed to obtain Bling token: {{detail}}', 'Error al obtener token Bling: {{detail}}', 'Échec de l’obtention du jeton Bling : {{detail}}', lang),
    'api.bling.contactNotFound': L('Contato Bling não encontrado: {{id}}', 'Bling contact not found: {{id}}', 'Contacto Bling no encontrado: {{id}}', 'Contact Bling introuvable : {{id}}', lang),
    'api.bling.webhookEmptyBody': L('Corpo da requisição vazio', 'Empty request body', 'Cuerpo de la solicitud vacío', 'Corps de la requête vide', lang),
    'api.bling.webhookNoContactId': L('Webhook sem ID de contato', 'Webhook missing contact ID', 'Webhook sin ID de contacto', 'Webhook sans ID de contact', lang),
    'api.bling.propostaClientNotFound': L('Cliente proposta não encontrado', 'Proposal client not found', 'Cliente de propuesta no encontrado', 'Client proposition introuvable', lang),
    'api.bling.clientAlreadyLinked': L('Cliente já vinculado a outro contato Bling', 'Client already linked to another Bling contact', 'Cliente ya vinculado a otro contacto Bling', 'Client déjà lié à un autre contact Bling', lang),
    'api.bling.enqueueJobFailed': L('Falha ao enfileirar job Bling: {{detail}}', 'Failed to enqueue Bling job: {{detail}}', 'Error al encolar job Bling: {{detail}}', 'Échec de la mise en file du job Bling : {{detail}}', lang),
    'api.bling.jobNoTenant': L('Job sem tenant_id', 'Job missing tenant_id', 'Job sin tenant_id', 'Job sans tenant_id', lang),
    'api.bling.jobNoContactId': L('blingContatoId ausente no job', 'blingContatoId missing in job', 'blingContatoId ausente en el job', 'blingContatoId absent du job', lang),

    'api.fcu.notFoundGeneric': L('FCU não encontrado', 'FCU not found', 'FCU no encontrado', 'FCU introuvable', lang),
    'api.fcu.deactivateNoRows': L('Nenhuma linha foi atualizada. FCU pode não existir ou já estar inativo.', 'No rows updated. FCU may not exist or is already inactive.', 'Ninguna fila actualizada. El FCU puede no existir o ya estar inactivo.', 'Aucune ligne mise à jour. Le FCU n’existe peut-être pas ou est déjà inactif.', lang),
    'api.fcu.deactivateNoRowsSimple': L('Nenhuma linha foi atualizada. FCU pode não existir.', 'No rows updated. FCU may not exist.', 'Ninguna fila actualizada. El FCU puede no existir.', 'Aucune ligne mise à jour. Le FCU n’existe peut-être pas.', lang),
    'api.fcu.deactivateFailed': L('Erro ao inativar FCU: {{detail}}', 'Failed to deactivate FCU: {{detail}}', 'Error al inactivar FCU: {{detail}}', 'Échec de la désactivation du FCU : {{detail}}', lang),
    'api.fcu.dtoConvertFailed': L('Erro ao converter FCU para DTO: {{detail}}', 'Failed to convert FCU to DTO: {{detail}}', 'Error al convertir FCU a DTO: {{detail}}', 'Échec de la conversion FCU en DTO : {{detail}}', lang),
    'api.fcu.updateFieldsFailed': L('Erro ao atualizar campos do FCU: {{detail}}', 'Failed to update FCU fields: {{detail}}', 'Error al actualizar campos del FCU: {{detail}}', 'Échec de la mise à jour des champs FCU : {{detail}}', lang),
    'api.fcu.idRequired': L('ID do FCU é obrigatório', 'FCU ID is required', 'ID del FCU es obligatorio', 'ID du FCU obligatoire', lang),

    'api.tipoServico.idRequired': L('ID do TipoServico é obrigatório', 'Service type ID is required', 'ID del TipoServico es obligatorio', 'ID du type de service obligatoire', lang),
    'api.tipoServico.deactivateNoRows': L('Nenhuma linha foi atualizada para o ID: {{id}}', 'No rows updated for ID: {{id}}', 'Ninguna fila actualizada para el ID: {{id}}', 'Aucune ligne mise à jour pour l’ID : {{id}}', lang),
    'api.tipoServico.reloadFailed': L('Erro ao recarregar TipoServico ID {{id}} após inativação', 'Failed to reload service type ID {{id}} after deactivation', 'Error al recargar TipoServico ID {{id}} tras inactivación', 'Échec du rechargement du type de service ID {{id}} après désactivation', lang),
    'api.tipoServico.deactivateFailed': L('Erro ao inativar TipoServico: {{detail}}', 'Failed to deactivate service type: {{detail}}', 'Error al inactivar TipoServico: {{detail}}', 'Échec de la désactivation du type de service : {{detail}}', lang),

    'api.os.fileListFailed': L('Erro ao listar arquivos disponíveis: {{detail}}', 'Failed to list available files: {{detail}}', 'Error al listar archivos disponibles: {{detail}}', 'Échec de la liste des fichiers disponibles : {{detail}}', lang),
    'api.os.folderCreateFailed': L('Erro ao criar pasta da OS: {{detail}}', 'Failed to create work order folder: {{detail}}', 'Error al crear carpeta de la OS: {{detail}}', 'Échec de la création du dossier OS : {{detail}}', lang),
    'api.os.folderDiversosFailed': L('Erro ao criar pasta diversos: {{detail}}', 'Failed to create misc folder: {{detail}}', 'Error al crear carpeta varios: {{detail}}', 'Échec de la création du dossier divers : {{detail}}', lang),
    'api.os.folderDiversosOsFailed': L('Erro ao criar pasta diversos para OS: {{detail}}', 'Failed to create misc folder for work order: {{detail}}', 'Error al crear carpeta varios para OS: {{detail}}', 'Échec de la création du dossier divers pour l’OS : {{detail}}', lang),
    'api.os.fileReadFailed': L('Erro ao ler arquivo: {{detail}}', 'Failed to read file: {{detail}}', 'Error al leer archivo: {{detail}}', 'Échec de la lecture du fichier : {{detail}}', lang),
    'api.os.crsNotEmitted': L('CRS ainda não emitido para esta OS', 'CRS not yet issued for this work order', 'CRS aún no emitido para esta OS', 'CRS pas encore émis pour cette OS', lang),

    'api.estoque.qrGenerateFailed': L('Erro ao gerar QR Code: {{detail}}', 'Failed to generate QR code: {{detail}}', 'Error al generar código QR: {{detail}}', 'Échec de la génération du code QR : {{detail}}', lang),
    'api.estoque.qrImageFailed': L('Erro ao gerar imagem do QR Code: {{detail}}', 'Failed to generate QR code image: {{detail}}', 'Error al generar imagen del código QR: {{detail}}', 'Échec de la génération de l’image QR : {{detail}}', lang),

    'api.update.notFound': L('Atualização não encontrada', 'Update not found', 'Actualización no encontrada', 'Mise à jour introuvable', lang),
    'api.update.notAvailable': L('Atualização não está disponível para aprovação', 'Update is not available for approval', 'La actualización no está disponible para aprobación', 'La mise à jour n’est pas disponible pour approbation', lang),
    'api.update.userNotFound': L('Usuário não encontrado ou sem perfil', 'User not found or without profile', 'Usuario no encontrado o sin perfil', 'Utilisateur introuvable ou sans profil', lang),
    'api.update.approveForbidden': L('Apenas administradores e diretores podem aprovar atualizações', 'Only administrators and directors can approve updates', 'Solo administradores y directores pueden aprobar actualizaciones', 'Seuls les administrateurs et directeurs peuvent approuver les mises à jour', lang),
    'api.update.downloadUrlNotConfigured': L('URL de download não configurada', 'Download URL not configured', 'URL de descarga no configurada', 'URL de téléchargement non configurée', lang),

    'api.billing.notConfigured': L('Billing não configurado para o tenant', 'Billing not configured for tenant', 'Billing no configurado para el tenant', 'Facturation non configurée pour le tenant', lang),
    'api.billing.platformNoCheckout': L('Organização da plataforma não requer checkout', 'Platform organization does not require checkout', 'La organización de la plataforma no requiere checkout', 'L’organisation plateforme ne nécessite pas de checkout', lang),
    'api.billing.mockOnly': L('Ativação mock disponível apenas com provider mock', 'Mock activation available only with mock provider', 'Activación mock disponible solo con proveedor mock', 'Activation mock disponible uniquement avec le fournisseur mock', lang),
    'api.billing.notFound': L('Billing não encontrado', 'Billing not found', 'Billing no encontrado', 'Facturation introuvable', lang),
    'api.billing.pagarmeNotConfigured': L('Pagar.me não configurado', 'Pagar.me not configured', 'Pagar.me no configurado', 'Pagar.me non configuré', lang),
    'api.billing.pagarmeWebhookNotConfigured': L('Webhook Pagar.me não configurado', 'Pagar.me webhook not configured', 'Webhook Pagar.me no configurado', 'Webhook Pagar.me non configuré', lang),
    'api.billing.pagarmeSessionFailed': L('Falha ao criar checkout Pagar.me: {{detail}}', 'Failed to create Pagar.me checkout: {{detail}}', 'Error al crear checkout Pagar.me: {{detail}}', 'Échec de création du checkout Pagar.me : {{detail}}', lang),
    'api.billing.pagarmeRedirect': L('Redirecionando para o checkout Pagar.me', 'Redirecting to Pagar.me checkout', 'Redirigiendo al checkout Pagar.me', 'Redirection vers le checkout Pagar.me', lang),
    'api.billing.pagarmeSignatureInvalid': L('Assinatura do webhook Pagar.me inválida', 'Invalid Pagar.me webhook signature', 'Firma del webhook Pagar.me inválida', 'Signature du webhook Pagar.me invalide', lang),
    'api.billing.pagarmePayloadInvalid': L('Payload do webhook Pagar.me inválido', 'Invalid Pagar.me webhook payload', 'Payload del webhook Pagar.me inválido', 'Payload du webhook Pagar.me invalide', lang),
    'api.billing.pagarmeSignatureRequired': L('Cabeçalho de assinatura Pagar.me obrigatório', 'Pagar.me signature header required', 'Cabecera de firma Pagar.me obligatoria', 'En-tête de signature Pagar.me requis', lang),
    'api.bling.webhookHomologationOk': L('Webhook Bling validado — evento de teste enfileirado', 'Bling webhook validated — test event queued', 'Webhook Bling validado — evento de prueba en cola', 'Webhook Bling validé — événement test mis en file', lang),
    'api.bling.webhookHomologationFailed': L('Homologação do webhook falhou: {{detail}}', 'Webhook homologation failed: {{detail}}', 'Homologación del webhook falló: {{detail}}', 'Échec de l\'homologation webhook : {{detail}}', lang),
    'api.bling.webhookDisabled': L('Webhook Bling desabilitado no ambiente', 'Bling webhook disabled in environment', 'Webhook Bling deshabilitado en el entorno', 'Webhook Bling désactivé dans l\'environnement', lang),
    'api.billing.stripeNotConfigured': L('Stripe não configurado', 'Stripe not configured', 'Stripe no configurado', 'Stripe non configuré', lang),
    'api.billing.stripeIncomplete': L('Stripe incompleto: defina secret key e price id', 'Stripe incomplete: set secret key and price id', 'Stripe incompleto: defina secret key y price id', 'Stripe incomplet : définissez secret key et price id', lang),
    'api.billing.stripeSessionFailed': L('Falha ao criar sessão Stripe: {{detail}}', 'Failed to create Stripe session: {{detail}}', 'Error al crear sesión Stripe: {{detail}}', 'Échec de la création de la session Stripe : {{detail}}', lang),
    'api.billing.stripeWebhookNotConfigured': L('Webhook Stripe não configurado', 'Stripe webhook not configured', 'Webhook Stripe no configurado', 'Webhook Stripe non configuré', lang),
    'api.billing.stripeSignatureInvalid': L('Assinatura Stripe inválida', 'Invalid Stripe signature', 'Firma Stripe no válida', 'Signature Stripe invalide', lang),

    'api.fiscal.certEmpty': L('Arquivo de certificado vazio', 'Certificate file is empty', 'Archivo de certificado vacío', 'Fichier de certificat vide', lang),
    'api.fiscal.certInvalidPkcs12': L('Certificado PKCS#12 sem certificado X.509 válido', 'PKCS#12 certificate has no valid X.509 certificate', 'Certificado PKCS#12 sin certificado X.509 válido', 'Certificat PKCS#12 sans certificat X.509 valide', lang),
    'api.fiscal.certInvalidPassword': L('Certificado inválido ou senha incorreta: {{detail}}', 'Invalid certificate or wrong password: {{detail}}', 'Certificado no válido o contraseña incorrecta: {{detail}}', 'Certificat invalide ou mot de passe incorrect : {{detail}}', lang),
    'api.fiscal.certTypeRequired': L('Informe o tipo do certificado (A1 ou A3)', 'Specify certificate type (A1 or A3)', 'Indique el tipo de certificado (A1 o A3)', 'Indiquez le type de certificat (A1 ou A3)', lang),
    'api.fiscal.certTypeInvalid': L('Tipo de certificado deve ser A1 ou A3', 'Certificate type must be A1 or A3', 'El tipo de certificado debe ser A1 o A3', 'Le type de certificat doit être A1 ou A3', lang),
    'api.fiscal.certPasswordRequired': L('Senha do certificado obrigatória', 'Certificate password is required', 'Contraseña del certificado obligatoria', 'Mot de passe du certificat obligatoire', lang),

    'api.associacaoFcu.notFound': L('Associação não encontrada: {{id}}', 'Association not found: {{id}}', 'Asociación no encontrada: {{id}}', 'Association introuvable : {{id}}', lang),
    'api.associacaoFcu.idRequired': L('idFcu é obrigatório', 'idFcu is required', 'idFcu es obligatorio', 'idFcu obligatoire', lang),
    'api.associacao.notFound': L('Associação não encontrada', 'Association not found', 'Asociación no encontrada', 'Association introuvable', lang),
    'api.file.notFound': L('Arquivo não encontrado: {{id}}', 'File not found: {{id}}', 'Archivo no encontrado: {{id}}', 'Fichier introuvable : {{id}}', lang),
    'api.file.docxNotFound': L('Arquivo DOCX não encontrado: {{path}}', 'DOCX file not found: {{path}}', 'Archivo DOCX no encontrado: {{path}}', 'Fichier DOCX introuvable : {{path}}', lang),
    'api.template.notFound': L('Template não encontrado: {{id}}', 'Template not found: {{id}}', 'Plantilla no encontrada: {{id}}', 'Modèle introuvable : {{id}}', lang),

    'api.gmail.notInitialized': L('GmailService não foi inicializado', 'GmailService was not initialized', 'GmailService no fue inicializado', 'GmailService n’a pas été initialisé', lang),
    'api.gmail.sendFailed': L('Erro ao enviar email via Gmail API: {{detail}}', 'Failed to send email via Gmail API: {{detail}}', 'Error al enviar correo vía Gmail API: {{detail}}', 'Échec de l’envoi d’e-mail via Gmail API : {{detail}}', lang),

    'api.studio.letterheadInvalid': L('Preset de timbrado inválido: {{id}}', 'Invalid letterhead preset: {{id}}', 'Preset de membrete inválido: {{id}}', 'Préréglage de papier à en-tête invalide : {{id}}', lang),
    'api.studio.pdfEmpty': L('PDF vazio', 'Empty PDF', 'PDF vacío', 'PDF vide', lang),
    'api.studio.pdfNoPages': L('PDF sem páginas', 'PDF has no pages', 'PDF sin páginas', 'PDF sans pages', lang),
    'api.studio.tooManyElements': L('Demasiados elementos no layout (máx. {{max}})', 'Too many layout elements (max. {{max}})', 'Demasiados elementos en el diseño (máx. {{max}})', 'Trop d’éléments dans la mise en page (max. {{max}})', lang),
    'api.studio.gifWriterUnavailable': L('GIF ImageWriter não disponível', 'GIF ImageWriter not available', 'GIF ImageWriter no disponible', 'GIF ImageWriter indisponible', lang),

    'api.user.profileNotFoundGeneric': L('Perfil não encontrado', 'Profile not found', 'Perfil no encontrado', 'Profil introuvable', lang),
    'api.dossie.idOrOsRequired': L('Informe id ou numeroOs', 'Provide id or numeroOs', 'Indique id o numeroOs', 'Indiquez id ou numeroOs', lang),
    'api.common.bodyRequired': L('Corpo obrigatório', 'Request body is required', 'Cuerpo obligatorio', 'Corps obligatoire', lang),
    'api.publicacao.idRequired': L('publicacaoId é obrigatório', 'publicacaoId is required', 'publicacaoId es obligatorio', 'publicacaoId obligatoire', lang),
    'api.publicacao.fcuIdRequired': L('fcuId é obrigatório', 'fcuId is required', 'fcuId es obligatorio', 'fcuId obligatoire', lang),
    'api.tenant.featureUnknown': L('Feature flag desconhecida: {{code}}', 'Unknown feature flag: {{code}}', 'Feature flag desconocida: {{code}}', 'Feature flag inconnue : {{code}}', lang),
    'api.jwt.invalidUser': L('Usuário inválido para emissão de JWT', 'Invalid user for JWT issuance', 'Usuario no válido para emisión de JWT', 'Utilisateur invalide pour l’émission du JWT', lang),
    'api.barcode.twelveDigitsRequired': L('Código deve ter 12 dígitos', 'Code must have 12 digits', 'El código debe tener 12 dígitos', 'Le code doit comporter 12 chiffres', lang),
    'api.golive.checklistRequired': L('Itens do checklist obrigatórios', 'Checklist items are required', 'Elementos del checklist obligatorios', 'Éléments du checklist obligatoires', lang),
    'api.golive.templateNotFound': L('Template não encontrado: {{file}}', 'Template not found: {{file}}', 'Plantilla no encontrada: {{file}}', 'Modèle introuvable : {{file}}', lang),
    'api.golive.templateReadFailed': L('Erro ao ler template: {{detail}}', 'Failed to read template: {{detail}}', 'Error al leer plantilla: {{detail}}', 'Échec de la lecture du modèle : {{detail}}', lang),

    'api.update.versionDirCreateFailed': L('Falha ao criar diretório da versão: {{path}}', 'Failed to create version directory: {{path}}', 'Error al crear directorio de versión: {{path}}', 'Échec de la création du répertoire de version : {{path}}', lang),
    'api.update.backupDirNotWritable': L('Diretório de backup sem permissões de escrita: {{path}}', 'Backup directory is not writable: {{path}}', 'Directorio de backup sin permisos de escritura: {{path}}', 'Répertoire de sauvegarde non accessible en écriture : {{path}}', lang),
    'api.secret.encryptFailed': L('Falha ao cifrar segredo: {{detail}}', 'Failed to encrypt secret: {{detail}}', 'Error al cifrar secreto: {{detail}}', 'Échec du chiffrement du secret : {{detail}}', lang),
    'api.secret.decryptFailed': L('Falha ao decifrar segredo: {{detail}}', 'Failed to decrypt secret: {{detail}}', 'Error al descifrar secreto: {{detail}}', 'Échec du déchiffrement du secret : {{detail}}', lang),
    'api.bling.hmacFailed': L('HMAC falhou: {{detail}}', 'HMAC failed: {{detail}}', 'HMAC falló: {{detail}}', 'Échec HMAC : {{detail}}', lang),
    'api.user.photoFolderCreateFailed': L('Não foi possível criar pasta de fotos de perfil: {{detail}}', 'Could not create profile photo folder: {{detail}}', 'No se pudo crear carpeta de fotos de perfil: {{detail}}', 'Impossible de créer le dossier de photos de profil : {{detail}}', lang),
    'api.publicacao.notFound': L('Publicação não encontrada', 'Publication not found', 'Publicación no encontrada', 'Publication introuvable', lang),
    'api.perfil.notFound': L('Perfil não encontrado', 'Profile not found', 'Perfil no encontrado', 'Profil introuvable', lang),
    'api.fcuAssembly.exportPdfFailed': L('Erro ao exportar PDF: {{detail}}', 'Failed to export PDF: {{detail}}', 'Error al exportar PDF: {{detail}}', 'Échec de l’export PDF : {{detail}}', lang),
    'api.fcuAssembly.notFound': L('Assembly não encontrado: {{id}}', 'Assembly not found: {{id}}', 'Assembly no encontrado: {{id}}', 'Assembly introuvable : {{id}}', lang),
    'api.fcuAssembly.saveFailed': L('Erro ao salvar assembly: {{detail}}', 'Failed to save assembly: {{detail}}', 'Error al guardar assembly: {{detail}}', 'Échec de l’enregistrement de l’assembly : {{detail}}', lang),
    'api.fcuAssembly.loadFailed': L('Erro ao carregar assembly: {{detail}}', 'Failed to load assembly: {{detail}}', 'Error al cargar assembly: {{detail}}', 'Échec du chargement de l’assembly : {{detail}}', lang),
    'api.fcuAssembly.fileRequired': L("Arquivo 'file' não enviado", "File 'file' was not uploaded", "Archivo 'file' no enviado", "Fichier 'file' non envoyé", lang),
    'api.delegacao.fieldsRequired': L('usuarioGranteeId e funcionalidadeCodigo são obrigatórios', 'usuarioGranteeId and funcionalidadeCodigo are required', 'usuarioGranteeId y funcionalidadeCodigo son obligatorios', 'usuarioGranteeId et funcionalidadeCodigo sont obligatoires', lang),
    'api.delegacao.notFound': L('Delegação não encontrada: {{id}}', 'Delegation not found: {{id}}', 'Delegación no encontrada: {{id}}', 'Délégation introuvable : {{id}}', lang),
    'api.delegacao.granteeIdRequired': L('Query usuarioGranteeId é obrigatória', 'Query usuarioGranteeId is required', 'Query usuarioGranteeId es obligatoria', 'Le paramètre usuarioGranteeId est obligatoire', lang),
    'api.cliente.notFound': L('Cliente não encontrado: {{id}}', 'Client not found: {{id}}', 'Cliente no encontrado: {{id}}', 'Client introuvable : {{id}}', lang),
    'api.barcode.empty': L('Código de barras vazio', 'Barcode is empty', 'Código de barras vacío', 'Code-barres vide', lang),
    'api.barcode.code128ImageFailed': L('Erro ao gerar imagem do código de barras (CODE128): {{detail}}', 'Failed to generate barcode image (CODE128): {{detail}}', 'Error al generar imagen de código de barras (CODE128): {{detail}}', 'Échec de la génération de l’image code-barres (CODE128) : {{detail}}', lang),
    'api.barcode.invalid13Digits': L('Código de barras inválido: deve ter 13 dígitos', 'Invalid barcode: must have 13 digits', 'Código de barras no válido: debe tener 13 dígitos', 'Code-barres invalide : doit comporter 13 chiffres', lang),
    'api.barcode.imageFailed': L('Erro ao gerar imagem do código de barras: {{detail}}', 'Failed to generate barcode image: {{detail}}', 'Error al generar imagen del código de barras: {{detail}}', 'Échec de la génération de l’image code-barres : {{detail}}', lang),
    'api.chamada.alreadyInCall': L('Você já está em uma chamada', 'You are already in a call', 'Ya está en una llamada', 'Vous êtes déjà en appel', lang),
    'api.chamada.notFound': L('Chamada não encontrada', 'Call not found', 'Llamada no encontrada', 'Appel introuvable', lang),
    'api.chamada.cannotAnswer': L('Você não pode atender esta chamada', 'You cannot answer this call', 'No puede atender esta llamada', 'Vous ne pouvez pas répondre à cet appel', lang),
    'api.chamada.notAvailable': L('Esta chamada não está mais disponível', 'This call is no longer available', 'Esta llamada ya no está disponible', 'Cet appel n’est plus disponible', lang),
    'api.chamada.cannotReject': L('Você não pode recusar esta chamada', 'You cannot reject this call', 'No puede rechazar esta llamada', 'Vous ne pouvez pas refuser cet appel', lang),
    'api.chamada.cannotEnd': L('Você não pode encerrar esta chamada', 'You cannot end this call', 'No puede finalizar esta llamada', 'Vous ne pouvez pas terminer cet appel', lang),
    'api.chamada.iniciarFieldsRequired': L(
      'conversaId, chamadorId e receptorId são obrigatórios no corpo JSON',
      'conversaId, chamadorId and receptorId are required in the JSON body',
      'conversaId, chamadorId y receptorId son obligatorios en el cuerpo JSON',
      'conversaId, chamadorId et receptorId sont obligatoires dans le corps JSON',
      lang
    ),
    'api.chamada.receptorIdRequired': L(
      'receptorId é obrigatório no corpo JSON',
      'receptorId is required in the JSON body',
      'receptorId es obligatorio en el cuerpo JSON',
      'receptorId est obligatoire dans le corps JSON',
      lang
    ),
    'api.chamada.operationFailed': L(
      'Erro ao processar chamada: {{detail}}',
      'Failed to process call: {{detail}}',
      'Error al procesar la llamada: {{detail}}',
      'Échec du traitement de l’appel : {{detail}}',
      lang
    ),
    'api.tpFiles.listFailed': L(
      'Erro ao buscar arquivos: {{detail}}',
      'Failed to list files: {{detail}}',
      'Error al buscar archivos: {{detail}}',
      'Échec de la recherche de fichiers : {{detail}}',
      lang
    ),
    'api.tpFiles.findFailed': L(
      'Erro ao buscar arquivo: {{detail}}',
      'Failed to fetch file: {{detail}}',
      'Error al buscar archivo: {{detail}}',
      'Échec de la récupération du fichier : {{detail}}',
      lang
    ),
    'api.tpFiles.createFailed': L(
      'Erro ao criar arquivo: {{detail}}',
      'Failed to create file: {{detail}}',
      'Error al crear archivo: {{detail}}',
      'Échec de la création du fichier : {{detail}}',
      lang
    ),
    'api.tpFiles.updateFailed': L(
      'Erro ao atualizar arquivo: {{detail}}',
      'Failed to update file: {{detail}}',
      'Error al actualizar archivo: {{detail}}',
      'Échec de la mise à jour du fichier : {{detail}}',
      lang
    ),
    'api.tpFiles.inactivateFailed': L(
      'Erro ao inativar arquivo: {{detail}}',
      'Failed to deactivate file: {{detail}}',
      'Error al inactivar archivo: {{detail}}',
      'Échec de la désactivation du fichier : {{detail}}',
      lang
    ),
    'api.tpFiles.deactivateFailed': L(
      'Erro ao desativar arquivo: {{detail}}',
      'Failed to deactivate file: {{detail}}',
      'Error al desactivar archivo: {{detail}}',
      'Échec de la désactivation du fichier : {{detail}}',
      lang
    ),
    'api.tpFiles.findByTipoServicoFailed': L(
      'Erro ao buscar arquivos do tipo de serviço: {{detail}}',
      'Failed to fetch files for service type: {{detail}}',
      'Error al buscar archivos del tipo de servicio: {{detail}}',
      'Échec de la recherche de fichiers par type de service : {{detail}}',
      lang
    ),
    'api.audit.fetchHistoryFailed': L(
      'Erro ao buscar histórico: {{detail}}',
      'Failed to fetch audit history: {{detail}}',
      'Error al buscar historial: {{detail}}',
      'Échec de la récupération de l’historique : {{detail}}',
      lang
    ),
    'api.audit.fetchFailed': L(
      'Erro ao buscar auditoria: {{detail}}',
      'Failed to fetch audit records: {{detail}}',
      'Error al buscar auditoría: {{detail}}',
      'Échec de la récupération de l’audit : {{detail}}',
      lang
    ),
    'api.os.notFound': L('OS não encontrada', 'Work order not found', 'OS no encontrada', 'OS introuvable', lang),
    'api.os.notFoundById': L('OS com id {{id}} não encontrada', 'Work order with id {{id}} not found', 'OS con id {{id}} no encontrada', 'OS avec id {{id}} introuvable', lang),
    'api.os.notFoundByIdOs': L('OS com idOs {{idOs}} não encontrada', 'Work order with idOs {{idOs}} not found', 'OS con idOs {{idOs}} no encontrada', 'OS avec idOs {{idOs}} introuvable', lang),
    'api.os.listFailed': L('Erro ao listar OS: {{detail}}', 'Failed to list work orders: {{detail}}', 'Error al listar OS: {{detail}}', 'Échec de la liste des OS : {{detail}}', lang),
    'api.os.updateFailed': L(
      'Erro ao atualizar OS: {{detail}}',
      'Failed to update work order: {{detail}}',
      'Error al actualizar OS: {{detail}}',
      'Échec de la mise à jour de l’OS : {{detail}}',
      lang
    ),
    'api.os.tarefaDadoTecnico.descricaoObrigatoria': L(
      'Informe a descrição da tarefa (mín. 3 caracteres).',
      'Enter the task description (min. 3 characters).',
      'Indique la descripción de la tarea (mín. 3 caracteres).',
      'Saisissez la description de la tâche (min. 3 caractères).',
      lang
    ),
    'api.os.tarefaDadoTecnico.adObrigatorio': L(
      'Selecione uma AD/SB para o vínculo.',
      'Select an AD/SB for the link.',
      'Seleccione una AD/SB para el vínculo.',
      'Sélectionnez une AD/SB pour le lien.',
      lang
    ),
    'api.os.tarefaDadoTecnico.manualObrigatorio': L(
      'Selecione um manual técnico para o vínculo.',
      'Select a technical manual for the link.',
      'Seleccione un manual técnico para el vínculo.',
      'Sélectionnez un manuel technique pour le lien.',
      lang
    ),
    'api.os.registroEncerrado': L(
      'Esta OS está encerrada ou possui CRS emitido. Use «Reabrir OS» com justificativa antes de alterar.',
      'This work order is closed or has an issued CRS. Use «Reopen WO» with justification before editing.',
      'Esta OS está cerrada o tiene CRS emitido. Use «Reabrir OS» con justificación antes de editar.',
      'Cette OS est clôturée ou possède un CRS émis. Utilisez « Rouvrir l’OS » avec justification avant modification.',
      lang
    ),
    'api.os.reaberturaPerfilNegado': L(
      'Seu perfil não está autorizado a reabrir OS encerradas.',
      'Your role is not authorized to reopen closed work orders.',
      'Su perfil no está autorizado para reabrir OS cerradas.',
      'Votre profil n’est pas autorisé à rouvrir des OS clôturées.',
      lang
    ),
    'api.os.reaberturaJustificativaObrigatoria': L(
      'Informe uma justificativa com pelo menos 15 caracteres para reabrir a OS.',
      'Provide a justification of at least 15 characters to reopen the work order.',
      'Indique una justificación de al menos 15 caracteres para reabrir la OS.',
      'Indiquez une justification d’au moins 15 caractères pour rouvrir l’OS.',
      lang
    ),
    'api.os.reaberturaNaoNecessaria': L(
      'Esta OS não está encerrada; reabertura não é necessária.',
      'This work order is not closed; reopening is not required.',
      'Esta OS no está cerrada; no es necesario reabrirla.',
      'Cette OS n’est pas clôturée ; la réouverture n’est pas nécessaire.',
      lang
    ),
    'api.os.reaberturaSucesso': L(
      'OS reaberta com sucesso. O registro pode ser editado novamente.',
      'Work order reopened successfully. The record can be edited again.',
      'OS reabierta con éxito. El registro puede editarse de nuevo.',
      'OS rouverte avec succès. Le dossier peut être modifié à nouveau.',
      lang
    ),
    'api.os.deactivateFailed': L(
      'Erro ao inativar ordem de serviço: {{detail}}',
      'Failed to deactivate work order: {{detail}}',
      'Error al inactivar orden de servicio: {{detail}}',
      'Échec de la désactivation de l’ordre de service : {{detail}}',
      lang
    ),
    'api.os.kitFcuDeficitListFailed': L(
      'Falha ao listar déficit do kit FCU: {{detail}}',
      'Failed to list FCU kit deficit: {{detail}}',
      'Error al listar déficit del kit FCU: {{detail}}',
      'Échec de la liste du déficit du kit FCU : {{detail}}',
      lang
    ),
    'api.os.fileUploadFailed': L(
      'Erro ao fazer upload dos arquivos: {{detail}}',
      'Failed to upload files: {{detail}}',
      'Error al subir archivos: {{detail}}',
      'Échec du téléversement des fichiers : {{detail}}',
      lang
    ),
    'api.os.fileListOsFailed': L(
      'Erro ao listar arquivos da OS: {{detail}}',
      'Failed to list work order files: {{detail}}',
      'Error al listar archivos de la OS: {{detail}}',
      'Échec de la liste des fichiers OS : {{detail}}',
      lang
    ),
    'api.os.fileAssociateFailed': L(
      'Erro ao associar arquivos: {{detail}}',
      'Failed to associate files: {{detail}}',
      'Error al asociar archivos: {{detail}}',
      'Échec de l’association des fichiers : {{detail}}',
      lang
    ),
    'api.os.fileRemoveFailed': L(
      'Erro ao remover arquivo: {{detail}}',
      'Failed to remove file: {{detail}}',
      'Error al eliminar archivo: {{detail}}',
      'Échec de la suppression du fichier : {{detail}}',
      lang
    ),
    'api.os.fileProcessFailed': L(
      'Erro ao processar arquivo: {{detail}}',
      'Failed to process file: {{detail}}',
      'Error al procesar archivo: {{detail}}',
      'Échec du traitement du fichier : {{detail}}',
      lang
    ),
    'api.os.fileGetFailed': L(
      'Erro ao obter arquivo: {{detail}}',
      'Failed to fetch file: {{detail}}',
      'Error al obtener archivo: {{detail}}',
      'Échec de la récupération du fichier : {{detail}}',
      lang
    ),
    'api.os.fileListDiversosFailed': L(
      'Erro ao listar arquivos diversos: {{detail}}',
      'Failed to list misc files: {{detail}}',
      'Error al listar archivos varios: {{detail}}',
      'Échec de la liste des fichiers divers : {{detail}}',
      lang
    ),
    'api.os.filePhysicalNotFound': L(
      'Arquivo físico não encontrado',
      'Physical file not found',
      'Archivo físico no encontrado',
      'Fichier physique introuvable',
      lang
    ),
    'api.os.fileNoFilesSent': L(
      'Nenhum arquivo enviado',
      'No files uploaded',
      'Ningún archivo enviado',
      'Aucun fichier envoyé',
      lang
    ),
    'api.os.fileEmptyList': L(
      'Lista de arquivos vazia',
      'Empty file list',
      'Lista de archivos vacía',
      'Liste de fichiers vide',
      lang
    ),
    'api.os.fileUploadSuccess': L(
      'Arquivos enviados com sucesso',
      'Files uploaded successfully',
      'Archivos enviados con éxito',
      'Fichiers envoyés avec succès',
      lang
    ),
    'api.os.fileAssociateSuccess': L(
      'Arquivos associados com sucesso',
      'Files associated successfully',
      'Archivos asociados con éxito',
      'Fichiers associés avec succès',
      lang
    ),
    'api.os.fileUploadDiversosSuccess': L(
      'Arquivos enviados com sucesso para diversos',
      'Files uploaded successfully to misc folder',
      'Archivos enviados con éxito a varios',
      'Fichiers envoyés avec succès dans divers',
      lang
    ),
    'api.os.fileUploadOsDiversosSuccess': L(
      'Arquivos enviados com sucesso para OS {{osId}}/diversos',
      'Files uploaded successfully to work order {{osId}}/misc',
      'Archivos enviados con éxito a OS {{osId}}/varios',
      'Fichiers envoyés avec succès pour l’OS {{osId}}/divers',
      lang
    ),
    'api.user.associateProfileFailed': L(
      'Erro ao associar perfil: {{detail}}',
      'Failed to assign profile: {{detail}}',
      'Error al asociar perfil: {{detail}}',
      'Échec de l’association du profil : {{detail}}',
      lang
    ),
    'api.user.deleteFailed': L(
      'Erro ao excluir usuário: {{detail}}',
      'Failed to delete user: {{detail}}',
      'Error al eliminar usuario: {{detail}}',
      'Échec de la suppression de l’utilisateur : {{detail}}',
      lang
    ),
    'api.logo.loadFailed': L(
      'Erro ao carregar logo: {{detail}}',
      'Failed to load logo: {{detail}}',
      'Error al cargar logo: {{detail}}',
      'Échec du chargement du logo : {{detail}}',
      lang
    ),
    'api.proposta.printHtmlFailed': L(
      'Erro ao gerar HTML para impressão: {{detail}}',
      'Failed to generate print HTML: {{detail}}',
      'Error al generar HTML para impresión: {{detail}}',
      'Échec de la génération du HTML d’impression : {{detail}}',
      lang
    ),
    'api.fcu.updateFailed': L(
      'Erro ao atualizar FCU: {{detail}}',
      'Failed to update FCU: {{detail}}',
      'Error al actualizar FCU: {{detail}}',
      'Échec de la mise à jour du FCU : {{detail}}',
      lang
    ),
    'api.fcu.updateInternalFailed': L(
      'Erro interno ao atualizar FCU: {{detail}}',
      'Internal error updating FCU: {{detail}}',
      'Error interno al actualizar FCU: {{detail}}',
      'Erreur interne lors de la mise à jour du FCU : {{detail}}',
      lang
    ),
    'api.associacaoFcu.fetchProductsFailed': L(
      'Erro ao buscar produtos: {{detail}}',
      'Failed to fetch products: {{detail}}',
      'Error al buscar productos: {{detail}}',
      'Échec de la recherche de produits : {{detail}}',
      lang
    ),
    'api.cliente.notFoundGeneric': L(
      'Cliente não encontrado',
      'Client not found',
      'Cliente no encontrado',
      'Client introuvable',
      lang
    ),
    'api.cliente.createFailed': L(
      'Erro ao criar cliente: {{detail}}',
      'Failed to create client: {{detail}}',
      'Error al crear cliente: {{detail}}',
      'Échec de la création du client : {{detail}}',
      lang
    ),
    'api.manual.invalidFilename': L(
      'Nome de arquivo inválido',
      'Invalid filename',
      'Nombre de archivo no válido',
      'Nom de fichier invalide',
      lang
    ),
    'api.manual.notFound': L(
      'Arquivo não encontrado: {{filename}}',
      'File not found: {{filename}}',
      'Archivo no encontrado: {{filename}}',
      'Fichier introuvable : {{filename}}',
      lang
    ),
    'api.manual.readFailed': L(
      'Erro ao ler manual: {{detail}}',
      'Failed to read manual: {{detail}}',
      'Error al leer manual: {{detail}}',
      'Échec de la lecture du manuel : {{detail}}',
      lang
    ),
    'api.estoque.minBatchLineRequired': L(
      'Envie ao menos uma linha com partNumber',
      'Send at least one row with partNumber',
      'Envíe al menos una fila con partNumber',
      'Envoyez au moins une ligne avec partNumber',
      lang
    ),
    'api.estoque.itemNotFound': L(
      'Item não encontrado',
      'Item not found',
      'Ítem no encontrado',
      'Article introuvable',
      lang
    ),
    'api.estoque.itemNotFoundByCode': L(
      'Item não encontrado: {{codigo}}',
      'Item not found: {{codigo}}',
      'Ítem no encontrado: {{codigo}}',
      'Article introuvable : {{codigo}}',
      lang
    ),
    'api.estoque.noItemsByPartNumber': L(
      'Nenhum item encontrado: {{partNumber}}',
      'No items found: {{partNumber}}',
      'Ningún ítem encontrado: {{partNumber}}',
      'Aucun article trouvé : {{partNumber}}',
      lang
    ),
    'api.estoque.qrUrlResolveFailed': L(
      'Falha ao resolver URL do QR: {{detail}}',
      'Failed to resolve QR URL: {{detail}}',
      'Error al resolver URL del QR: {{detail}}',
      'Échec de la résolution de l’URL QR : {{detail}}',
      lang
    ),
    'api.estoque.publicQueryFailed': L(
      'Falha ao consultar item: {{detail}}',
      'Failed to query item: {{detail}}',
      'Error al consultar ítem: {{detail}}',
      'Échec de la consultation de l’article : {{detail}}',
      lang
    ),
    'api.billing.stripeSignatureRequired': L(
      'Cabeçalho Stripe-Signature obrigatório',
      'Stripe-Signature header is required',
      'Cabecera Stripe-Signature obligatoria',
      'En-tête Stripe-Signature obligatoire',
      lang
    ),
    'api.oauth.smtpUnexpectedResponse': L(
      'Resposta SMTP inesperada: {{detail}}',
      'Unexpected SMTP response: {{detail}}',
      'Respuesta SMTP inesperada: {{detail}}',
      'Réponse SMTP inattendue : {{detail}}',
      lang
    ),

    'api.auth.passwordChanged': L(
      'Senha alterada com sucesso!',
      'Password changed successfully!',
      'Contraseña cambiada con éxito.',
      'Mot de passe modifié avec succès !',
      lang
    ),
    'api.auth.passwordResetSuccess': L(
      'Senha redefinida com sucesso!',
      'Password reset successfully!',
      'Contraseña restablecida con éxito.',
      'Mot de passe réinitialisé avec succès !',
      lang
    ),
    'api.auth.currentPasswordValid': L(
      'Senha atual válida',
      'Current password is valid',
      'Contraseña actual válida',
      'Mot de passe actuel valide',
      lang
    ),
    'api.auth.passwordRequired': L(
      'Senha é obrigatória',
      'Password is required',
      'La contraseña es obligatoria',
      'Le mot de passe est obligatoire',
      lang
    ),

    'api.externo.userDeactivated': L(
      'Usuário externo inativado com sucesso',
      'External user deactivated successfully',
      'Usuario externo desactivado con éxito',
      'Utilisateur externe désactivé avec succès',
      lang
    ),
    'api.externo.userActivated': L(
      'Usuário externo ativado com sucesso',
      'External user activated successfully',
      'Usuario externo activado con éxito',
      'Utilisateur externe activé avec succès',
      lang
    ),
    'api.externo.funcionalidadesUpdated': L(
      'Funcionalidades atualizadas com sucesso',
      'Permissions updated successfully',
      'Funcionalidades actualizadas con éxito',
      'Fonctionnalités mises à jour avec succès',
      lang
    ),
    'api.externo.osAccessGranted': L(
      'Acesso à OS concedido com sucesso',
      'Work order access granted successfully',
      'Acceso a la OS concedido con éxito',
      'Accès à l’OS accordé avec succès',
      lang
    ),
    'api.externo.osAccessRevoked': L(
      'Acesso à OS revogado com sucesso',
      'Work order access revoked successfully',
      'Acceso a la OS revocado con éxito',
      'Accès à l’OS révoqué avec succès',
      lang
    ),
    'api.externo.osAccessRevokedComplete': L(
      'Acesso à OS e documentos revogados com sucesso',
      'Work order and document access revoked successfully',
      'Acceso a la OS y documentos revocado con éxito',
      'Accès à l’OS et aux documents révoqué avec succès',
      lang
    ),
    'api.externo.documentAccessGranted': L(
      'Acesso ao documento concedido com sucesso',
      'Document access granted successfully',
      'Acceso al documento concedido con éxito',
      'Accès au document accordé avec succès',
      lang
    ),
    'api.externo.documentAccessRevoked': L(
      'Acesso ao documento revogado com sucesso',
      'Document access revoked successfully',
      'Acceso al documento revocado con éxito',
      'Accès au document révoqué avec succès',
      lang
    ),
    'api.externo.printFailed': L(
      'Erro ao gerar impressão: {{detail}}',
      'Failed to generate print view: {{detail}}',
      'Error al generar impresión: {{detail}}',
      'Échec de la génération de l’impression : {{detail}}',
      lang
    ),

    'api.update.installerUnavailable': L(
      'Serviço de instalação indisponível. Não é possível executar atualização.',
      'Install service unavailable. Cannot run update.',
      'Servicio de instalación no disponible. No se puede ejecutar la actualización.',
      'Service d’installation indisponible. Impossible d’exécuter la mise à jour.',
      lang
    ),
    'api.update.installDisabled': L(
      'Instalação de atualizações desabilitada. Configure update.install.enabled=true.',
      'Update installation is disabled. Set update.install.enabled=true.',
      'Instalación de actualizaciones deshabilitada. Configure update.install.enabled=true.',
      'Installation des mises à jour désactivée. Configurez update.install.enabled=true.',
      lang
    ),
    'api.update.installFailed': L(
      'Falha ao instalar atualização',
      'Failed to install update',
      'Error al instalar la actualización',
      'Échec de l’installation de la mise à jour',
      lang
    ),
    'api.update.executeFailed': L(
      'Erro ao executar atualização: {{detail}}',
      'Failed to run update: {{detail}}',
      'Error al ejecutar la actualización: {{detail}}',
      'Échec de l’exécution de la mise à jour : {{detail}}',
      lang
    ),
    'api.update.zipNotFound': L(
      'Falha ao baixar arquivo de atualização. Nenhum arquivo ZIP foi encontrado.',
      'Failed to download update. No ZIP file was found.',
      'Error al descargar la actualización. No se encontró ningún archivo ZIP.',
      'Échec du téléchargement. Aucun fichier ZIP trouvé.',
      lang
    ),
    'api.update.downloadError': L(
      'Erro ao baixar atualização: {{detail}}',
      'Failed to download update: {{detail}}',
      'Error al descargar actualización: {{detail}}',
      'Échec du téléchargement de la mise à jour : {{detail}}',
      lang
    ),

    'api.funcionalidade.listFailed': L(
      'Erro ao listar funcionalidades: {{detail}}',
      'Failed to list features: {{detail}}',
      'Error al listar funcionalidades: {{detail}}',
      'Échec de la liste des fonctionnalités : {{detail}}',
      lang
    ),
    'api.funcionalidade.notFound': L(
      'Funcionalidade não encontrada',
      'Feature not found',
      'Funcionalidad no encontrada',
      'Fonctionnalité introuvable',
      lang
    ),
    'api.funcionalidade.fetchFailed': L(
      'Erro ao buscar funcionalidade: {{detail}}',
      'Failed to fetch feature: {{detail}}',
      'Error al buscar funcionalidad: {{detail}}',
      'Échec de la récupération de la fonctionnalité : {{detail}}',
      lang
    ),
    'api.funcionalidade.createFailed': L(
      'Erro ao criar funcionalidade: {{detail}}',
      'Failed to create feature: {{detail}}',
      'Error al crear funcionalidad: {{detail}}',
      'Échec de la création de la fonctionnalité : {{detail}}',
      lang
    ),
    'api.funcionalidade.updateFailed': L(
      'Erro ao atualizar funcionalidade: {{detail}}',
      'Failed to update feature: {{detail}}',
      'Error al actualizar funcionalidad: {{detail}}',
      'Échec de la mise à jour de la fonctionnalité : {{detail}}',
      lang
    ),
    'api.funcionalidade.deactivateFailed': L(
      'Erro ao inativar funcionalidade: {{detail}}',
      'Failed to deactivate feature: {{detail}}',
      'Error al desactivar funcionalidad: {{detail}}',
      'Échec de la désactivation de la fonctionnalité : {{detail}}',
      lang
    ),
    'api.funcionalidade.deactivated': L(
      'Funcionalidade inativada com sucesso',
      'Feature deactivated successfully',
      'Funcionalidad desactivada con éxito',
      'Fonctionnalité désactivée avec succès',
      lang
    ),
    'api.funcionalidade.listByProfileFailed': L(
      'Erro ao listar funcionalidades do perfil: {{detail}}',
      'Failed to list profile features: {{detail}}',
      'Error al listar funcionalidades del perfil: {{detail}}',
      'Échec de la liste des fonctionnalités du profil : {{detail}}',
      lang
    ),
    'api.funcionalidade.listBySectionFailed': L(
      'Erro ao listar funcionalidades da seção: {{detail}}',
      'Failed to list section features: {{detail}}',
      'Error al listar funcionalidades de la sección: {{detail}}',
      'Échec de la liste des fonctionnalités de la section : {{detail}}',
      lang
    ),
    'api.funcionalidade.menuBuildFailed': L(
      'Erro ao montar menu: {{detail}}',
      'Failed to build menu: {{detail}}',
      'Error al montar el menú: {{detail}}',
      'Échec de la construction du menu : {{detail}}',
      lang
    ),
    'api.funcionalidade.listMenuFailed': L(
      'Erro ao listar funcionalidades para menu: {{detail}}',
      'Failed to list menu features: {{detail}}',
      'Error al listar funcionalidades para menú: {{detail}}',
      'Échec de la liste des fonctionnalités du menu : {{detail}}',
      lang
    ),
    'api.funcionalidade.listByUserFailed': L(
      'Erro ao listar funcionalidades do usuário: {{detail}}',
      'Failed to list user features: {{detail}}',
      'Error al listar funcionalidades del usuario: {{detail}}',
      'Échec de la liste des fonctionnalités de l’utilisateur : {{detail}}',
      lang
    ),

    'api.perfil.listFailed': L(
      'Erro ao listar perfis: {{detail}}',
      'Failed to list profiles: {{detail}}',
      'Error al listar perfiles: {{detail}}',
      'Échec de la liste des profils : {{detail}}',
      lang
    ),
    'api.perfil.fetchFailed': L(
      'Erro ao buscar perfil: {{detail}}',
      'Failed to fetch profile: {{detail}}',
      'Error al buscar perfil: {{detail}}',
      'Échec de la récupération du profil : {{detail}}',
      lang
    ),
    'api.perfil.createFailed': L(
      'Erro ao criar perfil: {{detail}}',
      'Failed to create profile: {{detail}}',
      'Error al crear perfil: {{detail}}',
      'Échec de la création du profil : {{detail}}',
      lang
    ),
    'api.perfil.updateFailed': L(
      'Erro ao atualizar perfil: {{detail}}',
      'Failed to update profile: {{detail}}',
      'Error al actualizar perfil: {{detail}}',
      'Échec de la mise à jour du profil : {{detail}}',
      lang
    ),
    'api.perfil.deactivateFailed': L(
      'Erro ao inativar perfil: {{detail}}',
      'Failed to deactivate profile: {{detail}}',
      'Error al desactivar perfil: {{detail}}',
      'Échec de la désactivation du profil : {{detail}}',
      lang
    ),
    'api.perfil.deactivated': L(
      'Perfil inativado com sucesso',
      'Profile deactivated successfully',
      'Perfil desactivado con éxito',
      'Profil désactivé avec succès',
      lang
    ),
    'api.perfil.assignFuncionalidadesFailed': L(
      'Erro ao atribuir funcionalidades: {{detail}}',
      'Failed to assign features: {{detail}}',
      'Error al asignar funcionalidades: {{detail}}',
      'Échec de l’attribution des fonctionnalités : {{detail}}',
      lang
    ),
    'api.perfil.listFuncionalidadesFailed': L(
      'Erro ao listar funcionalidades do perfil: {{detail}}',
      'Failed to list profile features: {{detail}}',
      'Error al listar funcionalidades del perfil: {{detail}}',
      'Échec de la liste des fonctionnalités du profil : {{detail}}',
      lang
    ),

    'api.publicacao.createFailed': L(
      'Erro ao criar publicação: {{detail}}',
      'Failed to create publication: {{detail}}',
      'Error al crear publicación: {{detail}}',
      'Échec de la création de la publication : {{detail}}',
      lang
    ),
    'api.publicacao.updateFailed': L(
      'Erro ao atualizar publicação: {{detail}}',
      'Failed to update publication: {{detail}}',
      'Error al actualizar publicación: {{detail}}',
      'Échec de la mise à jour de la publication : {{detail}}',
      lang
    ),
    'api.publicacao.deleteFailed': L(
      'Erro ao excluir publicação: {{detail}}',
      'Failed to delete publication: {{detail}}',
      'Error al eliminar publicación: {{detail}}',
      'Échec de la suppression de la publication : {{detail}}',
      lang
    ),
    'api.publicacao.fetchFcuFailed': L(
      'Erro ao buscar publicação do FCU: {{detail}}',
      'Failed to fetch FCU publication: {{detail}}',
      'Error al buscar publicación del FCU: {{detail}}',
      'Échec de la récupération de la publication FCU : {{detail}}',
      lang
    ),
    'api.publicacao.fetchFcusFailed': L(
      'Erro ao buscar FCUs: {{detail}}',
      'Failed to fetch FCUs: {{detail}}',
      'Error al buscar FCUs: {{detail}}',
      'Échec de la récupération des FCU : {{detail}}',
      lang
    ),
    'api.publicacao.fetchPublicacoesFailed': L(
      'Erro ao buscar publicações: {{detail}}',
      'Failed to fetch publications: {{detail}}',
      'Error al buscar publicaciones: {{detail}}',
      'Échec de la récupération des publications : {{detail}}',
      lang
    ),
    'api.publicacao.createAssociationFailed': L(
      'Erro ao criar associação: {{detail}}',
      'Failed to create association: {{detail}}',
      'Error al crear asociación: {{detail}}',
      'Échec de la création de l’association : {{detail}}',
      lang
    ),
    'api.publicacao.associateFcusFailed': L(
      'Erro ao associar FCUs: {{detail}}',
      'Failed to associate FCUs: {{detail}}',
      'Error al asociar FCUs: {{detail}}',
      'Échec de l’association des FCU : {{detail}}',
      lang
    ),

    'api.bling.fiscalUsingDefaults': L(
      'Usando padrões — configure CFOP, série e certificado conforme sua operação',
      'Using defaults — configure CFOP, series and certificate for your operation',
      'Usando valores predeterminados — configure CFOP, serie y certificado según su operación',
      'Valeurs par défaut — configurez CFOP, série et certificat selon votre activité',
      lang
    ),
    'api.bling.fiscalSaved': L(
      'Configuração fiscal salva',
      'Fiscal configuration saved',
      'Configuración fiscal guardada',
      'Configuration fiscale enregistrée',
      lang
    ),
    'api.bling.fiscalCertStored': L(
      'Certificado {{tipo}} armazenado com segurança. Para emissão via Bling, instale o mesmo certificado no painel Bling (Preferências > Certificado digital).',
      'Certificate {{tipo}} stored securely. For Bling issuance, install the same certificate in the Bling panel (Settings > Digital certificate).',
      'Certificado {{tipo}} almacenado con seguridad. Para emisión vía Bling, instale el mismo certificado en el panel Bling (Preferencias > Certificado digital).',
      'Certificat {{tipo}} stocké en sécurité. Pour l’émission via Bling, installez le même certificat dans le panneau Bling (Préférences > Certificat numérique).',
      lang
    ),
    'api.bling.fiscalCertRemoved': L(
      'Certificado removido desta empresa',
      'Certificate removed from this company',
      'Certificado eliminado de esta empresa',
      'Certificat supprimé de cette entreprise',
      lang
    ),
    'api.bling.statusPlatformDisabled': L(
      'Integração Bling desativada na plataforma (AERO_SUITE_BLING_ENABLED=false)',
      'Bling integration disabled on the platform (AERO_SUITE_BLING_ENABLED=false)',
      'Integración Bling desactivada en la plataforma (AERO_SUITE_BLING_ENABLED=false)',
      'Intégration Bling désactivée sur la plateforme (AERO_SUITE_BLING_ENABLED=false)',
      lang
    ),
    'api.bling.statusAccountConnected': L(
      'Conta Bling conectada',
      'Bling account connected',
      'Cuenta Bling conectada',
      'Compte Bling connecté',
      lang
    ),
    'api.bling.statusLegacyToken': L(
      'Token legado global configurado (migrar para OAuth por empresa)',
      'Global legacy token configured (migrate to OAuth per company)',
      'Token legado global configurado (migrar a OAuth por empresa)',
      'Jeton legacy global configuré (migrer vers OAuth par entreprise)',
      lang
    ),
    'api.bling.statusOauthNotConfigured': L(
      'OAuth Bling não configurado (AERO_SUITE_BLING_CLIENT_ID / CLIENT_SECRET / REDIRECT_URI)',
      'Bling OAuth not configured (AERO_SUITE_BLING_CLIENT_ID / CLIENT_SECRET / REDIRECT_URI)',
      'OAuth Bling no configurado (AERO_SUITE_BLING_CLIENT_ID / CLIENT_SECRET / REDIRECT_URI)',
      'OAuth Bling non configuré (AERO_SUITE_BLING_CLIENT_ID / CLIENT_SECRET / REDIRECT_URI)',
      lang
    ),
    'api.bling.statusNoAccount': L(
      'Nenhuma conta Bling conectada para esta empresa',
      'No Bling account connected for this company',
      'Ninguna cuenta Bling conectada para esta empresa',
      'Aucun compte Bling connecté pour cette entreprise',
      lang
    ),
    'api.bling.readinessReady': L(
      'Integração pronta para NF-e automática.',
      'Integration ready for automatic invoicing.',
      'Integración lista para factura automática.',
      'Intégration prête pour la facturation automatique.',
      lang
    ),
    'api.bling.readinessNotConnected': L('Conta Bling não conectada.', 'Bling account not connected.', 'Cuenta Bling no conectada.', 'Compte Bling non connecté.', lang),
    'api.bling.readinessReconnectOauth': L('Reconecte OAuth na central Bling.', 'Reconnect OAuth in the Bling hub.', 'Reconecte OAuth en el centro Bling.', 'Reconnectez OAuth dans le hub Bling.', lang),
    'api.bling.readinessUploadCert': L('Envie o certificado .pfx na configuração fiscal.', 'Upload the .pfx certificate in fiscal settings.', 'Envíe el certificado .pfx en la configuración fiscal.', 'Téléversez le certificat .pfx dans la config fiscale.', lang),
    'api.bling.readinessCertMissing': L('Certificado não configurado.', 'Certificate not configured.', 'Certificado no configurado.', 'Certificat non configuré.', lang),
    'api.bling.readinessFillCfop': L('Preencha o CFOP padrão.', 'Fill in the default CFOP.', 'Complete el CFOP predeterminado.', 'Renseignez le CFOP par défaut.', lang),
    'api.bling.readinessCfopMissing': L('CFOP ausente.', 'CFOP missing.', 'CFOP ausente.', 'CFOP manquant.', lang),
    'api.bling.readinessFillNcm': L('Preencha o NCM padrão.', 'Fill in the default NCM.', 'Complete el NCM predeterminado.', 'Renseignez le NCM par défaut.', lang),
    'api.bling.readinessNcmMissing': L('NCM ausente.', 'NCM missing.', 'NCM ausente.', 'NCM manquant.', lang),
    'api.bling.readinessScopeFix': L(
      'Ative «{{permission}}» no app Bling e reconecte a conta.',
      'Enable «{{permission}}» in the Bling app and reconnect the account.',
      'Active «{{permission}}» en la app Bling y reconecte la cuenta.',
      'Activez «{{permission}}» dans l’app Bling et reconnectez le compte.',
      lang
    ),
    'api.bling.readinessScopeReconnect': L(
      'Reconecte OAuth após alterar escopos no app Bling.',
      'Reconnect OAuth after changing scopes in the Bling app.',
      'Reconecte OAuth tras cambiar alcances en la app Bling.',
      'Reconnectez OAuth après modification des scopes dans l’app Bling.',
      lang
    ),
    'api.bling.readinessTokenRevoked': L('Token OAuth revogado — reconecte a conta Bling.', 'OAuth token revoked — reconnect the Bling account.', 'Token OAuth revocado — reconecte la cuenta Bling.', 'Jeton OAuth révoqué — reconnectez le compte Bling.', lang),
    'api.bling.readinessScopeForbidden': L('Permissão ausente na Bling.', 'Permission missing in Bling.', 'Permiso ausente en Bling.', 'Autorisation manquante dans Bling.', lang),
    'api.bling.integrationDisabled': L(
      'Integração Bling desativada (AERO_SUITE_BLING_ENABLED=false)',
      'Bling integration disabled (AERO_SUITE_BLING_ENABLED=false)',
      'Integración Bling desactivada (AERO_SUITE_BLING_ENABLED=false)',
      'Intégration Bling désactivée (AERO_SUITE_BLING_ENABLED=false)',
      lang
    ),
    'api.bling.jobRequeued': L(
      'Job reenfileirado para processamento',
      'Job requeued for processing',
      'Job reencolado para procesamiento',
      'Job remis en file pour traitement',
      lang
    ),
    'api.bling.jobRemoved': L(
      'Job removido',
      'Job removed',
      'Job eliminado',
      'Job supprimé',
      lang
    ),
    'api.bling.jobNoneDead': L(
      'Nenhum job morto para reprocessar',
      'No dead jobs to reprocess',
      'Ningún job muerto para reprocesar',
      'Aucun job mort à retraiter',
      lang
    ),
    'api.bling.jobsRequeued': L(
      'Jobs reenfileirados',
      'Jobs requeued',
      'Jobs reencolados',
      'Jobs remis en file',
      lang
    ),
    'api.bling.jobNoneDeadToRemove': L(
      'Nenhum job morto para remover',
      'No dead jobs to remove',
      'Ningún job muerto para eliminar',
      'Aucun job mort à supprimer',
      lang
    ),
    'api.bling.jobsRemoved': L(
      'Jobs removidos',
      'Jobs removed',
      'Jobs eliminados',
      'Jobs supprimés',
      lang
    ),
    'api.bling.syncJobNotFound': L(
      'Job de sincronização Bling não encontrado',
      'Bling sync job not found',
      'Job de sincronización Bling no encontrado',
      'Job de synchronisation Bling introuvable',
      lang
    ),
    'api.bling.bootstrapComplete': L(
      'Bootstrap de homologação concluído — use o cliente importado em uma proposta APROVADA',
      'Homologation bootstrap completed — use the imported customer in an APPROVED proposal',
      'Bootstrap de homologación completado — use el cliente importado en una propuesta APROBADA',
      'Bootstrap d’homologation terminé — utilisez le client importé dans une proposition APPROUVÉE',
      lang
    ),
    'api.bling.bootstrapFailed': L(
      'Bootstrap falhou: {{detail}}',
      'Bootstrap failed: {{detail}}',
      'Bootstrap falló: {{detail}}',
      'Échec du bootstrap : {{detail}}',
      lang
    ),
    'api.bling.scopeEndpointUnavailable': L(
      'Endpoint indisponível nesta conta — OK para homologação',
      'Endpoint unavailable on this account — OK for homologation',
      'Endpoint no disponible en esta cuenta — OK para homologación',
      'Endpoint indisponible sur ce compte — OK pour homologation',
      lang
    ),
    'api.bling.scopeAllOk': L(
      'Todos os recursos necessários respondem OK na API Bling',
      'All required resources respond OK on the Bling API',
      'Todos los recursos necesarios responden OK en la API Bling',
      'Toutes les ressources requises répondent OK sur l’API Bling',
      lang
    ),
    'api.bling.scopePartialDenied': L(
      '{{count}} recurso(s) sem permissão (HTTP 403) — ajuste escopos no app Bling e reconecte OAuth',
      '{{count}} resource(s) without permission (HTTP 403) — adjust scopes in the Bling app and reconnect OAuth',
      '{{count}} recurso(s) sin permiso (HTTP 403) — ajuste alcances en la app Bling y reconecte OAuth',
      '{{count}} ressource(s) sans permission (HTTP 403) — ajustez les scopes dans l’app Bling et reconnectez OAuth',
      lang
    ),
    'api.bling.scopeInsufficient': L(
      'Sem permissão (insufficient_scope) — habilite: {{permission}}',
      'Insufficient permission (insufficient_scope) — enable: {{permission}}',
      'Sin permiso (insufficient_scope) — habilite: {{permission}}',
      'Permission insuffisante (insufficient_scope) — activez : {{permission}}',
      lang
    ),
    'api.bling.scopeRateLimit': L(
      'Rate limit (429) — escopo provavelmente OK; tente novamente em instantes',
      'Rate limit (429) — scope probably OK; try again shortly',
      'Rate limit (429) — alcance probablemente OK; intente de nuevo en instantes',
      'Rate limit (429) — scope probablement OK ; réessayez dans un instant',
      lang
    ),
    'api.bling.contactsNotFound': L(
      'Nenhum contato encontrado',
      'No contacts found',
      'Ningún contacto encontrado',
      'Aucun contact trouvé',
      lang
    ),
    'api.bling.contactImported': L(
      'Cliente criado e vinculado ao Bling',
      'Customer created and linked to Bling',
      'Cliente creado y vinculado a Bling',
      'Client créé et lié à Bling',
      lang
    ),
    'api.bling.contactUpdated': L(
      'Cliente atualizado e vinculado ao Bling',
      'Customer updated and linked to Bling',
      'Cliente actualizado y vinculado a Bling',
      'Client mis à jour et lié à Bling',
      lang
    ),
    'api.bling.scopeCheckOk': L('OK', 'OK', 'OK', 'OK', lang),
    'api.bling.scopeReconnectHint': L(
      'Após alterar escopos no app Bling, desconecte e reconecte OAuth em Configurações > Integração Bling.',
      'After changing scopes in the Bling app, disconnect and reconnect OAuth under Settings > Bling Integration.',
      'Tras cambiar alcances en la app Bling, desconecte y reconecte OAuth en Configuración > Integración Bling.',
      'Après avoir modifié les scopes dans l’app Bling, déconnectez et reconnectez OAuth dans Paramètres > Intégration Bling.',
      lang
    ),
    'api.whatsapp.notEnabled': L(
      'WhatsApp API não está habilitada. Configure whatsapp.api.enabled=true',
      'WhatsApp API is not enabled. Set whatsapp.api.enabled=true',
      'La API de WhatsApp no está habilitada. Configure whatsapp.api.enabled=true',
      'L’API WhatsApp n’est pas activée. Configurez whatsapp.api.enabled=true',
      lang
    ),
    'api.whatsapp.urlNotConfigured': L(
      'URL da WhatsApp API não configurada. Configure whatsapp.api.url',
      'WhatsApp API URL not configured. Set whatsapp.api.url',
      'URL de la API WhatsApp no configurada. Configure whatsapp.api.url',
      'URL de l’API WhatsApp non configurée. Configurez whatsapp.api.url',
      lang
    ),
    'api.whatsapp.tokenNotConfigured': L(
      'Token da WhatsApp API não configurado. Configure whatsapp.api.token',
      'WhatsApp API token not configured. Set whatsapp.api.token',
      'Token de la API WhatsApp no configurado. Configure whatsapp.api.token',
      'Jeton API WhatsApp non configuré. Configurez whatsapp.api.token',
      lang
    ),
    'api.whatsapp.unsupportedProvider': L(
      'Provedor WhatsApp não suportado: {{provider}}',
      'Unsupported WhatsApp provider: {{provider}}',
      'Proveedor WhatsApp no soportado: {{provider}}',
      'Fournisseur WhatsApp non pris en charge : {{provider}}',
      lang
    ),
    'api.whatsapp.sendFailedDefault': L(
      'Falha ao enviar mensagem via WhatsApp API',
      'Failed to send message via WhatsApp API',
      'Error al enviar mensaje por WhatsApp API',
      'Échec de l’envoi du message via l’API WhatsApp',
      lang
    ),
    'api.whatsapp.apiUnavailable': L(
      'API não disponível ou falhou',
      'API unavailable or failed',
      'API no disponible o falló',
      'API indisponible ou en échec',
      lang
    ),
    'api.whatsapp.evolutionConnectError': L(
      'Erro de conexão com Evolution API em {{url}}: {{detail}}',
      'Connection error with Evolution API at {{url}}: {{detail}}',
      'Error de conexión con Evolution API en {{url}}: {{detail}}',
      'Erreur de connexion à l’API Evolution sur {{url}} : {{detail}}',
      lang
    ),
    'api.whatsapp.evolutionTimeout': L(
      'Timeout ao conectar com Evolution API. Verifique a URL e se a API está acessível.',
      'Timeout connecting to Evolution API. Check the URL and that the API is reachable.',
      'Tiempo de espera al conectar con Evolution API. Verifique la URL y que la API esté accesible.',
      'Délai dépassé lors de la connexion à l’API Evolution. Vérifiez l’URL et l’accessibilité de l’API.',
      lang
    ),
    'api.whatsapp.evolutionSendFailed': L(
      'Erro ao enviar via Evolution API: {{detail}}',
      'Failed to send via Evolution API: {{detail}}',
      'Error al enviar por Evolution API: {{detail}}',
      'Échec de l’envoi via Evolution API : {{detail}}',
      lang
    ),
    'api.whatsapp.twilioSendFailed': L(
      'Erro ao enviar via Twilio: {{detail}}',
      'Failed to send via Twilio: {{detail}}',
      'Error al enviar por Twilio: {{detail}}',
      'Échec de l’envoi via Twilio : {{detail}}',
      lang
    ),
    'api.evolution.platformDisabled': L(
      'Integração Evolution API desabilitada na plataforma.',
      'Evolution API integration is disabled on the platform.',
      'Integración Evolution API deshabilitada en la plataforma.',
      'Intégration Evolution API désactivée sur la plateforme.',
      lang
    ),
    'api.evolution.platformNotConfigured': L(
      'Evolution API não configurada (URL ou chave administrativa).',
      'Evolution API not configured (URL or admin API key).',
      'Evolution API no configurada (URL o clave administrativa).',
      'Evolution API non configurée (URL ou clé admin).',
      lang
    ),
    'api.evolution.statusConnected': L(
      'WhatsApp conectado.',
      'WhatsApp connected.',
      'WhatsApp conectado.',
      'WhatsApp connecté.',
      lang
    ),
    'api.evolution.statusNotConnected': L(
      'WhatsApp não conectado. Escaneie o QR Code nas configurações.',
      'WhatsApp not connected. Scan the QR code in settings.',
      'WhatsApp no conectado. Escanee el código QR en configuración.',
      'WhatsApp non connecté. Scannez le QR code dans les paramètres.',
      lang
    ),
    'api.evolution.statusNotActivated': L(
      'Módulo WhatsApp não ativado para esta oficina.',
      'WhatsApp module not activated for this shop.',
      'Módulo WhatsApp no activado para este taller.',
      'Module WhatsApp non activé pour cet atelier.',
      lang
    ),
    'api.evolution.tenantNotConfigured': L(
      'WhatsApp não configurado para esta oficina.',
      'WhatsApp not configured for this shop.',
      'WhatsApp no configurado para este taller.',
      'WhatsApp non configuré pour cet atelier.',
      lang
    ),
    'api.evolution.tokenUnavailable': L(
      'Token da instância WhatsApp indisponível.',
      'WhatsApp instance token unavailable.',
      'Token de instancia WhatsApp no disponible.',
      'Jeton d’instance WhatsApp indisponible.',
      lang
    ),
    'api.evolution.instanceDisconnected': L(
      'Instância WhatsApp desconectada. Reconecte nas configurações.',
      'WhatsApp instance disconnected. Reconnect in settings.',
      'Instancia WhatsApp desconectada. Reconecte en configuración.',
      'Instance WhatsApp déconnectée. Reconnectez dans les paramètres.',
      lang
    ),
    'api.evolution.mediaRequired': L(
      'Informe URL pública ou conteúdo do arquivo para envio.',
      'Provide a public URL or file content for sending.',
      'Indique URL pública o contenido del archivo para el envío.',
      'Indiquez une URL publique ou le contenu du fichier pour l’envoi.',
      lang
    ),
    'api.evolution.enqueueFailed': L(
      'Falha ao enfileirar envio WhatsApp: {{detail}}',
      'Failed to queue WhatsApp send: {{detail}}',
      'Error al encolar envío WhatsApp: {{detail}}',
      'Échec de mise en file d’envoi WhatsApp : {{detail}}',
      lang
    ),
    'api.evolution.jobPayloadInvalid': L(
      'Payload do job WhatsApp inválido: {{detail}}',
      'Invalid WhatsApp job payload: {{detail}}',
      'Payload del job WhatsApp inválido: {{detail}}',
      'Payload du job WhatsApp invalide : {{detail}}',
      lang
    ),
    'api.evolution.adminOnly': L(
      'Apenas administradores podem gerenciar a integração WhatsApp.',
      'Only administrators can manage WhatsApp integration.',
      'Solo administradores pueden gestionar la integración WhatsApp.',
      'Seuls les administrateurs peuvent gérer l’intégration WhatsApp.',
      lang
    ),
    'api.evolution.serviceUnavailable': L(
      'Evolution API indisponível. Verifique se o serviço evolution-api está no ar e se a URL aponta para http://evolution-api:8080 (Docker) ou http://localhost:18082 (host).',
      'Evolution API unavailable. Check that evolution-api is running and the URL points to http://evolution-api:8080 (Docker) or http://localhost:18082 (host).',
      'Evolution API no disponible. Compruebe que evolution-api esté en ejecución y que la URL apunte a http://evolution-api:8080 (Docker) o http://localhost:18082 (host).',
      'API Evolution indisponible. Vérifiez que evolution-api est démarré et que l’URL pointe vers http://evolution-api:8080 (Docker) ou http://localhost:18082 (hôte).',
      lang
    ),
    'api.bling.httpResponse': L(
      '{{detail}}',
      '{{detail}}',
      '{{detail}}',
      '{{detail}}',
      lang
    ),
    'api.bling.tenantNoTokenGeneric': L(
      'Tenant sem token Bling',
      'Tenant has no Bling token',
      'Tenant sin token Bling',
      'Tenant sans jeton Bling',
      lang
    ),

    'api.billing.stripeRedirect': L(
      'Redirecione para o Stripe Checkout.',
      'Redirect to Stripe Checkout.',
      'Redirija al Stripe Checkout.',
      'Redirigez vers Stripe Checkout.',
      lang
    ),
    'api.billing.mockSession': L(
      'Sessão de pagamento simulada (configure Stripe em produção).',
      'Simulated payment session (configure Stripe in production).',
      'Sesión de pago simulada (configure Stripe en producción).',
      'Session de paiement simulée (configurez Stripe en production).',
      lang
    ),

    'api.estoque.entryRegisterFailed': L(
      'Erro ao registrar entrada. Verifique os dados e tente novamente.',
      'Failed to register inbound stock. Check the data and try again.',
      'Error al registrar entrada. Verifique los datos e intente de nuevo.',
      'Échec de l’enregistrement d’entrée. Vérifiez les données et réessayez.',
      lang
    ),

    'api.file.notFoundGeneric': L('Arquivo não encontrado', 'File not found', 'Archivo no encontrado', 'Fichier introuvable', lang),

    'api.adminSetup.associateSuccess': L(
      'Usuário associado ao perfil administrador com sucesso',
      'User associated with administrator profile successfully',
      'Usuario asociado al perfil administrador con éxito',
      'Utilisateur associé au profil administrateur avec succès',
      lang
    ),
    'api.adminSetup.associateFailed': L(
      'Erro ao associar usuário: {{detail}}',
      'Failed to associate user: {{detail}}',
      'Error al asociar usuario: {{detail}}',
      'Échec de l’association de l’utilisateur : {{detail}}',
      lang
    ),
    'api.email.test.adminOnly': L(
      'Apenas administradores podem testar e-mail',
      'Only administrators can test email',
      'Solo administradores pueden probar el correo',
      'Seuls les administrateurs peuvent tester l’e-mail',
      lang
    ),
    'api.email.test.destinationRequired': L(
      'E-mail de destino não fornecido',
      'Destination email not provided',
      'Correo de destino no proporcionado',
      'E-mail de destination non fourni',
      lang
    ),
    'api.email.test.destinationFormatHint': L(
      'Forneça um e-mail no formato: {"email": "destino@exemplo.com"}',
      'Provide an email in the format: {"email": "destination@example.com"}',
      'Proporcione un correo en el formato: {"email": "destino@ejemplo.com"}',
      'Fournissez un e-mail au format : {"email": "destination@exemple.com"}',
      lang
    ),
    'api.email.test.invalidFormat': L(
      'Formato de e-mail inválido',
      'Invalid email format',
      'Formato de correo no válido',
      'Format d’e-mail invalide',
      lang
    ),
    'api.email.test.sentSuccess': L(
      'E-mail de teste enviado com sucesso!',
      'Test email sent successfully!',
      'Correo de prueba enviado con éxito',
      'E-mail de test envoyé avec succès',
      lang
    ),
    'api.email.test.checkInbox': L(
      'Verifique a caixa de entrada e a pasta de spam do e-mail: {{email}}',
      'Check the inbox and spam folder for: {{email}}',
      'Verifique la bandeja de entrada y la carpeta de spam de: {{email}}',
      'Vérifiez la boîte de réception et le dossier spam de : {{email}}',
      lang
    ),
    'api.email.test.sendFailed': L(
      'Erro ao enviar e-mail de teste',
      'Failed to send test email',
      'Error al enviar correo de prueba',
      'Échec de l’envoi de l’e-mail de test',
      lang
    ),
    'api.email.test.analysisAuth': L('Autenticação', 'Authentication', 'Autenticación', 'Authentification', lang),
    'api.email.test.analysisAuthCauses': L(
      'Usuário ou senha incorretos, conta de e-mail inativa',
      'Incorrect username or password, inactive email account',
      'Usuario o contraseña incorrectos, cuenta de correo inactiva',
      'Identifiant ou mot de passe incorrect, compte e-mail inactif',
      lang
    ),
    'api.email.test.analysisConnection': L('Conexão', 'Connection', 'Conexión', 'Connexion', lang),
    'api.email.test.analysisConnectionCauses': L(
      'Servidor SMTP inacessível, firewall/proxy bloqueando, servidor offline',
      'SMTP server unreachable, firewall/proxy blocking, server offline',
      'Servidor SMTP inaccesible, firewall/proxy bloqueando, servidor offline',
      'Serveur SMTP inaccessible, pare-feu/proxy bloquant, serveur hors ligne',
      lang
    ),
    'api.email.test.analysisTls': L('TLS/SSL', 'TLS/SSL', 'TLS/SSL', 'TLS/SSL', lang),
    'api.email.test.analysisTlsCauses': L(
      'Configuração de START-TLS incorreta (valores válidos: DISABLED, OPTIONAL, REQUIRED)',
      'Incorrect START-TLS configuration (valid values: DISABLED, OPTIONAL, REQUIRED)',
      'Configuración START-TLS incorrecta (valores válidos: DISABLED, OPTIONAL, REQUIRED)',
      'Configuration START-TLS incorrecte (valeurs valides : DISABLED, OPTIONAL, REQUIRED)',
      lang
    ),
    'api.email.test.analysisUnknown': L('Desconhecido', 'Unknown', 'Desconocido', 'Inconnu', lang),
    'api.email.test.analysisUnknownCauses': L(
      'Verifique os logs do servidor para mais detalhes',
      'Check server logs for more details',
      'Verifique los logs del servidor para más detalles',
      'Consultez les logs du serveur pour plus de détails',
      lang
    ),
    'api.email.test.instructionsPost': L(
      'Use POST /api/email/test com {"email": "seu-email@exemplo.com"} para testar',
      'Use POST /api/email/test with {"email": "your-email@example.com"} to test',
      'Use POST /api/email/test con {"email": "su-correo@ejemplo.com"} para probar',
      'Utilisez POST /api/email/test avec {"email": "votre-email@exemple.com"} pour tester',
      lang
    ),
    'api.email.test.instructionsScript': L(
      'Execute testar-email.ps1 para testes mais detalhados',
      'Run testar-email.ps1 for more detailed tests',
      'Ejecute testar-email.ps1 para pruebas más detalladas',
      'Exécutez testar-email.ps1 pour des tests plus détaillés',
      lang
    ),
    'api.whatsapp.test.phoneRequired': L(
      'Parâmetro phone é obrigatório',
      'phone parameter is required',
      'El parámetro phone es obligatorio',
      'Le paramètre phone est obligatoire',
      lang
    ),
    'api.whatsapp.test.sentSuccess': L(
      'Mensagem enviada com sucesso',
      'Message sent successfully',
      'Mensaje enviado con éxito',
      'Message envoyé avec succès',
      lang
    ),
    'api.whatsapp.test.unknownFailure': L(
      'Falha desconhecida: {{detail}}',
      'Unknown failure: {{detail}}',
      'Fallo desconocido: {{detail}}',
      'Échec inconnu : {{detail}}',
      lang
    ),
    'api.whatsapp.test.sendError': L(
      'Erro ao testar envio: {{detail}}',
      'Error testing send: {{detail}}',
      'Error al probar envío: {{detail}}',
      'Erreur lors du test d’envoi : {{detail}}',
      lang
    ),
    'api.update.userIdRequired': L(
      'usuarioId é obrigatório',
      'usuarioId is required',
      'usuarioId es obligatorio',
      'usuarioId est obligatoire',
      lang
    ),
    'api.dev.fix.databaseSuccess': L(
      'Banco de dados corrigido com sucesso',
      'Database fixed successfully',
      'Base de datos corregida con éxito',
      'Base de données corrigée avec succès',
      lang
    ),
    'api.dev.fix.databaseError': L(
      'Erro ao corrigir banco de dados: {{detail}}',
      'Error fixing database: {{detail}}',
      'Error al corregir base de datos: {{detail}}',
      'Erreur lors de la correction de la base : {{detail}}',
      lang
    ),
    'api.dev.fix.checkError': L(
      'Erro ao verificar banco de dados: {{detail}}',
      'Error checking database: {{detail}}',
      'Error al verificar base de datos: {{detail}}',
      'Erreur lors de la vérification de la base : {{detail}}',
      lang
    ),
    'api.dev.fix.profilesExist': L(
      'Perfis já existem no banco',
      'Profiles already exist in the database',
      'Los perfiles ya existen en la base',
      'Les profils existent déjà dans la base',
      lang
    ),
    'api.dev.fix.profilesInserted': L(
      'Perfis inseridos com sucesso',
      'Profiles inserted successfully',
      'Perfiles insertados con éxito',
      'Profils insérés avec succès',
      lang
    ),
    'api.dev.fix.insertProfilesError': L(
      'Erro ao inserir perfis: {{detail}}',
      'Error inserting profiles: {{detail}}',
      'Error al insertar perfiles: {{detail}}',
      'Erreur lors de l’insertion des profils : {{detail}}',
      lang
    ),
    'api.dev.fix.addColumnsError': L(
      'Erro ao adicionar colunas: {{detail}}',
      'Error adding columns: {{detail}}',
      'Error al agregar columnas: {{detail}}',
      'Erreur lors de l’ajout de colonnes : {{detail}}',
      lang
    ),
    'conformidade.enforcement.asl_nao_aprovado': L(
      'Fornecedor {{fornecedor}} sem ASL aprovado — entrada de material bloqueada.',
      'Supplier {{fornecedor}} without approved ASL — material receipt blocked.',
      'Proveedor {{fornecedor}} sin ASL aprobado — recepción de material bloqueada.',
      'Fournisseur {{fornecedor}} sans ASL approuvé — réception matériel bloquée.',
      lang
    ),
    'conformidade.enforcement.asl_vencido': L(
      'ASL do fornecedor {{fornecedor}} vencido ({{validade}}).',
      'Supplier {{fornecedor}} ASL expired ({{validade}}).',
      'ASL del proveedor {{fornecedor}} vencido ({{validade}}).',
      'ASL du fournisseur {{fornecedor}} expiré ({{validade}}).',
      lang
    ),
    'conformidade.os.alerta.nc_aberta': L(
      '{{count}} não conformidade(s) aberta(s) vinculada(s) a esta OS.',
      '{{count}} open non-conformity(ies) linked to this work order.',
      '{{count}} no conformidad(es) abierta(s) vinculada(s) a esta OS.',
      '{{count}} non-conformité(s) ouverte(s) liée(s) à cette OT.',
      lang
    ),
    'conformidade.os.alerta.treinamento_obrigatorio': L(
      'Treinamento obrigatório pendente: {{curso}} (função {{funcao}}).',
      'Mandatory training pending: {{curso}} (role {{funcao}}).',
      'Formación obligatoria pendiente: {{curso}} (función {{funcao}}).',
      'Formation obligatoire en attente : {{curso}} (fonction {{funcao}}).',
      lang
    ),
    'conformidade.os.alerta.calibracao_vencida': L(
      '{{count}} ferramenta(s)/instrumento(s) com calibração vencida.',
      '{{count}} tool(s)/instrument(s) with expired calibration.',
      '{{count}} herramienta(s)/instrumento(s) con calibración vencida.',
      '{{count}} outil(s)/instrument(s) avec étalonnage expiré.',
      lang
    ),
    'conformidade.enforcement.calibracao_vencida': L(
      'Calibração vencida — operação bloqueada ({{count}} ferramenta(s)).',
      'Expired calibration — operation blocked ({{count}} tool(s)).',
      'Calibración vencida — operación bloqueada ({{count}} herramienta(s)).',
      'Étalonnage expiré — opération bloquée ({{count}} outil(s)).',
      lang
    ),
    'conformidade.enforcement.calibracao_ferramenta_vencida': L(
      'Ferramenta {{ferramenta}} com calibração vencida.',
      'Tool {{ferramenta}} has expired calibration.',
      'Herramienta {{ferramenta}} con calibración vencida.',
      'Outil {{ferramenta}} avec étalonnage expiré.',
      lang
    ),
    'conformidade.enforcement.treino_obrigatorio': L(
      'Treinamento obrigatório pendente: {{curso}} (função {{funcao}}).',
      'Mandatory training pending: {{curso}} (role {{funcao}}).',
      'Formación obligatoria pendiente: {{curso}} (función {{funcao}}).',
      'Formation obligatoire en attente : {{curso}} (fonction {{funcao}}).',
      lang
    ),
    'conformidade.enforcement.subcontratacao_vencida': L(
      'Subcontratação {{subcontratado}} com certificado vencido ({{validade}}).',
      'Subcontractor {{subcontratado}} with expired certificate ({{validade}}).',
      'Subcontratación {{subcontratado}} con certificado vencido ({{validade}}).',
      'Sous-traitance {{subcontratado}} avec certificat expiré ({{validade}}).',
      lang
    ),
    'nc.error.eficacia_obrigatoria': L(
      'Confirme a eficácia da ação corretiva antes de fechar a NC.',
      'Confirm corrective action effectiveness before closing the NC.',
      'Confirme la eficacia de la acción correctiva antes de cerrar la NC.',
      'Confirmez l’efficacité de l’action corrective avant de clôturer la NC.',
      lang
    ),
    'nc.error.capa_fase_invalida': L(
      'Fase CAPA inválida.',
      'Invalid CAPA phase.',
      'Fase CAPA inválida.',
      'Phase CAPA invalide.',
      lang
    ),
    'calibracao.error.id_invalido': L(
      'Identificador de calibração inválido.',
      'Invalid calibration identifier.',
      'Identificador de calibración inválido.',
      'Identifiant d’étalonnage invalide.',
      lang
    ),
    'calibracao.error.nao_encontrado': L(
      'Registro de calibração não encontrado.',
      'Calibration record not found.',
      'Registro de calibración no encontrado.',
      'Enregistrement d’étalonnage introuvable.',
      lang
    ),
    'calibracao.error.campos_obrigatorios': L(
      'Preencha os campos obrigatórios da calibração.',
      'Fill in the required calibration fields.',
      'Complete los campos obligatorios de calibración.',
      'Renseignez les champs obligatoires d’étalonnage.',
      lang
    ),
    'calibracao.error.tipo_invalido': L(
      'Tipo de ferramenta inválido.',
      'Invalid tool type.',
      'Tipo de herramienta inválido.',
      'Type d’outil invalide.',
      lang
    ),
    'nc.error.id_invalido': L(
      'Identificador de não conformidade inválido.',
      'Invalid non-conformity identifier.',
      'Identificador de no conformidad inválido.',
      'Identifiant de non-conformité invalide.',
      lang
    ),
    'nc.error.nao_encontrada': L(
      'Não conformidade não encontrada.',
      'Non-conformity not found.',
      'No conformidad no encontrada.',
      'Non-conformité introuvable.',
      lang
    ),
    'nc.error.os_invalida': L(
      'Ordem de serviço vinculada inválida ou inativa.',
      'Linked work order is invalid or inactive.',
      'Orden de servicio vinculada inválida o inactiva.',
      'Ordre de travail lié invalide ou inactif.',
      lang
    ),
    'nc.error.campos_obrigatorios': L(
      'Preencha os campos obrigatórios da não conformidade.',
      'Fill in the required non-conformity fields.',
      'Complete los campos obligatorios de la no conformidad.',
      'Renseignez les champs obligatoires de la non-conformité.',
      lang
    ),
    'nc.error.severidade_invalida': L(
      'Severidade inválida.',
      'Invalid severity.',
      'Severidad inválida.',
      'Sévérité invalide.',
      lang
    ),
    'nc.error.status_invalido': L(
      'Status da não conformidade inválido.',
      'Invalid non-conformity status.',
      'Estado de la no conformidad inválido.',
      'Statut de non-conformité invalide.',
      lang
    ),
    'nc.error.responsavel_obrigatorio': L(
      'Defina o responsável pela fase antes de aprovar.',
      'Assign a phase responsible before approving.',
      'Defina el responsable de la fase antes de aprobar.',
      'Définissez le responsable de la phase avant d\'approuver.',
      lang
    ),
    'nc.error.responsavel_invalido': L(
      'Usuário responsável inválido.',
      'Invalid responsible user.',
      'Usuario responsable inválido.',
      'Utilisateur responsable invalide.',
      lang
    ),
    'nc.error.fase_anterior_nao_aprovada': L(
      'A fase anterior deve estar aprovada antes de avançar.',
      'The previous phase must be approved before advancing.',
      'La fase anterior debe estar aprobada antes de avanzar.',
      'La phase précédente doit être approuvée avant d\'avancer.',
      lang
    ),
    'nc.error.etapas_pendentes_aprovacao': L(
      'Todas as fases CAPA devem estar aprovadas antes do fechamento.',
      'All CAPA phases must be approved before closing.',
      'Todas las fases CAPA deben estar aprobadas antes del cierre.',
      'Toutes les phases CAPA doivent être approuvées avant la clôture.',
      lang
    ),
    'nc.error.conteudo_fase_incompleto': L(
      'Preencha o conteúdo obrigatório desta fase CAPA.',
      'Fill in the required content for this CAPA phase.',
      'Complete el contenido obligatorio de esta fase CAPA.',
      'Renseignez le contenu obligatoire de cette phase CAPA.',
      lang
    ),
    'nc.error.anexo_obrigatorio': L(
      'Selecione um arquivo para anexar.',
      'Select a file to attach.',
      'Seleccione un archivo para adjuntar.',
      'Sélectionnez un fichier à joindre.',
      lang
    ),
    'nc.error.anexo_tipo_invalido': L(
      'Tipo de arquivo não permitido para evidência de NC.',
      'File type not allowed for NC evidence.',
      'Tipo de archivo no permitido para evidencia de NC.',
      'Type de fichier non autorisé pour la preuve NC.',
      lang
    ),
    'nc.error.anexo_grande': L(
      'Arquivo excede o limite de 25 MB.',
      'File exceeds the 25 MB limit.',
      'El archivo supera el límite de 25 MB.',
      'Le fichier dépasse la limite de 25 Mo.',
      lang
    ),
    'nc.error.anexo_upload_falhou': L(
      'Falha ao enviar o anexo.',
      'Failed to upload attachment.',
      'Error al enviar el anexo.',
      'Échec de l\'envoi de la pièce jointe.',
      lang
    ),
    'nc.error.anexo_nao_encontrado': L(
      'Anexo não encontrado.',
      'Attachment not found.',
      'Anexo no encontrado.',
      'Pièce jointe introuvable.',
      lang
    ),
    'nc.error.anexo_evidencia_obrigatorio': L(
      'Anexe ao menos uma evidência na fase de verificação.',
      'Attach at least one piece of evidence in the verification phase.',
      'Adjunte al menos una evidencia en la fase de verificación.',
      'Joignez au moins une preuve dans la phase de vérification.',
      lang
    ),
    'nc.error.etapa_nao_encontrada': L(
      'Etapa CAPA não encontrada.',
      'CAPA phase not found.',
      'Fase CAPA no encontrada.',
      'Phase CAPA introuvable.',
      lang
    ),
    'nc.error.usuario_obrigatorio': L(
      'Usuário autenticado é obrigatório para aprovar.',
      'Authenticated user is required to approve.',
      'Se requiere usuario autenticado para aprobar.',
      'Un utilisateur authentifié est requis pour approuver.',
      lang
    ),
    'sgq.error.codigo_obrigatorio': L(
      'Informe o código do documento controlado.',
      'Enter the controlled document code.',
      'Indique el código del documento controlado.',
      'Indiquez le code du document maîtrisé.',
      lang
    ),
    'sgq.error.id_invalido': L(
      'Identificador de documento inválido.',
      'Invalid document identifier.',
      'Identificador de documento inválido.',
      'Identifiant de document invalide.',
      lang
    ),
    'sgq.error.nao_encontrado': L(
      'Documento controlado não encontrado.',
      'Controlled document not found.',
      'Documento controlado no encontrado.',
      'Document maîtrisé introuvable.',
      lang
    ),
    'sgq.error.campos_obrigatorios': L(
      'Preencha os campos obrigatórios do documento.',
      'Fill in the required document fields.',
      'Complete los campos obligatorios del documento.',
      'Renseignez les champs obligatoires du document.',
      lang
    ),
    'sgq.error.tipo_invalido': L(
      'Tipo de documento inválido.',
      'Invalid document type.',
      'Tipo de documento inválido.',
      'Type de document invalide.',
      lang
    ),
    'sgq.error.status_invalido': L(
      'Status do documento inválido.',
      'Invalid document status.',
      'Estado del documento inválido.',
      'Statut du document invalide.',
      lang
    ),
    'sgq.error.arquivo_obrigatorio': L(
      'Selecione um arquivo PDF para anexar.',
      'Select a PDF file to attach.',
      'Seleccione un archivo PDF para adjuntar.',
      'Sélectionnez un fichier PDF à joindre.',
      lang
    ),
    'sgq.error.arquivo_apenas_pdf': L(
      'Apenas arquivos PDF são permitidos.',
      'Only PDF files are allowed.',
      'Solo se permiten archivos PDF.',
      'Seuls les fichiers PDF sont autorisés.',
      lang
    ),
    'sgq.error.arquivo_grande': L(
      'Arquivo excede o tamanho máximo permitido.',
      'File exceeds the maximum allowed size.',
      'El archivo supera el tamaño máximo permitido.',
      'Le fichier dépasse la taille maximale autorisée.',
      lang
    ),
    'sgq.error.arquivo_upload_falhou': L(
      'Falha ao enviar o arquivo do documento.',
      'Failed to upload the document file.',
      'Error al enviar el archivo del documento.',
      'Échec de l’envoi du fichier du document.',
      lang
    ),
    'sgq.error.sem_arquivo': L(
      'Documento não possui arquivo anexo.',
      'Document has no attached file.',
      'El documento no tiene archivo adjunto.',
      'Le document n’a pas de fichier joint.',
      lang
    ),
    'subcontratacao.error.id_invalido': L(
      'Identificador de subcontratação inválido.',
      'Invalid subcontractor identifier.',
      'Identificador de subcontratación inválido.',
      'Identifiant de sous-traitance invalide.',
      lang
    ),
    'subcontratacao.error.nao_encontrada': L(
      'Subcontratação não encontrada.',
      'Subcontractor record not found.',
      'Subcontratación no encontrada.',
      'Sous-traitance introuvable.',
      lang
    ),
    'subcontratacao.error.campos_obrigatorios': L(
      'Preencha os campos obrigatórios da subcontratação.',
      'Fill in the required subcontractor fields.',
      'Complete los campos obligatorios de la subcontratación.',
      'Renseignez les champs obligatoires de la sous-traitance.',
      lang
    ),
    'subcontratacao.error.status_invalido': L(
      'Status da subcontratação inválido.',
      'Invalid subcontractor status.',
      'Estado de la subcontratación inválido.',
      'Statut de sous-traitance invalide.',
      lang
    ),
    'treinamento.error.id_invalido': L(
      'Identificador de treinamento inválido.',
      'Invalid training record identifier.',
      'Identificador de formación inválido.',
      'Identifiant de formation invalide.',
      lang
    ),
    'treinamento.error.nao_encontrado': L(
      'Registro de treinamento não encontrado.',
      'Training record not found.',
      'Registro de formación no encontrado.',
      'Enregistrement de formation introuvable.',
      lang
    ),
    'treinamento.error.usuario_obrigatorio': L(
      'Selecione o usuário do treinamento.',
      'Select the training user.',
      'Seleccione el usuario de la formación.',
      'Sélectionnez l’utilisateur de la formation.',
      lang
    ),
    'treinamento.error.usuario_nao_encontrado': L(
      'Usuário do treinamento não encontrado.',
      'Training user not found.',
      'Usuario de la formación no encontrado.',
      'Utilisateur de la formation introuvable.',
      lang
    ),
    'treinamento.error.campos_obrigatorios': L(
      'Preencha os campos obrigatórios do treinamento.',
      'Fill in the required training fields.',
      'Complete los campos obligatorios de la formación.',
      'Renseignez les champs obligatoires de la formation.',
      lang
    ),
    'treinamento.obrig.error.id_invalido': L(
      'Identificador de regra inválido.',
      'Invalid mandatory training rule identifier.',
      'Identificador de regla inválido.',
      'Identifiant de règle invalide.',
      lang
    ),
    'treinamento.obrig.error.nao_encontrado': L(
      'Regra de treinamento obrigatório não encontrada.',
      'Mandatory training rule not found.',
      'Regla de formación obligatoria no encontrada.',
      'Règle de formation obligatoire introuvable.',
      lang
    ),
    'treinamento.obrig.error.campos_obrigatorios': L(
      'Preencha os campos obrigatórios da regra de treinamento.',
      'Fill in the required mandatory training rule fields.',
      'Complete los campos obligatorios de la regla de formación.',
      'Renseignez les champs obligatoires de la règle de formation.',
      lang
    ),
    'conformidade.relatorio.error.export': L(
      'Falha ao exportar relatório SGQ.',
      'Failed to export QMS report.',
      'Error al exportar informe SGQ.',
      'Échec d’export du rapport SGQ.',
      lang
    ),
  };
}

export const API_BACKEND_I18N_PT_BR = dict('pt');
export const API_BACKEND_I18N_EN_US = dict('en');
export const API_BACKEND_I18N_ES_ES = dict('es');
export const API_BACKEND_I18N_FR_FR = dict('fr');
