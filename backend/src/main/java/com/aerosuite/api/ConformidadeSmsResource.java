package com.aerosuite.api;

import com.aerosuite.dto.ConformidadeSmsIndicadoresDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ConformidadeSmsIndicadoresService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/conformidade/sms")
@Produces(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"CONFORMIDADE_PAINEL", "CONFORMIDADE_NC"})
public class ConformidadeSmsResource {

    @Inject
    ConformidadeSmsIndicadoresService smsService;

    @GET
    @Path("/indicadores")
    public Response indicadores(@QueryParam("dias") @DefaultValue("60") int dias) {
        ConformidadeSmsIndicadoresDto dto = smsService.indicadores(dias);
        return Response.ok(dto).build();
    }
}
