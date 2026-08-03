package com.aerosuite.api;

import com.aerosuite.dto.*;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.UsuarioExternoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.LocalDate;
import java.util.List;

/**
 * REST API para gerenciamento de usuários externos.
 */
@Path("/api/usuarios-externos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"USUARIOS_EXTERNOS", "usuarios-externos", "GERENCIAR_PERMISSOES"})
public class UsuarioExternoResource {

    @Inject
    UsuarioExternoService service;

    // ========================================
    // CRUD de Usuário Externo
    // ========================================

    @GET
    public Response list(
            @QueryParam("page") @DefaultValue("0") Integer page,
            @QueryParam("size") @DefaultValue("10") Integer size,
            @QueryParam("q") String q,
            @QueryParam("ativo") Boolean ativo) {
        try {
            var result = service.search(page, size, q, ativo);
            return Response.ok()
                    .entity(new SearchResponse(result.items(), result.total()))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Integer id) {
        try {
            UsuarioExternoDto dto = service.getByIdComDetalhes(id);
            if (dto == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.USER_EXTERNO_NOT_FOUND)))
                        .build();
            }
            return Response.ok(dto).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @POST
    public Response create(UsuarioExternoDto dto, @QueryParam("criadoPor") Integer criadoPor) {
        try {
            UsuarioExternoDto created = service.create(dto, criadoPor);
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Integer id, UsuarioExternoDto dto) {
        try {
            UsuarioExternoDto updated = service.update(id, dto);
            return Response.ok(updated).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Integer id) {
        try {
            service.delete(id);
            return Response.ok(new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.EXTERNO_USER_DEACTIVATED))).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/{id}/ativar")
    public Response activate(@PathParam("id") Integer id) {
        try {
            service.activate(id);
            return Response.ok(new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.EXTERNO_USER_ACTIVATED))).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    // ========================================
    // Funcionalidades
    // ========================================

    @GET
    @Path("/funcionalidades")
    public Response getAllFuncionalidades() {
        try {
            List<FuncionalidadeExternaDto> funcionalidades = service.getAllFuncionalidades();
            return Response.ok(funcionalidades).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/{id}/funcionalidades")
    public Response getFuncionalidadesUsuario(@PathParam("id") Integer id) {
        try {
            List<FuncionalidadeExternaDto> funcionalidades = service.getFuncionalidadesUsuario(id);
            return Response.ok(funcionalidades).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/{id}/funcionalidades")
    public Response atualizarFuncionalidades(
            @PathParam("id") Integer id,
            AtualizarFuncionalidadesRequest request) {
        try {
            service.atualizarFuncionalidades(id, request.funcionalidadeIds, request.concedidoPor);
            return Response.ok(new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.EXTERNO_FUNCIONALIDADES_UPDATED))).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    // ========================================
    // Ordens de Serviço
    // ========================================

    @GET
    @Path("/{id}/os")
    public Response getOSsUsuario(@PathParam("id") Integer id) {
        try {
            List<OSExternaResumoDto> oss = service.getOSsUsuario(id);
            return Response.ok(oss).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/{id}/os/{osId}")
    public Response concederAcessoOS(
            @PathParam("id") Integer id,
            @PathParam("osId") Long osId,
            ConcederAcessoOSRequest request) {
        try {
            service.concederAcessoOS(id, osId, request.concedidoPor, request.observacoes);
            return Response.ok(new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.EXTERNO_OS_ACCESS_GRANTED))).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @DELETE
    @Path("/{id}/os/{osId}")
    public Response revogarAcessoOS(
            @PathParam("id") Integer id,
            @PathParam("osId") Long osId) {
        try {
            service.revogarAcessoOS(id, osId);
            return Response.ok(new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.EXTERNO_OS_ACCESS_REVOKED))).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }
    
    @DELETE
    @Path("/{id}/os/{osId}/completo")
    public Response revogarAcessoOSCompleto(
            @PathParam("id") Integer id,
            @PathParam("osId") Long osId) {
        try {
            service.revogarAcessoOSCompleto(id, osId);
            return Response.ok(new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.EXTERNO_OS_ACCESS_REVOKED_COMPLETE))).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    // ========================================
    // Documentos
    // ========================================

    @GET
    @Path("/{id}/documentos")
    public Response getDocumentosUsuario(@PathParam("id") Integer id) {
        try {
            List<DocumentoExternoDto> docs = service.getDocumentosUsuario(id);
            return Response.ok(docs).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/{id}/documentos")
    public Response concederAcessoDocumento(
            @PathParam("id") Integer id,
            ConcederAcessoDocumentoRequest request) {
        try {
            service.concederAcessoDocumento(
                id,
                request.osFileId,
                request.tpFileId,
                request.nomeArquivo,
                request.descricao,
                request.podeDownload,
                request.dataExpiracao,
                request.concedidoPor
            );
            return Response.ok(new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.EXTERNO_DOCUMENT_ACCESS_GRANTED))).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @DELETE
    @Path("/{id}/documentos/{documentoId}")
    public Response revogarAcessoDocumento(
            @PathParam("id") Integer id,
            @PathParam("documentoId") Integer documentoId) {
        try {
            service.revogarAcessoDocumento(documentoId);
            return Response.ok(new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.EXTERNO_DOCUMENT_ACCESS_REVOKED))).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    // ========================================
    // Classes auxiliares
    // ========================================

    public static class SearchResponse {
        public List<UsuarioExternoDto> content;
        public long totalElements;

        public SearchResponse(List<UsuarioExternoDto> content, long totalElements) {
            this.content = content;
            this.totalElements = totalElements;
        }
    }

    public static class ErrorResponse {
        public String message;

        public ErrorResponse(String message) {
            this.message = message;
        }
    }

    public static class AtualizarFuncionalidadesRequest {
        public List<Integer> funcionalidadeIds;
        public Integer concedidoPor;
    }

    public static class ConcederAcessoOSRequest {
        public Integer concedidoPor;
        public String observacoes;
    }

    public static class ConcederAcessoDocumentoRequest {
        public Long osFileId;
        public Long tpFileId;
        public String nomeArquivo;
        public String descricao;
        public Boolean podeDownload;
        public LocalDate dataExpiracao;
        public Integer concedidoPor;
    }
}
