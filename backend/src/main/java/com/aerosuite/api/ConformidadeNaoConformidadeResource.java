package com.aerosuite.api;

import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ConformidadeNcAnexoService;
import com.aerosuite.service.ConformidadeNcCapaEtapaService;
import com.aerosuite.service.ConformidadeNaoConformidadeService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/api/conformidade/nao-conformidades")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"CONFORMIDADE_NC", "GERENCIAR_PERMISSOES", "DOSSIE_AUDITORIA"})
public class ConformidadeNaoConformidadeResource {

    @Inject
    ConformidadeNaoConformidadeService service;

    @Inject
    ConformidadeNcCapaEtapaService etapaService;

    @Inject
    ConformidadeNcAnexoService anexoService;

    @GET
    public PageResponse<ConformidadeNaoConformidadeDto> listar(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("q") String q,
            @QueryParam("status") String status,
            @QueryParam("severidade") String severidade,
            @QueryParam("osId") Integer osId) {
        return service.listar(page, size, q, status, severidade, osId);
    }

    @GET
    @Path("/os-opcoes")
    public List<ConformidadeNcOsOpcaoDto> buscarOsOpcoes(@QueryParam("q") String q) {
        return service.buscarOsOpcoes(q);
    }

    @GET
    @Path("/{id}")
    public ConformidadeNaoConformidadeDto obter(@PathParam("id") Long id) {
        return service.obter(id);
    }

    @POST
    public Response criar(ConformidadeNaoConformidadeWriteDto body) {
        return Response.status(Response.Status.CREATED).entity(service.criar(body)).build();
    }

    @PUT
    @Path("/{id}")
    public ConformidadeNaoConformidadeDto atualizar(@PathParam("id") Long id, ConformidadeNaoConformidadeWriteDto body) {
        return service.atualizar(id, body);
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        service.excluir(id);
        return Response.noContent().build();
    }

    @GET
    @Path("/{id}/etapas")
    public List<ConformidadeNcCapaEtapaDto> listarEtapas(@PathParam("id") Long id) {
        return etapaService.listar(id);
    }

    @POST
    @Path("/{id}/etapas/{fase}/aprovar")
    public ConformidadeNcCapaEtapaDto aprovarEtapa(
            @PathParam("id") Long id,
            @PathParam("fase") String fase,
            ConformidadeNcAprovacaoWriteDto body) {
        return etapaService.aprovar(id, fase, body);
    }

    @POST
    @Path("/{id}/etapas/{fase}/rejeitar")
    public ConformidadeNcCapaEtapaDto rejeitarEtapa(
            @PathParam("id") Long id,
            @PathParam("fase") String fase,
            ConformidadeNcAprovacaoWriteDto body) {
        return etapaService.rejeitar(id, fase, body);
    }

    @GET
    @Path("/{id}/anexos")
    public List<ConformidadeNcAnexoDto> listarAnexos(
            @PathParam("id") Long id, @QueryParam("capaFase") String capaFase) {
        return anexoService.listar(id, capaFase);
    }

    @POST
    @Path("/{id}/anexos")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadAnexo(
            @PathParam("id") Long id,
            @RestForm("file") FileUpload file,
            @RestForm("descricao") String descricao,
            @RestForm("capaFase") String capaFase) {
        ConformidadeNcAnexoDto dto = anexoService.upload(id, file, descricao, capaFase);
        return Response.status(Response.Status.CREATED).entity(dto).build();
    }

    @GET
    @Path("/{id}/anexos/{anexoId}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response downloadAnexo(@PathParam("id") Long id, @PathParam("anexoId") Long anexoId) {
        java.nio.file.Path path = anexoService.resolvePath(id, anexoId);
        var meta = anexoService.meta(id, anexoId);
        String contentType =
                meta.tipoArquivo != null && !meta.tipoArquivo.isBlank()
                        ? meta.tipoArquivo
                        : "application/octet-stream";
        String fileName =
                meta.nomeOriginal != null && !meta.nomeOriginal.isBlank()
                        ? meta.nomeOriginal
                        : meta.nomeArquivo;
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

    @DELETE
    @Path("/{id}/anexos/{anexoId}")
    public Response excluirAnexo(@PathParam("id") Long id, @PathParam("anexoId") Long anexoId) {
        anexoService.excluir(id, anexoId);
        return Response.noContent().build();
    }
}
