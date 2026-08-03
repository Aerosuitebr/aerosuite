package com.aerosuite.service;

import com.aerosuite.domain.SistemaEmpresaConfig;
import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.LgpdAceiteRequest;
import com.aerosuite.dto.ProvisionTenantResponse;
import com.aerosuite.dto.TenantDto;
import com.aerosuite.dto.TrialSignupRequest;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.p1.LgpdDocumentVersions;
import com.aerosuite.p1.TenantModuleCatalog;
import com.aerosuite.model.Perfil;
import com.aerosuite.repository.UsuarioRepository;
import com.aerosuite.security.PasswordCredentials;
import com.aerosuite.security.PasswordPolicyValidator;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import java.time.LocalDate;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class TenantSignupService {

    private static final Pattern CODIGO_PATTERN = Pattern.compile("^[a-z0-9][a-z0-9_-]{1,62}$");

    @Inject
    TenantHibernateScope tenantHibernateScope;
    @Inject
    TenantModuleService tenantModuleService;
    @Inject
    TenantBillingService tenantBillingService;
    @Inject
    UsuarioRepository usuarioRepository;
    @Inject
    LgpdService lgpdService;
    @Inject
    EntityManager entityManager;

    @ConfigProperty(name = "aero.suite.signup.public-enabled", defaultValue = "true")
    boolean publicSignupEnabled;

    @Transactional
    public ProvisionTenantResponse signupTrial(TrialSignupRequest req, String ip, String userAgent) {
        if (!publicSignupEnabled) {
            throw new ForbiddenException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_SIGNUP_DISABLED));
        }
        validate(req);
        String emailNorm = req.adminEmail.trim().toLowerCase(Locale.ROOT);
        long existingAccounts = Usuario.count("email = ?1 and ativo = true", emailNorm);
        if (existingAccounts > 0) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_SIGNUP_EMAIL_EXISTS));
        }
        String codigo = resolveCodigo(req);
        if (TenantConstants.DEFAULT_CODIGO.equals(codigo)) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_SIGNUP_RESERVED_CODE));
        }

        final String tenantNome = req.nome.trim();
        final long newTenantId = tenantHibernateScope.createTenantRow(codigo, tenantNome);
        final List<String> modulosSignup = resolveSignupModulos(req.modulosHabilitados);

        final Integer[] adminIdHolder = { null };
        final String[] adminEmailHolder = { null };

        tenantHibernateScope.runInNewTransaction(newTenantId, () -> {
            Tenant tenant = Tenant.findById(newTenantId);
            if (tenant != null) {
                tenantModuleService.applyModulos(tenant, modulosSignup);
            }
            tenantBillingService.initBillingForNewTenant(newTenantId, false);
            createDefaultEmpresaConfig(tenantNome, codigo, newTenantId, emailNorm);
            createAdmin(req, newTenantId);

            Usuario admin = usuarioRepository.findByEmailAndOrgTenantId(emailNorm, newTenantId);
            if (admin != null) {
                adminIdHolder[0] = admin.id;
                adminEmailHolder[0] = admin.email;
                LgpdAceiteRequest aceite = new LgpdAceiteRequest();
                aceite.aceito = true;
                aceite.versaoTermos = req.versaoTermos;
                aceite.versaoPrivacidade = req.versaoPrivacidade;
                lgpdService.registrarAceite(admin, aceite, ip, userAgent);
            }
        });

        ProvisionTenantResponse out = new ProvisionTenantResponse();
        TenantDto dto = new TenantDto(newTenantId, codigo, tenantNome, true);
        dto.modulosHabilitados = new ArrayList<>(modulosSignup);
        out.tenant = dto;
        if (adminIdHolder[0] != null) {
            out.adminUserId = adminIdHolder[0];
            out.adminEmail = adminEmailHolder[0];
            out.adminCreated = true;
            out.senhaGeradaAutomaticamente = req.adminSenha == null || req.adminSenha.isBlank();
            if (out.senhaGeradaAutomaticamente) {
                out.adminSenhaTemporaria = "(gerada — use recuperação de senha se necessário)";
            }
        }
        return out;
    }

    private void createDefaultEmpresaConfig(String tenantNome, String tenantCodigo, long orgTenantId, String adminEmail) {
        SistemaEmpresaConfig cfg = new SistemaEmpresaConfig();
        cfg.tenantId = TenantConstants.tenantIdOf(orgTenantId);
        cfg.displayName = tenantNome;
        cfg.supportEmail = adminEmail != null && !adminEmail.isBlank() ? adminEmail.trim() : null;
        cfg.copyrightEntity = tenantNome;
        cfg.persist();
    }

    private void createAdmin(TrialSignupRequest req, long tenantId) {
        String emailNorm = req.adminEmail.trim().toLowerCase();
        if (usuarioRepository.findByEmailAndOrgTenantId(emailNorm, tenantId) != null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_SIGNUP_EMAIL_EXISTS));
        }
        Perfil perfilAdmin = entityManager
                .createQuery("SELECT p FROM Perfil p WHERE p.codigo = :codigo AND p.ativo = true", Perfil.class)
                .setParameter("codigo", "ADMIN")
                .getResultStream()
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Perfil ADMIN não encontrado no sistema"));

        Usuario u = new Usuario();
        u.email = emailNorm;
        u.nome = req.adminNome != null && !req.adminNome.isBlank() ? req.adminNome.trim() : "Administrador";
        u.senha = PasswordCredentials.hash(req.adminSenha);
        u.orgTenantId = tenantId;
        u.perfil = perfilAdmin;
        u.ativo = true;
        u.dataCadastro = LocalDate.now();
        u.precisaTrocarSenha = false;
        u.persist();
    }

    private static List<String> resolveSignupModulos(List<String> raw) {
        if (raw == null || raw.isEmpty()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_SIGNUP_MODULOS_REQUIRED));
        }
        Set<String> valid = new LinkedHashSet<>();
        for (String m : raw) {
            if (m == null || m.isBlank()) {
                continue;
            }
            String code = m.trim().toUpperCase(Locale.ROOT);
            if (TenantModuleCatalog.DEFAULT_MODULES.contains(code)) {
                valid.add(code);
            }
        }
        if (valid.isEmpty()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_SIGNUP_MODULOS_REQUIRED));
        }
        return new ArrayList<>(valid);
    }

    private static void validate(TrialSignupRequest req) {
        if (req == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_SIGNUP_INVALID_REQUEST));
        }
        if (req.codigo != null && !req.codigo.isBlank()) {
            String c = req.codigo.trim().toLowerCase(Locale.ROOT);
            if (!CODIGO_PATTERN.matcher(c).matches()) {
                throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_SIGNUP_INVALID_ORG_CODE));
            }
        }
        if (req.nome == null || req.nome.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_SIGNUP_ORG_NAME_REQUIRED));
        }
        if (req.adminEmail == null || req.adminEmail.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_SIGNUP_ADMIN_EMAIL_REQUIRED));
        }
        if (req.adminSenha == null || req.adminSenha.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_SIGNUP_ADMIN_PASSWORD_MIN));
        }
        PasswordPolicyValidator.requireValid(req.adminSenha);
        if (!Boolean.TRUE.equals(req.aceitoTermos)) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_SIGNUP_TERMS_REQUIRED));
        }
        if (!LgpdDocumentVersions.TERMOS.equals(req.versaoTermos)
                || !LgpdDocumentVersions.PRIVACIDADE.equals(req.versaoPrivacidade)) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_SIGNUP_LGPD_VERSION_INVALID));
        }
    }

    private String resolveCodigo(TrialSignupRequest req) {
        if (req.codigo != null && !req.codigo.isBlank()) {
            String codigo = req.codigo.trim().toLowerCase(Locale.ROOT);
            if (Tenant.find("codigo = ?1", codigo).firstResult() != null) {
                throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_SIGNUP_ORG_CODE_IN_USE));
            }
            return codigo;
        }
        return generateUniqueCodigo(req.nome.trim());
    }

    private String generateUniqueCodigo(String nome) {
        String base = slugify(nome);
        String codigo = base;
        int suffix = 0;
        while (Tenant.find("codigo = ?1", codigo).firstResult() != null
                || TenantConstants.DEFAULT_CODIGO.equals(codigo)) {
            suffix++;
            String suf = "-" + suffix;
            int maxBase = 63 - suf.length();
            String trimmed = base.length() > maxBase ? base.substring(0, maxBase).replaceAll("-$", "") : base;
            codigo = trimmed + suf;
        }
        return codigo;
    }

    private static String slugify(String nome) {
        if (nome == null || nome.isBlank()) {
            return "org";
        }
        String normalized = Normalizer.normalize(nome.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        String slug = normalized.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        if (slug.isEmpty()) {
            slug = "org";
        }
        if (!Character.isLetterOrDigit(slug.charAt(0))) {
            slug = "o" + slug;
        }
        if (slug.length() < 2) {
            slug = slug + "1";
        }
        if (slug.length() > 50) {
            slug = slug.substring(0, 50).replaceAll("-$", "");
            if (slug.length() < 2) {
                slug = "org";
            }
        }
        if (!CODIGO_PATTERN.matcher(slug).matches()) {
            slug = "org-" + System.currentTimeMillis() % 100000;
        }
        return slug;
    }
}
