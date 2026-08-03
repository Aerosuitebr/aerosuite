package com.aerosuite.api;

import com.aerosuite.dto.GoLiveImportRequestDto;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.GoLiveMigracaoService;
import com.aerosuite.service.GoLiveMigracaoService.GoLiveChecklistSaveDto;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.nio.charset.StandardCharsets;

/**
 * Kit go-live P4.3 — checklist, templates CSV e importação em lote.
 */
@Path("/api/go-live-migracao")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"GO_LIVE_MIGRACAO", "GERENCIAR_PERMISSOES"})
public class GoLiveMigracaoResource {

    @Inject
    GoLiveMigracaoService service;

    @Inject
    InternalUserContext internalUserContext;

    @GET
    @Path("/checklist")
    public Response checklist() {
        return Response.ok(service.checklist()).build();
    }

    @PUT
    @Path("/checklist")
    public Response salvarChecklist(GoLiveChecklistSaveDto body) {
        Integer usuarioId = internalUserContext.getUserId();
        return Response.ok(service.salvarChecklist(body, usuarioId)).build();
    }

    @GET
    @Path("/templates")
    public Response templates() {
        return Response.ok(service.templates()).build();
    }

    @GET
    @Path("/templates/{id}/download")
    @Produces("text/csv; charset=utf-8")
    public Response downloadTemplate(@PathParam("id") String id) {
        String csv = service.loadTemplateCsv(id);
        byte[] body = csv.getBytes(StandardCharsets.UTF_8);
        byte[] withBom = new byte[body.length + 3];
        withBom[0] = (byte) 0xEF;
        withBom[1] = (byte) 0xBB;
        withBom[2] = (byte) 0xBF;
        System.arraycopy(body, 0, withBom, 3, body.length);
        String fileName = id + ".csv";
        return Response.ok(withBom)
                .header("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
                .build();
    }

    @POST
    @Path("/import/clientes-proposta")
    public Response importClientes(GoLiveImportRequestDto body) {
        return Response.ok(service.importClientesProposta(body)).build();
    }

    @POST
    @Path("/import/fcu")
    public Response importFcu(GoLiveImportRequestDto body) {
        return Response.ok(service.importFcu(body)).build();
    }

    @POST
    @Path("/import/usuarios-externos")
    public Response importUsuariosExternos(GoLiveImportRequestDto body) {
        return Response.ok(service.importUsuariosExternos(body)).build();
    }

    @POST
    @Path("/import/fornecedores")
    public Response importFornecedores(GoLiveImportRequestDto body) {
        return Response.ok(service.importFornecedores(body)).build();
    }

    @POST
    @Path("/import/treinamentos")
    public Response importTreinamentos(GoLiveImportRequestDto body) {
        return Response.ok(service.importTreinamentos(body)).build();
    }

    @POST
    @Path("/import/documentos-sgq")
    public Response importDocumentosSgq(GoLiveImportRequestDto body) {
        return Response.ok(service.importDocumentosSgq(body)).build();
    }

    @POST
    @Path("/import/calibracao")
    public Response importCalibracao(GoLiveImportRequestDto body) {
        return Response.ok(service.importCalibracao(body)).build();
    }

    @POST
    @Path("/import/nao-conformidades")
    public Response importNaoConformidades(GoLiveImportRequestDto body) {
        return Response.ok(service.importNaoConformidades(body)).build();
    }
}
