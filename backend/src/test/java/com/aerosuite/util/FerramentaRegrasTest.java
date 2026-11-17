package com.aerosuite.util;
import com.aerosuite.domain.Ferramenta;
import com.aerosuite.domain.FerramentaMovimento;
import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.Test;
import java.time.*;
import static org.junit.jupiter.api.Assertions.*;

class FerramentaRegrasTest {
    @Test void rejeitaCriteriosDeTesteSemInventarRequisitosTecnicos(){
        for(String criterio:new String[]{"asadasdasd","teste","ASDASD","aaaa","placeholder","", " "})
            assertThrows(BadRequestException.class,()->FerramentaRegras.exigirCriterioDefinitivo(criterio),criterio);
        assertThrows(BadRequestException.class,()->FerramentaRegras.exigirCriterioDefinitivo(null));
    }
    @Test void aceitaCriteriosTecnicosConcisos(){
        for(String criterio:new String[]{"±0,5 N·m","Conforme procedimento metrológico aprovado","Erro ≤ 4% na faixa de 20 a 100 N·m"})
            assertDoesNotThrow(()->FerramentaRegras.exigirCriterioDefinitivo(criterio));
    }
    private final LocalDateTime agora=LocalDateTime.of(2026,10,31,13,0);
    private Ferramenta instrumento(LocalDate prazo){Ferramenta f=new Ferramenta();f.exigeCalibracao=true;f.proximaCalibracao=prazo;return f;}
    @Test void calculaPeloDiaRealizadoEMesesDeCalendario(){assertEquals(LocalDate.of(2027,4,10),FerramentaRegras.proxima(LocalDate.of(2026,10,10),6,"MESES"));}
    @Test void limitaAoUltimoDiaDoMes(){assertEquals(LocalDate.of(2027,2,28),FerramentaRegras.proxima(LocalDate.of(2027,1,31),1,"MESES"));assertEquals(LocalDate.of(2028,2,29),FerramentaRegras.proxima(LocalDate.of(2028,1,31),1,"MESES"));}
    @Test void somaDiasSemConfundirComMeses(){assertEquals(LocalDate.of(2026,11,30),FerramentaRegras.proxima(LocalDate.of(2026,10,31),30,"DIAS"));}
    @Test void rejeitaPeriodicidadeInvalida(){assertThrows(BadRequestException.class,()->FerramentaRegras.proxima(agora.toLocalDate(),0,"MESES"));assertThrows(BadRequestException.class,()->FerramentaRegras.proxima(agora.toLocalDate(),6,"ANOS"));}
    @Test void impedeUsoSemEvidenciaAprovada(){assertNotNull(FerramentaRegras.restricao(instrumento(null),agora.plusHours(1),agora));}
    @Test void permiteUsoAteOFimDaDataProgramada(){Ferramenta f=instrumento(agora.toLocalDate());assertNull(FerramentaRegras.restricao(f,agora.withHour(23).withMinute(59),agora));assertNotNull(FerramentaRegras.restricao(f,agora.plusDays(1),agora));}
    @Test void bloqueiaNoDiaSeguinteSemDependerDeAlerta(){assertNotNull(FerramentaRegras.restricao(instrumento(agora.toLocalDate().minusDays(1)),null,agora));}
    @Test void aumentoDoIntervaloNaoDesbloqueiaPrazoAnterior(){Ferramenta f=instrumento(agora.toLocalDate().minusDays(1));f.intervalo=24;f.unidade="MESES";assertNotNull(FerramentaRegras.restricao(f,agora.plusHours(1),agora));}
    @Test void bloqueioOperacionalIndependeDaCalibracao(){Ferramenta f=instrumento(agora.toLocalDate().plusMonths(6));for(String condicao:new String[]{"AVARIA","INSPECAO","EM_LABORATORIO","EM_ANALISE","REPROVADA","BAIXA"}){f.condicao=condicao;assertNotNull(FerramentaRegras.restricao(f,agora.plusHours(1),agora));}}
    @Test void previsaoDeveSerFutura(){assertNotNull(FerramentaRegras.restricao(new Ferramenta(),agora,agora));}
    @Test void retiradaExigeAsDuasConfirmacoes(){FerramentaMovimento m=new FerramentaMovimento();m.tipo="RETIRADA";assertFalse(FerramentaRegras.confirmacoesCompletas(m));m.entregaPor=1;assertFalse(FerramentaRegras.confirmacoesCompletas(m));m.recebidoPor=2;assertTrue(FerramentaRegras.confirmacoesCompletas(m));}
    @Test void transferenciaExigeCienciaMesmoAposEntregaERecebimento(){FerramentaMovimento m=new FerramentaMovimento();m.tipo="TRANSFERENCIA";m.entregaPor=1;m.recebidoPor=2;assertFalse(FerramentaRegras.confirmacoesCompletas(m));m.cienciaPor=3;assertTrue(FerramentaRegras.confirmacoesCompletas(m));}
    @Test void aprovacaoMetrologicaNaoRemoveRestricaoFisica(){
        Ferramenta f=instrumento(agora.toLocalDate().plusMonths(6));
        f.statusCalibracao="APROVADA";f.bloqueioOperacional="AVARIA";
        assertNotNull(FerramentaRegras.restricao(f,agora.plusHours(1),agora));
        f.bloqueioOperacional=null;
        assertNull(FerramentaRegras.restricao(f,agora.plusHours(1),agora));
    }
    @Test void inspecaoNaoSubstituiCalibracaoExtraordinariaReprovada(){
        Ferramenta f=instrumento(agora.toLocalDate().plusMonths(6));
        for(String status:new String[]{"EM_LABORATORIO","EM_ANALISE","REPROVADA"}){
            f.statusCalibracao=status;f.condicao="REGULAR";
            assertNotNull(FerramentaRegras.restricao(f,agora.plusHours(1),agora));
        }
    }
}
