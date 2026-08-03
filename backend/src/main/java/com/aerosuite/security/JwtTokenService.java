package com.aerosuite.security;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.core.HttpHeaders;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;

/**
 * JWT interno (HS256) para substituir token Base64 reversível.
 * Segredo: propriedade {@code aero.suite.auth.jwt.secret} / variável {@code AERO_SUITE_JWT_SECRET} (mínimo 32 caracteres).
 */
@ApplicationScoped
public class JwtTokenService {

    private static final String CLAIM_TYP = "typ";
    private static final String TYP_INTERNAL = "int";
    private static final String TYP_MFA_SETUP = "mfa_setup";
    /** Plano de controle da plataforma (sessão elevada, TTL curto). */
    private static final String TYP_PLATFORM_OPS = "pop";
    private static final String CLAIM_MFA_AT = "mfa_at";
    /** Claim opcional em tokens antigos; tokens novos incluem sempre o tenant do {@link Usuario}. */
    public static final String CLAIM_TID = "tid";

    @ConfigProperty(name = "aero.suite.auth.jwt.secret")
    String jwtSecret;

    /**
     * Token interno legado {@code Base64(id:email:millis)} — desligado por omissão.
     * Token externo {@code EXT:} permanece independente desta flag.
     */
    @ConfigProperty(name = "aero.suite.auth.allow-legacy-internal-base64", defaultValue = "false")
    boolean allowLegacyInternalBase64;

    @ConfigProperty(name = "aero.suite.platform.ops.token-ttl-minutes", defaultValue = "60")
    int platformOpsTokenTtlMinutes;

