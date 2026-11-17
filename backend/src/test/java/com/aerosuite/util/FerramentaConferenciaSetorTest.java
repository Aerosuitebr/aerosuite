package com.aerosuite.util;

import com.aerosuite.domain.FerramentaMovimento;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class FerramentaConferenciaSetorTest {
    @Test void operadorConcluiRetiradaETransferenciaSemAssumirIdentidadeDoMecanico(){
        for(String tipo:new String[]{"RETIRADA","TRANSFERENCIA"}){
            var m=new FerramentaMovimento();m.tipo=tipo;m.mecanicoId=7;
            var agora=LocalDateTime.of(2026,11,5,10,0);
            FerramentaRegras.registrarConferenciaSetor(m,42,agora);
            assertTrue(FerramentaRegras.confirmacoesCompletas(m));
            assertEquals(7,m.mecanicoId);assertEquals(42,m.entregaPor);assertEquals(42,m.recebidoPor);
            assertEquals(agora,m.recebidoEm);
            if(tipo.equals("TRANSFERENCIA"))assertEquals(42,m.cienciaPor);
            else assertNull(m.cienciaPor);
        }
    }
    @Test void concluirPendenciaExistentePreservaConfirmacoesJaRegistradas(){
        var m=new FerramentaMovimento();m.tipo="TRANSFERENCIA";m.entregaPor=10;
        m.entregaEm=LocalDateTime.of(2026,11,4,9,0);
        FerramentaRegras.registrarConferenciaSetor(m,42,LocalDateTime.of(2026,11,5,10,0));
        assertEquals(10,m.entregaPor);assertEquals(4,m.entregaEm.getDayOfMonth());
        assertEquals(42,m.recebidoPor);assertTrue(FerramentaRegras.confirmacoesCompletas(m));
    }
}
