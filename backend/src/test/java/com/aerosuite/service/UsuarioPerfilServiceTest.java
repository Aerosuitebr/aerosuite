package com.aerosuite.service;

import com.aerosuite.domain.Usuario;
import com.aerosuite.domain.UsuarioPerfil;
import com.aerosuite.model.Perfil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class UsuarioPerfilServiceTest {
    @Test
    void effectiveProfilesExcludeSuspendedDisabledAndForeignLinks() {
        Usuario user = new Usuario();
        user.id = 7;
        user.orgTenantId = 2L;
        Perfil stock = profile(1, "ESTOQUE", 2L);
        Perfil admin = profile(2, "ADMIN", null);
        Perfil workshop = profile(3, "OFICINA", 2L);
        Perfil foreign = profile(4, "OFICINA", 3L);
        Perfil disabled = profile(5, "DESATIVADO", 2L);
        disabled.setAtivo(false);
        user.perfil = workshop;

        UsuarioPerfilService service = serviceWithLinks(List.of(
                link(stock, true), link(admin, true), link(workshop, false), link(foreign, true), link(disabled, true)));

        List<Perfil> effective = service.efetivos(user);
        assertEquals(List.of(stock, admin), effective);
        assertSame(admin, service.principal(effective, user.perfil));

        user.ativo = false;
        assertTrue(service.efetivos(user).isEmpty());
    }

    @Test
    void suspendedLinkDoesNotFallBackToThePreviousPrimaryProfile() {
        Usuario user = new Usuario();
        user.id = 7;
        user.orgTenantId = 2L;
        user.perfil = profile(2, "ADMIN", null);

        assertEquals(List.of(user.perfil), serviceWithLinks(List.of()).efetivos(user));
        assertTrue(serviceWithLinks(List.of(link(user.perfil, false))).efetivos(user).isEmpty());
    }

    private static Perfil profile(long id, String code, Long tenantId) {
        Perfil profile = new Perfil(code, "", code);
        profile.setId(id);
        profile.setOwnerTenantId(tenantId);
        return profile;
    }

    private static UsuarioPerfil link(Perfil profile, boolean active) {
        UsuarioPerfil link = new UsuarioPerfil();
        link.perfil = profile;
        link.ativo = active;
        return link;
    }

    private static UsuarioPerfilService serviceWithLinks(List<UsuarioPerfil> links) {
        var service = new UsuarioPerfilService();
        service.superPerfis = "ADMIN,ADMINISTRADOR,DIRETOR";
        Object query = Proxy.newProxyInstance(TypedQuery.class.getClassLoader(), new Class<?>[]{TypedQuery.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "setParameter" -> proxy;
                    case "getResultList" -> links;
                    default -> throw new UnsupportedOperationException(method.getName());
                });
        service.entityManager = (EntityManager) Proxy.newProxyInstance(
                EntityManager.class.getClassLoader(), new Class<?>[]{EntityManager.class},
                (proxy, method, args) -> {
                    assertEquals("createQuery", method.getName());
                    return query;
                });
        return service;
    }
}
