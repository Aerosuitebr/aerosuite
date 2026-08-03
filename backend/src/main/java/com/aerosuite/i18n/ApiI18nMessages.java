package com.aerosuite.i18n;

/** Chaves i18n (frontend `api-backend-i18n`) para respostas JSON da API. */
public final class ApiI18nMessages {

    private ApiI18nMessages() {}

    // Tickets
    public static final String TICKET_NOT_FOUND = "api.ticket.notFound";
    public static final String TICKET_FILE_SAVE_ERROR = "api.ticket.fileSaveError";
    public static final String TICKET_FILE_NOT_FOUND = "api.ticket.fileNotFound";
    public static final String TICKET_FILE_READ_ERROR = "api.ticket.fileReadError";
    public static final String TICKET_OPERATION_ERROR = "api.ticket.operationError";

    // Bling
    public static final String BLING_JOB_NOT_FOUND = "api.bling.jobNotFound";
    public static final String BLING_IMPORT_CONTACT_FAILED = "api.bling.importContactFailed";
    public static final String BLING_LINK_CONTACT_FAILED = "api.bling.linkContactFailed";
    public static final String BLING_CREATE_ORDER_FAILED = "api.bling.createOrderFailed";
    public static final String BLING_CREATE_BLING_ORDER_FAILED = "api.bling.createBlingOrderFailed";
    public static final String BLING_EMIT_NFE_FAILED = "api.bling.emitNfeFailed";
    public static final String BLING_NO_PROPOSTA_LINKED_OS = "api.bling.noPropostaLinkedToOs";
    public static final String BLING_RETRY_AUTOMATIONS_FAILED = "api.bling.retryAutomationsFailed";
    public static final String BLING_SAVE_CONFIG_FAILED = "api.bling.saveConfigFailed";
    public static final String BLING_CERT_REQUIRED = "api.bling.certRequired";
    public static final String BLING_CERT_UPLOAD_FAILED = "api.bling.certUploadFailed";
    public static final String BLING_ADMIN_ONLY = "api.bling.adminOnly";
    public static final String BLING_OAUTH_START_FAILED = "api.bling.oauthStartFailed";
    public static final String BLING_FLUXO_RETRY_NOTHING = "api.bling.fluxoRetryNothing";
    public static final String BLING_FLUXO_RETRY_ACTIONS = "api.bling.fluxoRetryActions";

    // Comum / auth
    public static final String COMMON_NOT_AUTHENTICATED = "api.common.notAuthenticated";
    public static final String COMMON_FORBIDDEN = "api.common.forbidden";
    public static final String COMMON_NOT_FOUND = "api.common.notFound";
    public static final String COMMON_BAD_REQUEST = "api.common.badRequest";
    public static final String COMMON_OPERATION_ERROR = "api.common.operationError";

    // Notificações
    public static final String NOTIFICATION_USUARIO_ID_REQUIRED = "api.notification.usuarioIdRequired";
    public static final String NOTIFICATION_MARKED_READ = "api.notification.markedRead";
    public static final String NOTIFICATION_ALL_MARKED_READ = "api.notification.allMarkedRead";
    public static final String NOTIFICATION_DEFICIT_NOT_FOUND = "api.notification.deficitNotFound";

    // Empresa / marca
    public static final String EMPRESA_INVALID_REQUEST = "api.empresa.invalidRequest";
    public static final String EMPRESA_FILE_REQUIRED = "api.empresa.fileRequired";
    public static final String EMPRESA_IMAGE_TOO_LARGE = "api.empresa.imageTooLarge";
    public static final String EMPRESA_IMAGE_ONLY = "api.empresa.imageOnly";
    public static final String EMPRESA_UPLOAD_FAILED = "api.empresa.uploadFailed";
    public static final String EMPRESA_FORBIDDEN = "api.empresa.forbidden";

    // Backup
    public static final String BACKUP_CONFIG_NOT_FOUND = "api.backup.configNotFound";
    public static final String BACKUP_HOST_EMPTY = "api.backup.hostEmpty";
    public static final String BACKUP_PORT_INVALID = "api.backup.portInvalid";
    public static final String BACKUP_DATABASE_EMPTY = "api.backup.databaseEmpty";
    public static final String BACKUP_USER_EMPTY = "api.backup.userEmpty";
    public static final String BACKUP_CONNECT_SUCCESS = "api.backup.connectSuccess";
    public static final String BACKUP_CONNECT_INVALID = "api.backup.connectInvalid";
    public static final String BACKUP_ACCESS_DENIED = "api.backup.accessDenied";
    public static final String BACKUP_DB_NOT_FOUND = "api.backup.dbNotFound";
    public static final String BACKUP_CONNECTION_FAILED = "api.backup.connectionFailed";
    public static final String BACKUP_TIMEOUT = "api.backup.timeout";
    public static final String BACKUP_CONNECT_ERROR = "api.backup.connectError";
    public static final String BACKUP_UNEXPECTED = "api.backup.unexpectedError";
    public static final String BACKUP_STARTED = "api.backup.started";
    public static final String BACKUP_IN_PROGRESS = "api.backup.inProgress";
    public static final String BACKUP_COMPLETED = "api.backup.completed";
    public static final String BACKUP_FAILED = "api.backup.failed";
    public static final String BACKUP_STATUS_NOT_FOUND = "api.backup.statusNotFound";
    public static final String BACKUP_PATH_VALID = "api.backup.pathValid";
    public static final String BACKUP_PATH_ERROR = "api.backup.pathError";
    public static final String BACKUP_FOLDER_COPY_HINT = "api.backup.folderCopyHint";
    public static final String BACKUP_FOLDER_NOT_FOUND = "api.backup.folderNotFound";
    public static final String BACKUP_FOLDER_NOT_DIR = "api.backup.folderNotDir";
    public static final String BACKUP_FOLDER_OPEN_UNAVAILABLE = "api.backup.folderOpenUnavailable";
    public static final String BACKUP_FOLDER_OPENED = "api.backup.folderOpened";
    public static final String BACKUP_FOLDER_OPEN_ERROR = "api.backup.folderOpenError";

    // OS / arquivos
    public static final String OS_OPERATION_ERROR = "api.os.operationError";
    public static final String OS_DEACTIVATED = "api.os.deactivated";
    public static final String OS_FILE_REMOVED = "api.os.fileRemoved";
    public static final String OS_DTO_NULL = "api.os.dtoNull";
    public static final String OS_FCU_NOT_FOUND = "api.os.fcuNotFound";
    public static final String OS_FCU_INACTIVE = "api.os.fcuInactive";
    public static final String OS_FABRICANTE_NOT_FOUND = "api.os.fabricanteNotFound";
    public static final String OS_FABRICANTE_INACTIVE = "api.os.fabricanteInactive";
    public static final String OS_DT_ABERTURA_REQUIRED = "api.os.dtAberturaRequired";
    public static final String OS_ID_OS_REQUIRED = "api.os.idOsRequired";
    public static final String OS_ID_OS_DUPLICATE = "api.os.idOsDuplicate";
    public static final String OS_CREATE_FAILED = "api.os.createFailed";
    public static final String OS_CREATE_FROM_PROPOSTA_FAILED = "api.os.createFromPropostaFailed";

    // Catálogo
    public static final String PRODUCT_DEACTIVATED = "api.product.deactivated";
    public static final String FCU_DEACTIVATED = "api.fcu.deactivated";
    public static final String USER_DEACTIVATED = "api.user.deactivated";

    // Estoque
    public static final String ESTOQUE_OPERATION_ERROR = "api.estoque.operationError";

    // Dev / teste
    public static final String TEST_EMAIL_SENT = "api.testEmail.sent";
    public static final String TEST_EMAIL_SERVICE_MISSING = "api.testEmail.serviceMissing";
    public static final String AUDIT_TEST_RECORD_CREATED = "api.audit.testRecordCreated";

    // Proposta comercial (envio)
    public static final String PROPOSTA_EMAIL_SENT = "api.proposta.emailSentSuccess";
    public static final String PROPOSTA_EMAIL_SEND_FAILED = "api.proposta.emailSendFailed";
    public static final String PROPOSTA_EMAIL_SEND_ERROR = "api.proposta.emailSendError";
    public static final String PROPOSTA_WHATSAPP_SENT = "api.proposta.whatsappSentSuccess";
    public static final String PROPOSTA_WHATSAPP_LINK = "api.proposta.whatsappLinkGenerated";
    public static final String PROPOSTA_WHATSAPP_SEND_ERROR = "api.proposta.whatsappSendError";
    public static final String PROPOSTA_WRONG_TENANT = "api.proposta.wrongTenant";

    // OS / portal
    public static final String OS_EXTERNAL_PORTAL_ONLY = "api.os.externalPortalOnly";
    public static final String OS_TROCA_PAGAMENTO_FORBIDDEN = "api.os.trocaPagamentoForbidden";

