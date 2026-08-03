package com.aerosuite.api;

import com.aerosuite.dto.AccessAuditPageDto;
import com.aerosuite.security.RequiresPlatformOps;
import com.aerosuite.service.AccessAuditQueryService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

/**
 * Consulta de auditoria de acesso (login / RBAC). Operador da plataforma.
 */
@Path("/api/platform/access-audit")
@Produces(MediaType.APPLICATION_JSON)
@RequiresPlatformOps
public class AccessAuditResource {

    @Inject
    AccessAuditQueryService queryService;

    @GET
    public AccessAuditPageDto list(
            @QueryParam("tenantId") Long tenantId,
            @QueryParam("evento") String evento,
            @QueryParam("email") String email,
            @QueryParam("from") String from,
            @QueryParam("to") String to,
            @QueryParam("limit") Integer limit,
            @QueryParam("offset") Integer offset) {
        return queryService.list(tenantId, evento, email, parseDateTime(from), parseDateTime(to), limit, offset);
    }

    private static LocalDateTime parseDateTime(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(raw.trim());
        } catch (DateTimeParseException e) {
            try {
                return java.time.Instant.parse(raw.trim()).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
            } catch (DateTimeParseException e2) {
                return null;
            }
        }
    }
}
