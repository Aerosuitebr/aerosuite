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
 @Test void rejeitaVazioEEtapaInexistente(){for(var ids:List.of(List.<Long>of(),List.of(99L)))assertThrows(BadRequestException.class,()->OsFluxoEstacaoService.validarEtapas("Oficina",ids,catalogo()));}
 @Test void permiteEtapasDeSetoresDiferentes(){assertEquals(List.of(1L,3L),OsFluxoEstacaoService.validarEtapas("Oficina",List.of(3L,1L),catalogo()));}
 @Test void cadastroRapidoEEdicaoExigemGestaoAntesDeAcessarDados(){
  var service=new OsFluxoEstacaoService();service.user=new com.aerosuite.security.InternalUserContext();
  service.user.applyPermissionSnapshot("MECANICO",java.util.Set.of());
  assertThrows(jakarta.ws.rs.ForbiddenException.class,()->service.criarSetor("Pintura"));
  assertThrows(jakarta.ws.rs.ForbiddenException.class,()->service.criarEtapa("Pintura","Oficina","#112233",null));
  assertThrows(jakarta.ws.rs.ForbiddenException.class,()->service.atualizarEstacao("OFICINA-1","Posto","Oficina",List.of(1L)));
 }
 @Test void reordenarNaoRepeteEtapasRealizadasEPreservaConclusao(){
  var etapas=catalogo();var r=new com.aerosuite.domain.OsFluxoRegistro();r.etapaId=1L;r.saidaEm=java.time.LocalDateTime.now();
  assertEquals(3L,OsFluxoService.proximaPendente(List.of(etapas.get(2),etapas.get(0),etapas.get(1)),List.of(r)).id);
  r.conclusaoFluxo=true;assertNull(OsFluxoService.proximaPendente(etapas,List.of(r)));
 }
 @Test void edicaoDoFluxoExigeGestao(){var service=new OsFluxoEstacaoService();service.user=new com.aerosuite.security.InternalUserContext();service.user.applyPermissionSnapshot("MECANICO",java.util.Set.of());assertThrows(jakarta.ws.rs.ForbiddenException.class,()->service.salvarFluxo("v1",List.of()));}
 @Test void validaNomes(){assertEquals("Pintura",OsFluxoEstacaoService.validarNome(" Pintura "));for(String nome:new String[]{null," ","x".repeat(121)})assertThrows(BadRequestException.class,()->OsFluxoEstacaoService.validarNome(nome));}
 @Test void preservaClientesAntigos(){assertEquals(List.of(1L,2L),OsFluxoEstacaoService.validarEtapas("Oficina",null,catalogo()));}
}
