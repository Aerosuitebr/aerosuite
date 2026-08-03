package com.aerosuite.service;

import io.vertx.mutiny.core.Vertx;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class AccessAuditService {

    private static final Logger LOG = Logger.getLogger(AccessAuditService.class);

    public static final String EVENT_LOGIN_SUCCESS = "LOGIN_SUCCESS";
    public static final String EVENT_LOGIN_FAILURE = "LOGIN_FAILURE";
    public static final String EVENT_RBAC_DENIED = "RBAC_DENIED";
    public static final String EVENT_AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED";

    @ConfigProperty(name = "aero.suite.audit.enabled", defaultValue = "true")
    boolean auditEnabled;

    @Inject
    AccessAuditRecorder recorder;

    @Inject
    Vertx vertx;

    public void record(
            String evento,
            boolean sucesso,
            Long tenantId,
            Integer usuarioId,
            String email,
            String detalhe,
            String ip,
            String userAgent,
            String recurso) {
        if (!auditEnabled || evento == null || evento.isBlank()) {
            return;
        }
        String ev = evento;
        vertx.executeBlocking(
                        () -> {
                            recorder.persist(
                                    ev, sucesso, tenantId, usuarioId, email, detalhe, ip, userAgent, recurso);
                            return null;
                        })
                .subscribe()
                .with(
                        ignored -> {},
                        err -> LOG.warnf(err, "Falha ao gravar auditoria de acesso (%s)", ev));
    }

    public void loginSuccess(Long tenantId, Integer usuarioId, String email, String ip, String userAgent) {
        loginSuccess(tenantId, usuarioId, email, ip, userAgent, "/api/auth/login");
    }

    public void loginSuccess(
            Long tenantId, Integer usuarioId, String email, String ip, String userAgent, String recurso) {
        record(EVENT_LOGIN_SUCCESS, true, tenantId, usuarioId, email, null, ip, userAgent, recurso);
    }

    public void loginFailure(String email, String tenantCodigo, String code, String ip, String userAgent) {
        loginFailure(email, tenantCodigo, code, ip, userAgent, "/api/auth/login");
    }

    public void loginFailure(
            String email, String tenantCodigo, String code, String ip, String userAgent, String recurso) {
        String detalhe = code != null ? code : "INVALID_CREDENTIALS";
        if (tenantCodigo != null && !tenantCodigo.isBlank()) {
            detalhe = detalhe + " tenant=" + tenantCodigo.trim();
        }
        record(EVENT_LOGIN_FAILURE, false, null, null, email, detalhe, ip, userAgent, recurso);
    }

    public void rbacDenied(
            Long tenantId, Integer usuarioId, String email, String detalhe, String ip, String userAgent, String path) {
        record(EVENT_RBAC_DENIED, false, tenantId, usuarioId, email, detalhe, ip, userAgent, path);
    }

    /** Pedido autenticado rejeitado (401) — Bearer ausente, inválido ou JWT expirado. */
    public void authUnauthorized(String detalhe, String ip, String userAgent, String recurso) {
        record(EVENT_AUTH_UNAUTHORIZED, false, null, null, null, detalhe, ip, userAgent, recurso);
    }

}