    // Tenant / organizações
    public static final String TENANT_PROVISIONING_FORBIDDEN = "api.tenant.provisioningForbidden";
    public static final String PLATFORM_OPS_FORBIDDEN = "api.platform.opsForbidden";
    public static final String PLATFORM_OPS_LOGIN_DENIED = "api.platform.opsLoginDenied";
    public static final String PLATFORM_OPS_MFA_REQUIRED = "api.platform.opsMfaRequired";
    public static final String PLATFORM_OPS_MFA_STALE = "api.platform.opsMfaStale";
    public static final String PLATFORM_OPS_OPERATOR_USER_INACTIVE = "api.platform.ops.operatorUserInactive";
    public static final String PLATFORM_OPS_OPERATOR_CONFIG_PROTECTED = "api.platform.ops.operatorConfigProtected";
    public static final String PLATFORM_OPS_OPERATOR_NOT_GRANTED = "api.platform.ops.operatorNotGranted";
    public static final String TENANT_SIGNUP_DISABLED = "api.tenant.signupDisabled";
    public static final String EMPRESA_ONBOARDING_ADMIN_ONLY = "api.empresa.onboardingAdminOnly";

    // Portal externo
    public static final String EXTERNO_PROPOSTA_DENIED = "api.externo.propostaDenied";
    public static final String EXTERNO_USER_INVALID = "api.externo.userInvalid";
    public static final String EXTERNO_OS_ACCESS_DENIED = "api.externo.osAccessDenied";
    public static final String EXTERNO_OS_NOT_FOUND = "api.externo.osNotFound";
    public static final String EXTERNO_OTHER_USER_DATA = "api.externo.otherUserDataDenied";
    public static final String EXTERNO_MANAGE_PERMISSION = "api.externo.managePermissionRequired";
    public static final String EXTERNO_USER_DEACTIVATED = "api.externo.userDeactivated";
    public static final String EXTERNO_USER_ACTIVATED = "api.externo.userActivated";
    public static final String EXTERNO_FUNCIONALIDADES_UPDATED = "api.externo.funcionalidadesUpdated";
    public static final String EXTERNO_OS_ACCESS_GRANTED = "api.externo.osAccessGranted";
    public static final String EXTERNO_OS_ACCESS_REVOKED = "api.externo.osAccessRevoked";
    public static final String EXTERNO_OS_ACCESS_REVOKED_COMPLETE = "api.externo.osAccessRevokedComplete";
    public static final String EXTERNO_DOCUMENT_ACCESS_GRANTED = "api.externo.documentAccessGranted";
    public static final String EXTERNO_DOCUMENT_ACCESS_REVOKED = "api.externo.documentAccessRevoked";
    public static final String EXTERNO_PRINT_FAILED = "api.externo.printFailed";

    // Usuários
    public static final String USER_EMAIL_REQUIRED = "api.user.emailRequired";
    public static final String USER_NAME_REQUIRED = "api.user.nameRequired";
    public static final String USER_EMAIL_ALREADY_REGISTERED = "api.user.emailAlreadyRegistered";
    public static final String USER_PROFILE_NOT_FOUND = "api.user.profileNotFound";
    public static final String USER_EMAIL_SERVICE_UNAVAILABLE = "api.user.emailServiceUnavailable";
    public static final String USER_NOT_AUTHENTICATED = "api.user.notAuthenticated";
    public static final String USER_NOT_FOUND = "api.user.notFound";
    public static final String USER_ID_REQUIRED = "api.user.idRequired";
    public static final String USER_NO_EMAIL = "api.user.noEmail";
    public static final String USER_EXTERNO_NOT_FOUND = "api.user.externoNotFound";
    public static final String USER_FEATURE_NOT_FOUND = "api.user.featureNotFound";
    public static final String USER_DELETE_HAS_RELATIONS = "api.user.deleteHasRelations";
    public static final String USER_DELETE_CANNOT_DELETE = "api.user.deleteCannotDelete";
    public static final String USER_DELETE_CONSTRAINT = "api.user.deleteConstraint";
    public static final String USER_DELETE_SERVER_ERROR = "api.user.deleteServerError";
    public static final String USER_DELETE_UNEXPECTED = "api.user.deleteUnexpected";
    public static final String USER_DELETE_UNKNOWN = "api.user.deleteUnknown";

    // Auth (login / senha)
    public static final String AUTH_INVALID_CREDENTIALS = "api.auth.invalidCredentials";
    public static final String AUTH_USER_INACTIVE = "api.auth.userInactive";
    public static final String AUTH_SUBSCRIPTION_INACTIVE = "api.auth.subscriptionInactive";
    public static final String AUTH_TENANT_REQUIRED = "api.auth.tenantRequired";
    public static final String AUTH_TENANT_NOT_FOUND = "api.auth.tenantNotFound";
    public static final String AUTH_TOKEN_INVALID = "api.auth.tokenInvalid";
    public static final String AUTH_PASSWORD_MIN_LENGTH = "api.auth.passwordMinLength";
    public static final String AUTH_PASSWORD_POLICY = "api.auth.passwordPolicy";
    public static final String AUTH_USER_NOT_FOUND = "api.auth.userNotFound";
    public static final String AUTH_PASSWORD_REUSED = "api.auth.passwordReused";
    public static final String AUTH_CURRENT_PASSWORD_WRONG = "api.auth.currentPasswordWrong";
    public static final String AUTH_NO_PASSWORD_CHANGE_REQUIRED = "api.auth.noPasswordChangeRequired";
    public static final String AUTH_TEMP_PASSWORD_WRONG = "api.auth.tempPasswordWrong";
    public static final String AUTH_EMAIL_REQUIRED = "api.auth.emailRequired";
    public static final String AUTH_TOKEN_REQUIRED = "api.auth.tokenRequired";
    public static final String AUTH_NEW_PASSWORD_REQUIRED = "api.auth.newPasswordRequired";
    public static final String AUTH_CURRENT_PASSWORD_REQUIRED = "api.auth.currentPasswordRequired";
    public static final String AUTH_TEMP_PASSWORD_REQUIRED = "api.auth.tempPasswordRequired";
    public static final String AUTH_SERVICE_UNAVAILABLE = "api.auth.serviceUnavailable";
    public static final String AUTH_INVALID_REQUEST = "api.auth.invalidRequest";
    public static final String AUTH_RESET_FAILED = "api.auth.resetFailed";
    public static final String AUTH_CHANGE_PASSWORD_FAILED = "api.auth.changePasswordFailed";
    public static final String AUTH_PROCESS_REQUEST_FAILED = "api.auth.processRequestFailed";
    public static final String AUTH_VALIDATE_TOKEN_FAILED = "api.auth.validateTokenFailed";
    public static final String AUTH_VALIDATE_CURRENT_PASSWORD_FAILED = "api.auth.validateCurrentPasswordFailed";
    public static final String AUTH_OAUTH_REFRESH_FAILED = "api.auth.oauthRefreshFailed";
    public static final String AUTH_LIST_USERS_FAILED = "api.auth.listUsersFailed";
    public static final String AUTH_CREATE_USER_FAILED = "api.auth.createUserFailed";
    public static final String AUTH_FORGOT_PASSWORD_ACK = "api.auth.forgotPasswordAck";
    public static final String AUTH_LOGIN_AGAIN = "api.auth.loginAgain";
    public static final String AUTH_MFA_REQUIRED = "api.auth.mfaRequired";
    public static final String AUTH_MFA_ENROLLMENT_REQUIRED = "api.auth.mfaEnrollmentRequired";
    public static final String AUTH_MFA_CODE_INVALID = "api.auth.mfaCodeInvalid";
    public static final String AUTH_MFA_CODE_REQUIRED = "api.auth.mfaCodeRequired";
    public static final String AUTH_MFA_DISABLED = "api.auth.mfaDisabled";
    public static final String AUTH_OAUTH_REFRESH_SUCCESS = "api.auth.oauthRefreshSuccess";
    public static final String AUTH_USER_NOT_FOUND_OR_INACTIVE = "api.auth.userNotFoundOrInactive";
    public static final String AUTH_PASSWORD_CHANGED = "api.auth.passwordChanged";
    public static final String AUTH_PASSWORD_RESET_SUCCESS = "api.auth.passwordResetSuccess";
    public static final String AUTH_CURRENT_PASSWORD_VALID = "api.auth.currentPasswordValid";
    public static final String AUTH_PASSWORD_REQUIRED = "api.auth.passwordRequired";
    public static final String AUTH_ADMIN_USER_CREATED = "api.auth.adminUserCreated";
    public static final String AUTH_ADMIN_USER_EXISTS = "api.auth.adminUserExists";
    public static final String AUTH_TEST_ENDPOINT_OK = "api.auth.testEndpointOk";

