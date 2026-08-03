package com.aerosuite.api;

import com.aerosuite.dto.ConformidadePainelDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ConformidadePainelService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/conformidade/painel")
@Produces(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"CONFORMIDADE_PAINEL", "SGQ_DOCUMENTO_CONTROLADO", "CONFORMIDADE_NC"})
public class ConformidadePainelResource {

    @Inject
    ConformidadePainelService painelService;

    @GET
    public Response painel(@QueryParam("dias") @DefaultValue("60") int dias) {
        ConformidadePainelDto dto = painelService.painel(dias);
        return Response.ok(dto).build();
    }
}
