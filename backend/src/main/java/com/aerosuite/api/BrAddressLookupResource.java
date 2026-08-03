package com.aerosuite.api;

import com.aerosuite.dto.br.CepLookupDto;
import com.aerosuite.dto.br.CnpjLookupDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.BrAddressLookupService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Proxy autenticado para consulta de CEP/CNPJ (evita CORS e headers de auth no browser).
 */
@Path("/api/br")
@Produces(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(onlyAuthenticated = true)
public class BrAddressLookupResource {

    @Inject
    BrAddressLookupService brAddressLookupService;

    @GET
    @Path("/cep/{cep}")
    public Response lookupCep(@PathParam("cep") String cep) {
        return brAddressLookupService.lookupCep(cep)
                .map(dto -> Response.ok(dto).build())
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }

    @GET
    @Path("/cnpj/{cnpj}")
    public Response lookupCnpj(@PathParam("cnpj") String cnpj) {
        return brAddressLookupService.lookupCnpj(cnpj)
                .map(dto -> Response.ok(dto).build())
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }
}
