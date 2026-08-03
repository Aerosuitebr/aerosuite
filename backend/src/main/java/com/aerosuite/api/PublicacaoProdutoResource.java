package com.aerosuite.api;

import com.aerosuite.dto.PublicacaoProdutoDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.PublicacaoProdutoService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;

@Path("/api/publicacao-fcu")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
@RequiresFuncionalidades(anyOf = {"PUBLICACOES_TECNICAS", "PUBLICACAO_CADASTRO", "PUBLICACAO_ASSOCIAR_PN"})
public class PublicacaoProdutoResource {

    @Inject
    PublicacaoProdutoService service;

    @GET
    public Response search(
            @QueryParam("page") @DefaultValue("0") Integer page,
            @QueryParam("size") @DefaultValue("10") Integer size,
            @QueryParam("sort") String sort,
            @QueryParam("q") String q,
            @QueryParam("publicacaoId") Integer publicacaoId,
            @QueryParam("isActive") String isActiveParam) {
        
        Boolean isActive = null;
        if (isActiveParam != null && !isActiveParam.isBlank()) {
            isActive = Boolean.parseBoolean(isActiveParam);
        }
        
        var result = service.search(page, size, sort, q, publicacaoId, isActive);
        return Response.ok(result).build();
    }

    @GET
    @Path("/publicacao/{publicacaoId}")
    public Response getByPublicacaoId(@PathParam("publicacaoId") Integer publicacaoId) {
        List<PublicacaoProdutoDto> associations = service.getByPublicacaoId(publicacaoId);
        return Response.ok(associations).build();
    }

    /**
     * Busca a publicação técnica associada a um FCU específico
     * Retorna os dados da publicação para preenchimento automático na OS
     */
    @GET
    @Path("/fcu/{fcuId}")
    public Response getPublicacaoByFcuId(@PathParam("fcuId") Integer fcuId) {
        try {
            if (fcuId == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.PUBLICACAO_FCU_ID_REQUIRED)))
                        .build();
            }
            PublicacaoProdutoDto publicacao = service.getPublicacaoByFcuId(fcuId);
            if (publicacao == null) {
                // Retorna objeto vazio se não houver associação (não é erro)
                return Response.ok().build();
            }
            return Response.ok(publicacao).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", ApiI18nMessages.withDetail(
                            ApiI18nMessages.PUBLICACAO_FETCH_FCU_FAILED, e.getMessage())))
                    .build();
        }
    }

    @GET
    @Path("/available-fcus")
    public Response getAvailableFcus(
            @QueryParam("publicacaoId") Integer publicacaoId,
            @QueryParam("search") String search) {
        try {
            if (publicacaoId == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.PUBLICACAO_ID_REQUIRED)))
                        .build();
            }
            var fcus = service.getAvailableFcus(publicacaoId, search);
            return Response.ok(fcus).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", ApiI18nMessages.messageOrFallback(
                            ApiI18nMessages.COMMON_BAD_REQUEST, e.getMessage())))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", ApiI18nMessages.withDetail(
                            ApiI18nMessages.PUBLICACAO_FETCH_FCUS_FAILED, e.getMessage())))
                    .build();
        }
    }

    @GET
    @Path("/available-publicacoes")
    public Response getAvailablePublicacoes(
            @QueryParam("fcuId") Integer fcuId,
            @QueryParam("search") String search) {
        try {
            if (fcuId == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.PUBLICACAO_FCU_ID_REQUIRED)))
                        .build();
            }
            var publicacoes = service.getAvailablePublicacoes(fcuId, search);
            return Response.ok(publicacoes).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", ApiI18nMessages.messageOrFallback(
                            ApiI18nMessages.COMMON_BAD_REQUEST, e.getMessage())))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", ApiI18nMessages.withDetail(
                            ApiI18nMessages.PUBLICACAO_FETCH_PUBLICACOES_FAILED, e.getMessage())))
                    .build();
        }
    }

    @POST
    public Response create(PublicacaoProdutoDto dto) {
        try {
            PublicacaoProdutoDto created = service.create(dto);
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", ApiI18nMessages.withDetail(
                            ApiI18nMessages.PUBLICACAO_CREATE_ASSOCIATION_FAILED, e.getMessage())))
                    .build();
        }
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Integer id) {
        try {
            PublicacaoProdutoDto deleted = service.delete(id);
            return Response.ok(deleted).build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", ApiI18nMessages.messageOrFallback(
                            ApiI18nMessages.PUBLICACAO_NOT_FOUND, e.getMessage())))
                    .build();
        }
    }

    @DELETE
    @Path("/publicacao/{publicacaoId}/fcu/{fcuId}")
    public Response deleteByPublicacaoAndFcu(
            @PathParam("publicacaoId") Integer publicacaoId,
            @PathParam("fcuId") Integer fcuId) {
        service.deleteByPublicacaoAndFcu(publicacaoId, fcuId);
        return Response.noContent().build();
    }

    @POST
    @Path("/associate")
    public Response associateFcus(
            @QueryParam("publicacaoId") Integer publicacaoId,
            List<Integer> fcuIds) {
        try {
            if (publicacaoId == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.PUBLICACAO_ID_REQUIRED)))
                        .build();
            }
            service.associateFcus(publicacaoId, fcuIds);
            return Response.ok().build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", ApiI18nMessages.withDetail(
                            ApiI18nMessages.PUBLICACAO_ASSOCIATE_FCUS_FAILED, e.getMessage())))
                    .build();
        }
    }
}
