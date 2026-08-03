package com.aerosuite.service;

import com.aerosuite.domain.SistemaEmpresaConfig;
import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.*;
import com.aerosuite.model.Perfil;
import com.aerosuite.repository.UsuarioRepository;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.PasswordCredentials;
import com.aerosuite.security.PasswordPolicyValidator;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.util.PasswordGenerator;
import com.aerosuite.util.ServerUrlUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@ApplicationScoped
public class TenantProvisioningService {

    private static final Pattern CODIGO_PATTERN = Pattern.compile("^[a-z0-9][a-z0-9_-]{1,62}$");

    @Inject
    TenantDataAccess tenantDataAccess;
    @Inject
    InternalUserContext internalUserContext;
    @Inject
    EntityManager entityManager;
    @Inject
    UsuarioRepository usuarioRepository;
    @Inject
    EmailService emailService;
    @Inject
    AuthService authService;
    @Inject
    ServerUrlUtil serverUrlUtil;
    @Inject
    TenantHibernateScope tenantHibernateScope;
    @Inject
    TenantModuleService tenantModuleService;
    @Inject
    TenantBillingService tenantBillingService;
    @Inject
    EmpresaAssetService empresaAssetService;
    @Inject
    TenantFeatureService tenantFeatureService;

    public TenantDto toPublicTenantDto(long tenantId) {
        return toDto(requireTenant(tenantId));
    }

