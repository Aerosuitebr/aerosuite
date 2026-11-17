package com.aerosuite.security;

import com.aerosuite.model.Perfil;
import com.aerosuite.domain.Usuario;
import com.aerosuite.service.UsuarioPerfilService;
import org.junit.jupiter.api.Test;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MfaPolicyServiceTest {

    private final MfaPolicyService service = new MfaPolicyService();

    @Test
    void isPerfilCriticoRecognizesPart145AndAdmin() {
        Usuario exec = usuarioComPerfil("P145_EXECUCAO");
        Perfil rt = usuarioComPerfil("P145_RT").perfil;
        service.usuarioPerfis = new UsuarioPerfilService() {
            @Override
            public List<Perfil> efetivos(Usuario usuario) {
                return List.of(usuario.perfil);
            }
        };
        assertFalse(service.isPerfilCritico(exec));
        service.usuarioPerfis = new UsuarioPerfilService() {
            @Override
            public List<Perfil> efetivos(Usuario usuario) {
                return List.of(usuario.perfil, rt);
            }
        };
        assertTrue(service.isPerfilCritico(exec));
    }

    private static Usuario usuarioComPerfil(String codigo) {
        Usuario u = new Usuario();
        Perfil perfil = new Perfil();
        perfil.setCodigo(codigo);
        u.perfil = perfil;
        return u;
    }
}
