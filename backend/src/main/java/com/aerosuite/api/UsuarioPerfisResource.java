package com.aerosuite.api;

import com.aerosuite.dto.UsuarioPerfisDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.UsuarioPerfilService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/controle-acesso/vinculos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"USUARIOS", "GERENCIAR_PERMISSOES"})
public class UsuarioPerfisResource {
    @Inject UsuarioPerfilService service;

    @GET
    public List<UsuarioPerfisDto> listar() {
        return service.listar();
    }

    @PUT
    @Path("/{usuarioId}")
    @RequiresFuncionalidades(allOf = {"GERENCIAR_PERMISSOES"})
    public UsuarioPerfisDto salvar(@PathParam("usuarioId") int usuarioId, UsuarioPerfisDto.Atualizacao request) {
        return service.salvar(usuarioId, request);
    }
}
