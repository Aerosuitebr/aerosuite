package com.aerosuite.service;
import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;
class OsExecucaoServiceTest {
    @Test void cicloExecucaoETransicoesInvalidas() {
        assertEquals("EM_ANDAMENTO",OsExecucaoService.transicao("NAO_INICIADA","iniciar"));
        assertEquals("PAUSADA",OsExecucaoService.transicao("EM_ANDAMENTO","pausar"));
        assertEquals("EM_ANDAMENTO",OsExecucaoService.transicao("PAUSADA","retomar"));
        assertEquals("FINALIZADA",OsExecucaoService.transicao("PAUSADA","finalizar"));
        assertThrows(BadRequestException.class,()->OsExecucaoService.transicao("NAO_INICIADA","finalizar"));
        assertThrows(BadRequestException.class,()->OsExecucaoService.transicao("FINALIZADA","retomar"));
        assertThrows(BadRequestException.class,()->OsExecucaoService.transicao("EM_ANDAMENTO","iniciar"));
    }
    @Test void periodosIniciamNaSegundaFeiraENoPrimeiroDiaDoMes() {
        LocalDate sexta=LocalDate.of(2026,10,23);
        assertEquals(LocalDate.of(2026,10,19),OsExecucaoService.inicioPeriodo("SEMANA",sexta));
        assertEquals(LocalDate.of(2026,10,1),OsExecucaoService.inicioPeriodo("MES",sexta));
        assertThrows(BadRequestException.class,()->OsExecucaoService.inicioPeriodo("ANO",sexta));
    }
}
