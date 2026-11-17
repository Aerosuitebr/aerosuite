package com.aerosuite.service;

import org.junit.jupiter.api.Test;
import jakarta.ws.rs.ForbiddenException;
import static org.junit.jupiter.api.Assertions.*;

class FerramentaTerminalTest {
    static class EstacoesFake extends OsFluxoEstacaoService {
        int chamadas; boolean vinculada; boolean ferramentas;
        @Override public TerminalInfo terminalInfo(String id){chamadas++;return new TerminalInfo(vinculada,ferramentas,id,ferramentas?FERRAMENTARIA:"PRODUCAO","Estação QA","Balcão QA");}
    }
    @Test void operacaoFisicaExigePareamentoMesmoParaPerfilPrivilegiado(){
        var context=new FerramentaTerminalContext();var estacoes=new EstacoesFake();context.estacoes=estacoes;
        context.identificar("Terminal-QA-001");
        assertThrows(ForbiddenException.class,context::exigir);
        estacoes.vinculada=true;context.identificar("Terminal-QA-001");
        assertThrows(ForbiddenException.class,context::exigir);
        estacoes.ferramentas=true;context.identificar("Terminal-QA-001");
        assertDoesNotThrow(context::exigir);
        assertEquals("Balcão QA",context.info().maquina());
    }
    @Test void snapshotDaRequisicaoNaoMisturaMaquinas(){
        var context=new FerramentaTerminalContext();var estacoes=new EstacoesFake();context.estacoes=estacoes;
        context.identificar("Terminal-QA-001");context.info();context.info();assertEquals(1,estacoes.chamadas);
        context.identificar("Terminal-QA-002");assertEquals("Terminal-QA-002",context.info().terminalId());assertEquals(2,estacoes.chamadas);
    }
}