    // Catálogo — entidades
    public static final String FCU_NOT_FOUND = "api.fcu.notFound";
    public static final String FABRICANTE_NOT_FOUND = "api.fabricante.notFound";
    public static final String TIPO_SERVICO_NOT_FOUND = "api.tipoServico.notFound";
    public static final String USER_NOT_FOUND_BY_ID = "api.user.notFoundById";
    public static final String TENANT_NOT_IDENTIFIED = "api.tenant.notIdentified";

    // Bling — fiscal / OAuth
    public static final String BLING_NO_PEDIDO_LINKED = "api.bling.noPedidoLinked";
    public static final String BLING_CERT_NOT_CONFIGURED = "api.bling.certNotConfigured";
    public static final String BLING_NFE_NOT_RETURNED = "api.bling.nfeNotReturned";
    public static final String BLING_NFE_JSON_BUILD_FAILED = "api.bling.nfeJsonBuildFailed";
    public static final String BLING_NFE_WEBHOOK_NO_ID = "api.bling.nfeWebhookNoId";
    public static final String BLING_NFE_ALREADY_REGISTERED = "api.bling.nfeAlreadyRegistered";
    public static final String BLING_NFE_EMITTED = "api.bling.nfeEmitted";
    public static final String BLING_PLATFORM_DISABLED = "api.bling.platformDisabled";
    public static final String BLING_OAUTH_NOT_CONFIGURED = "api.bling.oauthNotConfigured";
    public static final String BLING_OAUTH_STATE_INVALID = "api.bling.oauthStateInvalid";
    public static final String BLING_OAUTH_CODE_MISSING = "api.bling.oauthCodeMissing";
    public static final String BLING_NO_REFRESH_TOKEN = "api.bling.noRefreshToken";

    // Tenant — provisionamento (admin plataforma)
    public static final String TENANT_INVALID_REQUEST_BODY = "api.tenant.invalidRequestBody";
    public static final String TENANT_CANNOT_SUSPEND_DEFAULT = "api.tenant.cannotSuspendDefault";
    public static final String TENANT_NO_ADMIN_FOUND = "api.tenant.noAdminFound";
    public static final String TENANT_CODE_REQUIRED = "api.tenant.codeRequired";
    public static final String TENANT_NAME_REQUIRED = "api.tenant.nameRequired";
    public static final String TENANT_INVALID_CODE_FORMAT = "api.tenant.invalidCodeFormat";
    public static final String TENANT_RESERVED_CODE = "api.tenant.reservedCode";
    public static final String TENANT_CODE_IN_USE = "api.tenant.codeInUse";
    public static final String TENANT_NOT_FOUND = "api.tenant.notFound";
    public static final String TENANT_FILE_REQUIRED = "api.tenant.fileRequired";
    public static final String TENANT_LOGO_SAVE_FAILED = "api.tenant.logoSaveFailed";
    public static final String TENANT_ADMIN_EMAIL_EXISTS = "api.tenant.adminEmailExists";
    public static final String TENANT_ADMIN_PROFILE_NOT_FOUND = "api.tenant.adminProfileNotFound";
    public static final String TENANT_WELCOME_EMAIL_SENT = "api.tenant.welcomeEmailSent";
    public static final String TENANT_WELCOME_EMAIL_FAILED = "api.tenant.welcomeEmailFailed";

    // Produtos
    public static final String PRODUCT_NOT_FOUND = "api.product.notFound";
    public static final String PRODUCT_FILES_NOT_SENT = "api.product.filesNotSent";
    public static final String PRODUCT_NO_PHOTO = "api.product.noPhoto";
    public static final String PRODUCT_INVALID_FILENAME = "api.product.invalidFilename";
    public static final String PRODUCT_PHOTO_NOT_FOUND = "api.product.photoNotFound";
    public static final String PRODUCT_NO_BARCODE = "api.product.noBarcode";
    public static final String PRODUCT_INVALID_BARCODE = "api.product.invalidBarcode";
    public static final String PRODUCT_DEACTIVATE_FAILED = "api.product.deactivateFailed";
    public static final String PRODUCT_IMAGE_SAVE_FAILED = "api.product.imageSaveFailed";
    public static final String PRODUCT_IMAGE_READ_FAILED = "api.product.imageReadFailed";
    public static final String PRODUCT_BARCODE_GENERATE_FAILED = "api.product.barcodeGenerateFailed";
    public static final String PRODUCT_BARCODE_IMAGE_FAILED = "api.product.barcodeImageFailed";
    public static final String PRODUCT_PN_DUPLICATE = "api.product.pnDuplicate";

    // LGPD
    public static final String LGPD_USER_INVALID = "api.lgpd.userInvalid";
    public static final String LGPD_TERMS_REQUIRED = "api.lgpd.termsRequired";
    public static final String LGPD_VERSION_OUTDATED = "api.lgpd.versionOutdated";
    public static final String LGPD_REQUEST_TYPE_REQUIRED = "api.lgpd.requestTypeRequired";
    public static final String LGPD_REQUEST_TYPE_INVALID = "api.lgpd.requestTypeInvalid";
    public static final String LGPD_REQUEST_NOT_FOUND = "api.lgpd.requestNotFound";
    public static final String LGPD_EXPORT_NOT_READY = "api.lgpd.exportNotReady";
    public static final String LGPD_EXPORT_FILE_NOT_FOUND = "api.lgpd.exportFileNotFound";
    public static final String LGPD_FILE_UNAVAILABLE = "api.lgpd.fileUnavailable";
    public static final String LGPD_NOT_AUTHENTICATED = "api.lgpd.notAuthenticated";
    public static final String LGPD_USER_NOT_FOUND = "api.lgpd.userNotFound";
    public static final String LGPD_EXPORT_USER_NOT_FOUND = "api.lgpd.exportUserNotFound";
    public static final String LGPD_EXPORT_WRITE_FAILED = "api.lgpd.exportWriteFailed";
    public static final String LGPD_ARTIFACT_INVALID = "api.lgpd.artifactInvalid";

    // OAuth2 (SMTP / Google)
    public static final String OAUTH_NOT_ENABLED = "api.oauth.notEnabled";
    public static final String OAUTH_CREDENTIALS_NOT_CONFIGURED = "api.oauth.credentialsNotConfigured";
    public static final String OAUTH_CREDENTIALS_NOT_INITIALIZED = "api.oauth.credentialsNotInitialized";
    public static final String OAUTH_REFRESH_FAILED = "api.oauth.refreshFailed";
    public static final String OAUTH_REFRESH_WRONG_CLIENT = "api.oauth.refreshWrongClient";
    public static final String OAUTH_SMTP_UNEXPECTED = "api.oauth.smtpUnexpectedResponse";

    // Chat
    public static final String CHAT_CONVERSATION_NOT_FOUND = "api.chat.conversationNotFound";
    public static final String CHAT_NOT_PARTICIPANT = "api.chat.notParticipant";

    // Tenant signup
    public static final String TENANT_SIGNUP_RESERVED_CODE = "api.tenant.signup.reservedCode";
    public static final String TENANT_SIGNUP_EMAIL_EXISTS = "api.tenant.signup.emailExists";
    public static final String TENANT_SIGNUP_INVALID_REQUEST = "api.tenant.signup.invalidRequest";
    public static final String TENANT_SIGNUP_INVALID_ORG_CODE = "api.tenant.signup.invalidOrgCode";
    public static final String TENANT_SIGNUP_ORG_NAME_REQUIRED = "api.tenant.signup.orgNameRequired";
    public static final String TENANT_SIGNUP_ADMIN_EMAIL_REQUIRED = "api.tenant.signup.adminEmailRequired";
    public static final String TENANT_SIGNUP_ADMIN_PASSWORD_MIN = "api.tenant.signup.adminPasswordMin";
    public static final String TENANT_SIGNUP_TERMS_REQUIRED = "api.tenant.signup.termsRequired";
    public static final String TENANT_SIGNUP_LGPD_VERSION_INVALID = "api.tenant.signup.lgpdVersionInvalid";
    public static final String TENANT_SIGNUP_ORG_CODE_IN_USE = "api.tenant.signup.orgCodeInUse";
    public static final String TENANT_SIGNUP_MODULOS_REQUIRED = "api.tenant.signup.modulosRequired";
    public static final String PRODUCT_PN_INVALID = "api.product.pnInvalid";

    // Backup (serviço)
    public static final String BACKUP_CONNECTION_DATA_REQUIRED = "api.backup.connectionDataRequired";
    public static final String BACKUP_PATH_REQUIRED = "api.backup.pathRequired";
    public static final String BACKUP_PERSIST_FAILED = "api.backup.persistFailed";
    public static final String BACKUP_DIR_NOT_WRITABLE = "api.backup.dirNotWritable";
    public static final String BACKUP_FILE_NOT_CREATED = "api.backup.fileNotCreated";
    public static final String BACKUP_FILE_EMPTY = "api.backup.fileEmpty";
    public static final String BACKUP_DELETE_FAILED = "api.backup.deleteFailed";
    public static final String BACKUP_LIST_DIR_FAILED = "api.backup.listDirFailed";
    public static final String BACKUP_PATH_NOT_INFORMED = "api.backup.pathNotInformed";
    public static final String BACKUP_PATH_INVALID = "api.backup.pathInvalid";
    public static final String BACKUP_PATH_OUTSIDE_DRIVE = "api.backup.pathOutsideDrive";
    public static final String BACKUP_DRIVE_NOT_MOUNTED = "api.backup.driveNotMounted";
    public static final String BACKUP_SAVE_FAILED = "api.backup.saveFailed";

