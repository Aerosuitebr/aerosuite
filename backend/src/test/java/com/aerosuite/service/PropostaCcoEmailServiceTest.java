package com.aerosuite.service;
import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
class PropostaCcoEmailServiceTest {
    @Test void normalizaDeduplicaEExcluiDestinatarioPrincipal() {
        var s=new PropostaCcoEmailService();
        assertEquals(List.of("time@empresa.com","outro@empresa.com"),s.destinatarios("cliente@empresa.com",
                " Time@Empresa.com ; time@empresa.com,CLIENTE@empresa.com\noutro@empresa.com"));
        assertEquals(List.of(),s.destinatarios("cliente@empresa.com",""));
    }
    @Test void rejeitaEnderecoInvalidoEInjecaoDeCabecalho() {
        assertThrows(BadRequestException.class,()->PropostaCcoEmailService.normalizarEmail("invalido"));
        assertThrows(BadRequestException.class,()->PropostaCcoEmailService.normalizarEmail("a@b.com\r\nBcc: atacante@b.com"));
        assertThrows(BadRequestException.class,()->new PropostaCcoEmailService().destinatarios("cliente@empresa.com","ok@empresa.com;invalido"));
    }
    @Test void validaCodigoDeBarrasSemConfundirIdentificadorExterno() {
        assertEquals(123L,OsFluxoService.idCodigo("OS123"));
        assertEquals(123L,OsFluxoService.idCodigo("123"));
        assertThrows(BadRequestException.class,()->OsFluxoService.idCodigo("OS1 OR 1=1"));
    }
}
