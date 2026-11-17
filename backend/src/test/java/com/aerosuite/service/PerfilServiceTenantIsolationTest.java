package com.aerosuite.service;

import com.aerosuite.dto.PerfilDTO;
import com.aerosuite.model.Perfil;
import com.aerosuite.security.TenantDataAccess;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PerfilServiceTenantIsolationTest {
    private final PerfilService service = new PerfilService();
    private final Perfil shared = new Perfil("Padrão", "", "PADRAO");
    private final Perfil own = new Perfil("Oficina", "", "OFICINA");
    private final Perfil other = new Perfil("Oficina", "", "OFICINA");

    @BeforeEach
    void setUp() {
        own.setOwnerTenantId(2L);
        other.setOwnerTenantId(3L);
        Map<Long, Perfil> profiles = Map.of(1L, shared, 2L, own, 3L, other);
        service.entityManager = (EntityManager) Proxy.newProxyInstance(
                EntityManager.class.getClassLoader(), new Class<?>[]{EntityManager.class},
                (proxy, method, args) -> {
                    assertEquals("find", method.getName());
                    return profiles.get(args[1]);
                });
        service.tenantDataAccess = new TenantDataAccess() {
            @Override
            public long currentTenantId() {
                return 2L;
            }
        };
    }

    @Test
    void exposesOnlySharedAndOwnedProfilesForAssignment() {
        assertSame(shared, service.buscarAtribuivel(1L));
        assertSame(own, service.buscarAtribuivel(2L));
        assertNull(service.buscarAtribuivel(3L));
        assertThrows(NotFoundException.class, () -> service.listarFuncionalidades(3L));
        own.setAtivo(false);
        assertNull(service.buscarAtribuivel(2L));
    }

    @Test
    void rejectsChangesToSharedAndForeignProfiles() {
        PerfilDTO dto = new PerfilDTO();
        assertThrows(ForbiddenException.class, () -> service.atualizar(1L, dto));
        assertThrows(ForbiddenException.class, () -> service.deletar(1L));
        assertThrows(ForbiddenException.class, () -> service.atribuirFuncionalidades(1L, List.of()));
        assertThrows(NotFoundException.class, () -> service.atualizar(3L, dto));
        assertThrows(NotFoundException.class, () -> service.deletar(3L));
        assertThrows(NotFoundException.class, () -> service.atribuirFuncionalidades(3L, List.of()));
    }
}