    // Proposta (domínio)
    public static final String PROPOSTA_NOT_FOUND = "proposta.error.not_found";
    public static final String PROPOSTA_COMERCIAL_NOT_FOUND = "proposta.error.comercial_not_found";
    public static final String PROPOSTA_EMAIL_DESTINO_REQUIRED = "proposta.error.email_destino_required";
    public static final String PROPOSTA_PHONE_DESTINO_REQUIRED = "proposta.error.phone_destino_required";
    public static final String PROPOSTA_PHONE_INVALID = "proposta.error.phone_invalid";
    public static final String PROPOSTA_PDF_GENERATE_FAILED = "proposta.error.pdf_generate_failed";
    public static final String PROPOSTA_NULL_ON_SAVE_ITEMS = "proposta.error.null_on_save_items";
    public static final String PROPOSTA_PORTAL_EMAIL_REQUIRED = "proposta.portal.email_required";
    public static final String PROPOSTA_PORTAL_NO_EXTERNAL_USER = "proposta.portal.no_external_user";
    public static final String PROPOSTA_PORTAL_NOT_FOUND = "proposta.portal.not_found";
    public static final String PROPOSTA_BLING_CLIENTE_NOT_LINKED = "proposta.bling.cliente_not_linked";
    public static final String PROPOSTA_EXTERNA_STATUS_INVALID = "proposta.externa.status_invalid";
    public static final String PROPOSTA_EXTERNA_REJECTION_REASON = "proposta.externa.rejection_reason_required";
    public static final String PROPOSTA_EXTERNA_NOT_FOUND = "proposta.externa.not_found";
    public static final String PROPOSTA_BLING_PEDIDO_NOT_FOUND = "proposta.bling.pedido_not_found";
    public static final String PROPOSTA_BLING_PEDIDO_NOT_LINKED = "proposta.bling.pedido_not_linked";
    public static final String PROPOSTA_BLING_PEDIDO_ALREADY_EXISTS = "proposta.bling.pedido_already_exists";
    public static final String PROPOSTA_BLING_PEDIDO_CREATED = "proposta.bling.pedido_created";
    public static final String PROPOSTA_BLING_PEDIDO_STATUS_REQUIRED = "proposta.bling.pedido_status_required";
    public static final String PROPOSTA_BLING_JSON_BUILD_FAILED = "proposta.bling.json_build_failed";

    // Studio (validação)
    public static final String STUDIO_JOB_NOT_COMPLETE = "api.studio.jobNotComplete";
    public static final String STUDIO_PREVIEW_UNAVAILABLE = "api.studio.previewUnavailable";
    public static final String STUDIO_PREVIEW_FILE_NOT_FOUND = "api.studio.previewFileNotFound";
    public static final String STUDIO_JOB_NOT_FOUND = "api.studio.jobNotFound";
    public static final String STUDIO_FILE_REQUIRED = "api.studio.fileRequired";
    public static final String STUDIO_SESSION_REQUIRED = "api.studio.sessionRequired";
    public static final String STUDIO_DOCUMENT_REQUIRED = "api.studio.documentRequired";
    public static final String STUDIO_TEMPLATE_ID_REQUIRED = "api.studio.templateIdRequired";
    public static final String STUDIO_TEMPLATE_INVALID = "api.studio.templateInvalid";
    public static final String STUDIO_CUSTOM_LAYOUT_REQUIRED = "api.studio.customLayoutRequired";
    public static final String STUDIO_DIMENSIONS_MIN = "api.studio.dimensionsMin";
    public static final String STUDIO_DIMENSIONS_MAX = "api.studio.dimensionsMax";
    public static final String STUDIO_ELEMENT_INVALID = "api.studio.elementInvalid";
    public static final String STUDIO_ELEMENT_TYPE_INVALID = "api.studio.elementTypeInvalid";
    public static final String STUDIO_TEXT_TOO_LONG = "api.studio.textTooLong";
    public static final String STUDIO_VISUAL_EDITOR_REQUIRES_LAYOUT = "api.studio.visualEditorRequiresLayout";
    public static final String STUDIO_INVALID_PATH = "api.studio.invalidPath";
    public static final String STUDIO_ASSET_ACCESS_DENIED = "api.studio.assetAccessDenied";
    public static final String STUDIO_ASSET_NOT_FOUND = "api.studio.assetNotFound";

    // Exceções genéricas (mapper)
    public static final String COMMON_OPERATION_NOT_ALLOWED = "api.common.operationNotAllowed";
    public static final String COMMON_RESOURCE_NOT_FOUND = "api.common.resourceNotFound";
    public static final String COMMON_INTERNAL_ERROR = "api.common.internalError";
    public static final String COMMON_UNEXPECTED_ERROR = "api.common.unexpectedError";
    public static final String COMMON_VALIDATION = "api.common.validation";
    public static final String COMMON_FIELD_TOO_LONG = "api.common.fieldTooLong";

    // E-mail (erros expostos à API)
    public static final String EMAIL_SEND_FAILED = "api.email.sendFailed";