    private SecretKey signingKey() {
        byte[] bytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException(
                    "Segredo JWT inválido: a propriedade aero.suite.auth.jwt.secret deve ter pelo menos 32 bytes. "
                            + "Em produção defina a variável de ambiente AERO_SUITE_JWT_SECRET (Aero Suite).");
        }
        return Keys.hmacShaKeyFor(bytes);
    }

    /** Token curto (15 min) para cadastro TOTP após senha válida. */
    public String mintMfaSetupToken(Usuario usuario) {
        if (usuario == null || usuario.id == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.JWT_INVALID_USER));
        }
        Instant now = Instant.now();
        Instant exp = now.plus(Duration.ofMinutes(15));
        Long tid = usuario.orgTenantId != null ? usuario.orgTenantId : TenantConstants.DEFAULT_TENANT_ID;
        return Jwts.builder()
                .subject(String.valueOf(usuario.id))
                .claim("email", usuario.email != null ? usuario.email : "")
                .claim(CLAIM_TID, tid)
                .claim(CLAIM_TYP, TYP_MFA_SETUP)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(signingKey(), Jwts.SIG.HS256)
                .compact();
    }

    public Optional<Claims> parseAndVerifyMfaSetup(String compactJwt) {
        if (compactJwt == null || compactJwt.isBlank()) {
            return Optional.empty();
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey())
                    .build()
                    .parseSignedClaims(compactJwt)
                    .getPayload();
            if (!TYP_MFA_SETUP.equals(claims.get(CLAIM_TYP))) {
                return Optional.empty();
            }
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public String mintInternalToken(Usuario usuario) {
        if (usuario == null || usuario.id == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.JWT_INVALID_USER));
        }
        Instant now = Instant.now();
        Instant exp = now.plus(Duration.ofHours(12));
        Long tid = usuario != null && usuario.orgTenantId != null
                ? usuario.orgTenantId
                : TenantConstants.DEFAULT_TENANT_ID;
        return Jwts.builder()
                .subject(String.valueOf(usuario.id))
                .claim("email", usuario.email != null ? usuario.email : "")
                .claim("name", usuario.nome != null ? usuario.nome : "")
                .claim(CLAIM_TID, tid)
                .claim(CLAIM_TYP, TYP_INTERNAL)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(signingKey(), Jwts.SIG.HS256)
                .compact();
    }

    /** Token curto para o plano de controle (infraestrutura / auditoria sensível). */
    public String mintPlatformOpsToken(Usuario usuario) {
        return mintPlatformOpsToken(usuario, Instant.now().getEpochSecond());
    }

    public String mintPlatformOpsToken(Usuario usuario, long mfaAtEpochSec) {
        if (usuario == null || usuario.id == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.JWT_INVALID_USER));
        }
        Instant now = Instant.now();
        int ttl = Math.max(15, Math.min(platformOpsTokenTtlMinutes, 240));
        Instant exp = now.plus(Duration.ofMinutes(ttl));
        Long tid = usuario.orgTenantId != null ? usuario.orgTenantId : TenantConstants.DEFAULT_TENANT_ID;
        return Jwts.builder()
                .subject(String.valueOf(usuario.id))
                .claim("email", usuario.email != null ? usuario.email : "")
                .claim("name", usuario.nome != null ? usuario.nome : "")
                .claim(CLAIM_TID, tid)
                .claim(CLAIM_TYP, TYP_PLATFORM_OPS)
                .claim(CLAIM_MFA_AT, mfaAtEpochSec)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(signingKey(), Jwts.SIG.HS256)
                .compact();
    }

    public static long extractMfaAtFromClaims(Claims claims) {
        if (claims == null) {
            return 0L;
        }
        Object raw = claims.get(CLAIM_MFA_AT);
        if (raw instanceof Number n) {
            return n.longValue();
        }
        if (raw instanceof String s) {
            try {
                return Long.parseLong(s.trim());
            } catch (NumberFormatException ignored) {
                return 0L;
            }
        }
        return 0L;
    }

    public Optional<Claims> parseAndVerifyPlatformOps(String compactJwt) {
        if (compactJwt == null || compactJwt.isBlank()) {
            return Optional.empty();
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey())
                    .build()
                    .parseSignedClaims(compactJwt)
                    .getPayload();
            if (!TYP_PLATFORM_OPS.equals(claims.get(CLAIM_TYP))) {
                return Optional.empty();
            }
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /** Extrai o tenant do payload JWT interno; {@code null} se ausente (token legado). */
    public static Long extractTenantIdFromClaims(Claims claims) {
        if (claims == null) {
            return null;
        }
        Object raw = claims.get(CLAIM_TID);
        if (raw == null) {
            return null;
        }
        if (raw instanceof Number n) {
            return n.longValue();
        }
        if (raw instanceof String s && !s.isBlank()) {
            return Long.parseLong(s.trim());
        }
        return null;
    }

    public Optional<Claims> parseAndVerifyInternal(String compactJwt) {
        if (compactJwt == null || compactJwt.isBlank()) {
            return Optional.empty();
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey())
                    .build()
                    .parseSignedClaims(compactJwt)
                    .getPayload();
            if (!TYP_INTERNAL.equals(claims.get(CLAIM_TYP))) {
                return Optional.empty();
            }
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /**
     * Token legado interno: Base64 de {@code id:email:millis} (sem prefixo EXT).
     */
    public Optional<LegacyInternalToken> tryParseLegacyInternalBase64(String token) {
        if (!allowLegacyInternalBase64) {
            return Optional.empty();
        }
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            String decoded = new String(Base64.getDecoder().decode(token), StandardCharsets.UTF_8);
            if (decoded.startsWith("EXT:")) {
                return Optional.empty();
            }
            String[] parts = decoded.split(":");
            if (parts.length < 2) {
                return Optional.empty();
            }
            int id = Integer.parseInt(parts[0]);
            String email = parts[1];
            return Optional.of(new LegacyInternalToken(id, email));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public boolean isExternoLegacyToken(String token) {
        return tryParseExternoLegacyToken(token).isPresent();
    }

    /**
     * Token legado externo: Base64 de {@code EXT:id:email:millis} ou {@code EXT:id:email:orgTenantId:millis}.
     */
    public Optional<ExternoLegacyToken> tryParseExternoLegacyToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            String decoded = new String(Base64.getDecoder().decode(token), StandardCharsets.UTF_8);
            if (!decoded.startsWith("EXT:")) {
                return Optional.empty();
            }
            String[] parts = decoded.split(":", 5);
            if (parts.length < 3) {
                return Optional.empty();
            }
            int id = Integer.parseInt(parts[1]);
            String email = parts[2];
            Long orgTenantId = null;
            if (parts.length >= 5) {
                orgTenantId = Long.parseLong(parts[3]);
            }
            return Optional.of(new ExternoLegacyToken(id, email, orgTenantId));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public record ExternoLegacyToken(int userId, String email, Long orgTenantId) {}

    public AuditoriaUsuarioContext auditoriaFromHeaders(HttpHeaders headers, String forwardedFor, String realIp) {
        return auditoriaFromHeaders(headers, forwardedFor, realIp, null, null, null, null);
    }

    public AuditoriaUsuarioContext auditoriaFromHeaders(
            HttpHeaders headers,
            String forwardedFor,
            String realIp,
            String authorization,
            Long xUserId,
            String xUserName,
            String xUserEmail) {
        String ip = forwardedFor != null ? forwardedFor : (realIp != null ? realIp : "IP não identificado");
        String userAgent = headers != null ? headers.getHeaderString("User-Agent") : null;

        String authHeader = authorization;
        if ((authHeader == null || authHeader.isBlank()) && headers != null) {
            authHeader = headers.getHeaderString("Authorization");
        }
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String raw = authHeader.substring(7).trim();
            Optional<Claims> jwt = parseAndVerifyInternal(raw);
            if (jwt.isPresent()) {
                Claims c = jwt.get();
                Integer uid = Integer.parseInt(c.getSubject());
                String email = c.get("email", String.class);
                String name = c.get("name", String.class);
                Usuario u = Usuario.findById(uid);
                String nome = u != null && u.nome != null ? u.nome : (name != null ? name : "Usuário");
                return new AuditoriaUsuarioContext(nome, email, uid.longValue(), ip, userAgent);
            }
            Optional<LegacyInternalToken> leg = tryParseLegacyInternalBase64(raw);
            if (leg.isPresent()) {
                LegacyInternalToken t = leg.get();
                Usuario usuario = Usuario.findById(t.userId());
                String nome = usuario != null && usuario.nome != null ? usuario.nome : "Usuário";
                return new AuditoriaUsuarioContext(nome, t.email(), (long) t.userId(), ip, userAgent);
            }
        }

        Long uid = xUserId;
        if (uid == null && headers != null) {
            String h = headers.getHeaderString("X-User-Id");
            if (h != null && !h.isBlank()) {
                try {
                    uid = Long.parseLong(h.trim());
                } catch (NumberFormatException ignored) {
                    /* fallback abaixo */
                }
            }
        }
        String email = xUserEmail;
        if ((email == null || email.isBlank()) && headers != null) {
            email = headers.getHeaderString("X-User-Email");
        }
        String nome = xUserName;
        if ((nome == null || nome.isBlank()) && headers != null) {
            nome = headers.getHeaderString("X-User-Name");
        }
        if (uid != null) {
            Usuario u = Usuario.findById(uid.intValue());
            if (u != null) {
                if (nome == null || nome.isBlank()) {
                    nome = u.nome;
                }
                if (email == null || email.isBlank()) {
                    email = u.email;
                }
            }
            if (nome == null || nome.isBlank()) {
                nome = email != null && !email.isBlank() ? email : "Usuário";
            }
            return new AuditoriaUsuarioContext(nome, email, uid, ip, userAgent);
        }

        return new AuditoriaUsuarioContext("Usuário não identificado", null, null, ip, userAgent);
    }

    public record LegacyInternalToken(int userId, String email) {}
}
