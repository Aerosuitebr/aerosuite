package com.aerosuite.api;

import com.aerosuite.dto.HangarDto;
import com.aerosuite.dto.HangarWriteDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.HangarService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

/**
 * P5.3.2 — CRUD de hangares (bay) por tenant.
 */
@Path("/api/hangares")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"QUADRO_CAPACIDADE", "ORDEM_SERVICO"})
public class HangarResource {

    @Inject
    HangarService hangarService;

    @GET
    public List<HangarDto> listar(@QueryParam("incluirInativos") @DefaultValue("false") boolean incluirInativos) {
        return hangarService.listar(incluirInativos);
    }

    @POST
    public Response criar(HangarWriteDto body) {
        HangarDto dto = hangarService.criar(body);
        return Response.status(Response.Status.CREATED).entity(dto).build();
    }

    @PUT
    @Path("/{id}")
    public HangarDto atualizar(@PathParam("id") Long id, HangarWriteDto body) {
        return hangarService.atualizar(id, body);
    }
}
