package com.aerosuite.service;

import com.aerosuite.domain.AcessoAuditoria;
import com.aerosuite.dto.AccessAuditEntryDto;
import com.aerosuite.dto.AccessAuditPageDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@ApplicationScoped
public class AccessAuditQueryService {

    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 200;

    @Inject
    EntityManager entityManager;

    @Inject
    TenantProvisioningService tenantProvisioningService;

    public AccessAuditPageDto list(
            Long tenantId,
            String evento,
            String email,
            LocalDateTime from,
            LocalDateTime to,
            Integer limit,
            Integer offset) {
        tenantProvisioningService.requirePlatformOperator();

        int lim = limit != null && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT;
        int off = offset != null && offset >= 0 ? offset : 0;

        StringBuilder where = new StringBuilder(" WHERE 1=1");
        Map<String, Object> params = new HashMap<>();

        if (tenantId != null) {
            where.append(" AND a.tenantId = :tenantId");
            params.put("tenantId", tenantId);
        }
        if (evento != null && !evento.isBlank()) {
            where.append(" AND a.evento = :evento");
            params.put("evento", evento.trim().toUpperCase(Locale.ROOT));
        }
        if (email != null && !email.isBlank()) {
            where.append(" AND LOWER(a.email) LIKE :email");
            params.put("email", "%" + email.trim().toLowerCase(Locale.ROOT) + "%");
        }
        if (from != null) {
            where.append(" AND a.createdAt >= :from");
            params.put("from", from);
        }
        if (to != null) {
            where.append(" AND a.createdAt <= :to");
            params.put("to", to);
        }

        String base = "FROM AcessoAuditoria a" + where;

        TypedQuery<Long> countQ = entityManager.createQuery("SELECT COUNT(a)" + base, Long.class);
        params.forEach(countQ::setParameter);
        long total = countQ.getSingleResult();

        TypedQuery<AcessoAuditoria> listQ =
                entityManager.createQuery("SELECT a " + base + " ORDER BY a.createdAt DESC", AcessoAuditoria.class);
        params.forEach(listQ::setParameter);
        listQ.setFirstResult(off);
        listQ.setMaxResults(lim);

        List<AccessAuditEntryDto> items = new ArrayList<>();
        for (AcessoAuditoria row : listQ.getResultList()) {
            items.add(toDto(row));
        }
        return new AccessAuditPageDto(items, total);
    }

    private static AccessAuditEntryDto toDto(AcessoAuditoria row) {
        AccessAuditEntryDto d = new AccessAuditEntryDto();
        d.id = row.id;
        d.tenantId = row.tenantId;
        d.usuarioId = row.usuarioId;
        d.email = row.email;
        d.evento = row.evento;
        d.sucesso = row.sucesso;
        d.detalhe = row.detalhe;
        d.ip = row.ip;
        d.recurso = row.recurso;
        d.createdAt = row.createdAt;
        return d;
    }
}
