package com.aerosuite.api;



import com.aerosuite.api.AuthResource.ErrorResponse;

import com.aerosuite.dto.MfaConfirmRequest;
import com.aerosuite.dto.MfaSetupResponse;
import com.aerosuite.dto.PlatformOpsEligibilityDto;

import com.aerosuite.dto.PlatformOpsElevateRequest;

import com.aerosuite.dto.PlatformOpsLoginRequest;

import com.aerosuite.dto.PlatformOpsRevalidateRequest;

import com.aerosuite.dto.PlatformOpsSessionResponse;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.i18n.AuthI18nCodes;

import com.aerosuite.security.InternalUserContext;

import com.aerosuite.service.AuthLoginException;

import com.aerosuite.service.AuthMfaException;

import com.aerosuite.service.PlatformOpsAuthService;

import jakarta.inject.Inject;

import jakarta.ws.rs.Consumes;

import jakarta.ws.rs.GET;

import jakarta.ws.rs.POST;

import jakarta.ws.rs.Path;

import jakarta.ws.rs.Produces;

import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;

import jakarta.ws.rs.core.Response;

import java.util.Map;



/**

 * Login dedicado ao plano de controle — URL não exposta no menu da aplicação.

 */

@Path("/api/platform-ops")

@Produces(MediaType.APPLICATION_JSON)

@Consumes(MediaType.APPLICATION_JSON)

public class PlatformOpsResource {



    @Inject

    PlatformOpsAuthService platformOpsAuthService;



    @Inject

    InternalUserContext internalUserContext;



    @POST

    @Path("/login")

    public Response login(PlatformOpsLoginRequest request) {

        try {

            PlatformOpsSessionResponse session = platformOpsAuthService.login(request);

            return Response.ok(session).build();

        } catch (AuthMfaException e) {

            return Response.status(Response.Status.FORBIDDEN)

                    .entity(Map.of(

                            "code", e.code,

                            "message", e.getMessage(),

                            "mfaSetupToken", e.mfaSetupToken != null ? e.mfaSetupToken : ""))

                    .build();

        } catch (AuthLoginException e) {

            return Response.status(Response.Status.UNAUTHORIZED)

                    .entity(new ErrorResponse(AuthI18nCodes.encodedMessage(e.code), e.code))

                    .build();

        }

    }



    /**

     * Indica se o utilizador autenticado pode ver o módulo de operações (allowlist no servidor).

     */

    @GET

    @Path("/eligibility")

    public Response eligibility() {

        if (!internalUserContext.isAuthenticated()) {

            return Response.status(Response.Status.UNAUTHORIZED).build();

        }

        boolean ok = platformOpsAuthService.isCurrentUserEligible(

                internalUserContext.getEmail(), internalUserContext.getTenantId());

        return Response.ok(new PlatformOpsEligibilityDto(ok)).build();

    }



    /**

     * Step-up: utilizador já autenticado na app comum solicita sessão elevada (senha + MFA).

     */

    @POST

    @Path("/elevate")

    public Response elevate(PlatformOpsElevateRequest request) {

        if (!internalUserContext.isAuthenticated()) {

            return Response.status(Response.Status.UNAUTHORIZED).build();

        }

        try {

            String password = request != null ? request.password : null;

            String totpCode = request != null ? request.totpCode : null;

            PlatformOpsSessionResponse session = platformOpsAuthService.elevateWithCredentials(

                    internalUserContext.getUserId(), password, totpCode);

            return Response.ok(session).build();

        } catch (AuthMfaException e) {

            return Response.status(Response.Status.FORBIDDEN)

                    .entity(Map.of(

                            "code", e.code,

                            "message", e.getMessage(),

                            "mfaSetupToken", e.mfaSetupToken != null ? e.mfaSetupToken : ""))

                    .build();

        } catch (AuthLoginException e) {

            return Response.status(Response.Status.UNAUTHORIZED)

                    .entity(new ErrorResponse(AuthI18nCodes.encodedMessage(e.code), e.code))

                    .build();

        } catch (jakarta.ws.rs.NotAuthorizedException | jakarta.ws.rs.ForbiddenException e) {

            return Response.status(Response.Status.UNAUTHORIZED)

                    .entity(new ErrorResponse(

                            ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED),

                            "INVALID_CREDENTIALS"))

                    .build();

        }

    }

    /**
     * Revalidação periódica de MFA (sessão elevada ainda válida, confirmação MFA expirada).
     */
    @POST
    @Path("/revalidate-mfa")
    public Response revalidateMfa(PlatformOpsRevalidateRequest request) {
        if (!internalUserContext.isAuthenticated()) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        try {
            String totpCode = request != null ? request.totpCode : null;
            PlatformOpsSessionResponse session = platformOpsAuthService.revalidateMfa(
                    internalUserContext.getUserId(), totpCode);
            return Response.ok(session).build();
        } catch (AuthMfaException e) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of(
                            "code", e.code,
                            "message", e.getMessage(),
                            "mfaSetupToken", e.mfaSetupToken != null ? e.mfaSetupToken : ""))
                    .build();
        } catch (AuthLoginException e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse(AuthI18nCodes.encodedMessage(e.code), e.code))
                    .build();
        } catch (jakarta.ws.rs.NotAuthorizedException | jakarta.ws.rs.ForbiddenException e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse(
                            ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED),
                            "INVALID_CREDENTIALS"))
                    .build();
        }
    }

    /**
     * Inicia cadastro MFA inline (Bearer = token {@code mfa_setup} retornado no login).
     */
    @POST
    @Path("/mfa/setup")
    public Response mfaSetup(@Context HttpHeaders headers) {
        try {
            MfaSetupResponse setup = platformOpsAuthService.beginMfaEnrollment(extractBearer(headers));
            return Response.ok(setup).build();
        } catch (jakarta.ws.rs.NotAuthorizedException | jakarta.ws.rs.ForbiddenException e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse(
                            ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED),
                            "INVALID_CREDENTIALS"))
                    .build();
        }
    }

    /**
     * Confirma cadastro MFA e abre sessão elevada do plano de controle.
     */
    @POST
    @Path("/mfa/confirm")
    public Response mfaConfirm(MfaConfirmRequest request, @Context HttpHeaders headers) {
        try {
            String totpCode = request != null ? request.totpCode : null;
            PlatformOpsSessionResponse session =
                    platformOpsAuthService.confirmMfaEnrollment(extractBearer(headers), totpCode);
            return Response.ok(session).build();
        } catch (AuthLoginException e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse(AuthI18nCodes.encodedMessage(e.code), e.code))
                    .build();
        } catch (jakarta.ws.rs.NotAuthorizedException | jakarta.ws.rs.ForbiddenException e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse(
                            ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED),
                            "INVALID_CREDENTIALS"))
                    .build();
        }
    }

    private static String extractBearer(HttpHeaders headers) {
        if (headers == null) {
            return null;
        }
        String auth = headers.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (auth == null || !auth.startsWith("Bearer ")) {
            return null;
        }
        return auth.substring(7).trim();
    }

}

