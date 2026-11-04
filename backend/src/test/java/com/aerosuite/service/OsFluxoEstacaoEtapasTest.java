package com.aerosuite.service;
import com.aerosuite.domain.OsFluxoEtapa;
import jakarta.ws.rs.BadRequestException;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class OsFluxoEstacaoEtapasTest {
 private List<OsFluxoEtapa> catalogo() {
  var a=new OsFluxoEtapa();a.id=1L;a.setor="Oficina";
  var b=new OsFluxoEtapa();b.id=2L;b.setor="Oficina";
  var c=new OsFluxoEtapa();c.id=3L;c.setor="Recebimento";
  return List.of(a,b,c);
 }
 @Test void selecionaSubconjuntoNaOrdemDoFluxo(){assertEquals(List.of(2L),OsFluxoEstacaoService.validarEtapas("Oficina",List.of(2L,2L),catalogo()));}
 @Test void rejeitaVazioEtapaInexistenteEOutroSetor(){for(var ids:List.of(List.<Long>of(),List.of(99L),List.of(3L)))assertThrows(BadRequestException.class,()->OsFluxoEstacaoService.validarEtapas("Oficina",ids,catalogo()));}
 @Test void preservaClientesAntigos(){assertEquals(List.of(1L,2L),OsFluxoEstacaoService.validarEtapas("Oficina",null,catalogo()));}
}
