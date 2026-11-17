package com.aerosuite.api;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.FerramentaService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
@Path("/api/ferramentas/plano-pn")
@Produces(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyCodigoStartingWith = {"OS", "os", "FERRAMENTAS"})
public class PlanoFerramentasResource {
    @Inject FerramentaService service;
    @GET public FerramentaService.PlanoPn plano(@QueryParam("pn") String pn, @QueryParam("osId") Long osId) {
        return service.planoPn(pn, osId, service.autenticarSessao());
    }
}
