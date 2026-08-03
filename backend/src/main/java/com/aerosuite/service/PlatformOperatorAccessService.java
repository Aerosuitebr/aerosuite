package com.aerosuite.service;

import com.aerosuite.domain.PlatformOperatorAccess;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.PlatformOperatorAccessRequest;
import com.aerosuite.dto.PlatformOperatorListDto;
import com.aerosuite.dto.PlatformOperatorRowDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.i18n.UserLocaleResolver;
import com.aerosuite.model.Perfil;
import com.aerosuite.util.ServerUrlUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class PlatformOperatorAccessService {

    @Inject
    TenantProvisioningService tenantProvisioningService;

    @Inject
    EmailService emailService;

    @Inject
    ServerUrlUtil serverUrlUtil;

    @ConfigProperty(name = "aero.suite.platform.ops.allowed-emails", defaultValue = "admin@aerosuite.com")
    String allowedEmailsRaw;

    @ConfigProperty(name = "quarkus.mailer.from", defaultValue = "noreply@aerosuite.app")
    String supportEmail;

    public PlatformOperatorListDto listOperators() {
        tenantProvisioningService.requirePlatformOperator();

        List<Usuario> users =
                Usuario.<Usuario>find(
                                "FROM Usuario u LEFT JOIN FETCH u.perfil WHERE u.orgTenantId = ?1 ORDER BY u.nome",
                                TenantConstants.DEFAULT_TENANT_ID)
                        .list();

        Map<Integer, PlatformOperatorAccess> grants = new HashMap<>();
        for (PlatformOperatorAccess g : PlatformOperatorAccess.<PlatformOperatorAccess>listAll()) {
            grants.put(g.usuarioId, g);
        }

        Set<String> configEmails = parseConfigEmails();
        PlatformOperatorListDto dto = new PlatformOperatorListDto();
        for (Usuario u : users) {
            PlatformOperatorRowDto row = toRow(u, grants.get(u.id), configEmails);
            dto.items.add(row);
            if (row.opsAccessEffective) {
                dto.totalEffective++;
            }
            if (row.opsAccessFromConfig) {
                dto.totalFromConfig++;
            }
            if (row.opsAccessFromGrant && row.grantAtivo) {
                dto.totalFromGrant++;
            }
        }
        return dto;
    }

    @Transactional
    public PlatformOperatorRowDto setOperatorAccess(
            int usuarioId, PlatformOperatorAccessRequest request, Integer actorUsuarioId) {
        tenantProvisioningService.requirePlatformOperator();
        if (request == null || request.ativo == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_INVALID_REQUEST));
        }

        Usuario usuario =
                Usuario.<Usuario>find(
                                "FROM Usuario u LEFT JOIN FETCH u.perfil WHERE u.id = ?1 AND u.orgTenantId = ?2",
                                usuarioId,
                                TenantConstants.DEFAULT_TENANT_ID)
                        .firstResult();
        if (usuario == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND));
        }
        if (!Boolean.TRUE.equals(usuario.ativo)) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_OPERATOR_USER_INACTIVE));
        }

        boolean wantActive = Boolean.TRUE.equals(request.ativo);
        String email = normalizeEmail(usuario.email);
        boolean configAllowed = parseConfigEmails().contains(email);

        if (!wantActive && configAllowed) {
            throw new BadRequestException(
                    ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_OPERATOR_CONFIG_PROTECTED));
        }

        PlatformOperatorAccess grant = PlatformOperatorAccess.findById(usuarioId);
        boolean wasActive = grant != null && Boolean.TRUE.equals(grant.ativo);
        LocalDateTime now = LocalDateTime.now();

        if (wantActive) {
            if (grant == null) {
                grant = new PlatformOperatorAccess();
                grant.usuarioId = usuarioId;
                grant.grantedAt = now;
                grant.grantedByUsuarioId = actorUsuarioId;
            } else {
                grant.grantedAt = grant.grantedAt != null ? grant.grantedAt : now;
                grant.grantedByUsuarioId =
                        grant.grantedByUsuarioId != null ? grant.grantedByUsuarioId : actorUsuarioId;
                grant.revokedAt = null;
                grant.revokedByUsuarioId = null;
            }
            grant.ativo = true;
            grant.updatedAt = now;
            grant.persist();
            if (!wasActive) {
                sendGrantedEmail(usuario, grant.grantedAt);
            }
        } else {
            if (grant == null) {
                throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_OPERATOR_NOT_GRANTED));
            }
            grant.ativo = false;
            grant.revokedAt = now;
            grant.revokedByUsuarioId = actorUsuarioId;
            grant.updatedAt = now;
            grant.persist();
            if (wasActive) {
                sendRevokedEmail(usuario, now);
            }
        }

        return toRow(usuario, grant, parseConfigEmails());
    }

    public boolean hasActiveDatabaseGrant(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String normalized = normalizeEmail(email);
        List<PlatformOperatorAccess> grants =
                PlatformOperatorAccess.<PlatformOperatorAccess>find("ativo = true").list();
        for (PlatformOperatorAccess grant : grants) {
            Usuario u = Usuario.findById(grant.usuarioId);
            if (u != null && normalizeEmail(u.email).equals(normalized)) {
                return true;
            }
        }
        return false;
    }

    public boolean isEmailInConfigAllowlist(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return parseConfigEmails().contains(normalizeEmail(email));
    }

    private void sendGrantedEmail(Usuario usuario, LocalDateTime grantedAt) {
        String locale = UserLocaleResolver.normalize(usuario.idioma);
        String accessUrl = serverUrlUtil.getPublicFrontendUrl() + "/plataforma/acesso";
        String grantedLabel = formatDateTime(locale, grantedAt);
        String perfil = perfilLabel(usuario);
        emailService.sendPlatformOpsAccessGranted(
                usuario.email, locale, usuario.nome, usuario.email, perfil, accessUrl, grantedLabel);
    }

    private void sendRevokedEmail(Usuario usuario, LocalDateTime revokedAt) {
        String locale = UserLocaleResolver.normalize(usuario.idioma);
        String revokedLabel = formatDateTime(locale, revokedAt);
        String perfil = perfilLabel(usuario);
        emailService.sendPlatformOpsAccessRevoked(
                usuario.email, locale, usuario.nome, usuario.email, perfil, revokedLabel, supportEmail);
    }

    private static String perfilLabel(Usuario usuario) {
        Perfil p = usuario.perfil;
        if (p == null) {
            return "—";
        }
        String codigo = p.getCodigo() != null ? p.getCodigo() : "";
        String nome = p.getNome() != null ? p.getNome() : "";
        if (!codigo.isBlank() && !nome.isBlank()) {
            return nome + " (" + codigo + ")";
        }
        return !nome.isBlank() ? nome : codigo;
    }

    private static String formatDateTime(String locale, LocalDateTime dt) {
        if (dt == null) {
            return "—";
        }
        DateTimeFormatter fmt =
                switch (UserLocaleResolver.normalize(locale)) {
                    case "en-US" -> DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm", Locale.US);
                    case "es-ES" -> DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm", Locale.of("es", "ES"));
                    case "fr-FR" -> DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm", Locale.FRANCE);
                    default -> DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm", Locale.of("pt", "BR"));
                };
        return dt.format(fmt);
    }

    private PlatformOperatorRowDto toRow(
            Usuario u, PlatformOperatorAccess grant, Set<String> configEmails) {
        PlatformOperatorRowDto row = new PlatformOperatorRowDto();
        row.usuarioId = u.id;
        row.nome = u.nome;
        row.email = u.email;
        row.usuarioAtivo = Boolean.TRUE.equals(u.ativo);
        if (u.perfil != null) {
            row.perfilCodigo = u.perfil.getCodigo();
            row.perfilNome = u.perfil.getNome();
        }
        String email = normalizeEmail(u.email);
        row.opsAccessFromConfig = configEmails.contains(email);
        row.opsAccessFromGrant = grant != null && Boolean.TRUE.equals(grant.ativo);
        row.grantAtivo = grant != null && Boolean.TRUE.equals(grant.ativo);
        row.grantedAt = grant != null ? grant.grantedAt : null;
        row.revokedAt = grant != null ? grant.revokedAt : null;
        row.opsAccessEffective = row.opsAccessFromConfig || row.opsAccessFromGrant;
        return row;
    }

    private Set<String> parseConfigEmails() {
        return Arrays.stream(allowedEmailsRaw.split(","))
                .map(String::trim)
                .map(s -> s.toLowerCase(Locale.ROOT))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
