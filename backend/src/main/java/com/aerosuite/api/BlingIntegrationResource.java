package com.aerosuite.api;

import com.aerosuite.integration.bling.BlingClient;
import com.aerosuite.integration.bling.BlingContactPageDto;
import com.aerosuite.integration.bling.BlingConnectionStatus;
import com.aerosuite.integration.bling.BlingOAuthService;
import com.aerosuite.integration.bling.BlingOAuthStartDto;
import com.aerosuite.integration.bling.BlingTenantApiClient;
import com.aerosuite.integration.bling.TenantBlingConnectionService;
import com.aerosuite.integration.bling.TenantBlingConnectionViewDto;
import com.aerosuite.integration.bling.BlingFiscalConfigDto;
import com.aerosuite.integration.bling.BlingFiscalPayloadHelper;
import com.aerosuite.integration.bling.BlingFiscalConfigUpdateDto;
import com.aerosuite.integration.bling.BlingImportClienteResultDto;
import com.aerosuite.integration.bling.BlingNfeEmitResultDto;
import com.aerosuite.integration.bling.BlingNfeReadinessDto;
import com.aerosuite.integration.bling.BlingPropostaNfeListDto;
import com.aerosuite.integration.bling.BlingPropostaPedidoViewDto;
import com.aerosuite.integration.bling.BlingSyncStatusDto;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.PermissionProfileService;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.BlingContactSyncService;
import com.aerosuite.service.BlingFiscalSyncService;
import com.aerosuite.service.BlingWebhookService;
import com.aerosuite.service.PropostaBlingPedidoService;
import com.aerosuite.service.SistemaEmpresaConfigService;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.integration.bling.BlingBootstrapResultDto;
import com.aerosuite.integration.bling.BlingDeadJobsActionResultDto;
import com.aerosuite.integration.bling.BlingScopeProbe;
import com.aerosuite.integration.bling.BlingScopesStatusDto;
import com.aerosuite.integration.bling.BlingSyncJobViewDto;
import com.aerosuite.integration.bling.BlingFluxoRetryResultDto;
import com.aerosuite.integration.bling.BlingPropostaFluxoViewDto;
import com.aerosuite.service.BlingBootstrapService;
import com.aerosuite.service.BlingNfeReadinessService;
import com.aerosuite.service.BlingWebhookHomologationService;
import com.aerosuite.integration.bling.BlingWebhookHomologationDto;
import com.aerosuite.service.BlingPropostaFluxoService;
import com.aerosuite.service.BlingSyncJobService;
import com.aerosuite.service.TenantBlingFiscalConfigService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.nio.file.Files;
import java.util.List;
import java.util.Map;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/api/integracoes/bling")
@Produces(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(onlyAuthenticated = true)
public class BlingIntegrationResource {

    @Inject
    BlingClient blingClient;

    @Inject
    TenantBlingConnectionService tenantConnectionService;

    @Inject
    BlingOAuthService blingOAuthService;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    PermissionProfileService permissionProfileService;

    @Inject
    BlingContactSyncService contactSyncService;

    @Inject
    BlingWebhookService blingWebhookService;

    @Inject
    PropostaBlingPedidoService pedidoService;

    @Inject
    BlingFiscalSyncService fiscalSyncService;

    @Inject
    TenantBlingFiscalConfigService fiscalConfigService;

    @Inject
    BlingScopeProbe scopeProbe;

    @Inject
    BlingBootstrapService bootstrapService;

    @Inject
    BlingWebhookHomologationService webhookHomologationService;

    @Inject
    BlingSyncJobService syncJobService;

    @Inject
    BlingPropostaFluxoService fluxoService;

    @Inject
    BlingNfeReadinessService nfeReadinessService;

    @Inject
    BlingTenantApiClient tenantApiClient;

    @ConfigProperty(name = "aero.suite.security.super-perfil-codigos", defaultValue = "ADMIN,ADMINISTRADOR,DIRETOR")
    String superPerfilCodigosRaw;

    @GET
    @Path("/status")
    public BlingConnectionStatus status(
            @jakarta.ws.rs.QueryParam("refresh") @jakarta.ws.rs.DefaultValue("false") boolean refresh) {
        if (refresh) {
            scopeProbe.invalidate(requireTenantId());
        }
        return blingClient.checkConnection();
    }

    @GET
    @Path("/scopes")
    public BlingScopesStatusDto scopes(
            @jakarta.ws.rs.QueryParam("refresh") @jakarta.ws.rs.DefaultValue("false") boolean refresh) {
        if (!canManageBling()) {
            throw new jakarta.ws.rs.ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.BLING_ADMIN_ONLY));
        }
        return scopeProbe.probe(requireTenantId(), refresh);
    }

    @POST
    @Path("/bootstrap/homologacao")
    public Response bootstrapHomologacao() {
        if (!canManageBling()) {
            return forbidden();
        }
        Long tenantId = requireTenantId();
        Integer userId = internalUserContext.getUserId();
        BlingBootstrapResultDto result = bootstrapService.runHomologacao(tenantId, userId);
        if (!result.success) {
            return Response.status(Response.Status.BAD_REQUEST).entity(result).build();
        }
        return Response.ok(result).build();
    }

    @GET
    @Path("/connection")
    public TenantBlingConnectionViewDto connection() {
        Long tenantId = requireTenantId();
        return tenantConnectionService.getConnectionView(tenantId, canManageBling());
    }

    @POST
    @Path("/oauth/start")
    public Response startOAuth() {
        if (!canManageBling()) {
            return forbidden();
        }
        Long tenantId = requireTenantId();
        Integer userId = internalUserContext.getUserId();
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        try {
            BlingOAuthStartDto dto = blingOAuthService.startAuthorization(tenantId, userId);
            return Response.ok(dto).build();
        } catch (IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(ApiI18nMessages.BLING_OAUTH_START_FAILED, e.getMessage())))
                    .build();
        }
    }

    @DELETE
    @Path("/connection")
    public Response disconnect() {
        if (!canManageBling()) {
            return forbidden();
        }
        Long tenantId = requireTenantId();
        tenantConnectionService.disconnect(tenantId);
        scopeProbe.invalidate(tenantId);
        nfeReadinessService.invalidateTenant(tenantId);
        return Response.noContent().build();
    }

    @GET
    @Path("/contatos")
    @RequiresFuncionalidades(allOf = {"propostas-comerciais"})
    public com.aerosuite.integration.bling.BlingContactPageDto searchContacts(
            @jakarta.ws.rs.QueryParam("pesquisa") String pesquisa,
            @jakarta.ws.rs.QueryParam("numeroDocumento") String numeroDocumento,
            @jakarta.ws.rs.QueryParam("nome") String nome,
            @jakarta.ws.rs.QueryParam("limit") Integer limit) {
        int lim = limit != null ? limit : 20;
        if (numeroDocumento != null && !numeroDocumento.isBlank()) {
            BlingContactPageDto page = new BlingContactPageDto();
            BlingConnectionStatus conn = blingClient.checkConnection();
            page.enabled = conn.enabled;
            page.configured = conn.configured;
            if (!conn.enabled || !conn.configured) {
                page.message = conn.message;
                page.items = List.of();
                return page;
            }
            page.items = tenantApiClient.findContactsByDocument(requireTenantId(), numeroDocumento);
            page.message = page.items.isEmpty()
                    ? ApiI18nMessages.encode(ApiI18nMessages.BLING_CONTACTS_NOT_FOUND)
                    : null;
            return page;
        }
        if (nome != null && !nome.isBlank()) {
            BlingContactPageDto page = new BlingContactPageDto();
            BlingConnectionStatus conn = blingClient.checkConnection();
            page.enabled = conn.enabled;
            page.configured = conn.configured;
            if (!conn.enabled || !conn.configured) {
                page.message = conn.message;
                page.items = List.of();
                return page;
            }
            page.items = tenantApiClient.searchContactsByNome(requireTenantId(), nome, lim);
            page.message = page.items.isEmpty()
                    ? ApiI18nMessages.encode(ApiI18nMessages.BLING_CONTACTS_NOT_FOUND)
                    : null;
            return page;
        }
        return blingClient.searchContacts(pesquisa, lim);
    }

    @POST
    @Path("/homologacao/webhook")
    public Response webhookHomologacao() {
        if (!canManageBling()) {
            return forbidden();
        }
        BlingWebhookHomologationDto result = webhookHomologationService.run(requireTenantId());
        if (!result.success) {
            return Response.status(Response.Status.BAD_REQUEST).entity(result).build();
        }
        return Response.ok(result).build();
    }

    @GET
    @Path("/sync/status")
    public BlingSyncStatusDto syncStatus() {
        return blingWebhookService.syncStatus(requireTenantId());
    }

    @GET
    @Path("/nfe/readiness")
    public BlingNfeReadinessDto nfeReadiness(@jakarta.ws.rs.QueryParam("refresh") Boolean refresh) {
        boolean doRefresh = refresh != null && refresh;
        return nfeReadinessService.evaluateTenant(requireTenantId(), doRefresh);
    }

    @POST
    @Path("/produtos/{blingProductId}/fiscal")
    public Response syncProductFiscal(@PathParam("blingProductId") long blingProductId) {
        if (!canManageBling()) {
            return forbidden();
        }
        Long tenantId = requireTenantId();
        try {
            var fiscal = fiscalConfigService.resolveEffective(tenantId);
            String ncm = BlingFiscalPayloadHelper.resolveNcm(fiscal);
            String unidade = BlingFiscalPayloadHelper.defaultUnit();
            boolean ok = tenantApiClient.updateProductFiscalFields(tenantId, blingProductId, ncm, unidade);
            return Response.ok(Map.of(
                            "blingProductId", blingProductId,
                            "ncm", ncm != null ? ncm : "",
                            "unidade", unidade,
                            "persisted", ok))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.BLING_CREATE_PRODUCT_FAILED, e.getMessage())))
                    .build();
        }
    }

    @GET
    @Path("/sync/jobs/dead")
    public List<BlingSyncJobViewDto> listDeadSyncJobs() {
        if (!canManageBling()) {
            throw new jakarta.ws.rs.ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.BLING_ADMIN_ONLY));
        }
        return syncJobService.listDeadJobs(requireTenantId());
    }

    @POST
    @Path("/sync/jobs/{jobId}/reprocess")
    public Response reprocessDeadSyncJob(@PathParam("jobId") long jobId) {
        if (!canManageBling()) {
            return forbidden();
        }
        try {
            BlingDeadJobsActionResultDto result = syncJobService.reprocessDeadJob(requireTenantId(), jobId);
            return Response.ok(result).build();
        } catch (jakarta.ws.rs.NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.BLING_JOB_NOT_FOUND)))
                    .build();
        }
    }

    @DELETE
    @Path("/sync/jobs/{jobId}")
    public Response discardDeadSyncJob(@PathParam("jobId") long jobId) {
        if (!canManageBling()) {
            return forbidden();
        }
        try {
            BlingDeadJobsActionResultDto result = syncJobService.discardDeadJob(requireTenantId(), jobId);
            return Response.ok(result).build();
        } catch (jakarta.ws.rs.NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.BLING_JOB_NOT_FOUND)))
                    .build();
        }
    }

    @POST
    @Path("/sync/jobs/dead/reprocess-all")
    public Response reprocessAllDeadSyncJobs() {
        if (!canManageBling()) {
            return forbidden();
        }
        return Response.ok(syncJobService.reprocessAllDeadJobs(requireTenantId())).build();
    }

    @DELETE
    @Path("/sync/jobs/dead")
    public Response discardAllDeadSyncJobs() {
        if (!canManageBling()) {
            return forbidden();
        }
        return Response.ok(syncJobService.discardAllDeadJobs(requireTenantId())).build();
    }

    @POST
    @Path("/contatos/{blingContatoId}/import-cliente")
    @RequiresFuncionalidades(allOf = {"propostas-comerciais"})
    public Response importContactAsCliente(@PathParam("blingContatoId") long blingContatoId) {
        Long tenantId = requireTenantId();
        try {
            BlingImportClienteResultDto result =
                    contactSyncService.importContact(tenantId, blingContatoId, internalUserContext.getUserId());
            return Response.ok(result).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.BLING_IMPORT_CONTACT_FAILED, e.getMessage())))
                    .build();
        }
    }

    @POST
    @Path("/contatos/{blingContatoId}/link/{clientePropostaId}")
    @RequiresFuncionalidades(allOf = {"propostas-comerciais"})
    public Response linkContact(
            @PathParam("blingContatoId") long blingContatoId,
            @PathParam("clientePropostaId") int clientePropostaId) {
        Long tenantId = requireTenantId();
        try {
            return Response.ok(contactSyncService.linkExisting(tenantId, blingContatoId, clientePropostaId)).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.BLING_LINK_CONTACT_FAILED, e.getMessage())))
                    .build();
        }
    }

    @GET
    @Path("/propostas/{propostaId}/pedido")
    @RequiresFuncionalidades(allOf = {"propostas-comerciais"})
    public BlingPropostaPedidoViewDto getPropostaPedido(@PathParam("propostaId") long propostaId) {
        return pedidoService.viewForProposta(requireTenantId(), propostaId);
    }

    @POST
    @Path("/propostas/{propostaId}/pedido")
    @RequiresFuncionalidades(allOf = {"propostas-comerciais"})
    public Response createPropostaPedido(@PathParam("propostaId") long propostaId) {
        Long tenantId = requireTenantId();
        try {
            BlingPropostaPedidoViewDto dto =
                    pedidoService.criarPedido(tenantId, propostaId, internalUserContext.getUserId());
            return Response.ok(dto).build();
        } catch (jakarta.ws.rs.BadRequestException | jakarta.ws.rs.NotFoundException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.BLING_CREATE_ORDER_FAILED, e.getMessage())))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.BLING_CREATE_BLING_ORDER_FAILED, e.getMessage())))
                    .build();
        }
    }

    @GET
    @Path("/propostas/{propostaId}/nfe")
    @RequiresFuncionalidades(allOf = {"propostas-comerciais"})
    public BlingPropostaNfeListDto listPropostaNfe(@PathParam("propostaId") long propostaId) {
        return fiscalSyncService.listForProposta(requireTenantId(), propostaId);
    }

    @POST
    @Path("/propostas/{propostaId}/nfe/emitir")
    @RequiresFuncionalidades(allOf = {"propostas-comerciais"})
    public Response emitirPropostaNfe(@PathParam("propostaId") long propostaId) {
        Long tenantId = requireTenantId();
        try {
            BlingNfeEmitResultDto result = fiscalSyncService.emitirNfeForProposta(tenantId, propostaId);
            fluxoService.recordNfeResult(tenantId, propostaId, result);
            return Response.ok(result).build();
        } catch (Exception e) {
            fluxoService.recordNfeFailure(tenantId, propostaId, null, e);
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.BLING_EMIT_NFE_FAILED, e.getMessage())))
                    .build();
        }
    }

    @GET
    @Path("/propostas/{propostaId}/fluxo")
    @RequiresFuncionalidades(allOf = {"propostas-comerciais"})
    public BlingPropostaFluxoViewDto getPropostaFluxo(@PathParam("propostaId") long propostaId) {
        return fluxoService.viewForProposta(requireTenantId(), propostaId);
    }

    @GET
    @Path("/os/{osId}/fluxo")
    @RequiresFuncionalidades(anyOf = {"propostas-comerciais", "ORDEM_SERVICO"})
    public Response getOsFluxo(@PathParam("osId") long osId) {
        BlingPropostaFluxoViewDto view = fluxoService.viewForOs(requireTenantId(), osId);
        if (view == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.BLING_NO_PROPOSTA_LINKED_OS)))
                    .build();
        }
        return Response.ok(view).build();
    }

    @POST
    @Path("/propostas/{propostaId}/fluxo/retry")
    @RequiresFuncionalidades(allOf = {"propostas-comerciais"})
    public Response retryPropostaFluxo(@PathParam("propostaId") long propostaId) {
        Long tenantId = requireTenantId();
        try {
            BlingFluxoRetryResultDto result = fluxoService.retryAutomations(tenantId, propostaId);
            return Response.ok(result).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.BLING_RETRY_AUTOMATIONS_FAILED, e.getMessage())))
                    .build();
        }
    }

    @GET
    @Path("/fiscal-config")
    public BlingFiscalConfigDto getFiscalConfig() {
        return fiscalConfigService.getView(requireTenantId());
    }

    @PUT
    @Path("/fiscal-config")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response updateFiscalConfig(BlingFiscalConfigUpdateDto body) {
        if (!canManageBling()) {
            return forbidden();
        }
        try {
            return Response.ok(fiscalConfigService.update(requireTenantId(), body)).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.BLING_SAVE_CONFIG_FAILED, e.getMessage())))
                    .build();
        }
    }

    @POST
    @Path("/fiscal-config/certificado")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadCertificado(
            @FormParam("file") FileUpload file,
            @FormParam("password") String password,
            @FormParam("tipo") String tipo) {
        if (!canManageBling()) {
            return forbidden();
        }
        if (file == null || file.uploadedFile() == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.BLING_CERT_REQUIRED)))
                    .build();
        }
        try {
            byte[] bytes = Files.readAllBytes(file.uploadedFile());
            BlingFiscalConfigDto dto = fiscalConfigService.uploadCertificado(
                    requireTenantId(), bytes, file.fileName(), password, tipo);
            return Response.ok(dto).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.BLING_CERT_UPLOAD_FAILED, e.getMessage())))
                    .build();
        }
    }

    @DELETE
    @Path("/fiscal-config/certificado")
    public Response removeCertificado() {
        if (!canManageBling()) {
            return forbidden();
        }
        return Response.ok(fiscalConfigService.removeCertificado(requireTenantId())).build();
    }

    private Long requireTenantId() {
        Long tenantId = internalUserContext.getTenantId();
        if (tenantId == null) {
            throw new jakarta.ws.rs.BadRequestException(
                    ApiI18nMessages.encode(ApiI18nMessages.TENANT_NOT_IDENTIFIED));
        }
        return tenantId;
    }

    private void ensurePermissionSnapshot() {
        if (internalUserContext.isPermissionsHydrated()) {
            return;
        }
        Integer uid = internalUserContext.getUserId();
        if (uid == null) {
            return;
        }
        PermissionProfileService.PermissionSnapshot snap = permissionProfileService.loadSnapshot(uid);
        internalUserContext.applyPermissionSnapshot(snap.perfilCodigo(), snap.funcionalidadeCodigos());
    }

    private boolean canManageBling() {
        ensurePermissionSnapshot();
        return SistemaEmpresaConfigService.isSuperPerfil(
                internalUserContext.getPerfilCodigo(), superPerfilCodigosRaw);
    }

    private static Response forbidden() {
        return Response.status(Response.Status.FORBIDDEN)
                .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.BLING_ADMIN_ONLY)))
                .build();
    }
}
