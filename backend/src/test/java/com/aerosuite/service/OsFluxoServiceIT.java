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
}
