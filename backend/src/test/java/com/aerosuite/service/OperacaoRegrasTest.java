package com.aerosuite.service;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import jakarta.ws.rs.BadRequestException;
import static org.junit.jupiter.api.Assertions.*;
class OperacaoRegrasTest {
 @Test void saldoDescontaReservas(){assertEquals(new BigDecimal("3"),OperacaoRegras.disponivel(new BigDecimal("10"),new BigDecimal("7")));}
 @Test void saldoNuncaNegativo(){assertEquals(BigDecimal.ZERO,OperacaoRegras.disponivel(BigDecimal.ONE,BigDecimal.TEN));}
 @Test void saldoAusenteNaoDisponibilizaEstoque(){assertEquals(BigDecimal.ZERO,OperacaoRegras.disponivel(null,null));}
 @Test void consumoNaoLiberaReservaSeparada(){assertTrue(OperacaoRegras.reservado("SEPARADO"));assertFalse(OperacaoRegras.encerrado("SEPARADO"));assertTrue(OperacaoRegras.encerrado("CONSUMIDO"));}
 @Test void rejeitaModuloDesconhecido(){assertThrows(BadRequestException.class,()->OperacaoRegras.validar("invalido","ABERTO",null,null));}
 @Test void rejeitaEstadoDeOutroFluxo(){assertThrows(BadRequestException.class,()->OperacaoRegras.validar("compras","CONSUMIDO",null,null));}
 @Test void rejeitaQuantidadeZeroOuNegativa(){for(BigDecimal q:new BigDecimal[]{BigDecimal.ZERO,BigDecimal.ONE.negate()})assertThrows(BadRequestException.class,()->OperacaoRegras.validar("materiais","RESERVADO",q,null));}
 @Test void rejeitaCustoNegativo(){assertThrows(BadRequestException.class,()->OperacaoRegras.validar("custos","REALIZADO",null,BigDecimal.ONE.negate()));}
 @Test void aceitaCustoZeroExplicitamente(){assertDoesNotThrow(()->OperacaoRegras.validar("custos","REALIZADO",null,BigDecimal.ZERO));}
 @Test void registrosEncerradosNaoContinuamPendentes(){for(String s:new String[]{"RESOLVIDO","CONSUMIDO","RECEBIDO","CONFERIDO","CONCLUIDO","DEVOLVIDO","CANCELADO"})assertTrue(OperacaoRegras.encerrado(s));}
}
