package com.aerosuite.api;

import com.aerosuite.dto.UsuarioNotificacaoPreferenciasDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.UsuarioService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

@Path("/api/usuario-preferences")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(onlyAuthenticated = true)
public class UsuarioPreferencesResource {

    @Inject
    UsuarioService usuarioService;

    @GET
    @Path("/notificacoes")
    public UsuarioNotificacaoPreferenciasDto getNotificacoes() {
        return usuarioService.getNotificacoesUsuarioLogado();
    }

    @PUT
    @Path("/notificacoes")
    public Response atualizarNotificacoes(UsuarioNotificacaoPreferenciasDto body) {
        usuarioService.atualizarNotificacoesUsuarioLogado(
                body != null ? body.ticketEmailModo() : null);
        return Response.noContent().build();
    }

    @PUT
    @Path("/idioma")
    public Response atualizarIdioma(Map<String, String> body) {
        String idioma = body != null ? body.get("idioma") : null;
        usuarioService.atualizarIdiomaUsuarioLogado(idioma);
        return Response.noContent().build();
    }
}
