package com.aerosuite.service;

import com.aerosuite.domain.AcessoAuditoria;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

/** Persistência de auditoria de acesso (invocada em worker thread via {@link AccessAuditService}). */
@ApplicationScoped
public class AccessAuditRecorder {

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void persist(
            String evento,
            boolean sucesso,
            Long tenantId,
            Integer usuarioId,
            String email,
            String detalhe,
            String ip,
            String userAgent,
            String recurso) {
        AcessoAuditoria row = new AcessoAuditoria();
        row.evento = evento.trim();
        row.sucesso = sucesso;
        row.tenantId = tenantId;
        row.usuarioId = usuarioId;
        row.email = truncate(email, 255);
        row.detalhe = truncate(detalhe, 512);
        row.ip = truncate(ip, 64);
        row.userAgent = truncate(userAgent, 512);
        row.recurso = truncate(recurso, 255);
        row.persist();
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
