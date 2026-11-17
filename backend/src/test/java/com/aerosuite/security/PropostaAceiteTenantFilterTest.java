package com.aerosuite.security;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.UriInfo;
import org.junit.jupiter.api.Test;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class PropostaAceiteTenantFilterTest {
    @Test void resolveOrganizacaoPeloTokenSemAbrirSessaoOrm() throws Exception {
        var filter = new PropostaAceiteTenantFilter();
        filter.user = new InternalUserContext();
        filter.dataSource = mock(DataSource.class);
        var connection = mock(Connection.class);
        var statement = mock(PreparedStatement.class);
        var rows = mock(ResultSet.class);
        when(filter.dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(anyString())).thenReturn(statement);
        when(statement.executeQuery()).thenReturn(rows);
        when(rows.next()).thenReturn(true);
        when(rows.getString(1)).thenReturn("42");
        var request = request("api/public/propostas/" + "a".repeat(64) + "/aceitar");
        filter.filter(request);
        assertEquals(42L, filter.user.getTenantId());
        assertFalse(filter.user.isAuthenticated());
        verify(statement).setString(1, "a".repeat(64));
        verify(request, never()).abortWith(any());
    }

    @Test void tokenInvalidoNaoConsultaBanco() {
        var filter = new PropostaAceiteTenantFilter();
        filter.dataSource = mock(DataSource.class);
        var request = request("api/public/propostas/invalido");
        filter.filter(request);
        verify(request).abortWith(argThat(response -> response.getStatus() == 404));
        verifyNoInteractions(filter.dataSource);
    }

    private ContainerRequestContext request(String path) {
        var request = mock(ContainerRequestContext.class);
        var uri = mock(UriInfo.class);
        when(request.getUriInfo()).thenReturn(uri);
        when(uri.getPath()).thenReturn(path);
        return request;
    }
}
