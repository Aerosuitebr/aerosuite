package com.aerosuite.service;

import com.aerosuite.domain.*;
import com.aerosuite.dto.OsFluxoDtos.*;
import com.aerosuite.security.*;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.TestTransaction;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import org.junit.jupiter.api.*;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class OsFluxoServiceIT {
    @Inject OsFluxoService fluxo;
    @Inject OsFluxoEstacaoService estacoes;
    @Inject InternalUserContext user;
    @Inject TenantDataAccess tenants;
    @Inject PropostaCcoEmailService cco;
    @BeforeEach void contexto() {user.setInternalUser(1,"admin@teste.com","Teste",1L);user.applyPermissionSnapshot("ADMIN",Set.of());}
    @AfterEach void limpar() {user.clear();}
    private OS criar() {
        if(Tenant.findById(1L)==null) Tenant.getEntityManager().createNativeQuery("insert into tenant (id,codigo,nome,ativo,modulos_habilitados) values (1,'TESTE-FLUXO','Teste',true,'MRO,ESTOQUE,COMERCIAL')").executeUpdate();
        OS o=new OS();o.idOs=918723;o.dtAbertura=LocalDate.now();o.clienteNome="Teste fluxo";o.persistAndFlush();return o;
    }
    @Test @TestTransaction void entradasSaidasEstornoEAjustePreservamHistorico() {
        OS os=criar();var etapas=fluxo.etapas();var primeira=etapas.get(0);
        estacoes.vincularEstacao("terminal-teste-123","RECEBIMENTO-1");
        BiparRequest b=new BiparRequest();b.osCodigo="OS"+os.id;b.etapaId=primeira.id;b.terminalId="terminal-teste-123";b.acao="ENTRADA";
        assertEquals("EM_ETAPA",fluxo.bipar(b).get("situacao"));
        b.acao="SAIDA";assertEquals("AGUARDANDO",fluxo.bipar(b).get("situacao"));
        assertEquals(1L,((Map<?,?>)fluxo.detalhe(os.id).get("resumo")).get("etapasConcluidas"));
        fluxo.estornar(os.id,"Leitura equivocada");
        assertEquals(0L,((Map<?,?>)fluxo.detalhe(os.id).get("resumo")).get("etapasConcluidas"));
        AjusteRequest a=new AjusteRequest();a.tipo="POSICIONAR";a.etapaId=etapas.get(2).id;a.situacao="EM_ETAPA";a.preencherIntermediarias=true;a.motivo="Regularização documentada";
        long antes=OsFluxoRegistro.count();fluxo.simular(os.id,a);assertEquals(antes,OsFluxoRegistro.count());
        fluxo.ajustar(os.id,a);
        assertEquals(2L,((Map<?,?>)fluxo.detalhe(os.id).get("resumo")).get("etapasConcluidas"));
        assertNotNull(fluxo.dashboard(null,null).get("kpis"));
    }
    @Test @TestTransaction void leituraExigePareamentoEPermissaoParaAjuste() {
        OS os=criar();BiparRequest b=new BiparRequest();b.osCodigo="OS"+os.id;b.terminalId="terminal-sem-vinculo";
        assertThrows(ForbiddenException.class,()->fluxo.bipar(b));
        user.applyPermissionSnapshot("MECANICO",Set.of("OS_FLUXO_ESTACAO"));
        assertThrows(ForbiddenException.class,()->fluxo.estornar(os.id,"Sem permissão"));
        assertThrows(ForbiddenException.class,()->estacoes.vincularEstacao("terminal-teste-456","RECEBIMENTO-1"));
    }
    @Test @TestTransaction void pareamentoVinculaTerminalESaidaFinalConcluiFluxo() {
        OS os=criar();
        var solic=estacoes.solicitar("terminal-parear-123",null,"Teste");
        String codigo=(String)solic.get("codigo");assertEquals(8,codigo.length());
        assertEquals(codigo,estacoes.consultar(codigo).get("codigo"));
        estacoes.concluir(codigo,"RECEBIMENTO-1","Bancada teste");
        assertEquals(true,estacoes.solicitar("terminal-parear-123",null,"Teste").get("vinculada"));
        for(var etapa:fluxo.etapas()) {
            String setor=etapa.setor.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]","")+"-1";
            estacoes.atualizar("terminal-parear-123",setor,"Bancada teste");
            BiparRequest b=new BiparRequest();b.osCodigo="OS"+os.id;b.etapaId=etapa.id;b.terminalId="terminal-parear-123";b.acao="ENTRADA";
            fluxo.bipar(b);b.acao="SAIDA";fluxo.bipar(b);
        }
        assertEquals("CONCLUIDO",((Map<?,?>)fluxo.detalhe(os.id).get("os")).get("fluxoSituacao"));
    }
    @Test @TestTransaction void ccoPersisteSemDuplicacaoEConsultaExcluiOutroTenant() {
        criar();
        var item=cco.adicionar(new PropostaCcoEmailService.Item(null,"TIME@EMPRESA.COM",null,null,null,null));
        assertEquals(item.id(),cco.adicionar(new PropostaCcoEmailService.Item(null,"time@empresa.com",null,null,null,null)).id());
        PropostaCcoEmail.getEntityManager().createNativeQuery("insert into proposta_cco_email (tenant_id,email) values ('2','outro@empresa.com')").executeUpdate();
        assertFalse(cco.listar().stream().anyMatch(e->e.email().equals("outro@empresa.com")));
        assertEquals(List.of("time@empresa.com"),cco.destinatarios("cliente@empresa.com"));
    }
    @SuppressWarnings("unchecked")
    private List<Map<String,Object>> catalogo(Map<String,Object> resposta) {
        return (List<Map<String,Object>>)resposta.get("estacoes");
    }
    private OsFluxoRegistro passagem(OS os,OsFluxoEtapa etapa,int sequencia,boolean concluida) {
        OsFluxoRegistro r=new OsFluxoRegistro();r.tenantId="1";r.osId=os.id;r.etapaId=etapa.id;r.sequencia=sequencia;
        r.entradaEm=java.time.LocalDateTime.now().minusMinutes(10);if(concluida)r.saidaEm=java.time.LocalDateTime.now();r.persistAndFlush();return r;
    }
    private List<OsFluxoEstacaoService.EtapaEdicao> edicoes(List<OsFluxoEtapa> etapas) {
        return etapas.stream().map(e->new OsFluxoEstacaoService.EtapaEdicao(e.id,e.nome,e.setor,e.cor,e.metaMinutos)).collect(java.util.stream.Collectors.toCollection(ArrayList::new));
    }
    @Test @TestTransaction void editaFluxoMantemHistoricoCodigosEConcluidas() {
        OS andamento=criar();var etapas=fluxo.etapas();var primeira=etapas.get(0);
        passagem(andamento,primeira,1,true);
        OS concluida=new OS();concluida.idOs=918724;concluida.dtAbertura=LocalDate.now();concluida.clienteNome="Concluída";concluida.persistAndFlush();
        int seq=0;for(var etapa:etapas)passagem(concluida,etapa,++seq,true);
        String codigo=primeira.codigoBarrasEntrada;
        var novos=edicoes(etapas);var removida=novos.remove(1);
        novos.add(0,new OsFluxoEstacaoService.EtapaEdicao(null,"Etapa inserida","Oficina","#112233",15));
        Collections.swap(novos,1,2);
        novos.set(2,new OsFluxoEstacaoService.EtapaEdicao(primeira.id,"Recebimento revisado",primeira.setor,primeira.cor,null));
        var resposta=estacoes.salvarFluxo(OsFluxoEstacaoService.versaoFluxo(etapas),novos);
        assertNotNull(resposta.get("versaoFluxo"));assertEquals(codigo,primeira.codigoBarrasEntrada);
        assertFalse(OsFluxoEtapa.<OsFluxoEtapa>findById(removida.id()).ativo);
        assertEquals("CONCLUIDO",((Map<?,?>)fluxo.detalhe(concluida.id).get("os")).get("fluxoSituacao"));
        assertEquals("Etapa inserida",((OsFluxoEtapa)fluxo.detalhe(andamento.id).get("proximaEtapa")).nome);
        assertEquals(etapas.size(),((List<?>)fluxo.detalhe(concluida.id).get("registros")).size());
        assertEquals(etapas.size(),((List<?>)fluxo.detalhe(concluida.id).get("etapas")).size());
        assertEquals(etapas.size(),((Map<?,?>)fluxo.detalhe(concluida.id).get("resumo")).get("totalEtapas"));
        assertEquals("Recebimento revisado",((List<Map<String,Object>>)fluxo.detalhe(andamento.id).get("registros")).get(0).get("etapaNome"));
        assertTrue(catalogo(estacoes.gestaoEstacoes()).stream().anyMatch(e->"RECEBIMENTO-1".equals(e.get("codigo"))));
    }
    @Test @TestTransaction void bloqueiaExcluirEtapaAbertaEConflitoDeVersao() {
        OS os=criar();var etapas=fluxo.etapas();passagem(os,etapas.get(0),1,false);
        var novos=edicoes(etapas);novos.remove(0);
        assertThrows(ClientErrorException.class,()->estacoes.salvarFluxo(OsFluxoEstacaoService.versaoFluxo(etapas),novos));
        assertTrue(etapas.get(0).ativo);
        assertThrows(ClientErrorException.class,()->estacoes.salvarFluxo("versao-antiga",edicoes(etapas)));
    }
    @Test @TestTransaction void rejeitaConfiguracaoInvalidaSemAlterarFluxo() {
        criar();var etapas=fluxo.etapas();String versao=OsFluxoEstacaoService.versaoFluxo(etapas);
        assertThrows(BadRequestException.class,()->estacoes.salvarFluxo(versao,List.of()));
        var novos=edicoes(etapas);novos.add(novos.get(0));
        assertThrows(BadRequestException.class,()->estacoes.salvarFluxo(versao,novos));
        assertEquals(versao,OsFluxoEstacaoService.versaoFluxo(fluxo.etapas()));
    }
    @Test @TestTransaction void gestaoCriaSetorEtapaEEditaEstacaoPadrao() {
        criar();
        var etapas=fluxo.etapas();
        assertTrue(((List<?>)estacoes.criarSetor("Pintura").get("setores")).contains("Pintura"));
        assertThrows(BadRequestException.class,()->estacoes.criarSetor(" pintura "));
        var resposta=estacoes.criarEtapa("Pintura especial","Pintura","#112233",30);
        Long novaId=(Long)resposta.get("etapaCriadaId");assertNotNull(novaId);
        var nova=OsFluxoEtapa.<OsFluxoEtapa>findById(novaId);
        assertTrue(nova.ordem>etapas.get(etapas.size()-1).ordem);
        var ids=List.of(etapas.get(0).id,novaId);
        var atualizadas=catalogo(estacoes.atualizarEstacao("OFICINA-1","Posto completo","Pintura",ids));
        assertEquals(1L,atualizadas.stream().filter(e->"OFICINA-1".equals(e.get("codigo"))).count());
        assertEquals(ids,atualizadas.stream().filter(e->"OFICINA-1".equals(e.get("codigo"))).findFirst().orElseThrow().get("etapaIds"));
        estacoes.vincularEstacao("terminal-nova-etapa","OFICINA-1");
        assertEquals(ids,estacoes.etapasAtendidas("terminal-nova-etapa"));
        estacoes.renomear("OFICINA-1","Posto renomeado");
        assertEquals(ids,estacoes.etapasAtendidas("terminal-nova-etapa"));
    }
    @Test @TestTransaction void cadastroRapidoRejeitaDadosInvalidos() {
        criar();fluxo.etapas();
        assertThrows(BadRequestException.class,()->estacoes.criarEtapa("Pintura","Inexistente","#112233",30));
        assertThrows(BadRequestException.class,()->estacoes.criarEtapa("Pintura","Oficina","red",30));
        assertThrows(BadRequestException.class,()->estacoes.criarEtapa("Pintura","Oficina","#112233",0));
        assertThrows(BadRequestException.class,()->estacoes.atualizarEstacao("OFICINA-1","Posto","Oficina",List.of()));
        assertThrows(BadRequestException.class,()->estacoes.atualizarEstacao("OFICINA-1","Posto","Oficina",null));
    }
    @Test @TestTransaction void estacaoRestringeAsEtapasSelecionadas() {
        criar();
        var etapas=fluxo.etapas();
        var escolhida=etapas.get(0);
        var criadas=catalogo(estacoes.criar("Estação restrita",escolhida.setor,List.of(escolhida.id)));
        String codigo=(String)criadas.stream().filter(e->"Estação restrita".equals(e.get("nome"))).findFirst().orElseThrow().get("codigo");
        estacoes.vincularEstacao("terminal-etapa-restrita",codigo);
        assertEquals(List.of(escolhida.id),estacoes.etapasAtendidas("terminal-etapa-restrita"));
        estacoes.exigirEtapa("terminal-etapa-restrita",escolhida.id);
        for(var outra:etapas) if(!outra.id.equals(escolhida.id))
            assertThrows(ForbiddenException.class,()->estacoes.exigirEtapa("terminal-etapa-restrita",outra.id));
    }
    @Test @TestTransaction void estacaoPersonalizadaAtendeSetorERemoveVinculosSemApagarHistorico() {
        criar();
        var criadas=catalogo(estacoes.criar("Bancada adicional","Recebimento",null));
        String codigo=(String)criadas.stream().filter(e->"Bancada adicional".equals(e.get("nome"))).findFirst().orElseThrow().get("codigo");
        estacoes.vincularEstacao("terminal-nova-estacao",codigo);
        assertTrue(estacoes.atende("terminal-nova-estacao","Recebimento"));
        assertFalse(estacoes.atende("terminal-nova-estacao","Oficina"));
        estacoes.renomear(codigo,"Bancada renomeada");
        assertTrue(catalogo(estacoes.gestaoEstacoes()).stream().anyMatch(e->"Bancada renomeada".equals(e.get("nome"))));
        long registros=OsFluxoRegistro.count();
        assertThrows(ClientErrorException.class,()->estacoes.excluirEstacao(codigo));
        estacoes.remover("terminal-nova-estacao");
        assertFalse(catalogo(estacoes.excluirEstacao(codigo)).stream().anyMatch(e->codigo.equals(e.get("codigo"))));
        assertThrows(ForbiddenException.class,()->estacoes.exigirPareada("terminal-nova-estacao"));
        assertNotNull(estacoes.solicitar("terminal-nova-estacao",null,"Teste").get("codigo"));
        assertEquals(registros,OsFluxoRegistro.count());
        assertFalse(catalogo(estacoes.gestaoEstacoes()).stream().anyMatch(e->codigo.equals(e.get("codigo"))));
    }
    @Test @TestTransaction void exclusaoDeEstacaoGeradaPersisteERespeitaTenant() {
        criar();fluxo.etapas();
        OsFluxoEstacaoNome.getEntityManager().createNativeQuery("insert into os_fluxo_estacao_nome (tenant_id,codigo,nome,ativa) values ('2','RECEBIMENTO-1','Outro tenant',false)").executeUpdate();
        assertTrue(catalogo(estacoes.gestaoEstacoes()).stream().anyMatch(e->"RECEBIMENTO-1".equals(e.get("codigo"))));
        estacoes.vincularEstacao("terminal-estacao-excluida","RECEBIMENTO-1");
        assertThrows(ClientErrorException.class,()->estacoes.excluirEstacao("RECEBIMENTO-1"));
        estacoes.remover("terminal-estacao-excluida");
        estacoes.excluirEstacao("RECEBIMENTO-1");
        OsFluxoEstacaoNome.getEntityManager().flush();
        OsFluxoEstacaoNome.getEntityManager().clear();
        assertFalse(catalogo(estacoes.gestaoEstacoes()).stream().anyMatch(e->"RECEBIMENTO-1".equals(e.get("codigo"))));
        assertThrows(BadRequestException.class,()->estacoes.vincularEstacao("terminal-outro-123","RECEBIMENTO-1"));
    }
    @Test @TestTransaction void cadastroDeEstacaoValidaDadosEPermissoes() {
        criar();fluxo.etapas();
        assertThrows(BadRequestException.class,()->estacoes.criar(" ","Recebimento",null));
        assertThrows(BadRequestException.class,()->estacoes.criar("Bancada","Inexistente",null));
        user.applyPermissionSnapshot("MECANICO",Set.of("OS_FLUXO_ESTACAO"));
        assertThrows(ForbiddenException.class,()->estacoes.criar("Bancada","Recebimento",null));
        assertThrows(ForbiddenException.class,()->estacoes.excluirEstacao("RECEBIMENTO-1"));
    }
}
