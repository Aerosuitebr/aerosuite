package com.aerosuite.api;

import org.jboss.logging.Logger;
import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.openapi.OpenApiDescriptions;
import com.aerosuite.dto.KitFcuDeficitItemDto;
import com.aerosuite.dto.KitFcuDeficitPreviewDto;
import com.aerosuite.dto.OSPendenteTrocaPagamentoDto;
import com.aerosuite.dto.OsConsultaTrocasEventuaisLinhaDto;
import com.aerosuite.dto.OsPainelResumoDto;
import com.aerosuite.dto.PageResponse;
import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.dto.OsReaberturaRequest;
import com.aerosuite.dto.OSDto;
import com.aerosuite.p1.TenantFeatureCodes;
import com.aerosuite.security.AuthRequestAttributes;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.security.RequiresTenantFeature;
import com.aerosuite.service.OSService;
import com.aerosuite.service.OsConformidadeAlertaService;
import com.aerosuite.service.OsEstoqueSaidaAutomacaoService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;

import jakarta.ws.rs.ForbiddenException;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Path("/api/os")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
@RequiresFuncionalidades(anyOf = {"ORDEM_SERVICO", "CONSULTA_TROCAS_EVENTUAIS"})
public class OSResource {

    private static final Logger LOG = Logger.getLogger(OSResource.class);

    @Inject
    OSService service;

    @Inject
    OsEstoqueSaidaAutomacaoService osEstoqueSaidaAutomacaoService;

    @Inject
    OsConformidadeAlertaService osConformidadeAlertaService;

    @Inject
    AuthRequestAttributes authRequestAttributes;

