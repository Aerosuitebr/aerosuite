package com.aerosuite.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.aerosuite.domain.BlingNfeRegistro;
import com.aerosuite.domain.BlingPropostaFluxoEvento;
import com.aerosuite.domain.OS;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;

class BlingPropostaFluxoServiceTest {

    @Test
    void isOsConcluded_whenDataConclusaoOrFechamento() {
        OS os = new OS();
        assertFalse(BlingPropostaFluxoService.isOsConcluded(os));

        os.dataConclusaoServ = LocalDate.now();
        assertTrue(BlingPropostaFluxoService.isOsConcluded(os));

        os.dataConclusaoServ = null;
        os.dataFechamento = LocalDate.now();
        assertTrue(BlingPropostaFluxoService.isOsConcluded(os));
    }

    @Test
    void transitionedToConcluded_detectsFirstConclusion() {
        OS before = new OS();
        OS after = new OS();
        after.dataConclusaoServ = LocalDate.now();
        assertTrue(BlingPropostaFluxoService.transitionedToConcluded(before, after));
        assertFalse(BlingPropostaFluxoService.transitionedToConcluded(after, after));
    }

    @Test
    void hasFluxoNfeEventInList_recognizesEmitidaAndExistente() {
        assertFalse(BlingPropostaFluxoService.hasFluxoNfeEventInList(Collections.emptyList()));
        assertTrue(BlingPropostaFluxoService.hasFluxoNfeEventInList(
                List.of(evento(BlingPropostaFluxoService.ETAPA_NFE_EMITIDA))));
        assertTrue(BlingPropostaFluxoService.hasFluxoNfeEventInList(
                List.of(evento(BlingPropostaFluxoService.ETAPA_NFE_EXISTENTE))));
        assertFalse(BlingPropostaFluxoService.hasFluxoNfeEventInList(
                List.of(evento(BlingPropostaFluxoService.ETAPA_NFE_SOLICITADA))));
    }

    private static BlingPropostaFluxoEvento evento(String etapa) {
        BlingPropostaFluxoEvento ev = new BlingPropostaFluxoEvento();
        ev.etapa = etapa;
        return ev;
    }

    @Test
    void nfeNotification_isAuthorized() {
        assertTrue(BlingNfeAutorizadaNotificationService.isAuthorized("Autorizada", null));
        assertTrue(BlingNfeAutorizadaNotificationService.isAuthorized(null, "35260601234567890123456789012345678901234"));
        assertFalse(BlingNfeAutorizadaNotificationService.isAuthorized("Cancelada", null));
    }

    @Test
    void isNfeAtiva_recognizesAuthorizedInvoice() {
        BlingNfeRegistro row = new BlingNfeRegistro();
        row.situacao = "Autorizada";
        assertTrue(BlingPropostaFluxoService.isNfeAtiva(row));

        row.situacao = "Cancelada";
        row.chaveAcesso = null;
        assertFalse(BlingPropostaFluxoService.isNfeAtiva(row));

        row.situacao = null;
        row.chaveAcesso = "35260601234567890123456789012345678901234";
        assertTrue(BlingPropostaFluxoService.isNfeAtiva(row));
    }
}
