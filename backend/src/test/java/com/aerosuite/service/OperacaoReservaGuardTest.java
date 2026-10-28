package com.aerosuite.service;
import com.aerosuite.domain.ItemEstoque;
import com.aerosuite.dto.ItemEstoqueDto;
import jakarta.ws.rs.BadRequestException;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class OperacaoReservaGuardTest {
 OperacaoReservaGuard guard=new OperacaoReservaGuard(){@Override public BigDecimal reservado(Long id,Long excluir){return BigDecimal.valueOf(5);}};
 ItemEstoque item(){ItemEstoque i=new ItemEstoque();i.id=1L;i.partNumber="PN-1";i.loteId=2L;i.invoiceId=3L;return i;}
 @Test void bloqueiaAjusteAbaixoDaReserva(){ItemEstoqueDto d=new ItemEstoqueDto();d.quantidade=BigDecimal.ONE;assertThrows(BadRequestException.class,()->guard.conferirEdicao(item(),d));}
 @Test void aceitaSaldoMaiorOuIgualAoReservado(){ItemEstoqueDto d=new ItemEstoqueDto();d.quantidade=BigDecimal.TEN;assertDoesNotThrow(()->guard.conferirEdicao(item(),d));}
 @Test void preservaRastreabilidadeDoPn(){ItemEstoqueDto d=new ItemEstoqueDto();d.partNumber="OUTRO";assertThrows(BadRequestException.class,()->guard.conferirEdicao(item(),d));}
 @Test void preservaRastreabilidadeDoLote(){ItemEstoqueDto d=new ItemEstoqueDto();d.loteId=99L;assertThrows(BadRequestException.class,()->guard.conferirEdicao(item(),d));}
 @Test void naoExcluiItemComprometido(){assertThrows(BadRequestException.class,()->guard.conferirExclusao(item()));}
}
