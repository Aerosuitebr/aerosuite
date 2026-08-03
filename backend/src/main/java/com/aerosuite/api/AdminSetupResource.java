package com.aerosuite.api;

import com.aerosuite.domain.Usuario;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.model.Perfil;
import com.aerosuite.security.RequiresFuncionalidades;
import io.quarkus.arc.profile.UnlessBuildProfile;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Path("/api/admin-setup")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@UnlessBuildProfile("prod")
@RequiresFuncionalidades(allOf = {"GERENCIAR_PERMISSOES"})
public class AdminSetupResource {
    
    @Inject
    EntityManager entityManager;
    
    @POST
    @Path("/associate-user-admin")
    @Transactional
    public Response associateUserAdmin() {
        try {
            Usuario usuario = entityManager.createQuery(
                "SELECT u FROM Usuario u WHERE u.email = :email", Usuario.class
            ).setParameter("email", "wellemlyra@gmail.com").getSingleResult();
            
            Perfil perfil = entityManager.createQuery(
                "SELECT p FROM Perfil p WHERE p.codigo = :codigo", Perfil.class
            ).setParameter("codigo", "ADMIN").getSingleResult();
            
            usuario.perfil = perfil;
            entityManager.merge(usuario);
            
            return Response.ok(Map.of(
                    "message", ApiI18nMessages.encode(ApiI18nMessages.ADMIN_SETUP_ASSOCIATE_SUCCESS)))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.ADMIN_SETUP_ASSOCIATE_FAILED, e.getMessage())))
                .build();
        }
    }
}
