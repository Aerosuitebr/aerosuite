package com.aerosuite.security;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import javax.sql.DataSource;
import java.sql.SQLException;

/** Resolve a organização pelo segredo do link antes de abrir a sessão Hibernate. */
@Provider
@Priority(Priorities.AUTHENTICATION - 10)
public class PropostaAceiteTenantFilter implements ContainerRequestFilter {
    @Inject DataSource dataSource;
    @Inject InternalUserContext user;

    @Override
    public void filter(ContainerRequestContext request) {
        String path = request.getUriInfo().getPath();
        if (path.startsWith("/")) path = path.substring(1);
        String prefix = "api/public/propostas/";
        if (!path.startsWith(prefix)) return;
        String token = path.substring(prefix.length()).split("/", 2)[0];
        if (!token.matches("[a-f0-9]{64}")) {
            request.abortWith(Response.status(404).build());
            return;
        }
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                 "SELECT tenant_id FROM proposta_comercial WHERE aceite_token = ?")) {
            statement.setString(1, token);
            try (var rows = statement.executeQuery()) {
                if (!rows.next()) {
                    request.abortWith(Response.status(404).build());
                    return;
                }
                user.setProvisioningTenant(Long.parseLong(rows.getString(1)));
            }
        } catch (SQLException e) {
            throw new jakarta.ws.rs.InternalServerErrorException("Não foi possível consultar a proposta.", e);
        }
    }
}
