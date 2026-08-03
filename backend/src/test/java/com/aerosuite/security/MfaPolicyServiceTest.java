package com.aerosuite.security;

import com.aerosuite.model.Perfil;
import com.aerosuite.domain.Usuario;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MfaPolicyServiceTest {

    private final MfaPolicyService service = new MfaPolicyService();

    @Test
    void isPerfilCriticoRecognizesPart145AndAdmin() {
        Usuario rt = usuarioComPerfil("P145_RT");
        Usuario exec = usuarioComPerfil("P145_EXECUCAO");
        assertTrue(service.isPerfilCritico(rt));
        assertFalse(service.isPerfilCritico(exec));
    }

    private static Usuario usuarioComPerfil(String codigo) {
        Usuario u = new Usuario();
        Perfil perfil = new Perfil();
        perfil.setCodigo(codigo);
        u.perfil = perfil;
        return u;
    }
}
