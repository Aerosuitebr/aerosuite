package com.aerosuite.service;
import com.aerosuite.security.InternalUserContext;
import jakarta.ws.rs.ForbiddenException;
import java.util.Set;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class OperacaoAcessoTest {
 OperacaoService service(String...codes){OperacaoService s=new OperacaoService();s.user=new InternalUserContext();s.user.applyPermissionSnapshot("TESTE",Set.of(codes));return s;}
 @Test void centralNaoConcedeCustos(){assertThrows(ForbiddenException.class,()->service("CENTRAL_OPERACIONAL").acesso("custos"));}
 @Test void custosNaoConcedeOperacao(){assertThrows(ForbiddenException.class,()->service("CUSTOS_OPERACIONAIS").acesso("materiais"));}
 @Test void centralPermiteMateriais(){assertDoesNotThrow(()->service("CENTRAL_OPERACIONAL").acesso("materiais"));}
 @Test void custosPermiteResultados(){assertDoesNotThrow(()->service("CUSTOS_OPERACIONAIS").acesso("custos"));}
}