    /**
     * Endpoints internos de OS: bloqueia apenas token legado {@code EXT:} (portal externo).
     * <p>
     * Não inferir tipo de usuário a partir de {@code X-User-Id} enviado pelo frontend —
     * IDs numéricos de {@code usuario} e {@code usuario_externo} são sequências independentes
     * e podem colidir (falso positivo bloqueando usuários internos).
     * Autenticação/autorização interna fica a cargo de {@link com.aerosuite.security.JwtAuthenticationFilter}
     * e {@link com.aerosuite.security.PermissionAuthorizationFilter}.
     */
    private void assertInternalOsAccess() {
        if (authRequestAttributes.isExternalLegacyToken()) {
            throw new ForbiddenException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.OS_EXTERNAL_PORTAL_ONLY));
        }
    }

    /**
     * Configura o contexto do usuário para auditoria (Bearer: JWT interno ou token interno legado).
     */
    private void setUserContextForAudit(HttpHeaders headers, String forwardedFor, String realIp) {
        AuditoriaUsuarioContext ctx = AuditoriaUsuarioContext.from(headers, forwardedFor, realIp);
        service.setUserContext(ctx.nome, ctx.email, ctx.userId, ctx.ip, ctx.userAgent);
    }

    @GET
    @RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
    public PageResponse<OSDto> list(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("10") int size,
            @QueryParam("sort") @DefaultValue("id,asc") String sort,
            @QueryParam("q") String q,
            @QueryParam("isActive") String isActiveParam) {

        assertInternalOsAccess();

        // Converter string para Boolean (null = true por padrão para filtrar apenas ativos)
        Boolean isActive = null;
        if (isActiveParam != null && !isActiveParam.isBlank()) {
            isActive = Boolean.parseBoolean(isActiveParam);
        }
        try {
            return service.list(page, size, sort, q, isActive);
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao listar OS: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            throw new jakarta.ws.rs.InternalServerErrorException(
                    com.aerosuite.i18n.ApiI18nMessages.withDetail(
                            com.aerosuite.i18n.ApiI18nMessages.OS_LIST_FAILED, e.getMessage()));
        }
    }

    /** Métricas extras na listagem de OS (flag mro.os.dashboardExtendido). */
    @GET
    @Path("/painel-resumo")
    @RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
    @RequiresTenantFeature(allOf = {TenantFeatureCodes.MRO_OS_DASHBOARD_EXTENDIDO})
    public OsPainelResumoDto painelResumo() {
        assertInternalOsAccess();
        return service.painelResumo();
    }

    /**
     * Lista OS com itens da Solicitação de Troca Eventual ainda sem pagamento confirmado (pago null ou false).
     * Restrito a Suprimento, Administrador e Diretor.
     */
    @GET
    @Path("pendentes-pagamento-trocas")
    @RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
    public Response listPendentesPagamentoTrocas(
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {
        setUserContextForAudit(headers, forwardedFor, realIp);
        try {
            List<OSPendenteTrocaPagamentoDto> list = service.listPendentesPagamentoTrocas();
            return Response.ok(list).build();
        } catch (ForbiddenException e) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(ApiI18nMessages.OS_OPERATION_ERROR, e.getMessage())))
                    .build();
        } finally {
            service.clearUserContext();
        }
    }

    /**
     * Lista paginada de OS com Solicitação de Troca Eventual (itens e/ou comentário). Somente usuários internos.
     */
    @GET
    @Path("consulta-trocas-eventuais")
    @RequiresFuncionalidades(anyOf = {"ORDEM_SERVICO", "CONSULTA_TROCAS_EVENTUAIS"})
    public PageResponse<OsConsultaTrocasEventuaisLinhaDto> listConsultaTrocasEventuais(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("10") int size,
            @QueryParam("sort") @DefaultValue("id,desc") String sort,
            @QueryParam("q") String q) {

        assertInternalOsAccess();
        return service.listConsultaTrocasEventuais(page, size, sort, q);
    }

    @GET
    @Path("/{id}/conformidade-alertas")
    @RequiresFuncionalidades(anyOf = {"ORDEM_SERVICO", "CONFORMIDADE_NC", "CONFORMIDADE_TREINAMENTO"})
    public Response conformidadeAlertas(@PathParam("id") Long id) {
        assertInternalOsAccess();
        return Response.ok(osConformidadeAlertaService.alertasOs(id)).build();
    }

    @GET
    @Path("/{id}")
    @RequiresFuncionalidades(anyOf = {"ORDEM_SERVICO", "CONSULTA_TROCAS_EVENTUAIS"})
    public Response getById(
            @Parameter(description = OpenApiDescriptions.WORK_ORDER_ID) @PathParam("id") Long id) {

        assertInternalOsAccess();

        Optional<OSDto> dto = service.findById(id);
        return dto.map(Response::ok)
                .orElse(Response.status(Response.Status.NOT_FOUND))
                .build();
    }

    @GET
    @Path("/id-os/{idOs}")
    @RequiresFuncionalidades(anyOf = {"ORDEM_SERVICO", "CONSULTA_TROCAS_EVENTUAIS"})
    public Response getByIdOs(@Parameter(description = OpenApiDescriptions.WORK_ORDER_ID_SHORT) @PathParam("idOs") Integer idOs) {
        Optional<OSDto> dto = service.findByIdOs(idOs);
        return dto.map(Response::ok)
                .orElse(Response.status(Response.Status.NOT_FOUND))
                .build();
    }

    /**
     * Calcula, antes de salvar a OS, o déficit de estoque do kit do FCU informado.
     * Permite ao frontend exibir uma confirmação informativa ao usuário caso a abertura
     * da OS resulte em déficit (P/Ns sem estoque suficiente para baixa automática).
     */
    @GET
    @Path("/preview-kit-fcu-deficit/{fcuId}")
    @RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
    public Response previewKitFcuDeficit(
            @Parameter(description = OpenApiDescriptions.FCU_ID) @PathParam("fcuId") Integer fcuId) {
        try {
            KitFcuDeficitPreviewDto preview = osEstoqueSaidaAutomacaoService.previewDeficitKitFcu(fcuId);
            return Response.ok(preview).build();
        } catch (Exception e) {
            LOG.warnf(e, "OSResource.previewKitFcuDeficit - erro: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            // Retorna preview vazio em caso de erro inesperado, sem bloquear o salvar.
            KitFcuDeficitPreviewDto fallback = new KitFcuDeficitPreviewDto();
            fallback.fcuId = fcuId;
            return Response.ok(fallback).build();
        }
    }

    /**
     * Lista os itens de déficit de kit FCU registrados para uma OS específica.
     * Usado pelo modal de detalhes do indicador na listagem de OS.
     */
    @GET
    @Path("/{id}/kit-fcu-deficit")
    @RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
    public Response listKitFcuDeficit(
            @Parameter(description = OpenApiDescriptions.WORK_ORDER_ID) @PathParam("id") Long id) {
        try {
            List<KitFcuDeficitItemDto> itens = osEstoqueSaidaAutomacaoService.listarDeficitDaOs(id);
            return Response.ok(itens).build();
        } catch (Exception e) {
            LOG.warnf(e, "OSResource.listKitFcuDeficit - erro: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                            "error", ApiI18nMessages.encode(ApiI18nMessages.OS_KIT_FCU_DEFICIT_LIST_FAILED),
                            "message", ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.OS_KIT_FCU_DEFICIT_LIST_FAILED, e.getMessage())))
                    .build();
        }
    }

    @POST
    @RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
    public Response create(
            OSDto dto,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {

        assertInternalOsAccess();
        try {
            // Configurar contexto do usuário para auditoria
            setUserContextForAudit(headers, forwardedFor, realIp);
            
            OSDto createdDto = service.create(dto);
            return Response.created(URI.create("/api/os/" + createdDto.id)).entity(createdDto).build();
        } catch (Exception e) {
            LOG.warnf(e, "OSResource.create - Erro: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "error", ApiI18nMessages.encode(ApiI18nMessages.OS_CREATE_FAILED),
                            "message", ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.OS_CREATE_FAILED, e.getMessage())))
                    .build();
        } finally {
            service.clearUserContext();
        }
    }

    @PUT
    @Path("/{id}")
    @RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
    public Response update(
            @Parameter(description = OpenApiDescriptions.WORK_ORDER_ID) @PathParam("id") Long id, 
            OSDto dto,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {

        assertInternalOsAccess();

        // Configurar contexto do usuário para auditoria
        setUserContextForAudit(headers, forwardedFor, realIp);
        
        try {
            // Se o body contém isActive=false, fazer soft delete (inativar)
            if (dto != null && dto.isActive != null && !dto.isActive) {
                OSDto inactivated = service.inactivate(id);
                return Response.ok(inactivated).build();
            }
            // Caso contrário, atualizar normalmente
            OSDto updatedDto = service.update(id, dto);
            return Response.ok(updatedDto).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(ApiI18nMessages.messageOrFallback(ApiI18nMessages.OS_NOT_FOUND, e.getMessage()))
                    .build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiI18nMessages.withDetail(ApiI18nMessages.OS_UPDATE_FAILED, e.getMessage()))
                    .build();
        } finally {
            service.clearUserContext();
        }
    }

    @OPTIONS
    @Path("/{id}")
    public Response optionsDelete(@PathParam("id") Long id) {
        // CORS é gerenciado pelo Quarkus nativo (application.properties)
        return Response.ok().build();
    }

    @DELETE
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    @RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
    public Response delete(
            @Parameter(description = OpenApiDescriptions.WORK_ORDER_ID) @PathParam("id") Long id,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {

        assertInternalOsAccess();

        // Configurar contexto do usuário para auditoria
        setUserContextForAudit(headers, forwardedFor, realIp);
        
        try {
            // Delegar toda a lógica de negócio para o Service
            OSDto inactivated = service.delete(id);
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", ApiI18nMessages.encode(ApiI18nMessages.OS_DEACTIVATED));
            response.put("os", inactivated);
            // CORS é gerenciado pelo Quarkus nativo (application.properties)
            return Response.ok().entity(response).build();
        } catch (NotFoundException e) {
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", e.getMessage());
            // CORS é gerenciado pelo Quarkus nativo (application.properties)
            return Response.status(Response.Status.NOT_FOUND).entity(errorResponse).build();
        } catch (Exception e) {
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", ApiI18nMessages.messageOrFallback(
                    ApiI18nMessages.OS_DEACTIVATE_FAILED, e.getMessage()));
            // CORS é gerenciado pelo Quarkus nativo (application.properties)
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(errorResponse).build();
        } finally {
            service.clearUserContext();
        }
    }

    @POST
    @Path("/{id}/reabrir")
    @RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
    public Response reabrir(
            @Parameter(description = OpenApiDescriptions.WORK_ORDER_ID) @PathParam("id") Long id,
            OsReaberturaRequest body,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {
        assertInternalOsAccess();
        setUserContextForAudit(headers, forwardedFor, realIp);
        try {
            AuditoriaUsuarioContext ctx =
                    AuditoriaUsuarioContext.from(headers, forwardedFor, realIp);
            OSDto dto = service.reabrir(id, body, ctx);
            return Response.ok(Map.of(
                    "success", true,
                    "message", ApiI18nMessages.encode(ApiI18nMessages.OS_REABERTURA_SUCESSO),
                    "os", dto))
                    .build();
        } finally {
            service.clearUserContext();
        }
    }

    @DELETE
    @Path("/id-os/{idOs}")
    @RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
    public Response deleteByIdOs(@Parameter(description = OpenApiDescriptions.WORK_ORDER_ID_SHORT) @PathParam("idOs") Integer idOs) {
        try {
            // Soft delete - inativar ao invés de deletar fisicamente
            OSDto inactivated = service.deleteByIdOs(idOs);
            return Response.ok(inactivated).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(e.getMessage()).build();
        }
    }
}