    public void requirePlatformOperator() {
        if (tenantDataAccess.currentTenantId() != TenantConstants.DEFAULT_TENANT_ID) {
            throw new ForbiddenException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_PROVISIONING_FORBIDDEN));
        }
    }

    public TenantListResponse listTenantsWithSummary() {
        requirePlatformOperator();
        @SuppressWarnings("unchecked")
        List<Tenant> all = (List<Tenant>) (List<?>) Tenant.listAll();
        TenantStatsDto platformTotal = aggregatePlatformStats();
        List<TenantSummaryDto> items = all.stream().map(t -> toSummary(t, platformTotal)).toList();
        return new TenantListResponse(items, platformTotal);
    }

    public TenantDetailDto getTenantDetail(long id) {
        requirePlatformOperator();
        Tenant t = requireTenant(id);
        TenantDetailDto d = new TenantDetailDto();
        d.id = t.id;
        d.codigo = t.codigo;
        d.nome = t.nome;
        d.ativo = t.ativo;
        d.createdAt = t.createdAt;
        d.stats = loadStats(t.id);
        d.statsPlatformTotal = aggregatePlatformStats();
        fillConfigFields(d, t.id);
        d.modulosHabilitados = tenantModuleService.enabledModulesList(t.id);
        d.tenantFeatures = tenantFeatureService.adminView(t.id).items;
        return d;
    }

    public TenantFeaturesAdminDto getTenantFeatures(long id) {
        requirePlatformOperator();
        requireTenant(id);
        return tenantFeatureService.adminView(id);
    }

    public TenantFeaturesAdminDto updateTenantFeatures(long id, UpdateTenantFeaturesRequest request) {
        requirePlatformOperator();
        requireTenant(id);
        Integer userId = internalUserContext.getUserId();
        return tenantFeatureService.applyEnabled(
                id, request != null ? request.enabled : null, userId);
    }

    public CodigoAvailabilityDto checkCodigoAvailability(String codigoRaw) {
        requirePlatformOperator();
        if (codigoRaw == null || codigoRaw.isBlank()) {
            return new CodigoAvailabilityDto("", false, "EMPTY", null);
        }
        String codigo = normalizeCodigo(codigoRaw);
        if (!CODIGO_PATTERN.matcher(codigo).matches()) {
            return new CodigoAvailabilityDto(codigo, false, "INVALID_FORMAT", suggestCodigo(codigoRaw));
        }
        if (TenantConstants.DEFAULT_CODIGO.equals(codigo)) {
            return new CodigoAvailabilityDto(codigo, false, "RESERVED", suggestCodigo(codigoRaw + "-org"));
        }
        if (Tenant.find("codigo = ?1", codigo).firstResult() != null) {
            return new CodigoAvailabilityDto(codigo, false, "TAKEN", suggestCodigo(codigo + "-2"));
        }
        return new CodigoAvailabilityDto(codigo, true, null, null);
    }

    @Transactional
    public ProvisionTenantResponse provision(CreateTenantRequest req) {
        requirePlatformOperator();
        validateCreate(req);
        String codigo = normalizeCodigo(req.codigo);

        final String tenantNome = req.nome.trim();
        final long newTenantId = tenantHibernateScope.createTenantRow(codigo, tenantNome);
        Tenant created = Tenant.findById(newTenantId);
        tenantModuleService.applyModulos(created, req.modulosHabilitados);
        created.persist();
        final String[] generatedHolder = { null };
        tenantHibernateScope.runInNewTransaction(newTenantId, () -> {
            tenantBillingService.initBillingForNewTenant(newTenantId, false);
            createDefaultEmpresaConfig(req, tenantNome, codigo, newTenantId);
            if (req.adminEmail != null && !req.adminEmail.isBlank()) {
                generatedHolder[0] = createInitialAdmin(req, newTenantId);
            }
        });

        String adminSenhaTemporaria = generatedHolder[0];
        boolean senhaGerada = adminSenhaTemporaria != null;
        Integer adminUserId = null;
        String adminEmail = null;
        boolean adminCreated = false;

        if (req.adminEmail != null && !req.adminEmail.isBlank()) {
            String emailNorm = req.adminEmail.trim().toLowerCase(Locale.ROOT);
            Usuario admin = usuarioRepository.findByEmailAndOrgTenantId(emailNorm, newTenantId);
            if (admin != null) {
                adminUserId = admin.id;
                adminEmail = admin.email;
                adminCreated = true;
            }
        }

        boolean welcomeEmailSent = false;
        if (adminCreated && shouldSendWelcome(req)) {
            String nomeAdmin = req.adminNome != null && !req.adminNome.isBlank()
                    ? req.adminNome.trim()
                    : "Administrador";
            Tenant tenant = requireTenant(newTenantId);
            welcomeEmailSent = dispatchWelcomeEmail(tenant, adminEmail, nomeAdmin, adminSenhaTemporaria);
        }

        return new ProvisionTenantResponse(
                toDto(requireTenant(newTenantId)),
                adminUserId,
                adminEmail,
                adminCreated,
                adminSenhaTemporaria,
                senhaGerada,
                welcomeEmailSent);
    }

    @Transactional
    public TenantSummaryDto updateTenant(long id, UpdateTenantRequest req) {
        requirePlatformOperator();
        Tenant t = requireTenant(id);
        if (req == null) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_INVALID_REQUEST_BODY));
        }
        if (req.nome != null && !req.nome.isBlank()) {
            t.nome = req.nome.trim();
        }
        if (req.ativo != null) {
            if (TenantConstants.DEFAULT_TENANT_ID == t.id && !req.ativo) {
                throw new BadRequestException(
                        com.aerosuite.i18n.ApiI18nMessages.encode(
                                com.aerosuite.i18n.ApiI18nMessages.TENANT_CANNOT_SUSPEND_DEFAULT));
            }
            t.ativo = req.ativo;
        }
        if (req.modulosHabilitados != null) {
            tenantModuleService.applyModulos(t, req.modulosHabilitados);
        }
        if (req.featuresHabilitadas != null) {
            tenantFeatureService.applyEnabled(t.id, req.featuresHabilitadas, internalUserContext.getUserId());
        }
        if (req.displayName != null || req.supportEmail != null) {
            runAsTenant(t.id, () -> updateEmpresaConfig(t.id, req));
        }
        return toSummary(t, aggregatePlatformStats());
    }

    @Transactional
    public WelcomeEmailResponse resendWelcomeEmail(long tenantId, WelcomeEmailRequest req) {
        requirePlatformOperator();
        Tenant tenant = requireTenant(tenantId);
        WelcomeEmailRequest body = req != null ? req : new WelcomeEmailRequest();

        Usuario admin = resolveAdminForWelcome(tenant.id, body.adminEmail);
        if (admin == null) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_NO_ADMIN_FOUND));
        }

        String plainPassword = null;
        if (body.resetAdminPassword) {
            plainPassword = PasswordGenerator.generateSecurePassword();
            admin.senha = PasswordCredentials.hash(plainPassword);
            admin.precisaTrocarSenha = true;
            admin.persist();
        }

        boolean sent = dispatchWelcomeEmail(tenant, admin.email, admin.nome, plainPassword);
        return new WelcomeEmailResponse(
                sent,
                admin.email,
                sent
                        ? com.aerosuite.i18n.ApiI18nMessages.encode(
                                com.aerosuite.i18n.ApiI18nMessages.TENANT_WELCOME_EMAIL_SENT)
                        : com.aerosuite.i18n.ApiI18nMessages.encode(
                                com.aerosuite.i18n.ApiI18nMessages.TENANT_WELCOME_EMAIL_FAILED),
                plainPassword);
    }

    private boolean shouldSendWelcome(CreateTenantRequest req) {
        return req.sendWelcomeEmail == null || Boolean.TRUE.equals(req.sendWelcomeEmail);
    }

    private boolean dispatchWelcomeEmail(
            Tenant tenant, String adminEmail, String adminNome, String senhaTemporaria) {
        if (adminEmail == null || adminEmail.isBlank()) {
            return false;
        }
        try {
            String token = authService.createPasswordSetupToken(adminEmail, tenant.id);
            String frontendUrl = serverUrlUtil.getFrontendUrl();
            String loginUrl = frontendUrl + "/login";
            String setupUrl = frontendUrl + "/setup-password?token=" + token;
            Usuario admin = resolveAdminForWelcome(
                    tenant.id != null ? tenant.id : com.aerosuite.domain.TenantConstants.DEFAULT_TENANT_ID,
                    adminEmail);
            String locale = com.aerosuite.i18n.UserLocaleResolver.resolve(admin);
            return emailService.sendOrganizationWelcomeEmail(
                    adminEmail,
                    adminNome != null ? adminNome : "Administrador",
                    tenant.nome,
                    tenant.codigo,
                    loginUrl,
                    senhaTemporaria,
                    setupUrl,
                    locale);
        } catch (Exception e) {
            return false;
        }
    }

    private Usuario resolveAdminForWelcome(long orgTenantId, String emailHint) {
        if (emailHint != null && !emailHint.isBlank()) {
            return usuarioRepository.findByEmailAndOrgTenantId(
                    emailHint.trim().toLowerCase(Locale.ROOT), orgTenantId);
        }
        Usuario admin = Usuario.find(
                        "orgTenantId = ?1 and ativo = true and perfil.codigo = ?2",
                        orgTenantId,
                        "ADMIN")
                .firstResult();
        if (admin != null) {
            return admin;
        }
        return Usuario.find("orgTenantId = ?1 and ativo = true", orgTenantId).firstResult();
    }

    private void validateCreate(CreateTenantRequest req) {
        if (req == null || req.codigo == null || req.codigo.isBlank()) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_CODE_REQUIRED));
        }
        if (req.nome == null || req.nome.isBlank()) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_NAME_REQUIRED));
        }
        String codigo = normalizeCodigo(req.codigo);
        if (!CODIGO_PATTERN.matcher(codigo).matches()) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_INVALID_CODE_FORMAT));
        }
        if (TenantConstants.DEFAULT_CODIGO.equals(codigo)) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_RESERVED_CODE, "codigo", codigo));
        }
        if (Tenant.find("codigo = ?1", codigo).firstResult() != null) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_CODE_IN_USE, "codigo", codigo));
        }
        if (req.adminSenha != null && !req.adminSenha.isBlank()) {
            PasswordPolicyValidator.requireValid(req.adminSenha);
        }
    }

    private Tenant requireTenant(long id) {
        Tenant t = Tenant.findById(id);
        if (t == null) {
            throw new NotFoundException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_NOT_FOUND, "id", String.valueOf(id)));
        }
        return t;
    }

    private TenantSummaryDto toSummary(Tenant t, TenantStatsDto ignoredPlatformTotal) {
        TenantSummaryDto s = new TenantSummaryDto();
        s.id = t.id;
        s.codigo = t.codigo;
        s.nome = t.nome;
        s.ativo = t.ativo;
        s.stats = loadStats(t.id);
        fillConfigOnSummary(s, t.id);
        return s;
    }

    private void fillConfigOnSummary(TenantSummaryDto s, long tenantId) {
        SistemaEmpresaConfig cfg = findEmpresaConfig(tenantId);
        if (cfg != null) {
            s.displayName = cfg.displayName;
            s.supportEmail = cfg.supportEmail;
        }
    }

    private void fillConfigFields(TenantDetailDto d, long tenantId) {
        SistemaEmpresaConfig cfg = findEmpresaConfig(tenantId);
        if (cfg != null) {
            d.displayName = cfg.displayName;
            d.supportEmail = cfg.supportEmail;
            d.copyrightEntity = cfg.copyrightEntity;
        }
    }

    private SistemaEmpresaConfig findEmpresaConfig(long tenantId) {
        final SistemaEmpresaConfig[] holder = { null };
        runAsTenant(tenantId, () -> {
            holder[0] = SistemaEmpresaConfig.find(
                            "tenantId", TenantConstants.tenantIdOf(tenantId))
                    .firstResult();
        });
        return holder[0];
    }

    private void updateEmpresaConfig(long tenantId, UpdateTenantRequest req) {
        SistemaEmpresaConfig cfg = SistemaEmpresaConfig.find(
                        "tenantId", TenantConstants.tenantIdOf(tenantId))
                .firstResult();
        if (cfg == null) {
            cfg = new SistemaEmpresaConfig();
            cfg.tenantId = TenantConstants.tenantIdOf(tenantId);
            cfg.displayName = "";
            cfg.supportEmail = "";
        }
        if (req.displayName != null && !req.displayName.isBlank()) {
            cfg.displayName = req.displayName.trim();
            cfg.copyrightEntity = cfg.displayName;
        }
        if (req.supportEmail != null && !req.supportEmail.isBlank()) {
            cfg.supportEmail = req.supportEmail.trim();
        }
        cfg.persist();
    }

    private TenantStatsDto loadStats(long tenantId) {
        long usuarios = countNative(
                "SELECT COUNT(*) FROM usuario WHERE tenant_id = ?1 AND (ativo IS NULL OR ativo = 1)", tenantId);
        long externos = countNative(
                "SELECT COUNT(*) FROM usuario_externo WHERE tenant_id = ?1 AND (ativo IS NULL OR ativo = 1)",
                tenantId);
        long os = countNative(
                "SELECT COUNT(*) FROM os WHERE tenant_id = ?1 AND (is_active IS NULL OR is_active = 1)", tenantId);
        long propostas = countNative(
                "SELECT COUNT(*) FROM proposta_comercial WHERE tenant_id = ?1", tenantId);
        return new TenantStatsDto(usuarios, externos, os, propostas);
    }

    private TenantStatsDto aggregatePlatformStats() {
        long usuarios = countNative(
                "SELECT COUNT(*) FROM usuario WHERE (ativo IS NULL OR ativo = 1)", null);
        long externos = countNative(
                "SELECT COUNT(*) FROM usuario_externo WHERE (ativo IS NULL OR ativo = 1)", null);
        long os = countNative(
                "SELECT COUNT(*) FROM os WHERE (is_active IS NULL OR is_active = 1)", null);
        long propostas = countNative("SELECT COUNT(*) FROM proposta_comercial", null);
        return new TenantStatsDto(usuarios, externos, os, propostas);
    }

    private long countNative(String sql, Long tenantId) {
        var q = entityManager.createNativeQuery(sql);
        if (tenantId != null) {
            q.setParameter(1, tenantId);
        }
        Object r = q.getSingleResult();
        return r instanceof Number n ? n.longValue() : 0L;
    }

    private void createDefaultEmpresaConfig(
            CreateTenantRequest req, String tenantNome, String tenantCodigo, long orgTenantId) {
        SistemaEmpresaConfig cfg = new SistemaEmpresaConfig();
        cfg.tenantId = TenantConstants.tenantIdOf(orgTenantId);
        cfg.displayName = req.displayName != null && !req.displayName.isBlank()
                ? req.displayName.trim()
                : tenantNome;
        cfg.supportEmail = req.supportEmail != null && !req.supportEmail.isBlank()
                ? req.supportEmail.trim()
                : "contato@" + tenantCodigo + ".local";
        cfg.copyrightEntity = cfg.displayName;
        cfg.logoUrl = EmpresaAssetService.publicLogoUrlForTenantCodigo(tenantCodigo);
        cfg.persist();
    }

    @Transactional
    public void uploadTenantLogo(long tenantId, org.jboss.resteasy.reactive.multipart.FileUpload file) {
        requirePlatformOperator();
        Tenant t = requireTenant(tenantId);
        if (file == null || file.uploadedFile() == null) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_FILE_REQUIRED));
        }
        try {
            String logoUrl = empresaAssetService.saveLogoForTenant(tenantId, file);
            runAsTenant(tenantId, () -> {
                SistemaEmpresaConfig cfg = SistemaEmpresaConfig.find(
                                "tenantId", TenantConstants.tenantIdOf(tenantId))
                        .firstResult();
                if (cfg != null) {
                    cfg.logoUrl = logoUrl;
                    cfg.persist();
                }
            });
        } catch (java.io.IOException e) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.withDetail(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_LOGO_SAVE_FAILED, e.getMessage()));
        }
    }

    private String createInitialAdmin(CreateTenantRequest req, long orgTenantId) {
        String emailNorm = req.adminEmail.trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.findByEmailAndOrgTenantId(emailNorm, orgTenantId) != null) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_ADMIN_EMAIL_EXISTS, "email", emailNorm));
        }
        Perfil perfilAdmin = entityManager
                .createQuery("SELECT p FROM Perfil p WHERE p.codigo = :codigo AND p.ativo = true", Perfil.class)
                .setParameter("codigo", "ADMIN")
                .getResultStream()
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        com.aerosuite.i18n.ApiI18nMessages.encode(
                                com.aerosuite.i18n.ApiI18nMessages.TENANT_ADMIN_PROFILE_NOT_FOUND)));

        Usuario admin = new Usuario();
        admin.email = emailNorm;
        admin.nome = req.adminNome != null && !req.adminNome.isBlank()
                ? req.adminNome.trim()
                : "Administrador";
        admin.orgTenantId = orgTenantId;
        admin.perfil = perfilAdmin;
        admin.ativo = true;
        admin.dataCadastro = LocalDate.now();
        admin.precisaTrocarSenha = true;
        boolean autoGen = req.adminSenha == null || req.adminSenha.isBlank();
        String senha = autoGen ? PasswordGenerator.generateSecurePassword() : req.adminSenha;
        admin.senha = PasswordCredentials.hash(senha);
        admin.persist();
        return autoGen ? senha : null;
    }

    private void runAsTenant(long tenantId, Runnable action) {
        internalUserContext.setProvisioningTenant(tenantId);
        try {
            action.run();
        } finally {
            internalUserContext.clearProvisioningTenant();
        }
    }

    private static String suggestCodigo(String base) {
        String s = base.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (s.length() < 2) {
            s = "org-" + System.currentTimeMillis() % 10000;
        }
        if (s.length() > 62) {
            s = s.substring(0, 62).replaceAll("-+$", "");
        }
        return s;
    }

    private static String normalizeCodigo(String codigo) {
        return codigo.trim().toLowerCase(Locale.ROOT);
    }

    private TenantDto toDto(Tenant t) {
        TenantDto d = new TenantDto(t.id, t.codigo, t.nome, t.ativo);
        d.modulosHabilitados = tenantModuleService.enabledModulesList(t.id);
        return d;
    }
}
