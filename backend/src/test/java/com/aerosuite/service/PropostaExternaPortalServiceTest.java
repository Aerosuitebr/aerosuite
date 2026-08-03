package com.aerosuite.service;

import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.UsuarioExterno;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PropostaExternaPortalServiceTest {

    @Test
    void podeAcessar_porEmail() {
        UsuarioExterno u = new UsuarioExterno();
        u.orgTenantId = TenantConstants.DEFAULT_TENANT_ID;
        u.email = "cliente@empresa.com";

        PropostaComercial p = new PropostaComercial();
        p.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
        p.status = "ENVIADA";
        p.clienteEmail = " Cliente@Empresa.com ";

        assertTrue(PropostaExternaPortalService.podeAcessar(u, p));
    }

    @Test
    void podeAcessar_negadoRascunho() {
        UsuarioExterno u = new UsuarioExterno();
        u.orgTenantId = TenantConstants.DEFAULT_TENANT_ID;
        u.email = "a@b.com";

        PropostaComercial p = new PropostaComercial();
        p.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
        p.status = "RASCUNHO";
        p.clienteEmail = "a@b.com";

        assertFalse(PropostaExternaPortalService.podeAcessar(u, p));
    }

    @Test
    void podeAcessar_porEmpresaNome() {
        UsuarioExterno u = new UsuarioExterno();
        u.orgTenantId = TenantConstants.DEFAULT_TENANT_ID;
        u.empresa = "ACME Aviation";
        u.email = "sem-match@test.com";

        PropostaComercial p = new PropostaComercial();
        p.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
        p.status = "APROVADA";
        p.clienteNome = "acme aviation";

        assertTrue(PropostaExternaPortalService.podeAcessar(u, p));
    }
}