    // Bling — API client (resíduos)
    public static final String BLING_PARSE_CONTACT_FAILED = "api.bling.parseContactFailed";
    public static final String BLING_SEARCH_CONTACTS_FAILED = "api.bling.searchContactsFailed";
    public static final String BLING_CONTACT_ID_NOT_RETURNED = "api.bling.contactIdNotReturned";
    public static final String BLING_CREATE_CONTACT_API_FAILED = "api.bling.createContactApiFailed";
    public static final String BLING_PRODUCT_ID_NOT_RETURNED = "api.bling.productIdNotReturned";
    public static final String BLING_CREATE_PRODUCT_FAILED = "api.bling.createProductFailed";
    public static final String BLING_FETCH_COMPANY_FAILED = "api.bling.fetchCompanyFailed";
    public static final String BLING_PARSE_PEDIDO_FAILED = "api.bling.parsePedidoFailed";
    public static final String BLING_PEDIDO_ID_NOT_RETURNED = "api.bling.pedidoIdNotReturned";
    public static final String BLING_CREATE_PEDIDO_API_FAILED = "api.bling.createPedidoApiFailed";
    public static final String BLING_PARSE_NFE_FAILED = "api.bling.parseNfeFailed";
    public static final String BLING_NFE_ID_NOT_RETURNED = "api.bling.nfeIdNotReturned";
    public static final String BLING_EMIT_NFE_API_FAILED = "api.bling.emitNfeApiFailed";
    public static final String BLING_TENANT_NO_TOKEN = "api.bling.tenantNoToken";
    public static final String BLING_HTTP_ERROR = "api.bling.httpError";
    public static final String BLING_POST_FAILED = "api.bling.postFailed";
    public static final String BLING_GET_FAILED = "api.bling.getFailed";
    public static final String BLING_OAUTH_NO_ACCESS_TOKEN = "api.bling.oauthNoAccessToken";
    public static final String BLING_OAUTH_TOKEN_FAILED = "api.bling.oauthTokenFailed";
    public static final String BLING_CONTACT_NOT_FOUND = "api.bling.contactNotFound";
    public static final String BLING_WEBHOOK_EMPTY_BODY = "api.bling.webhookEmptyBody";
    public static final String BLING_WEBHOOK_NO_CONTACT_ID = "api.bling.webhookNoContactId";
    public static final String BLING_PROPOSTA_CLIENT_NOT_FOUND = "api.bling.propostaClientNotFound";
    public static final String BLING_CLIENT_ALREADY_LINKED = "api.bling.clientAlreadyLinked";
    public static final String BLING_ENQUEUE_JOB_FAILED = "api.bling.enqueueJobFailed";
    public static final String BLING_JOB_NO_TENANT = "api.bling.jobNoTenant";
    public static final String BLING_JOB_NO_CONTACT_ID = "api.bling.jobNoContactId";
    public static final String BLING_JOB_REQUEUED = "api.bling.jobRequeued";
    public static final String BLING_JOB_REMOVED = "api.bling.jobRemoved";
    public static final String BLING_JOB_NONE_DEAD = "api.bling.jobNoneDead";
    public static final String BLING_JOBS_REQUEUED = "api.bling.jobsRequeued";
    public static final String BLING_JOB_NONE_DEAD_TO_REMOVE = "api.bling.jobNoneDeadToRemove";
    public static final String BLING_JOBS_REMOVED = "api.bling.jobsRemoved";
    public static final String BLING_SCOPE_PARTIAL_DENIED = "api.bling.scopePartialDenied";
    public static final String BLING_SYNC_JOB_NOT_FOUND = "api.bling.syncJobNotFound";
    public static final String BLING_STATUS_PLATFORM_DISABLED = "api.bling.statusPlatformDisabled";
    public static final String BLING_STATUS_ACCOUNT_CONNECTED = "api.bling.statusAccountConnected";
    public static final String BLING_STATUS_LEGACY_TOKEN = "api.bling.statusLegacyToken";
    public static final String BLING_STATUS_OAUTH_NOT_CONFIGURED = "api.bling.statusOauthNotConfigured";
    public static final String BLING_STATUS_NO_ACCOUNT = "api.bling.statusNoAccount";
    public static final String BLING_READINESS_READY = "api.bling.readinessReady";
    public static final String BLING_READINESS_NOT_CONNECTED = "api.bling.readinessNotConnected";
    public static final String BLING_READINESS_RECONNECT_OAUTH = "api.bling.readinessReconnectOauth";
    public static final String BLING_READINESS_UPLOAD_CERT = "api.bling.readinessUploadCert";
    public static final String BLING_READINESS_CERT_MISSING = "api.bling.readinessCertMissing";
    public static final String BLING_READINESS_FILL_CFOP = "api.bling.readinessFillCfop";
    public static final String BLING_READINESS_CFOP_MISSING = "api.bling.readinessCfopMissing";
    public static final String BLING_READINESS_FILL_NCM = "api.bling.readinessFillNcm";
    public static final String BLING_READINESS_NCM_MISSING = "api.bling.readinessNcmMissing";
    public static final String BLING_READINESS_SCOPE_FIX = "api.bling.readinessScopeFix";
    public static final String BLING_READINESS_SCOPE_RECONNECT = "api.bling.readinessScopeReconnect";
    public static final String BLING_READINESS_TOKEN_REVOKED = "api.bling.readinessTokenRevoked";
    public static final String BLING_READINESS_SCOPE_FORBIDDEN = "api.bling.readinessScopeForbidden";
    public static final String BLING_INTEGRATION_DISABLED = "api.bling.integrationDisabled";
    public static final String BLING_FISCAL_USING_DEFAULTS = "api.bling.fiscalUsingDefaults";
    public static final String BLING_FISCAL_SAVED = "api.bling.fiscalSaved";
    public static final String BLING_FISCAL_CERT_STORED = "api.bling.fiscalCertStored";
    public static final String BLING_FISCAL_CERT_REMOVED = "api.bling.fiscalCertRemoved";
    public static final String BLING_BOOTSTRAP_COMPLETE = "api.bling.bootstrapComplete";
    public static final String BLING_BOOTSTRAP_FAILED = "api.bling.bootstrapFailed";
    public static final String BLING_SCOPE_ENDPOINT_UNAVAILABLE = "api.bling.scopeEndpointUnavailable";
    public static final String BLING_SCOPE_ALL_OK = "api.bling.scopeAllOk";
    public static final String BLING_SCOPE_INSUFFICIENT = "api.bling.scopeInsufficient";
    public static final String BLING_SCOPE_RATE_LIMIT = "api.bling.scopeRateLimit";
    public static final String BLING_HTTP_RESPONSE = "api.bling.httpResponse";
    public static final String BLING_TENANT_NO_TOKEN_GENERIC = "api.bling.tenantNoTokenGeneric";
    public static final String BLING_CONTACTS_NOT_FOUND = "api.bling.contactsNotFound";
    public static final String BLING_CONTACT_IMPORTED = "api.bling.contactImported";
    public static final String BLING_CONTACT_UPDATED = "api.bling.contactUpdated";
    public static final String BLING_SCOPE_CHECK_OK = "api.bling.scopeCheckOk";
    public static final String BLING_SCOPE_RECONNECT_HINT = "api.bling.scopeReconnectHint";

    public static final String WHATSAPP_NOT_ENABLED = "api.whatsapp.notEnabled";
    public static final String WHATSAPP_URL_NOT_CONFIGURED = "api.whatsapp.urlNotConfigured";
    public static final String WHATSAPP_TOKEN_NOT_CONFIGURED = "api.whatsapp.tokenNotConfigured";
    public static final String WHATSAPP_UNSUPPORTED_PROVIDER = "api.whatsapp.unsupportedProvider";
    public static final String WHATSAPP_SEND_FAILED_DEFAULT = "api.whatsapp.sendFailedDefault";
    public static final String WHATSAPP_API_UNAVAILABLE = "api.whatsapp.apiUnavailable";
    public static final String WHATSAPP_EVOLUTION_CONNECT_ERROR = "api.whatsapp.evolutionConnectError";
    public static final String WHATSAPP_EVOLUTION_TIMEOUT = "api.whatsapp.evolutionTimeout";
    public static final String WHATSAPP_EVOLUTION_SEND_FAILED = "api.whatsapp.evolutionSendFailed";
    public static final String WHATSAPP_TWILIO_SEND_FAILED = "api.whatsapp.twilioSendFailed";

    // Evolution API (WhatsApp multi-tenant)
    public static final String EVOLUTION_PLATFORM_DISABLED = "api.evolution.platformDisabled";
    public static final String EVOLUTION_PLATFORM_NOT_CONFIGURED = "api.evolution.platformNotConfigured";
    public static final String EVOLUTION_STATUS_CONNECTED = "api.evolution.statusConnected";
    public static final String EVOLUTION_STATUS_NOT_CONNECTED = "api.evolution.statusNotConnected";
    public static final String EVOLUTION_STATUS_NOT_ACTIVATED = "api.evolution.statusNotActivated";
    public static final String EVOLUTION_TENANT_NOT_CONFIGURED = "api.evolution.tenantNotConfigured";
    public static final String EVOLUTION_TOKEN_UNAVAILABLE = "api.evolution.tokenUnavailable";
    public static final String EVOLUTION_INSTANCE_DISCONNECTED = "api.evolution.instanceDisconnected";
    public static final String EVOLUTION_MEDIA_REQUIRED = "api.evolution.mediaRequired";
    public static final String EVOLUTION_ENQUEUE_FAILED = "api.evolution.enqueueFailed";
    public static final String EVOLUTION_JOB_PAYLOAD_INVALID = "api.evolution.jobPayloadInvalid";
    public static final String EVOLUTION_ADMIN_ONLY = "api.evolution.adminOnly";
    public static final String EVOLUTION_SERVICE_UNAVAILABLE = "api.evolution.serviceUnavailable";

    // FCU (serviço)
    public static final String FCU_NOT_FOUND_GENERIC = "api.fcu.notFoundGeneric";
    public static final String FCU_DEACTIVATE_NO_ROWS = "api.fcu.deactivateNoRows";
    public static final String FCU_DEACTIVATE_NO_ROWS_SIMPLE = "api.fcu.deactivateNoRowsSimple";
    public static final String FCU_DEACTIVATE_FAILED = "api.fcu.deactivateFailed";
    public static final String FCU_DTO_CONVERT_FAILED = "api.fcu.dtoConvertFailed";
    public static final String FCU_UPDATE_FIELDS_FAILED = "api.fcu.updateFieldsFailed";
    public static final String FCU_ID_REQUIRED = "api.fcu.idRequired";

    // Tipo de serviço
    public static final String TIPO_SERVICO_ID_REQUIRED = "api.tipoServico.idRequired";
    public static final String TIPO_SERVICO_DEACTIVATE_NO_ROWS = "api.tipoServico.deactivateNoRows";
    public static final String TIPO_SERVICO_RELOAD_FAILED = "api.tipoServico.reloadFailed";
    public static final String TIPO_SERVICO_DEACTIVATE_FAILED = "api.tipoServico.deactivateFailed";

    // OS — arquivos
    public static final String OS_FILE_LIST_FAILED = "api.os.fileListFailed";
    public static final String OS_FOLDER_CREATE_FAILED = "api.os.folderCreateFailed";
    public static final String OS_FOLDER_DIVERSOS_FAILED = "api.os.folderDiversosFailed";
    public static final String OS_FOLDER_DIVERSOS_OS_FAILED = "api.os.folderDiversosOsFailed";
    public static final String OS_FILE_READ_FAILED = "api.os.fileReadFailed";
    public static final String OS_CRS_NOT_EMITTED = "api.os.crsNotEmitted";

    // Estoque — QR
    public static final String ESTOQUE_QR_GENERATE_FAILED = "api.estoque.qrGenerateFailed";
    public static final String ESTOQUE_QR_IMAGE_FAILED = "api.estoque.qrImageFailed";

