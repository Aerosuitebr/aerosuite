package com.aerosuite.security;

import com.aerosuite.domain.Usuario;
import com.aerosuite.model.Perfil;
import com.aerosuite.service.UsuarioPerfilService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.ws.rs.NotAuthorizedException;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class PermissionProfileServiceTest {
    @Test
    void combinesPermissionsFromEveryEffectiveProfileAndDelegations() {
        Usuario user = user();
        Perfil workshop = new Perfil("Oficina", "", "OFICINA");
        workshop.setId(8L);
        PermissionProfileService service = service();
        service.usuarioPerfis = new UsuarioPerfilService() {
            @Override public List<Perfil> efetivos(Usuario u) {
                return List.of(u.perfil, workshop);
            }
        };
        Object query = Proxy.newProxyInstance(TypedQuery.class.getClassLoader(), new Class<?>[]{TypedQuery.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "setParameter" -> {
                        assertEquals(List.of(4L, 8L), args[1]);
                        yield proxy;
                    }
                    case "getResultList" -> List.of("ESTOQUE", "ORDEM_SERVICO");
                    default -> throw new UnsupportedOperationException(method.getName());
                });
        service.entityManager = (EntityManager) Proxy.newProxyInstance(EntityManager.class.getClassLoader(),
                new Class<?>[]{EntityManager.class}, (proxy, method, args) -> query);

        assertEquals(Set.of("ESTOQUE", "ORDEM_SERVICO", "CHAT"), service.loadSnapshot(user).funcionalidadeCodigos());
    }

    @Test
    void rejectsTheUsersTokenAfterProfileLinksChange() {
        Usuario user = user();
        user.perfisRevisao = 3;
        PermissionProfileService service = service();
        service.context.setInternalUser(user.id, "", "", user.orgTenantId);
        service.context.setPerfisRevisao(2L);

        assertThrows(NotAuthorizedException.class, () -> service.loadSnapshot(user));
    }

    private static Usuario user() {
        Usuario user = new Usuario();
        user.id = 7;
        user.orgTenantId = 2L;
        user.perfil = new Perfil("Estoque", "", "ESTOQUE");
        user.perfil.setId(4L);
        return user;
    }

    private static PermissionProfileService service() {
        var service = new PermissionProfileService();
        service.requestCache = new PermissionSnapshotRequestCache();
        service.context = new InternalUserContext();
        service.supplementalPermissionSource = userId -> Set.of("CHAT");
        return service;
    }
}
