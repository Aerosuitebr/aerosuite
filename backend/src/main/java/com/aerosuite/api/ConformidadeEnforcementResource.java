package com.aerosuite.api;

import com.aerosuite.dto.ConformidadeEnforcementConfigDto;
import com.aerosuite.dto.ConformidadeEnforcementConfigUpdateDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ConformidadeEnforcementPolicyService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * P1 — políticas de bloqueio operacional SGQ.
 */
@Path("/api/conformidade/enforcement")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"CONFORMIDADE_PAINEL", "GERENCIAR_PERMISSOES"})
public class ConformidadeEnforcementResource {

    @Inject
    ConformidadeEnforcementPolicyService policyService;

    @GET
    public Response getConfig() {
        return Response.ok(policyService.getConfig()).build();
    }

    @PUT
    @RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "CONFORMIDADE_PAINEL"})
    public Response putConfig(ConformidadeEnforcementConfigUpdateDto body) {
        ConformidadeEnforcementConfigDto saved = policyService.updateConfig(body);
        return Response.ok(saved).build();
    }
}
