package com.aerosuite.api;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.CriarDelegacaoFuncionalidadeRequest;
import com.aerosuite.dto.DelegacaoFuncionalidadeDto;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.DelegacaoFuncionalidadeService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

/**
 * Gestão de delegações de códigos de funcionalidade a utilizadores internos (além do perfil).
 */
@Path("/api/delegacao-funcionalidades")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "USUARIOS"})
public class DelegacaoFuncionalidadeResource {

    @Inject
    DelegacaoFuncionalidadeService service;

    @Inject
    InternalUserContext internalUserContext;

    @GET
    public List<DelegacaoFuncionalidadeDto> list(@QueryParam("usuarioGranteeId") Integer usuarioGranteeId) {
        if (usuarioGranteeId == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.DELEGACAO_GRANTEE_ID_REQUIRED));
        }
        return service.listarPorGrantee(usuarioGranteeId);
    }

    @POST
    public Response create(CriarDelegacaoFuncionalidadeRequest body) {
        DelegacaoFuncionalidadeDto created = service.criar(body, internalUserContext.getUserId());
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @DELETE
    @Path("/{id}")
    public Response revoke(@PathParam("id") long id) {
        service.revogar(id);
        return Response.noContent().build();
    }
}
