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
        }return list;
    }
    private Estacao estacao(String codigo) {return catalogo().stream().filter(e->e.codigo.equals(codigo)).findFirst().orElseThrow(()->new BadRequestException("Estação inválida."));}
    private String nome(Estacao e) {OsFluxoEstacaoNome custom=OsFluxoEstacaoNome.find("codigo",e.codigo).firstResult();return custom==null?e.nome:custom.nome;}
    private void validarTerminal(String terminal) {if(terminal==null||!terminal.matches("[A-Za-z0-9-]{8,64}"))throw new BadRequestException("Terminal inválido.");}
    private OsFluxoTerminal terminal(String id) {validarTerminal(id);return OsFluxoTerminal.find("terminalId",id).firstResult();}
    public void exigirPareada(String terminal) {OsFluxoTerminal t=terminal(terminal);if(t==null||!Boolean.TRUE.equals(t.ativa)||t.estacaoCodigo==null)throw new ForbiddenException("Máquina não pareada. Solicite o pareamento à gestão.");}
    public boolean atende(String terminal,String setor) {OsFluxoTerminal t=terminal(terminal);return t!=null&&Boolean.TRUE.equals(t.ativa)&&Objects.equals(estacao(t.estacaoCodigo).setor,setor);}
    public void exigirEtapa(String terminal,String setor) {if(!atende(terminal,setor))throw new ForbiddenException("Etapa não atendida por esta estação.");}
    @Transactional
    public Map<String,Object> listar(String terminalId) {
        OsFluxoTerminal atual=terminal(terminalId);if(atual!=null&&Boolean.TRUE.equals(atual.ativa))atual.ultimoAcesso=LocalDateTime.now();
        List<OsFluxoTerminal> terminais=OsFluxoTerminal.list("ativa = true");
        List<Map<String,Object>> result=catalogo().stream().map(e->{
            List<OsFluxoTerminal> ts=terminais.stream().filter(t->e.codigo.equals(t.estacaoCodigo)).toList();
            OsFluxoTerminal ultimo=ts.stream().filter(t->t.ultimoAcesso!=null).max(Comparator.comparing(t->t.ultimoAcesso)).orElse(null);
            return map("codigo",e.codigo,"nome",nome(e),"setor",e.setor,"ordem",e.ordem,"cor",e.cor,"etapaIds",e.etapas,
                    "desteTerminal",atual!=null&&Boolean.TRUE.equals(atual.ativa)&&e.codigo.equals(atual.estacaoCodigo),
                    "emUso",ultimo!=null&&ultimo.ultimoAcesso.isAfter(LocalDateTime.now().minusMinutes(2)),"emUsoPor",ultimo==null?null:ultimo.usuarioNome,
                    "ultimoAcesso",ultimo==null?null:ultimo.ultimoAcesso,"terminais",ts.size());
        }).toList();
        return map("estacoes",result,"estacaoDesteTerminal",atual!=null&&Boolean.TRUE.equals(atual.ativa)?atual.estacaoCodigo:null,"maquinaDesteTerminal",atual==null?null:atual.apelido);
    }
    public Map<String,Object> gestaoEstacoes() {
        gestao();List<OsFluxoTerminal> ts=OsFluxoTerminal.list("ativa = true order by estacaoCodigo, apelido");
        return map("estacoes",catalogo().stream().map(e->map("codigo",e.codigo,"nome",nome(e),"nomePadrao",e.nome,"nomePersonalizado",!nome(e).equals(e.nome),
                "setor",e.setor,"cor",e.cor,"etapas",fluxo.etapas().stream().filter(et->e.etapas.contains(et.id)).map(et->et.nome).toList(),"maquinas",ts.stream().filter(t->e.codigo.equals(t.estacaoCodigo)).count())).toList(),
                "maquinas",ts.stream().map(t->map("terminalId",t.terminalId,"apelido",t.apelido,"estacaoCodigo",t.estacaoCodigo,"estacaoNome",nome(estacao(t.estacaoCodigo)),
                        "usuarioNome",t.usuarioNome,"ip",t.ip,"userAgent",t.userAgent,"vinculadoEm",t.vinculadoEm,"ultimoAcesso",t.ultimoAcesso,"ativa",t.ativa)).toList());
    }
    @Transactional
    public Map<String,Object> renomear(String codigo,String nome) {
        gestao();estacao(codigo);if(nome==null||nome.isBlank()||nome.length()>120)throw new BadRequestException("Informe um nome de até 120 caracteres.");
        OsFluxoEstacaoNome e=OsFluxoEstacaoNome.find("codigo",codigo).firstResult();
        if(e==null){e=new OsFluxoEstacaoNome();e.tenantId=tenants.currentTenantIdStr();e.codigo=codigo;e.persist();}e.nome=nome.trim();return gestaoEstacoes();
    }
    private void vincular(OsFluxoTerminal t,String codigo,String apelido) {
        estacao(codigo);if(apelido!=null&&apelido.length()>120)throw new BadRequestException("Apelido muito longo.");
        t.estacaoCodigo=codigo;t.apelido=apelido;t.usuarioNome=user.getNome();t.ativa=true;t.codigoPareamento=null;t.expiraEm=null;
        if(t.vinculadoEm==null)t.vinculadoEm=LocalDateTime.now();t.ultimoAcesso=LocalDateTime.now();
    }
    @Transactional
    public Map<String,Object> vincularEstacao(String id,String codigo) {
        gestao();OsFluxoTerminal t=terminal(id);if(t==null){t=new OsFluxoTerminal();t.tenantId=tenants.currentTenantIdStr();t.terminalId=id;t.persist();}
        vincular(t,codigo,t.apelido);return listar(id);
    }
    @Transactional
    public Map<String,Object> atualizar(String id,String codigo,String apelido) {
        gestao();OsFluxoTerminal t=terminal(id);if(t==null)throw new NotFoundException();vincular(t,codigo,apelido);return gestaoEstacoes();
    }
    @Transactional
    public Map<String,Object> remover(String id) {
        gestao();OsFluxoTerminal t=terminal(id);if(t==null)throw new NotFoundException();t.ativa=false;t.codigoPareamento=null;t.expiraEm=null;return gestaoEstacoes();
    }
    @Transactional
    public Map<String,Object> solicitar(String id,String ip,String agent) {
        OsFluxoTerminal t=terminal(id);if(t==null){t=new OsFluxoTerminal();t.tenantId=tenants.currentTenantIdStr();t.terminalId=id;t.persist();}
        if(!Boolean.TRUE.equals(t.ativa)&&(t.expiraEm==null||!t.expiraEm.isAfter(LocalDateTime.now()))) {
            String codigo;
            do {codigo=String.format(Locale.ROOT,"%08d",RANDOM.nextInt(100_000_000));} while(OsFluxoTerminal.count("codigoPareamento",codigo)>0);
            t.codigoPareamento=codigo;t.expiraEm=LocalDateTime.now().plusMinutes(5);
            t.usuarioNome=user.getNome();t.ip=ip;t.userAgent=agent==null?null:agent.substring(0,Math.min(255,agent.length()));
        }
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
        gestao();OsFluxoTerminal t=pareamento(codigo);OsFluxoTerminal.getEntityManager().lock(t,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if(t.codigoPareamento==null||!codigo.equals(t.codigoPareamento)||t.expiraEm==null||!t.expiraEm.isAfter(LocalDateTime.now()))throw new BadRequestException("Código já utilizado ou expirado.");
        vincular(t,estacaoCodigo,apelido);return gestaoEstacoes();
    }
}
