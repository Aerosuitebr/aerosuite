package com.aerosuite.os;

import com.aerosuite.domain.OS;
import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OsRegistroEncerradoGuardTest {

    private final OsRegistroEncerradoGuard guard = new OsRegistroEncerradoGuard();

    @Test
    void encerradaQuandoDataFechamentoPreenchida() {
        OS os = new OS();
        os.dataFechamento = LocalDate.now();
        assertTrue(guard.isRegistroEncerrado(os));
    }

    @Test
    void encerradaQuandoCrsEmitido() {
        OS os = new OS();
        os.crsEmitidoEm = LocalDateTime.now();
        assertTrue(guard.isRegistroEncerrado(os));
    }

    @Test
    void abertaSemFechamentoNemCrs() {
        OS os = new OS();
        assertFalse(guard.isRegistroEncerrado(os));
        assertDoesNotThrow(() -> guard.assertMutacaoPermitida(os));
    }

    @Test
    void mutacaoBloqueadaQuandoEncerrada() {
        OS os = new OS();
        os.dataFechamento = LocalDate.now();
        BadRequestException ex =
                assertThrows(BadRequestException.class, () -> guard.assertMutacaoPermitida(os));
        assertEquals(ApiI18nMessages.OS_REGISTRO_ENCERRADO, ex.getMessage());
    }

    @Test
    void reaberturaExigePerfilAutorizado() {
        assertDoesNotThrow(() -> guard.assertPodeReabrir("P145_RT"));
        assertThrows(BadRequestException.class, () -> guard.assertPodeReabrir("P145_EXECUCAO"));
    }

    @Test
    void justificativaMinima15Caracteres() {
        assertThrows(BadRequestException.class, () -> guard.assertJustificativaValida("curta"));
        assertDoesNotThrow(() -> guard.assertJustificativaValida("Correção de registro após auditoria interna"));
    }
}
