package com.aerosuite.api;

import com.aerosuite.dto.LgpdDocumentDto;
import com.aerosuite.i18n.UserLocaleResolver;
import com.aerosuite.service.LgpdService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;

@Path("/api/public/lgpd")
@Produces(MediaType.APPLICATION_JSON)
public class PublicLgpdResource {

    @Inject
    LgpdService lgpdService;

    @GET
    @Path("/termos")
    public LgpdDocumentDto termos(
            @jakarta.ws.rs.QueryParam("tenant") String tenantCodigo,
            @Context HttpHeaders headers) {
        String locale = UserLocaleResolver.fromAcceptLanguage(headers.getHeaderString("Accept-Language"));
        if (tenantCodigo != null && !tenantCodigo.isBlank()) {
            return lgpdService.getTermosForTenantCodigo(tenantCodigo, locale);
        }
        return lgpdService.getTermosForTenantCodigo(null, locale);
    }

    @GET
    @Path("/privacidade")
    public LgpdDocumentDto privacidade(
            @jakarta.ws.rs.QueryParam("tenant") String tenantCodigo,
            @Context HttpHeaders headers) {
        String locale = UserLocaleResolver.fromAcceptLanguage(headers.getHeaderString("Accept-Language"));
        if (tenantCodigo != null && !tenantCodigo.isBlank()) {
            return lgpdService.getPrivacidadeForTenantCodigo(tenantCodigo, locale);
        }
        return lgpdService.getPrivacidadeForTenantCodigo(null, locale);
    }
}
