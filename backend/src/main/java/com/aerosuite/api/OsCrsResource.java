package com.aerosuite.api;

import com.aerosuite.domain.OS;
import com.aerosuite.dto.OsCrsDto;
import com.aerosuite.dto.OsCrsEmitirRequest;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.service.OsCrsService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;

/**
 * B1 — Certificado de liberação para serviço (CRS) por ordem de serviço.
 */
@Path("/api/os")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"ORDEM_SERVICO", "DOSSIE_AUDITORIA"})
public class OsCrsResource {

    @Inject
    OsCrsService crsService;

    @Inject
    TenantDataAccess tenantDataAccess;

    @GET
    @Path("/{osId}/crs/checklist")
    public Response checklist(
            @PathParam("osId") Long osId, @QueryParam("locale") @DefaultValue("pt-BR") String locale) {
        tenantDataAccess.requireOS(osId);
        return Response.ok(crsService.checklistTemplate(locale)).build();
    }

    @GET
    @Path("/{osId}/crs")
    public Response obter(@PathParam("osId") Long osId) {
        return Response.ok(crsService.obter(osId)).build();
    }

    @POST
    @Path("/{osId}/crs/emitir")
    @RequiresFuncionalidades(allOf = {"CRS_EMITIR"})
    public Response emitir(
            @PathParam("osId") Long osId,
            OsCrsEmitirRequest body,
            @QueryParam("locale") @DefaultValue("pt-BR") String locale) {
        OsCrsDto dto = crsService.emitir(osId, body, locale);
        return Response.ok(dto).build();
    }

    @GET
    @Path("/{osId}/crs/pdf")
    @Produces("application/pdf")
    public Response pdf(@PathParam("osId") Long osId, @QueryParam("locale") @DefaultValue("pt-BR") String locale) {
        try {
            OS os = tenantDataAccess.requireOS(osId);
            byte[] pdf = crsService.exportPdf(osId, locale);
            StreamingOutput stream = output -> output.write(pdf);
            return Response.ok(stream)
                    .header("Content-Disposition", "attachment; filename=\"" + crsService.suggestedFileName(os) + "\"")
                    .type("application/pdf")
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(java.util.Map.of("error", e.getMessage()))
                    .build();
        }
    }
}