    // Atualização do sistema
    public static final String UPDATE_NOT_FOUND = "api.update.notFound";
    public static final String UPDATE_NOT_AVAILABLE = "api.update.notAvailable";
    public static final String UPDATE_USER_NOT_FOUND = "api.update.userNotFound";
    public static final String UPDATE_APPROVE_FORBIDDEN = "api.update.approveForbidden";
    public static final String UPDATE_DOWNLOAD_URL_NOT_CONFIGURED = "api.update.downloadUrlNotConfigured";

    // Billing
    public static final String BILLING_NOT_CONFIGURED = "api.billing.notConfigured";
    public static final String BILLING_PLATFORM_NO_CHECKOUT = "api.billing.platformNoCheckout";
    public static final String BILLING_MOCK_ONLY = "api.billing.mockOnly";
    public static final String BILLING_NOT_FOUND = "api.billing.notFound";
    public static final String BILLING_PAGARME_NOT_CONFIGURED = "api.billing.pagarmeNotConfigured";
    public static final String BILLING_PAGARME_WEBHOOK_NOT_CONFIGURED = "api.billing.pagarmeWebhookNotConfigured";
    public static final String BILLING_PAGARME_SESSION_FAILED = "api.billing.pagarmeSessionFailed";
    public static final String BILLING_PAGARME_REDIRECT = "api.billing.pagarmeRedirect";
    public static final String BILLING_PAGARME_SIGNATURE_INVALID = "api.billing.pagarmeSignatureInvalid";
    public static final String BILLING_PAGARME_PAYLOAD_INVALID = "api.billing.pagarmePayloadInvalid";
    public static final String BILLING_PAGARME_SIGNATURE_REQUIRED = "api.billing.pagarmeSignatureRequired";
    public static final String BLING_WEBHOOK_HOMOLOGATION_OK = "api.bling.webhookHomologationOk";
    public static final String BLING_WEBHOOK_HOMOLOGATION_FAILED = "api.bling.webhookHomologationFailed";
    public static final String BLING_WEBHOOK_DISABLED = "api.bling.webhookDisabled";
    public static final String BILLING_STRIPE_NOT_CONFIGURED = "api.billing.stripeNotConfigured";
    public static final String BILLING_STRIPE_INCOMPLETE = "api.billing.stripeIncomplete";
    public static final String BILLING_STRIPE_SESSION_FAILED = "api.billing.stripeSessionFailed";
    public static final String BILLING_STRIPE_WEBHOOK_NOT_CONFIGURED = "api.billing.stripeWebhookNotConfigured";
    public static final String BILLING_STRIPE_SIGNATURE_INVALID = "api.billing.stripeSignatureInvalid";
    public static final String BILLING_STRIPE_REDIRECT = "api.billing.stripeRedirect";
    public static final String BILLING_MOCK_SESSION = "api.billing.mockSession";

    // Certificado fiscal
    public static final String FISCAL_CERT_EMPTY = "api.fiscal.certEmpty";
    public static final String FISCAL_CERT_INVALID_PKCS12 = "api.fiscal.certInvalidPkcs12";
    public static final String FISCAL_CERT_INVALID_PASSWORD = "api.fiscal.certInvalidPassword";
    public static final String FISCAL_CERT_TYPE_REQUIRED = "api.fiscal.certTypeRequired";
    public static final String FISCAL_CERT_TYPE_INVALID = "api.fiscal.certTypeInvalid";
    public static final String FISCAL_CERT_PASSWORD_REQUIRED = "api.fiscal.certPasswordRequired";

    // Associação FCU / arquivos / templates
    public static final String ASSOCIACAO_FCU_NOT_FOUND = "api.associacaoFcu.notFound";
    public static final String ASSOCIACAO_FCU_ID_REQUIRED = "api.associacaoFcu.idRequired";
    public static final String ASSOCIACAO_NOT_FOUND = "api.associacao.notFound";
    public static final String FILE_NOT_FOUND = "api.file.notFound";
    public static final String FILE_DOCX_NOT_FOUND = "api.file.docxNotFound";
    public static final String TEMPLATE_NOT_FOUND = "api.template.notFound";

    // Gmail
    public static final String GMAIL_NOT_INITIALIZED = "api.gmail.notInitialized";
    public static final String GMAIL_SEND_FAILED = "api.gmail.sendFailed";

    // Studio (resíduos)
    public static final String STUDIO_LETTERHEAD_INVALID = "api.studio.letterheadInvalid";
    public static final String STUDIO_PDF_EMPTY = "api.studio.pdfEmpty";
    public static final String STUDIO_PDF_NO_PAGES = "api.studio.pdfNoPages";
    public static final String STUDIO_TOO_MANY_ELEMENTS = "api.studio.tooManyElements";
    public static final String STUDIO_GIF_WRITER_UNAVAILABLE = "api.studio.gifWriterUnavailable";

    // Diversos
    public static final String USER_PROFILE_NOT_FOUND_GENERIC = "api.user.profileNotFoundGeneric";
    public static final String DOSSIE_ID_OR_OS_REQUIRED = "api.dossie.idOrOsRequired";
    public static final String COMMON_BODY_REQUIRED = "api.common.bodyRequired";
    public static final String PUBLICACAO_ID_REQUIRED = "api.publicacao.idRequired";
    public static final String PUBLICACAO_FCU_ID_REQUIRED = "api.publicacao.fcuIdRequired";
    public static final String TENANT_FEATURE_UNKNOWN = "api.tenant.featureUnknown";
    public static final String JWT_INVALID_USER = "api.jwt.invalidUser";
    public static final String BARCODE_12_DIGITS_REQUIRED = "api.barcode.twelveDigitsRequired";
    public static final String GOLIVE_CHECKLIST_REQUIRED = "api.golive.checklistRequired";
    public static final String GOLIVE_TEMPLATE_NOT_FOUND = "api.golive.templateNotFound";
    public static final String GOLIVE_TEMPLATE_READ_FAILED = "api.golive.templateReadFailed";
    public static final String GOLIVE_IMPORT_NAME_REQUIRED = "goLive.import.error.nameRequired";
    public static final String GOLIVE_IMPORT_CLIENT_EMAIL_EXISTS = "goLive.import.error.clientEmailExists";
    public static final String GOLIVE_IMPORT_PN_REQUIRED = "goLive.import.error.pnRequired";
    public static final String GOLIVE_IMPORT_FCU_EXISTS = "goLive.import.error.fcuExists";
    public static final String GOLIVE_IMPORT_NAME_EMAIL_REQUIRED = "goLive.import.error.nameEmailRequired";
    public static final String GOLIVE_IMPORT_EMAIL_EXISTS = "goLive.import.error.emailExists";
    public static final String GOLIVE_IMPORT_WOULD_CREATE = "goLive.import.wouldCreate";
    public static final String GOLIVE_IMPORT_CREATED = "goLive.import.created";
    public static final String GOLIVE_IMPORT_RAZAO_SOCIAL_REQUIRED = "goLive.import.error.razaoSocialRequired";
    public static final String GOLIVE_IMPORT_FORNECEDOR_CODIGO_EXISTS = "goLive.import.error.fornecedorCodigoExists";
    public static final String GOLIVE_IMPORT_CURSO_REQUIRED = "goLive.import.error.cursoRequired";
    public static final String GOLIVE_IMPORT_USUARIO_NOT_FOUND = "goLive.import.error.usuarioNotFound";
    public static final String GOLIVE_IMPORT_DOC_CAMPOS_OBRIGATORIOS = "goLive.import.error.docCamposObrigatorios";
    public static final String GOLIVE_IMPORT_DOC_EXISTS = "goLive.import.error.docExists";
    public static final String GOLIVE_IMPORT_CALIB_ID_REQUIRED = "goLive.import.error.calibIdRequired";
    public static final String GOLIVE_IMPORT_CALIB_EXISTS = "goLive.import.error.calibExists";
    public static final String GOLIVE_IMPORT_NC_TITULO_REQUIRED = "goLive.import.error.ncTituloRequired";

    public static final String ESTOQUE_ENTRY_REGISTER_FAILED = "api.estoque.entryRegisterFailed";

