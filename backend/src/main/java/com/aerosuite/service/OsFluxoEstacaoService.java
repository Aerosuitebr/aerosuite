package com.aerosuite.service;

import com.aerosuite.domain.*;
import com.aerosuite.security.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import java.security.SecureRandom;
import java.time.*;
import java.util.*;
import static com.aerosuite.service.OsFluxoService.map;

@ApplicationScoped
public class OsFluxoEstacaoService {
    @Inject TenantDataAccess tenants;
    @Inject InternalUserContext user;
    @Inject OsFluxoService fluxo;
    private static final SecureRandom RANDOM=new SecureRandom();
    private record Estacao(String codigo,String nome,String setor,int ordem,String cor,List<Long> etapas) {}
    private void gestao() {
        if(!Set.of("ADMIN","ADMINISTRADOR","DIRETOR").contains(Objects.toString(user.getPerfilCodigo(),""))&&!user.hasFuncionalidadeCodigo("OS_FLUXO_ESTACOES"))
            throw new ForbiddenException("Sem permissão para gerenciar estações.");
    }
    private List<Estacao> catalogo() {
        Map<String,List<OsFluxoEtapa>> setores=new LinkedHashMap<>();fluxo.etapas().forEach(e->setores.computeIfAbsent(e.setor,k->new ArrayList<>()).add(e));
        List<Estacao> list=new ArrayList<>();int ordem=0;
        for(var en:setores.entrySet()) {
            int quantidade="Oficina".equals(en.getKey())?5:1;
            for(int n=1;n<=quantidade;n++) {
                String codigo=en.getKey().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "")+"-"+n;
                list.add(new Estacao(codigo,en.getKey()+(quantidade>1?" "+n:""),en.getKey(),++ordem,en.getValue().get(0).cor,en.getValue().stream().map(e->e.id).toList()));
            }
        }
        List<OsFluxoEstacaoNome> configuradas=OsFluxoEstacaoNome.listAll();
        for(OsFluxoEstacaoNome e:configuradas) {
            if(Boolean.FALSE.equals(e.ativa)) {list.removeIf(s->s.codigo.equals(e.codigo));continue;}
            if(e.setor!=null&&setores.containsKey(e.setor)) {
                List<OsFluxoEtapa> etapas=setores.get(e.setor);
                list.add(new Estacao(e.codigo,e.nome,e.setor,++ordem,etapas.get(0).cor,etapas.stream().map(et->et.id).toList()));
            }
        }
        return list;
    }
    private Estacao estacao(String codigo) {return catalogo().stream().filter(e->e.codigo.equals(codigo)).findFirst().orElseThrow(()->new BadRequestException("Estação inválida."));}
    private String nome(Estacao e) {OsFluxoEstacaoNome custom=OsFluxoEstacaoNome.find("codigo",e.codigo).firstResult();return custom==null?e.nome:custom.nome;}
    private void validarTerminal(String terminal) {if(terminal==null||!terminal.matches("[A-Za-z0-9-]{8,64}"))throw new BadRequestException("Terminal inválido.");}
    private OsFluxoTerminal terminal(String id) {validarTerminal(id);return OsFluxoTerminal.find("terminalId",id).firstResult();}
    public void exigirPareada(String terminal) {OsFluxoTerminal t=terminal(terminal);if(t==null||!Boolean.TRUE.equals(t.ativa)||t.estacaoCodigo==null||catalogo().stream().noneMatch(e->e.codigo.equals(t.estacaoCodigo)))throw new ForbiddenException("Máquina não pareada. Solicite o pareamento à gestão.");}
    @Transactional
    public void anotarOrigem(String terminalId, String ip, String agent) { OsFluxoTerminal t=terminal(terminalId); if(t!=null) anotarOrigem(t, ip, agent); }
    /** A Estação de Bipagem consulta a fila a cada 30 s. Isso mantém o último acesso e o IP, como o pulso do Bellows. */
    @Transactional
    public void registrarPresenca(String terminalId, String ip, String agent) {
        OsFluxoTerminal t=terminal(terminalId);
        if(t==null) return;
        anotarOrigem(t, ip, agent);
        if(Boolean.TRUE.equals(t.ativa)) t.ultimoAcesso=LocalDateTime.now();
    }
    private void anotarOrigem(OsFluxoTerminal t, String ip, String agent) {
        if(ip!=null && !ip.isBlank()) { String limpo=ip.trim(); t.ip=limpo.length()>255?limpo.substring(0,255):limpo; }
        if(agent!=null && !agent.isBlank()) t.userAgent=agent.substring(0,Math.min(255,agent.length()));
    }
    public boolean atende(String terminal,String setor) {OsFluxoTerminal t=terminal(terminal);return t!=null&&Boolean.TRUE.equals(t.ativa)&&Objects.equals(estacao(t.estacaoCodigo).setor,setor);}
    /** Setor da estação pareada neste terminal, ou null se a máquina não estiver pareada. */
    public String setorAtendido(String terminal) {
        OsFluxoTerminal t=terminal(terminal);
        if(t==null||!Boolean.TRUE.equals(t.ativa)||t.estacaoCodigo==null) return null;
        return estacao(t.estacaoCodigo).setor;
    }
    public void exigirEtapa(String terminal,String setor) {if(!atende(terminal,setor))throw new ForbiddenException("Etapa não atendida por esta estação.");}
    @Transactional
    public Map<String,Object> listar(String terminalId) { return listar(terminalId, null, null); }
    @Transactional
    public Map<String,Object> listar(String terminalId, String ip, String agent) {
        OsFluxoTerminal atual=terminal(terminalId);if(atual!=null){anotarOrigem(atual,ip,agent);if(Boolean.TRUE.equals(atual.ativa))atual.ultimoAcesso=LocalDateTime.now();}
        List<OsFluxoTerminal> terminais=OsFluxoTerminal.list("ativa = true");
        List<Map<String,Object>> result=catalogo().stream().map(e->{
            List<OsFluxoTerminal> ts=terminais.stream().filter(t->e.codigo.equals(t.estacaoCodigo)).toList();
            OsFluxoTerminal ultimo=ts.stream().filter(t->t.ultimoAcesso!=null).max(Comparator.comparing(t->t.ultimoAcesso)).orElse(null);
            return map("codigo",e.codigo,"nome",nome(e),"setor",e.setor,"ordem",e.ordem,"cor",e.cor,"etapaIds",e.etapas,
                    "desteTerminal",atual!=null&&Boolean.TRUE.equals(atual.ativa)&&e.codigo.equals(atual.estacaoCodigo),
                    "emUso",ultimo!=null&&ultimo.ultimoAcesso.isAfter(LocalDateTime.now().minusMinutes(15)),"emUsoPor",ultimo==null?null:ultimo.usuarioNome,
                    "ultimoAcesso",ultimo==null?null:ultimo.ultimoAcesso,"terminais",ts.size());
        }).toList();
        boolean solicitacaoAberta=atual!=null&&!Boolean.TRUE.equals(atual.ativa)&&atual.expiraEm!=null&&atual.expiraEm.isAfter(LocalDateTime.now());
        return map("estacoes",result,"estacaoDesteTerminal",atual!=null&&Boolean.TRUE.equals(atual.ativa)?atual.estacaoCodigo:null,"maquinaDesteTerminal",atual==null?null:atual.apelido,"solicitacaoAberta",solicitacaoAberta);
    }
    @Transactional
    public Map<String,Object> gestaoEstacoes() {
        gestao();catalogo().forEach(e->monitor(e.codigo));List<OsFluxoTerminal> ts=OsFluxoTerminal.list("ativa = true order by estacaoCodigo, apelido");
        return map("setores",fluxo.etapas().stream().map(e->e.setor).distinct().toList(),"estacoes",catalogo().stream().map(e->map("codigo",e.codigo,"nome",nome(e),"nomePadrao",e.nome,"nomePersonalizado",!nome(e).equals(e.nome),
                "monitoradoDesde",monitor(e.codigo).monitoradoDesde,"semVinculoDesde",monitor(e.codigo).semVinculoDesde,"setor",e.setor,"cor",e.cor,"etapas",fluxo.etapas().stream().filter(et->e.etapas.contains(et.id)).map(et->et.nome).toList(),"maquinas",ts.stream().filter(t->e.codigo.equals(t.estacaoCodigo)).count())).toList(),
                "pendentes",OsFluxoTerminal.<OsFluxoTerminal>list("ativa = false and expiraEm > ?1",LocalDateTime.now()).stream().map(t->map("terminalId",t.terminalId,"usuarioNome",t.usuarioNome,"userAgent",t.userAgent,"ip",t.ip,"ultimoAcesso",t.ultimoAcesso,"expiraEm",t.expiraEm)).toList(),"maquinas",ts.stream().map(t->map("terminalId",t.terminalId,"apelido",t.apelido,"estacaoCodigo",t.estacaoCodigo,"estacaoNome",nome(estacao(t.estacaoCodigo)),
                        "usuarioNome",t.usuarioNome,"ip",t.ip,"userAgent",t.userAgent,"vinculadoEm",t.vinculadoEm,"ultimoAcesso",t.ultimoAcesso,"ativa",t.ativa)).toList());
    }
    @Transactional
    public Map<String,Object> renomear(String codigo,String nome) {
        gestao();Estacao original=estacao(codigo);if(nome==null||nome.length()>120)throw new BadRequestException("Informe um nome de até 120 caracteres.");
        if(nome.isBlank())nome=original.nome;
        OsFluxoEstacaoNome e=OsFluxoEstacaoNome.find("codigo",codigo).firstResult();
        if(e==null){e=new OsFluxoEstacaoNome();e.tenantId=tenants.currentTenantIdStr();e.codigo=codigo;e.persist();}e.nome=nome.trim();return gestaoEstacoes();
    }
    @Transactional
    public Map<String,Object> criar(String nome,String setor) {
        gestao();
        if(nome==null||nome.isBlank()||nome.trim().length()>120)throw new BadRequestException("Informe um nome de até 120 caracteres.");
        if(setor==null||fluxo.etapas().stream().noneMatch(e->setor.equals(e.setor)))throw new BadRequestException("Escolha um setor válido.");
        OsFluxoEstacaoNome e=new OsFluxoEstacaoNome();e.tenantId=tenants.currentTenantIdStr();
        e.codigo="CUSTOM-"+UUID.randomUUID();e.nome=nome.trim();e.setor=setor;e.ativa=true;e.persist();
        return gestaoEstacoes();
    }
    @Transactional
    public Map<String,Object> excluirEstacao(String codigo) {
        gestao();Estacao original=estacao(codigo);
        if(OsFluxoTerminal.count("estacaoCodigo = ?1 and ativa = true",codigo)>0)
            throw new ClientErrorException("Reatribua ou remova as máquinas vinculadas antes de excluir a estação.",409);
        OsFluxoEstacaoNome e=OsFluxoEstacaoNome.find("codigo",codigo).firstResult();
        if(e==null){e=new OsFluxoEstacaoNome();e.tenantId=tenants.currentTenantIdStr();e.codigo=codigo;e.nome=original.nome;e.persist();}
        e.ativa=false;
        List<OsFluxoTerminal> maquinas=OsFluxoTerminal.list("estacaoCodigo = ?1 and ativa = true",codigo);
        for(OsFluxoTerminal t:maquinas){t.ativa=false;t.codigoPareamento=null;t.expiraEm=null;}
        return gestaoEstacoes();
    }
    private void vincular(OsFluxoTerminal t,String codigo,String apelido) {
        estacao(codigo);if(apelido!=null&&apelido.length()>120)throw new BadRequestException("Apelido muito longo.");
        String anterior=Boolean.TRUE.equals(t.ativa)?t.estacaoCodigo:null;
        bloquearEstacoes(anterior,codigo);
        t.estacaoCodigo=codigo;t.apelido=apelido;t.usuarioNome=user.getNome();t.ativa=true;t.codigoPareamento=null;t.expiraEm=null;
        if(!Objects.equals(anterior,codigo))t.vinculadoEm=LocalDateTime.now();
        registrar(t,anterior,codigo,Objects.equals(anterior,codigo)?"ATUALIZADO":anterior==null?"VINCULADO":"TRANSFERIDO");
        atualizarMonitor(anterior);atualizarMonitor(codigo);
    }
    @Transactional
    public Map<String,Object> vincularEstacao(String id,String codigo) {
        gestao();OsFluxoTerminal t=terminalBloqueado(id);if(t==null){t=new OsFluxoTerminal();t.tenantId=tenants.currentTenantIdStr();t.terminalId=id;t.persist();}
        vincular(t,codigo,t.apelido);return listar(id);
    }
    @Transactional
    public Map<String,Object> atualizar(String id,String codigo,String apelido) {
        gestao();OsFluxoTerminal t=terminalBloqueado(id);if(t==null)throw new NotFoundException();vincular(t,codigo,apelido);return gestaoEstacoes();
    }
    @Transactional
    public Map<String,Object> cancelarSolicitacao(String id) {
        gestao();
        OsFluxoTerminal t=terminalBloqueado(id);
        if(t==null) throw new NotFoundException("Solicitação não encontrada.");
        if(Boolean.TRUE.equals(t.ativa)) throw new BadRequestException("Esta máquina já está vinculada.");
        t.codigoPareamento=null;
        t.expiraEm=null;
        return gestaoEstacoes();
    }
    @Transactional
    public Map<String,Object> remover(String id) {
        gestao();OsFluxoTerminal t=terminalBloqueado(id);if(t==null)throw new NotFoundException();String anterior=Boolean.TRUE.equals(t.ativa)?t.estacaoCodigo:null;bloquearEstacoes(anterior,null);t.ativa=false;t.codigoPareamento=null;t.expiraEm=null;if(anterior!=null){registrar(t,anterior,null,"REMOVIDO");atualizarMonitor(anterior);}return gestaoEstacoes();
    }
    @Transactional
    public Map<String,Object> solicitar(String id,String ip,String agent) {
        OsFluxoTerminal t=terminal(id);if(t==null){t=new OsFluxoTerminal();t.tenantId=tenants.currentTenantIdStr();t.terminalId=id;t.persist();}
        if(!Boolean.TRUE.equals(t.ativa)&&(t.expiraEm==null||!t.expiraEm.isAfter(LocalDateTime.now()))) {
            String codigo;
            do {codigo=String.format(Locale.ROOT,"%08d",RANDOM.nextInt(100_000_000));} while(OsFluxoTerminal.count("codigoPareamento",codigo)>0);
            t.codigoPareamento=codigo;t.expiraEm=LocalDateTime.now().plusMinutes(5);
            t.usuarioNome=user.getNome();
        }
        anotarOrigem(t,ip,agent);
        t.ultimoAcesso=LocalDateTime.now();
        return map("codigo",t.codigoPareamento,"expiraEm",t.expiraEm,"segundosRestantes",t.expiraEm==null?0:Math.max(0,Duration.between(LocalDateTime.now(),t.expiraEm).getSeconds()),"vinculada",Boolean.TRUE.equals(t.ativa));
    }
    private OsFluxoTerminal pareamento(String codigo) {
        if(codigo==null||!codigo.matches("[0-9]{8}"))throw new BadRequestException("Código de pareamento inválido.");
        OsFluxoTerminal t=OsFluxoTerminal.find("codigoPareamento = ?1 and ativa = false and expiraEm > ?2",codigo,LocalDateTime.now()).firstResult();
        if(t==null)throw new NotFoundException("Código inválido ou expirado.");return t;
    }
    public Map<String,Object> consultar(String codigo) {gestao();OsFluxoTerminal t=pareamento(codigo);return map("codigo",codigo,"usuarioNome",t.usuarioNome,"ip",t.ip,"userAgent",t.userAgent,"expiraEm",t.expiraEm);}
    @Transactional
    public Map<String,Object> concluir(String codigo,String estacaoCodigo,String apelido) {
        gestao();OsFluxoTerminal t=pareamento(codigo);OsFluxoTerminal.getEntityManager().refresh(t,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if(t.codigoPareamento==null||!codigo.equals(t.codigoPareamento)||t.expiraEm==null||!t.expiraEm.isAfter(LocalDateTime.now()))throw new BadRequestException("Código já utilizado ou expirado.");
        vincular(t,estacaoCodigo,apelido);return gestaoEstacoes();
    }

    private OsFluxoTerminal terminalBloqueado(String id) {
        OsFluxoTerminal t=terminal(id);
        if(t!=null)OsFluxoTerminal.getEntityManager().refresh(t,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        return t;
    }
    private OsFluxoEstacaoMonitor monitor(String codigo) {
        OsFluxoEstacaoMonitor existente=OsFluxoEstacaoMonitor.find("codigo",codigo).firstResult();if(existente!=null)return existente;
        String tenant=tenants.currentTenantIdStr();
        OsFluxoEstacaoMonitor.getEntityManager().createNativeQuery("INSERT IGNORE INTO os_fluxo_estacao_monitor (tenant_id,codigo,monitorado_desde,sem_vinculo_desde) VALUES (?1,?2,?3,?4)")
          .setParameter(1,tenant).setParameter(2,codigo).setParameter(3,LocalDateTime.now())
          .setParameter(4,OsFluxoTerminal.count("estacaoCodigo = ?1 and ativa = true",codigo)==0?LocalDateTime.now():null).executeUpdate();
        return OsFluxoEstacaoMonitor.<OsFluxoEstacaoMonitor>find("codigo",codigo).withLock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE).firstResult();
    }
    private void bloquearEstacoes(String anterior,String nova) {
        java.util.stream.Stream.of(anterior,nova).filter(Objects::nonNull).distinct().sorted().forEach(c->{
          OsFluxoEstacaoMonitor m=monitor(c);OsFluxoEstacaoMonitor.getEntityManager().refresh(m,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        });
    }
    private void atualizarMonitor(String codigo) {
        if(codigo==null)return;
        OsFluxoTerminal.getEntityManager().flush();
        OsFluxoEstacaoMonitor m=monitor(codigo);
        // DML usa a visão corrente do banco, inclusive após aguardar outro vínculo concorrente.
        OsFluxoEstacaoMonitor.getEntityManager().createNativeQuery("UPDATE os_fluxo_estacao_monitor SET sem_vinculo_desde = CASE WHEN EXISTS (SELECT 1 FROM os_fluxo_terminal t WHERE t.tenant_id = ?1 AND t.estacaoCodigo = ?2 AND t.ativa = true) THEN NULL ELSE COALESCE(sem_vinculo_desde, ?3) END WHERE tenant_id = ?1 AND codigo = ?2")
         .setParameter(1,tenants.currentTenantIdStr()).setParameter(2,codigo).setParameter(3,LocalDateTime.now()).executeUpdate();
        OsFluxoEstacaoMonitor.getEntityManager().refresh(m);
    }
    private void registrar(OsFluxoTerminal t,String anterior,String nova,String acao) {
        OsFluxoVinculoEvento e=new OsFluxoVinculoEvento();e.tenantId=tenants.currentTenantIdStr();e.terminalId=t.terminalId;e.apelido=t.apelido;
        e.estacaoAnterior=anterior;e.estacaoNova=nova;e.acao=acao;e.responsavel=user.getNome();e.ocorridoEm=LocalDateTime.now();e.persist();
    }
    @Transactional
    public Object aprovar(String id,String codigo,String apelido) {
        gestao();estacao(codigo);
        if(apelido==null||apelido.isBlank()||apelido.length()>120)throw new BadRequestException("Informe um nome de até 120 caracteres.");
        OsFluxoTerminal t=terminalBloqueado(id);
        if(t==null||Boolean.TRUE.equals(t.ativa)||t.expiraEm==null||!t.expiraEm.isAfter(LocalDateTime.now()))throw new ClientErrorException("Solicitação expirada ou já aprovada. Atualize a lista.",409);
        vincular(t,codigo,apelido.trim());return gestaoEstacoes();
    }
    public Object historico(String codigo) {
        gestao();estacao(codigo);
        return OsFluxoVinculoEvento.<OsFluxoVinculoEvento>find("estacaoAnterior = ?1 or estacaoNova = ?1 order by ocorridoEm desc, id desc",codigo).page(0,100).list().stream()
         .map(e->map("acao",e.acao,"terminalId",e.terminalId,"apelido",e.apelido,"estacaoAnterior",e.estacaoAnterior,"estacaoNova",e.estacaoNova,"responsavel",e.responsavel,"ocorridoEm",e.ocorridoEm)).toList();
    }
}
