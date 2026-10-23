package com.aerosuite.service;
import com.aerosuite.domain.OS;
import com.aerosuite.dto.OSDto;
import com.aerosuite.security.InternalUserContext;
import jakarta.ws.rs.ForbiddenException;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;
class OsAccessPolicyTest {
    private OsAccessPolicy policy(String perfil) {
        var p=new OsAccessPolicy();p.user=new InternalUserContext();p.user.setInternalUser(42,"m@empresa.com","Mecânico",1L);
        p.user.applyPermissionSnapshot(perfil,Set.of());return p;
    }
    @Test void mecanicoSoConsultaOrdensAtribuidasAEle() {
        var p=policy("MECANICO");var os=new OS();os.mecanicoResponsavelId=17;
        assertThrows(ForbiddenException.class,()->p.visualizar(os));assertEquals("NENHUM",p.escopo(os));
        os.mecanicoResponsavelId=42;assertDoesNotThrow(()->p.visualizar(os));assertEquals("MECANICO",p.escopo(os));
        assertThrows(ForbiddenException.class,p::criar);
    }
    @Test void bibliotecaTemEdicaoParcialEAdminTemEdicaoTotal() {
        var os=new OS();os.mecanicoResponsavelId=42;os.jaEditada=true;
        assertEquals("BIBLIOTECA",policy("BIBLIOTECA").escopo(os));assertEquals("TOTAL",policy("ADMIN").escopo(os));
        assertEquals("NENHUM",policy("COORDENADOR").escopo(os));
    }
    @Test void calculaFilaEAlertaApenasEmOrdensAbertas() {
        var p=policy("ADMIN");var os=new OS();os.dtAbertura=LocalDate.now().minusDays(6);var dto=new OSDto();
        p.preencher(os,dto);assertTrue(dto.alertaSemAtribuicao);assertEquals("AGUARDANDO_DISTRIBUICAO",dto.statusOperacional);
        os.mecanicoResponsavelId=42;os.statusExecucao="EM_ANDAMENTO";p.preencher(os,dto);
        assertFalse(dto.alertaSemAtribuicao);assertEquals("EM_EXECUCAO",dto.statusOperacional);
    }
}
