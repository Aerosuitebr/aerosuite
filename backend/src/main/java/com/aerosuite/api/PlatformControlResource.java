package com.aerosuite.api;

import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresPlatformOps;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.service.PlatformBackupControlService;
import com.aerosuite.service.PlatformControlService;
import com.aerosuite.service.PlatformOnboardingService;
import com.aerosuite.service.PlatformOperatorAccessService;
import com.aerosuite.service.PlatformTelemetryService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

/**
 * Centro de controle da plataforma: overview, billing cross-tenant e usuários por organização.
 */
@Path("/api/platform/control")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresPlatformOps
public class PlatformControlResource {

    @Inject
    PlatformControlService controlService;

    @Inject
    PlatformOperatorAccessService operatorAccessService;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    PlatformTelemetryService telemetryService;

    @Inject
    PlatformBackupControlService backupControlService;

    @Inject
    PlatformOnboardingService onboardingService;

    @GET
    @Path("/overview")
    public PlatformControlOverviewDto overview() {
        return controlService.getOverview();
    }

    @GET
    @Path("/billing")
    public PlatformBillingListDto listBilling() {
        return controlService.listBilling();
    }

    @PATCH
    @Path("/billing/{tenantId}")
    public PlatformBillingRowDto updateBilling(
            @PathParam("tenantId") long tenantId, PlatformUpdateBillingRequest request) {
        return controlService.updateBilling(tenantId, request);
    }

    @GET
    @Path("/tenants/{tenantId}/usuarios")
    public PlatformTenantUserListDto listTenantUsers(
            @PathParam("tenantId") long tenantId, @QueryParam("tipo") String tipo) {
        return controlService.listTenantUsers(tenantId, tipo);
    }

    @PATCH
    @Path("/tenants/{tenantId}/usuarios/{userId}")
    public PlatformTenantUserDto updateTenantUser(
            @PathParam("tenantId") long tenantId,
            @PathParam("userId") int userId,
            @QueryParam("tipo") String tipo,
            PlatformUpdateTenantUserRequest request) {
        return controlService.updateTenantUser(tenantId, userId, tipo, request);
    }

    @GET
    @Path("/telemetry")
    public PlatformTelemetryDto telemetry() {
        return telemetryService.loadTelemetry();
    }

    @GET
    @Path("/backup")
    public PlatformBackupPanelDto backupPanel(
            @QueryParam("limit") @DefaultValue("50") int limit,
            @QueryParam("offset") @DefaultValue("0") int offset) {
        return backupControlService.getPanel(limit, offset);
    }

    @PATCH
    @Path("/backup/schedule")
    public PlatformBackupPanelDto updateBackupSchedule(PlatformBackupScheduleRequest request) {
        return backupControlService.updateSchedule(request);
    }

    @GET
    @Path("/billing/{tenantId}/history")
    public PlatformBillingHistoryDto billingHistory(@PathParam("tenantId") long tenantId) {
        return controlService.listBillingHistory(tenantId);
    }

    @GET
    @Path("/operators")
    public PlatformOperatorListDto listOperators() {
        return operatorAccessService.listOperators();
    }

    @PATCH
    @Path("/operators/{usuarioId}")
    public PlatformOperatorRowDto setOperatorAccess(
            @PathParam("usuarioId") int usuarioId, PlatformOperatorAccessRequest request) {
        Integer actorId = internalUserContext.isAuthenticated() ? internalUserContext.getUserId() : null;
        return operatorAccessService.setOperatorAccess(usuarioId, request, actorId);
    }

    @GET
    @Path("/onboarding")
    public PlatformOnboardingHubDto onboardingHub() {
        return onboardingService.listHub();
    }

    @GET
    @Path("/onboarding/templates")
    public java.util.List<PlatformOnboardingTemplateDto> onboardingTemplates() {
        return onboardingService.listTemplates();
    }

    @GET
    @Path("/onboarding/{tenantId}")
    public PlatformOnboardingDetailDto onboardingDetail(@PathParam("tenantId") long tenantId) {
        return onboardingService.getDetail(tenantId);
    }

    @PATCH
    @Path("/onboarding/{tenantId}")
    public PlatformOnboardingDetailDto updateOnboarding(
            @PathParam("tenantId") long tenantId, PlatformOnboardingUpdateRequest request) {
        return onboardingService.updateOnboarding(tenantId, request);
    }

    @PATCH
    @Path("/onboarding/{tenantId}/requirements/{requirementKey}")
    public PlatformOnboardingDetailDto updateOnboardingRequirement(
            @PathParam("tenantId") long tenantId,
            @PathParam("requirementKey") String requirementKey,
            PlatformOnboardingRequirementUpdateRequest request) {
        return onboardingService.updateRequirement(tenantId, requirementKey, request);
    }

    @POST
    @Path("/onboarding/{tenantId}/messages")
    public PlatformOnboardingSendMessageResultDto sendOnboardingMessage(
            @PathParam("tenantId") long tenantId, PlatformOnboardingSendMessageRequest request) {
        return onboardingService.sendMessage(tenantId, request);
    }

    @PATCH
    @Path("/onboarding/templates/{code}")
    public PlatformOnboardingTemplateDto updateOnboardingTemplate(
            @PathParam("code") String code, PlatformOnboardingTemplateUpdateRequest request) {
        return onboardingService.updateTemplate(code, request);
    }

    @POST
    @Path("/onboarding/{tenantId}/welcome-email")
    public WelcomeEmailResponse resendOnboardingWelcomeEmail(
            @PathParam("tenantId") long tenantId, WelcomeEmailRequest request) {
        return onboardingService.resendWelcomeEmail(tenantId, request);
    }
}