    // Resíduos finais
    public static final String UPDATE_VERSION_DIR_CREATE_FAILED = "api.update.versionDirCreateFailed";
    public static final String UPDATE_BACKUP_DIR_NOT_WRITABLE = "api.update.backupDirNotWritable";
    public static final String UPDATE_INSTALLER_UNAVAILABLE = "api.update.installerUnavailable";
    public static final String UPDATE_INSTALL_DISABLED = "api.update.installDisabled";
    public static final String UPDATE_INSTALL_FAILED = "api.update.installFailed";
    public static final String UPDATE_EXECUTE_FAILED = "api.update.executeFailed";
    public static final String UPDATE_ZIP_NOT_FOUND = "api.update.zipNotFound";
    public static final String UPDATE_DOWNLOAD_ERROR = "api.update.downloadError";
    public static final String FUNCIONALIDADE_LIST_FAILED = "api.funcionalidade.listFailed";
    public static final String FUNCIONALIDADE_NOT_FOUND = "api.funcionalidade.notFound";
    public static final String FUNCIONALIDADE_FETCH_FAILED = "api.funcionalidade.fetchFailed";
    public static final String FUNCIONALIDADE_CREATE_FAILED = "api.funcionalidade.createFailed";
    public static final String FUNCIONALIDADE_UPDATE_FAILED = "api.funcionalidade.updateFailed";
    public static final String FUNCIONALIDADE_DEACTIVATE_FAILED = "api.funcionalidade.deactivateFailed";
    public static final String FUNCIONALIDADE_DEACTIVATED = "api.funcionalidade.deactivated";
    public static final String FUNCIONALIDADE_LIST_BY_PROFILE_FAILED = "api.funcionalidade.listByProfileFailed";
    public static final String FUNCIONALIDADE_LIST_BY_SECTION_FAILED = "api.funcionalidade.listBySectionFailed";
    public static final String FUNCIONALIDADE_MENU_BUILD_FAILED = "api.funcionalidade.menuBuildFailed";
    public static final String FUNCIONALIDADE_LIST_MENU_FAILED = "api.funcionalidade.listMenuFailed";
    public static final String FUNCIONALIDADE_LIST_BY_USER_FAILED = "api.funcionalidade.listByUserFailed";
    public static final String PERFIL_LIST_FAILED = "api.perfil.listFailed";
    public static final String PERFIL_FETCH_FAILED = "api.perfil.fetchFailed";
    public static final String PERFIL_CREATE_FAILED = "api.perfil.createFailed";
    public static final String PERFIL_UPDATE_FAILED = "api.perfil.updateFailed";
    public static final String PERFIL_DEACTIVATE_FAILED = "api.perfil.deactivateFailed";
    public static final String PERFIL_DEACTIVATED = "api.perfil.deactivated";
    public static final String PERFIL_ASSIGN_FUNCIONALIDADES_FAILED = "api.perfil.assignFuncionalidadesFailed";
    public static final String PERFIL_LIST_FUNCIONALIDADES_FAILED = "api.perfil.listFuncionalidadesFailed";
    public static final String PUBLICACAO_CREATE_FAILED = "api.publicacao.createFailed";
    public static final String PUBLICACAO_UPDATE_FAILED = "api.publicacao.updateFailed";
    public static final String PUBLICACAO_DELETE_FAILED = "api.publicacao.deleteFailed";
    public static final String PUBLICACAO_FETCH_FCU_FAILED = "api.publicacao.fetchFcuFailed";
    public static final String PUBLICACAO_FETCH_FCUS_FAILED = "api.publicacao.fetchFcusFailed";
    public static final String PUBLICACAO_FETCH_PUBLICACOES_FAILED = "api.publicacao.fetchPublicacoesFailed";
    public static final String PUBLICACAO_CREATE_ASSOCIATION_FAILED = "api.publicacao.createAssociationFailed";
    public static final String PUBLICACAO_ASSOCIATE_FCUS_FAILED = "api.publicacao.associateFcusFailed";
    public static final String SECRET_ENCRYPT_FAILED = "api.secret.encryptFailed";
    public static final String SECRET_DECRYPT_FAILED = "api.secret.decryptFailed";
    public static final String BLING_HMAC_FAILED = "api.bling.hmacFailed";
    public static final String USER_PHOTO_FOLDER_CREATE_FAILED = "api.user.photoFolderCreateFailed";
    public static final String PUBLICACAO_NOT_FOUND = "api.publicacao.notFound";
    public static final String PERFIL_NOT_FOUND = "api.perfil.notFound";
    public static final String FCU_ASSEMBLY_EXPORT_PDF_FAILED = "api.fcuAssembly.exportPdfFailed";
    public static final String FCU_ASSEMBLY_NOT_FOUND = "api.fcuAssembly.notFound";
    public static final String FCU_ASSEMBLY_SAVE_FAILED = "api.fcuAssembly.saveFailed";
    public static final String FCU_ASSEMBLY_LOAD_FAILED = "api.fcuAssembly.loadFailed";
    public static final String FCU_ASSEMBLY_FILE_REQUIRED = "api.fcuAssembly.fileRequired";
    public static final String DELEGACAO_FIELDS_REQUIRED = "api.delegacao.fieldsRequired";
    public static final String DELEGACAO_NOT_FOUND = "api.delegacao.notFound";
    public static final String DELEGACAO_GRANTEE_ID_REQUIRED = "api.delegacao.granteeIdRequired";
    public static final String CLIENTE_NOT_FOUND = "api.cliente.notFound";
    public static final String BARCODE_EMPTY = "api.barcode.empty";
    public static final String BARCODE_CODE128_IMAGE_FAILED = "api.barcode.code128ImageFailed";
    public static final String BARCODE_INVALID_13_DIGITS = "api.barcode.invalid13Digits";
    public static final String BARCODE_IMAGE_FAILED = "api.barcode.imageFailed";
    public static final String CHAMADA_ALREADY_IN_CALL = "api.chamada.alreadyInCall";
    public static final String CHAMADA_NOT_FOUND = "api.chamada.notFound";
    public static final String CHAMADA_CANNOT_ANSWER = "api.chamada.cannotAnswer";
    public static final String CHAMADA_NOT_AVAILABLE = "api.chamada.notAvailable";
    public static final String CHAMADA_CANNOT_REJECT = "api.chamada.cannotReject";
    public static final String CHAMADA_CANNOT_END = "api.chamada.cannotEnd";
    public static final String CHAMADA_INICIAR_FIELDS_REQUIRED = "api.chamada.iniciarFieldsRequired";
    public static final String CHAMADA_RECEPTOR_ID_REQUIRED = "api.chamada.receptorIdRequired";
    public static final String CHAMADA_OPERATION_FAILED = "api.chamada.operationFailed";
    public static final String CHAMADA_VOICE_DISABLED = "api.chamada.voiceDisabled";
    public static final String TP_FILES_LIST_FAILED = "api.tpFiles.listFailed";
    public static final String TP_FILES_FIND_FAILED = "api.tpFiles.findFailed";
    public static final String TP_FILES_CREATE_FAILED = "api.tpFiles.createFailed";
    public static final String TP_FILES_UPDATE_FAILED = "api.tpFiles.updateFailed";
    public static final String TP_FILES_INACTIVATE_FAILED = "api.tpFiles.inactivateFailed";
    public static final String TP_FILES_DEACTIVATE_FAILED = "api.tpFiles.deactivateFailed";
    public static final String TP_FILES_FIND_BY_TIPO_SERVICO_FAILED = "api.tpFiles.findByTipoServicoFailed";
    public static final String AUDIT_FETCH_HISTORY_FAILED = "api.audit.fetchHistoryFailed";
    public static final String AUDIT_FETCH_FAILED = "api.audit.fetchFailed";
    public static final String OS_NOT_FOUND = "api.os.notFound";
    public static final String OS_NOT_FOUND_BY_ID = "api.os.notFoundById";
    public static final String OS_NOT_FOUND_BY_ID_OS = "api.os.notFoundByIdOs";
    public static final String OS_LIST_FAILED = "api.os.listFailed";
    public static final String OS_UPDATE_FAILED = "api.os.updateFailed";
    public static final String OS_REGISTRO_ENCERRADO = "api.os.registroEncerrado";
    public static final String OS_REABERTURA_PERFIL_NEGADO = "api.os.reaberturaPerfilNegado";
    public static final String OS_REABERTURA_JUSTIFICATIVA_OBRIGATORIA = "api.os.reaberturaJustificativaObrigatoria";
    public static final String OS_REABERTURA_NAO_NECESSARIA = "api.os.reaberturaNaoNecessaria";
    public static final String OS_REABERTURA_SUCESSO = "api.os.reaberturaSucesso";
    public static final String OS_TAREFA_DT_INVALIDO = "api.os.tarefaDadoTecnico.invalido";
    public static final String OS_TAREFA_DT_TIPO_OBRIGATORIO = "api.os.tarefaDadoTecnico.tipoObrigatorio";
    public static final String OS_TAREFA_DT_TIPO_INVALIDO = "api.os.tarefaDadoTecnico.tipoInvalido";
    public static final String OS_TAREFA_DT_DESCRICAO_OBRIGATORIA = "api.os.tarefaDadoTecnico.descricaoObrigatoria";
    public static final String OS_TAREFA_DT_AD_OBRIGATORIO = "api.os.tarefaDadoTecnico.adObrigatorio";
    public static final String OS_TAREFA_DT_MANUAL_OBRIGATORIO = "api.os.tarefaDadoTecnico.manualObrigatorio";
    public static final String OS_TAREFA_DT_REF_OBRIGATORIA = "api.os.tarefaDadoTecnico.referenciaObrigatoria";
    public static final String OS_TAREFA_DT_AD_NAO_ENCONTRADO = "api.os.tarefaDadoTecnico.adNaoEncontrado";
    public static final String OS_TAREFA_DT_MANUAL_NAO_ENCONTRADO = "api.os.tarefaDadoTecnico.manualNaoEncontrado";
    public static final String OS_TAREFA_DT_LIMITE = "api.os.tarefaDadoTecnico.limiteExcedido";
    public static final String OS_DEACTIVATE_FAILED = "api.os.deactivateFailed";
    public static final String OS_KIT_FCU_DEFICIT_LIST_FAILED = "api.os.kitFcuDeficitListFailed";
    public static final String OS_FILE_UPLOAD_FAILED = "api.os.fileUploadFailed";
    public static final String OS_FILE_LIST_OS_FAILED = "api.os.fileListOsFailed";
    public static final String OS_FILE_ASSOCIATE_FAILED = "api.os.fileAssociateFailed";
    public static final String OS_FILE_REMOVE_FAILED = "api.os.fileRemoveFailed";
    public static final String OS_FILE_PROCESS_FAILED = "api.os.fileProcessFailed";
    public static final String OS_FILE_GET_FAILED = "api.os.fileGetFailed";
    public static final String OS_FILE_LIST_DIVERSOS_FAILED = "api.os.fileListDiversosFailed";
    public static final String OS_FILE_PHYSICAL_NOT_FOUND = "api.os.filePhysicalNotFound";
    public static final String OS_FILE_NO_FILES_SENT = "api.os.fileNoFilesSent";
    public static final String OS_FILE_EMPTY_LIST = "api.os.fileEmptyList";
    public static final String OS_FILE_UPLOAD_SUCCESS = "api.os.fileUploadSuccess";
    public static final String OS_FILE_ASSOCIATE_SUCCESS = "api.os.fileAssociateSuccess";
    public static final String OS_FILE_UPLOAD_DIVERSOS_SUCCESS = "api.os.fileUploadDiversosSuccess";
    public static final String OS_FILE_UPLOAD_OS_DIVERSOS_SUCCESS = "api.os.fileUploadOsDiversosSuccess";
    public static final String USER_ASSOCIATE_PROFILE_FAILED = "api.user.associateProfileFailed";
    public static final String USER_DELETE_FAILED = "api.user.deleteFailed";
    public static final String LOGO_LOAD_FAILED = "api.logo.loadFailed";
    public static final String PROPOSTA_PRINT_HTML_FAILED = "api.proposta.printHtmlFailed";
    public static final String FCU_UPDATE_FAILED = "api.fcu.updateFailed";
    public static final String FCU_UPDATE_INTERNAL_FAILED = "api.fcu.updateInternalFailed";
    public static final String ASSOCIACAO_FCU_FETCH_PRODUCTS_FAILED = "api.associacaoFcu.fetchProductsFailed";
    public static final String CLIENTE_NOT_FOUND_GENERIC = "api.cliente.notFoundGeneric";
    public static final String CLIENTE_CREATE_FAILED = "api.cliente.createFailed";
    public static final String MANUAL_INVALID_FILENAME = "api.manual.invalidFilename";
    public static final String MANUAL_NOT_FOUND = "api.manual.notFound";
    public static final String MANUAL_READ_FAILED = "api.manual.readFailed";
    public static final String ESTOQUE_MIN_BATCH_LINE_REQUIRED = "api.estoque.minBatchLineRequired";
    public static final String ESTOQUE_ITEM_NOT_FOUND = "api.estoque.itemNotFound";
    public static final String ESTOQUE_ITEM_NOT_FOUND_BY_CODE = "api.estoque.itemNotFoundByCode";
    public static final String ESTOQUE_NO_ITEMS_BY_PN = "api.estoque.noItemsByPartNumber";
    public static final String ESTOQUE_QR_URL_RESOLVE_FAILED = "api.estoque.qrUrlResolveFailed";
    public static final String ESTOQUE_PUBLIC_QUERY_FAILED = "api.estoque.publicQueryFailed";
    public static final String BILLING_STRIPE_SIGNATURE_REQUIRED = "api.billing.stripeSignatureRequired";
    public static final String FILE_NOT_FOUND_GENERIC = "api.file.notFoundGeneric";

