package com.aerosuite.api;

import com.aerosuite.domain.SgqDocumentoControlado;
import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.SgqDocumentoArquivoService;
import com.aerosuite.service.SgqDocumentoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import java.io.IOException;
import java.nio.file.Files;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/api/conformidade/documentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"SGQ_DOCUMENTO_CONTROLADO", "GERENCIAR_PERMISSOES", "DOSSIE_AUDITORIA"})
public class SgqDocumentoResource {

    @Inject
    SgqDocumentoService service;

    @Inject
    SgqDocumentoArquivoService arquivoService;

    @GET
    public PageResponse<SgqDocumentoDto> listar(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("q") String q,
            @QueryParam("tipo") String tipo,
            @QueryParam("status") String status,
            @QueryParam("somenteAtivos") @DefaultValue("true") boolean somenteAtivos) {
        return service.listar(page, size, q, tipo, status, somenteAtivos);
    }

    @GET
    @Path("/alertas")
    public ConformidadeAlertasResumoDto alertas(@QueryParam("dias") @DefaultValue("60") int dias) {
        return service.alertas(dias);
    }

    @GET
    @Path("/{id}")
    public SgqDocumentoDto obter(@PathParam("id") Long id) {
        return service.obter(id);
    }

    @POST
    public Response criar(SgqDocumentoWriteDto body) {
        return Response.status(Response.Status.CREATED).entity(service.criar(body)).build();
    }

    @PUT
    @Path("/{id}")
    public SgqDocumentoDto atualizar(@PathParam("id") Long id, SgqDocumentoWriteDto body) {
        return service.atualizar(id, body);
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        service.excluir(id);
        return Response.noContent().build();
    }

    @GET
    @Path("/historico/{codigo}")
    public java.util.List<SgqDocumentoHistoricoDto> historico(@PathParam("codigo") String codigo) {
        return service.historico(codigo);
    }

    @POST
    @Path("/{id}/nova-revisao")
    public Response publicarNovaRevisao(@PathParam("id") Long id, SgqDocumentoWriteDto body) {
        return Response.status(Response.Status.CREATED).entity(service.publicarNovaRevisao(id, body)).build();
    }

    @POST
    @Path("/{id}/arquivo")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadArquivo(@PathParam("id") Long id, @RestForm("file") FileUpload file) {
        SgqDocumentoDto dto = arquivoService.uploadArquivo(id, file);
        return Response.ok(dto).build();
    }

    @GET
    @Path("/{id}/arquivo")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response downloadArquivo(@PathParam("id") Long id) {
        java.nio.file.Path path = arquivoService.resolveArquivoPath(id);
        SgqDocumentoControlado meta = arquivoService.metaArquivo(id);
        String contentType =
                meta.arquivoContentType != null && !meta.arquivoContentType.isBlank()
                        ? meta.arquivoContentType
                        : "application/pdf";
        String fileName =
                meta.arquivoNome != null && !meta.arquivoNome.isBlank()
                        ? meta.arquivoNome
                        : "documento.pdf";
        StreamingOutput stream = output -> Files.copy(path, output);
        try {
            return Response.ok(stream)
                    .header("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
                    .type(contentType)
                    .header("Content-Length", Files.size(path))
                    .build();
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }
}
