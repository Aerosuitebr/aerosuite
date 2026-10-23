package com.aerosuite.api;

import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.PropostaCcoEmailService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/proposta-cco-emails")
@Produces(MediaType.APPLICATION_JSON) @Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"propostas-comerciais"})
public class PropostaCcoEmailResource {
    @Inject PropostaCcoEmailService service;
    @GET public List<PropostaCcoEmailService.Item> listar() { return service.listar(); }
    @GET @Path("/disponiveis") public List<PropostaCcoEmailService.Item> disponiveis() { return service.disponiveis(); }
    @POST public PropostaCcoEmailService.Item adicionar(PropostaCcoEmailService.Item body) { return service.adicionar(body); }
    @DELETE @Path("/{id}") public void remover(@PathParam("id") Long id) { service.remover(id); }
}
