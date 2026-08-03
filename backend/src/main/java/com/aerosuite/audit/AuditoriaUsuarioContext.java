package com.aerosuite.audit;

import com.aerosuite.security.JwtTokenService;
import jakarta.enterprise.inject.spi.CDI;
import jakarta.ws.rs.core.HttpHeaders;

/**
 * Dados do usuário e da requisição para gravar em {@code os_auditoria}.
 */
public final class AuditoriaUsuarioContext {

    public final String nome;
    public final String email;
    public final Long userId;
    public final String ip;
    public final String userAgent;

    public AuditoriaUsuarioContext(String nome, String email, Long userId, String ip, String userAgent) {
        this.nome = nome;
        this.email = email;
        this.userId = userId;
        this.ip = ip;
        this.userAgent = userAgent;
    }

    /**
     * Identidade a partir do Bearer (JWT interno ou token interno legado), com fallback em {@code X-User-*}.
     */
    public static AuditoriaUsuarioContext from(HttpHeaders headers, String forwardedFor, String realIp) {
        return from(headers, forwardedFor, realIp, null, null, null, null);
    }

    /**
     * Variante com cabeçalhos explícitos ({@code @HeaderParam}) — necessária em multipart, onde
     * {@code @Context HttpHeaders} pode não expor {@code Authorization}.
     */
    public static AuditoriaUsuarioContext from(
            HttpHeaders headers,
            String forwardedFor,
            String realIp,
            String authorization,
            Long xUserId,
            String xUserName,
            String xUserEmail) {
        return CDI.current().select(JwtTokenService.class).get()
                .auditoriaFromHeaders(headers, forwardedFor, realIp, authorization, xUserId, xUserName, xUserEmail);
    }
}
