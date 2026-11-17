package com.aerosuite.api;

import com.aerosuite.dto.CotacaoDolarDto;
import com.aerosuite.service.CotacaoDolarService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Path("/api/cotacao")
@Produces(MediaType.APPLICATION_JSON)
public class CotacaoResource {

    @Inject
    CotacaoDolarService service;

    /** Cotação PTAX do dólar (venda) — proxy server-side do BCB. */
    @GET
    @Path("/dolar")
    public Response dolar(@QueryParam("refresh") @DefaultValue("false") boolean refresh) {
        try {
            if (refresh) {
                service.limparCache();
            }
            CotacaoDolarDto dto = service.obterCotacaoAtual();
            return Response.ok(dto).build();
        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(Map.of(
                            "error", "cotacao_indisponivel",
                            "message", e.getMessage() != null ? e.getMessage()
                                    : "Não foi possível obter a cotação PTAX do dólar."
                    ))
                    .build();
        }
    }
}