    // Admin setup (dev)
    public static final String ADMIN_SETUP_ASSOCIATE_SUCCESS = "api.adminSetup.associateSuccess";
    public static final String ADMIN_SETUP_ASSOCIATE_FAILED = "api.adminSetup.associateFailed";

    // Email test (admin)
    public static final String EMAIL_TEST_ADMIN_ONLY = "api.email.test.adminOnly";
    public static final String EMAIL_TEST_DESTINATION_REQUIRED = "api.email.test.destinationRequired";
    public static final String EMAIL_TEST_DESTINATION_FORMAT_HINT = "api.email.test.destinationFormatHint";
    public static final String EMAIL_TEST_INVALID_FORMAT = "api.email.test.invalidFormat";
    public static final String EMAIL_TEST_SENT_SUCCESS = "api.email.test.sentSuccess";
    public static final String EMAIL_TEST_CHECK_INBOX = "api.email.test.checkInbox";
    public static final String EMAIL_TEST_SEND_FAILED = "api.email.test.sendFailed";
    public static final String EMAIL_TEST_ANALYSIS_AUTH = "api.email.test.analysisAuth";
    public static final String EMAIL_TEST_ANALYSIS_AUTH_CAUSES = "api.email.test.analysisAuthCauses";
    public static final String EMAIL_TEST_ANALYSIS_CONNECTION = "api.email.test.analysisConnection";
    public static final String EMAIL_TEST_ANALYSIS_CONNECTION_CAUSES = "api.email.test.analysisConnectionCauses";
    public static final String EMAIL_TEST_ANALYSIS_TLS = "api.email.test.analysisTls";
    public static final String EMAIL_TEST_ANALYSIS_TLS_CAUSES = "api.email.test.analysisTlsCauses";
    public static final String EMAIL_TEST_ANALYSIS_UNKNOWN = "api.email.test.analysisUnknown";
    public static final String EMAIL_TEST_ANALYSIS_UNKNOWN_CAUSES = "api.email.test.analysisUnknownCauses";
    public static final String EMAIL_TEST_INSTRUCTIONS_POST = "api.email.test.instructionsPost";
    public static final String EMAIL_TEST_INSTRUCTIONS_SCRIPT = "api.email.test.instructionsScript";

    // WhatsApp test (dev)
    public static final String WHATSAPP_TEST_PHONE_REQUIRED = "api.whatsapp.test.phoneRequired";
    public static final String WHATSAPP_TEST_SENT_SUCCESS = "api.whatsapp.test.sentSuccess";
    public static final String WHATSAPP_TEST_UNKNOWN_FAILURE = "api.whatsapp.test.unknownFailure";
    public static final String WHATSAPP_TEST_SEND_ERROR = "api.whatsapp.test.sendError";

    // System update
    public static final String UPDATE_USER_ID_REQUIRED = "api.update.userIdRequired";

    // Dev fix endpoints
    public static final String DEV_FIX_DATABASE_SUCCESS = "api.dev.fix.databaseSuccess";
    public static final String DEV_FIX_DATABASE_ERROR = "api.dev.fix.databaseError";
    public static final String DEV_FIX_CHECK_ERROR = "api.dev.fix.checkError";
    public static final String DEV_FIX_PROFILES_EXIST = "api.dev.fix.profilesExist";
    public static final String DEV_FIX_PROFILES_INSERTED = "api.dev.fix.profilesInserted";
    public static final String DEV_FIX_INSERT_PROFILES_ERROR = "api.dev.fix.insertProfilesError";
    public static final String DEV_FIX_ADD_COLUMNS_ERROR = "api.dev.fix.addColumnsError";

    /** Encodes a domain/module i18n key (ex. {@code hangar.error.foo}, {@code proposta.anexo.error.bar}). */
    public static String domain(String key) {
        return I18nMessageCodec.encode(key);
    }

    public static String encode(String key) {
        return I18nMessageCodec.encode(key);
    }

    public static String encode(String key, String paramKey, String paramValue) {
        return I18nMessageCodec.encode(key, paramKey, paramValue);
    }

    public static String encode(String key, java.util.Map<String, String> params) {
        return I18nMessageCodec.encode(key, params);
    }

    /** Usa mensagem já codificada ou envolve texto bruto como parâmetro `detail`. */
    public static String withDetail(String key, String detail) {
        if (detail != null && I18nMessageCodec.isEncoded(detail)) {
            return detail;
        }
        if (detail != null && !detail.isBlank()) {
            return I18nMessageCodec.encode(key, "detail", detail);
        }
        return I18nMessageCodec.encode(key);
    }

    public static String messageOrFallback(String fallbackKey, String raw) {
        if (raw != null && I18nMessageCodec.isEncoded(raw)) {
            return raw;
        }
        return withDetail(fallbackKey, raw);
    }
}
