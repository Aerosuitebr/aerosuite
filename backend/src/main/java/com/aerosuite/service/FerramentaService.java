package com.aerosuite.service;

import com.aerosuite.domain.*;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.PermissionProfileService;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.util.FerramentaRegras;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.*;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import java.time.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static com.aerosuite.util.FerramentaRegras.*;

@ApplicationScoped
public class FerramentaService {
    @Inject EntityManager em;
    @Inject InternalUserContext currentUser;
    @Inject TenantDataAccess tenants;
    @Inject PermissionProfileService permissions;
    @Inject FerramentaTerminalContext terminal;
    public static final String ESTACAO="FERRAMENTAS_ESTACAO", GESTAO="FERRAMENTAS_GESTAO", CAL="FERRAMENTAS_CALIBRACAO", MEC="FERRAMENTAS_MECANICO";
    public record MovimentoRequest(List<Long> ferramentas, Long osId, Integer mecanicoId, String localizacao, LocalDateTime retornoPrevisto, String tipo) {}
    public record Confirmacao(String etapa, String email, String senha, String justificativa, LocalDateTime retornoPrevisto) {}
    public record Acao(String condicao, String justificativa, String localizacao, LocalDateTime retornoPrevisto, Long eventoReferencia) {}
    public record Envio(Long laboratorioId, LocalDate enviadaEm, LocalDate retornoPrevisto, String condicaoEnvio) {}
    public record Recebimento(LocalDate realizadaEm, String certificado, String arquivoNome, String arquivoBase64, String resultados, boolean conferenciaFisica) {}
    public record Analise(boolean aprovada, String justificativa) {}
    public record Item(Ferramenta ferramenta, FerramentaCustodia custodia, String mecanico, String osNumero, String entreguePor, String restricao, String situacao, boolean atrasada, boolean recolher, Long diasCalibracao, String localizacao) {}

    public Set<String> permissoes(Usuario u) {
        if (u == null || !Objects.equals(u.orgTenantId, tenants.currentTenantId()) || !Boolean.TRUE.equals(u.ativo)) return Set.of();
        return permissions.loadSnapshot(u).funcionalidadeCodigos().stream()
            .filter(c -> c.startsWith("FERRAMENTAS_")).collect(java.util.stream.Collectors.toUnmodifiableSet());
    }
    public void exigirOperador(Usuario u) { exigir(u,ESTACAO,GESTAO,CAL); }
    public List<Item> minhasFerramentas(Usuario u) {
        exigir(u,MEC);
        return itens().stream().filter(i -> i.custodia()!=null && Objects.equals(i.custodia().mecanicoId,u.id)).toList();
    }
    public void exigir(Usuario u,String... codes) {
        if (Arrays.stream(codes).noneMatch(permissoes(u)::contains)) throw new ForbiddenException("Seu perfil não permite esta operação.");
    }
    public Usuario autenticar() {
        if (!currentUser.isAuthenticated() || currentUser.isPlatformOpsElevated() || currentUser.getTenantId() == null)
            throw new ForbiddenException("Entre com uma conta da organização.");
        Usuario u = usuarioNoTenant(currentUser.getUserId());
        exigir(u, ESTACAO, GESTAO, CAL, MEC);
        return u;
    }
    private Usuario usuarioNoTenant(Integer id) {
        return id == null ? null : Usuario.find("id = ?1 and orgTenantId = ?2", id, tenants.currentTenantId()).firstResult();
    }
    private <T> T bloqueado(Class<T> tipo, Long id) {
        return em.createQuery("from " + tipo.getSimpleName() + " where id = :id", tipo).setParameter("id", id)
            .setLockMode(LockModeType.PESSIMISTIC_WRITE).getResultStream().findFirst().orElse(null);
    }
    public Map<String,Object> contexto(Usuario u) {
        List<Map<String,Object>> pessoas=Usuario.<Usuario>list("orgTenantId = ?1 and ativo = true order by nome", tenants.currentTenantId()).stream()
            .filter(p->permissoes(p).contains(MEC)).map(p->Map.<String,Object>of("id",p.id,"nome",p.nome,"email",p.email)).toList();
        List<Map<String,Object>> ordens=OS.<OS>list("isActive = true and dataFechamento is null and dataConclusaoServ is null and (statusExecucao is null or statusExecucao <> 'FINALIZADA') order by idOs desc").stream()
            .map(o->{Map<String,Object> ordem=new LinkedHashMap<>();ordem.put("id",o.id);ordem.put("numero",o.idOs);ordem.put("descricao",Objects.toString(o.clienteNome,""));ordem.put("mecanicoResponsavelId",o.mecanicoResponsavelId);return ordem;}).toList();
        return Map.of("pessoas",pessoas,"ordens",ordens,"laboratorios",FerramentaLaboratorio.listAll(),"permissoes",permissoes(u));
    }
    public List<Item> itens() {
        Map<Long,FerramentaCustodia> custs=new HashMap<>();
        Set<Integer> userIds=new HashSet<>();Set<Long> osIds=new HashSet<>();
        for(FerramentaCustodia c:FerramentaCustodia.<FerramentaCustodia>list("encerradaEm is null")){custs.put(c.ferramentaId,c);userIds.add(c.mecanicoId);userIds.add(c.entreguePor);osIds.add(c.osId);}
        Map<Integer,String> nomes=new HashMap<>();Map<Long,String> ordens=new HashMap<>();
        if(!userIds.isEmpty())for(Object[] row:em.createQuery("select u.id,u.nome from Usuario u where u.id in :ids and u.orgTenantId = :tenant",Object[].class).setParameter("ids",userIds).setParameter("tenant", tenants.currentTenantId()).getResultList())nomes.put((Integer)row[0],(String)row[1]);
        if(!osIds.isEmpty())for(Object[] row:em.createQuery("select o.id,o.idOs from OS o where o.id in :ids",Object[].class).setParameter("ids",osIds).getResultList())ordens.put((Long)row[0],String.valueOf(row[1]));
        Map<Long,String> laboratorios=new HashMap<>();
        for(Object[] row:em.createQuery("select c.ferramentaId,l.nome from FerramentaCalibracao c,FerramentaLaboratorio l where c.laboratorioId=l.id and c.status='EM_LABORATORIO'",Object[].class).getResultList())laboratorios.put((Long)row[0],(String)row[1]);
        return Ferramenta.<Ferramenta>list("order by codigo").stream().map(f->item(f,custs.get(f.id),nomes,ordens,laboratorios)).toList();
    }
    private Item item(Ferramenta f,FerramentaCustodia c,Map<Integer,String> nomes,Map<Long,String> ordens,Map<Long,String> laboratorios) {
        String restricao=restricao(f,null,agora());
        Long dias=f.exigeCalibracao && f.proximaCalibracao!=null ? java.time.temporal.ChronoUnit.DAYS.between(agora().toLocalDate(),f.proximaCalibracao) : null;
        String situacao=restricao!=null ? ("EM_LABORATORIO".equals(f.condicao)?"EM_LABORATORIO":"BLOQUEADA") : c==null?"DISPONIVEL":"EM_USO";
        return new Item(f,c,c==null?null:nomes.get(c.mecanicoId),c==null?null:ordens.get(c.osId),c==null?null:nomes.get(c.entreguePor),restricao,situacao,c!=null && c.retornoPrevisto.isBefore(agora()),c!=null && restricao!=null,dias,c!=null?c.localizacao:laboratorios.getOrDefault(f.id,f.posicao));
    }
    private String nome(Integer id) { Usuario u=usuarioNoTenant(id); return u==null?"Usuário #"+id:u.nome; }
    private String numero(Long id) { OS o=OS.find("id", id).firstResult();return o==null?"OS #"+id:String.valueOf(o.idOs); }
    private FerramentaCustodia ativa(Long id) {return FerramentaCustodia.find("ferramentaId = ?1 and encerradaEm is null",id).firstResult();}
    private Ferramenta ferramenta(Long id) { Ferramenta f=bloqueado(Ferramenta.class,id);if(f==null)throw new NotFoundException("Ferramenta não encontrada.");return f; }
    private OS ordem(Long id) {
        if(id==null)throw new BadRequestException("Selecione a OS.");
        OS o=bloqueado(OS.class,id);
        if(o==null || !Boolean.TRUE.equals(o.isActive) || o.dataFechamento!=null || o.dataConclusaoServ!=null || "FINALIZADA".equals(o.statusExecucao)) throw new BadRequestException("OS encerrada ou indisponível.");return o;
    }
    private Usuario mecanico(Integer id) { Usuario u=id==null?null:usuarioNoTenant(id);if(u==null || !Boolean.TRUE.equals(u.ativo))throw new BadRequestException("Mecânico inativo ou inválido.");exigir(u,MEC);return u; }
    private void usavel(Ferramenta f,LocalDateTime retorno) {String r=restricao(f,retorno,agora());if(r!=null)throw new BadRequestException(f.codigo+": "+r);}
    private String texto(String valor,String campo,int max) {if(valor==null || valor.isBlank() || valor.length()>max)throw new BadRequestException(campo+" é obrigatório (máximo "+max+" caracteres).");return valor.trim();}
    private String opcional(String valor,int max) {if(valor!=null && valor.length()>max)throw new BadRequestException("Campo excede "+max+" caracteres.");return valor;}
    private void evento(Ferramenta f,Long os,Usuario u,String tipo,String detalhe) {
        FerramentaEvento e=new FerramentaEvento();e.ferramentaId=f.id;e.osId=os;e.autorId=u.id;e.autor=u.nome;e.tipo=tipo;e.detalhe=detalhe;e.ocorridoEm=agora();e.persist();
        var origem=terminal.info();if(origem.vinculada() && origem.ferramentaria()){e.terminalId=origem.terminalId();e.estacaoCodigo=origem.estacaoCodigo();e.estacaoNome=origem.estacaoNome();e.maquina=origem.maquina();}
    }
    private void registrarTerminal(FerramentaMovimento m){
        var origem=terminal.info();
        if(origem.ferramentaria()){m.terminalId=origem.terminalId();m.estacaoCodigo=origem.estacaoCodigo();m.estacaoNome=origem.estacaoNome();m.maquina=origem.maquina();}
    }
    @Transactional public Ferramenta salvar(Long id,Ferramenta req,Usuario u,String justificativa) {
        if(id==null)exigir(u,GESTAO);else exigir(u,GESTAO,CAL);
        if(req==null)throw new BadRequestException("Cadastro inválido.");
        String codigo=texto(req.codigo,"Código",80).toUpperCase(Locale.ROOT);
        if(!codigo.matches("[A-Z0-9._/\\-]+"))throw new BadRequestException("Código deve conter apenas letras, números, ponto, hífen ou barra.");
        if(Ferramenta.count("codigo = ?1 and id <> ?2",codigo,id==null?-1L:id)>0)throw new BadRequestException("Código já cadastrado.");
        Ferramenta f=id==null?new Ferramenta():ferramenta(id);
        if(!permissoes(u).contains(GESTAO) && (!Objects.equals(f.codigo,codigo) || !Objects.equals(f.descricao,req.descricao)
            || !Objects.equals(f.tipo,req.tipo) || !Objects.equals(f.marca,req.marca) || !Objects.equals(f.modelo,req.modelo)
            || !Objects.equals(f.serie,req.serie) || !Objects.equals(f.posicao,req.posicao)))
            throw new ForbiddenException("O acesso de calibração permite revisar apenas os parâmetros metrológicos.");
        boolean revisao=id!=null && (f.exigeCalibracao!=req.exigeCalibracao || !Objects.equals(f.intervalo,req.intervalo) || !Objects.equals(f.unidade,req.unidade) || !Objects.equals(f.criterio,req.criterio) || !Objects.equals(f.alertas,req.alertas));
        if(revisao){exigir(u,CAL);texto(justificativa,"Justificativa da revisão",2000);}
        if(req.intervalo==null)throw new BadRequestException("Informe a periodicidade.");
        proxima(agora().toLocalDate(),req.intervalo,req.unidade);
        texto(req.alertas,"Janelas de alerta",255);
        try {for(String a:req.alertas.split(",")){int n=Integer.parseInt(a.trim());if(n<0 || n>3650)throw new NumberFormatException();}}catch(Exception e){throw new BadRequestException("Alertas: informe dias separados por vírgula, por exemplo 30,15,7.");}
        if(req.exigeCalibracao)exigirCriterioDefinitivo(req.criterio);
        String anterior="Intervalo "+f.intervalo+" "+f.unidade+"; controle "+f.exigeCalibracao+"; critério "+Objects.toString(f.criterio,"");
        if(id==null){f.codigo=codigo;f.criadaEm=agora();}else if(!codigo.equals(f.codigo))throw new BadRequestException("A identificação patrimonial não pode ser alterada.");
        f.descricao=texto(req.descricao,"Descrição",255);f.tipo=opcional(req.tipo,255);f.marca=opcional(req.marca,255);f.modelo=opcional(req.modelo,255);f.serie=opcional(req.serie,255);f.posicao=texto(req.posicao,"Posição",255);
        f.exigeCalibracao=req.exigeCalibracao;f.intervalo=req.intervalo;f.unidade=req.unidade;f.alertas=req.alertas;f.criterio=req.criterio==null?null:req.criterio.trim();
        // Existing accepted deadlines are immutable: a longer interval never releases an expired instrument.
        f.persist();em.flush();evento(f,null,u,id==null?"CADASTRO":"REVISAO_CADASTRO",anterior+" → "+f.intervalo+" "+f.unidade+". "+Objects.toString(justificativa,"Cadastro individual"));return f;
    }
    @Transactional public List<FerramentaMovimento> preparar(MovimentoRequest r,Usuario u) {
        exigir(u,ESTACAO);
        if(r==null || r.ferramentas()==null || r.ferramentas().isEmpty() || r.ferramentas().size()>100)throw new BadRequestException("Bipe de 1 a 100 ferramentas.");
        if(r.ferramentas().stream().anyMatch(Objects::isNull))throw new BadRequestException("Identificação de ferramenta inválida.");
        if(new HashSet<>(r.ferramentas()).size()!=r.ferramentas().size())throw new BadRequestException("Leitura duplicada.");
        if(!Set.of("RETIRADA","TRANSFERENCIA","INTERESSE").contains(Objects.toString(r.tipo(),"")))throw new BadRequestException("Tipo de movimento inválido.");
        if(!"INTERESSE".equals(r.tipo()))terminal.exigir();
        ordem(r.osId());mecanico(r.mecanicoId());texto(r.localizacao(),"Localização",255);
        if(r.retornoPrevisto()==null || !r.retornoPrevisto().isAfter(agora()))throw new BadRequestException("Informe retorno futuro.");
        List<FerramentaMovimento> criados=new ArrayList<>();
        for(Long id:r.ferramentas().stream().sorted().toList()) {
            Ferramenta f=ferramenta(id);FerramentaCustodia c=ativa(id);
            if(!"INTERESSE".equals(r.tipo())) {
                usavel(f,r.retornoPrevisto());
                if("RETIRADA".equals(r.tipo()) && c!=null)throw new BadRequestException(f.codigo+" já está sob custódia.");
                if("TRANSFERENCIA".equals(r.tipo()) && (c==null || Objects.equals(c.osId,r.osId())))throw new BadRequestException("Selecione custódia ativa e outra OS de destino.");
                if(FerramentaMovimento.count("ferramentaId = ?1 and status = 'PENDENTE' and tipo <> 'INTERESSE'",id)>0)throw new BadRequestException(f.codigo+": já existe uma preparação pendente.");
            }
            FerramentaMovimento m=new FerramentaMovimento();m.ferramentaId=id;m.custodiaOrigemId=c==null?null:c.id;m.osId=r.osId();m.mecanicoId=r.mecanicoId();m.solicitanteId=u.id;m.tipo=r.tipo();m.localizacao=r.localizacao();m.retornoPrevisto=r.retornoPrevisto();m.criadoEm=agora();m.persist();
            registrarTerminal(m);evento(f,r.osId(),u,"SOLICITACAO_"+r.tipo(),"Movimento #"+m.id+"; destinatário "+nome(m.mecanicoId)+"; previsão "+m.retornoPrevisto+"; local "+m.localizacao);criados.add(m);
        }return criados;
    }
    public List<Map<String,Object>> movimentos(Usuario u) {
        boolean balcao=permissoes(u).contains(ESTACAO);
        return FerramentaMovimento.<FerramentaMovimento>list("status = 'PENDENTE' order by criadoEm desc").stream()
            .filter(m->balcao || Objects.equals(m.mecanicoId,u.id) || Objects.equals(m.solicitanteId,u.id) || (m.custodiaOrigemId!=null && Objects.equals(((FerramentaCustodia)FerramentaCustodia.find("id", m.custodiaOrigemId).firstResult()).mecanicoId,u.id)))
            .map(m->{Ferramenta f=Ferramenta.find("id", m.ferramentaId).firstResult();Map<String,Object> out=new LinkedHashMap<>();out.put("movimento",m);out.put("codigo",f.codigo);out.put("descricao",f.descricao);out.put("mecanico",nome(m.mecanicoId));out.put("osNumero",numero(m.osId));out.put("origem",m.custodiaOrigemId==null?null:nome(((FerramentaCustodia)FerramentaCustodia.find("id", m.custodiaOrigemId).firstResult()).mecanicoId));return out;}).toList();
    }
    @Transactional public FerramentaMovimento confirmar(Long id,Confirmacao r,Usuario sessao) {
        exigir(sessao,ESTACAO);
        if(r==null)throw new BadRequestException("Confirmação inválida.");
        if(!Set.of("CANCELAR","RECUSAR").contains(Objects.toString(r.etapa(),"")))terminal.exigir();
        FerramentaMovimento ref=FerramentaMovimento.find("id", id).firstResult();if(ref==null)throw new NotFoundException();
        // Always lock OS, then asset, then movement to match checkout/closure lock ordering.
        bloqueado(OS.class,ref.osId);Ferramenta f=ferramenta(ref.ferramentaId);
        FerramentaMovimento m=bloqueado(FerramentaMovimento.class,id);
        if(!"PENDENTE".equals(m.status))throw new BadRequestException("Movimento já encerrado.");
        Usuario u=sessao;

        if("CANCELAR".equals(r.etapa()) || "RECUSAR".equals(r.etapa())) {
            FerramentaCustodia origem=m.custodiaOrigemId==null?null:FerramentaCustodia.find("id", m.custodiaOrigemId).firstResult();
            if(!Objects.equals(m.solicitanteId,u.id) && !Objects.equals(m.mecanicoId,u.id)
                && (origem==null || !Objects.equals(origem.mecanicoId,u.id)))exigir(u,ESTACAO);
            m.status=r.etapa();evento(f,m.osId,u,m.status,texto(r.justificativa(),"Justificativa",2000));return m;
        }
        if("INTERESSE".equals(m.tipo))throw new BadRequestException("Interesse deve ser atendido por uma nova retirada ou transferência após liberar o exemplar.");
        ordem(m.osId);
        mecanico(m.mecanicoId);
        LocalDateTime previsao=Set.of("RECEBIMENTO","REGISTRAR").contains(Objects.toString(r.etapa(),"")) && r.retornoPrevisto()!=null?r.retornoPrevisto():m.retornoPrevisto;
        usavel(f,previsao);
        FerramentaCustodia origem=ativa(f.id);
        if("TRANSFERENCIA".equals(m.tipo) && (origem==null || !Objects.equals(origem.id,m.custodiaOrigemId)))throw new BadRequestException("A custódia de origem mudou. Cancele e prepare novamente.");
        switch(Objects.toString(r.etapa(),"")) {
            case "REGISTRAR" -> { registrarConferenciaSetor(m,u.id,agora());m.retornoPrevisto=previsao; }
            case "ENTREGA" -> {if(m.entregaPor!=null)throw new BadRequestException("Entrega já confirmada.");exigir(u,ESTACAO);m.entregaPor=u.id;m.entregaEm=agora();}
            case "RECEBIMENTO" -> {if(m.recebidoPor!=null)throw new BadRequestException("Recebimento já confirmado.");exigir(u,ESTACAO);
                if(!Objects.equals(m.retornoPrevisto,previsao))evento(f,m.osId,u,"PREVISAO_CONFIRMADA","Movimento #"+m.id+"; "+m.retornoPrevisto+" → "+previsao+". Prazo acordado no recebimento e registrado pela ferramentaria.");
                m.retornoPrevisto=previsao;m.recebidoPor=u.id;m.recebidoEm=agora();}
            case "CIENCIA" -> {if(!"TRANSFERENCIA".equals(m.tipo) || m.cienciaPor!=null)throw new BadRequestException("Ciência inválida ou já registrada.");exigir(u,ESTACAO);m.cienciaPor=u.id;m.cienciaEm=agora();}
            default -> throw new BadRequestException("Etapa inválida.");
        }
        registrarTerminal(m);
        evento(f,m.osId,u,"CONFIRMACAO_"+r.etapa(),"Movimento #"+m.id+"; etapa "+r.etapa()+" registrada pela ferramentaria; destinatário "+nome(m.mecanicoId)+"; previsão "+m.retornoPrevisto);
        if(confirmacoesCompletas(m)) {
            if(origem!=null && !"TRANSFERENCIA".equals(m.tipo))throw new BadRequestException("Exemplar já está em uso.");
            if(origem!=null){origem.encerradaEm=agora();origem.encerramento="TRANSFERENCIA";em.flush();}
            FerramentaCustodia c=new FerramentaCustodia();c.ferramentaId=f.id;c.osId=m.osId;c.mecanicoId=m.mecanicoId;c.entreguePor=m.entregaPor;c.localizacao=m.localizacao;c.retiradaEm=agora();c.retornoPrevisto=m.retornoPrevisto;c.previsaoAtualizadaEm=agora();c.persist();m.status="CONCLUIDO";
            evento(f,m.osId,u,"CUSTODIA_ABERTA","Movimento #"+m.id+"; custódia #"+c.id+"; responsável "+nome(c.mecanicoId)+"; OS "+numero(c.osId));
        }return m;
    }
    @Transactional public void devolver(Long id,Acao r,Usuario u) {
        exigir(u,ESTACAO);terminal.exigir();
        Ferramenta f=ferramenta(id);FerramentaCustodia c=ativa(id);
        if(c==null)throw new BadRequestException("Sem custódia ativa.");
        if(r==null || !Set.of("REGULAR","AVARIA","INSPECAO","PERDA","DESVIO").contains(Objects.toString(r.condicao(),"")))throw new BadRequestException("Informe a condição recebida.");
        String obs=texto(r.justificativa(),"Conferência de condição e acessórios",2000);
        c.encerradaEm=agora();c.encerramento="REGULAR".equals(r.condicao())?"DEVOLUCAO":"OCORRENCIA";
        if(!"REGULAR".equals(r.condicao())){f.condicao=r.condicao();f.bloqueioOperacional=r.condicao();}
        // Physical receipt must never overwrite a previous operational block.
        evento(f,c.osId,u,c.encerramento,"Condição: "+r.condicao()+". "+obs);
        cancelarPendentes(f,u,"Custódia encerrada pela ferramentaria.");
    }
    @Transactional public void previsao(Long id,Acao r,Usuario u) {
        exigir(u,ESTACAO);
        if(r==null)throw new BadRequestException("Informe a previsão e a justificativa.");
        Ferramenta f=ferramenta(id);FerramentaCustodia c=ativa(id);if(c==null)throw new BadRequestException("Sem custódia.");
        String obs=texto(r.justificativa(),"Justificativa",2000);if(r.retornoPrevisto()==null)throw new BadRequestException("Informe a previsão.");
        usavel(f,r.retornoPrevisto());String anterior=c.retornoPrevisto.toString();c.retornoPrevisto=r.retornoPrevisto();c.previsaoAtualizadaEm=agora();
        if(r.localizacao()!=null && !r.localizacao().isBlank())c.localizacao=texto(r.localizacao(),"Localização",255);
        evento(f,c.osId,u,"PREVISAO_ALTERADA",anterior+" → "+c.retornoPrevisto+". "+obs);
    }
    @Transactional public void ocorrencia(Long id,Acao r,Usuario u) {
        exigir(u,ESTACAO,GESTAO,CAL);
        Ferramenta f=ferramenta(id);FerramentaCustodia c=ativa(id);
        if(r==null || !Set.of("AVARIA","INSPECAO","PERDA","DESVIO","CHECAGEM","BAIXA","LIBERAR","AJUSTE").contains(Objects.toString(r.condicao(),"")))throw new BadRequestException("Tipo de ocorrência inválido.");
        if("AJUSTE".equals(r.condicao())){
            exigir(u,GESTAO,CAL);
            FerramentaEvento referencia=r.eventoReferencia()==null?null:FerramentaEvento.find("id", r.eventoReferencia()).firstResult();
            if(referencia==null || !Objects.equals(referencia.ferramentaId,id))throw new BadRequestException("Selecione um evento do histórico deste exemplar para registrar a correção.");
            evento(f,referencia.osId,u,"AJUSTE_HISTORICO","Correção do evento #"+referencia.id+": "+texto(r.justificativa(),"Informação corrigida e justificativa",2000));return;
        }
        if("BAIXA".equals(r.condicao()))exigir(u,GESTAO);
        if("LIBERAR".equals(r.condicao())) {
            exigir(u,GESTAO,CAL);
            if(Set.of("BAIXA","PERDA","EM_LABORATORIO","EM_ANALISE","REPROVADA").contains(f.condicao))throw new BadRequestException("A restrição exige o tratamento específico antes de liberar.");
            if(f.exigeCalibracao && (f.proximaCalibracao==null || f.proximaCalibracao.isBefore(agora().toLocalDate())))throw new BadRequestException("Uma nova calibração aprovada é obrigatória.");
            if(f.exigeCalibracao && f.statusCalibracao!=null && !"APROVADA".equals(f.statusCalibracao))throw new BadRequestException("Uma inspeção não substitui a aprovação do último ciclo de calibração.");
            if(FerramentaCalibracao.count("ferramentaId = ?1 and status in ('EM_LABORATORIO','EM_ANALISE')",id)>0)throw new BadRequestException("Conclua o ciclo de calibração antes da liberação operacional.");
            f.bloqueioOperacional=null;
            f.condicao="REGULAR";
        } else if(!"CHECAGEM".equals(r.condicao())){f.bloqueioOperacional=r.condicao();f.condicao=r.condicao();}
        evento(f,c==null?null:c.osId,u,"OCORRENCIA_"+r.condicao(),texto(r.justificativa(),"Resultado, decisão e providências",2000));
    }
    private void cancelarPendentes(Ferramenta f,Usuario u,String motivo) {
        for(FerramentaMovimento m:FerramentaMovimento.<FerramentaMovimento>list("ferramentaId = ?1 and status = 'PENDENTE' and tipo <> 'INTERESSE'",f.id)){m.status="CANCELAR";evento(f,m.osId,u,"CANCELAMENTO_AUTOMATICO","Movimento #"+m.id+". "+motivo);}
    }
    @Transactional public FerramentaLaboratorio laboratorio(FerramentaLaboratorio l,Usuario u) {
        exigir(u,CAL);if(l==null)throw new BadRequestException("Informe o laboratório.");FerramentaLaboratorio novo=new FerramentaLaboratorio();novo.nome=texto(l.nome,"Nome do laboratório",255);novo.contato=opcional(l.contato,255);novo.escopo=opcional(l.escopo,2000);novo.consultaAcreditacao=l.consultaAcreditacao;novo.persist();return novo;
    }
    @Transactional public FerramentaCalibracao enviar(Long id,Envio r,Usuario u) {
        exigir(u,CAL);terminal.exigir();
        Ferramenta f=ferramenta(id);
        if(ativa(id)!=null)throw new BadRequestException("Recolha a ferramenta antes do envio.");
        if(!f.exigeCalibracao || Set.of("BAIXA","PERDA").contains(Objects.toString(f.bloqueioOperacional,f.condicao)))throw new BadRequestException("Ferramenta não elegível para calibração.");
        if(FerramentaCalibracao.count("ferramentaId = ?1 and status in ('EM_LABORATORIO','EM_ANALISE')",id)>0)throw new BadRequestException("Já existe um ciclo em aberto.");
        if(r==null || r.laboratorioId()==null || FerramentaLaboratorio.find("id", r.laboratorioId()).firstResult()==null)throw new BadRequestException("Selecione o laboratório.");
        if(r.enviadaEm()==null || r.enviadaEm().isAfter(agora().toLocalDate()) || r.retornoPrevisto()==null || r.retornoPrevisto().isBefore(r.enviadaEm()))throw new BadRequestException("Datas de envio e retorno inválidas.");
        FerramentaCalibracao c=new FerramentaCalibracao();c.ferramentaId=id;c.laboratorioId=r.laboratorioId();c.enviadaEm=r.enviadaEm();c.retornoPrevisto=r.retornoPrevisto();c.condicaoEnvio=texto(r.condicaoEnvio(),"Condição, acessórios e comprovante",2000);c.enviadoPor=u.id;c.persist();f.condicao="EM_LABORATORIO";
        f.statusCalibracao="EM_LABORATORIO";
        cancelarPendentes(f,u,"Enviada para calibração.");evento(f,null,u,"ENVIO_LABORATORIO","Ciclo #"+c.id+"; laboratório #"+c.laboratorioId+"; "+c.condicaoEnvio);return c;
    }
    @Transactional public FerramentaCalibracao receber(Long id,Recebimento r,Usuario u) {
        terminal.exigir();
        exigir(u,CAL);FerramentaCalibracao ref=FerramentaCalibracao.find("id", id).firstResult();if(ref==null)throw new NotFoundException();Ferramenta f=ferramenta(ref.ferramentaId);
        FerramentaCalibracao c=bloqueado(FerramentaCalibracao.class,id);
        if(!"EM_LABORATORIO".equals(c.status))throw new BadRequestException("Ciclo não está em laboratório.");
        if(r==null || r.realizadaEm()==null || r.realizadaEm().isBefore(c.enviadaEm) || r.realizadaEm().isAfter(agora().toLocalDate()))throw new BadRequestException("Data da calibração inválida.");
        byte[] pdf;try {if(r.arquivoBase64()==null || r.arquivoBase64().length()>14000000)throw new IllegalArgumentException();pdf=Base64.getDecoder().decode(r.arquivoBase64());}catch(IllegalArgumentException e){throw new BadRequestException("Anexe um certificado PDF de até 10 MB.");}
        if(pdf.length<5 || pdf.length>10*1024*1024 || !new String(pdf,0,5,StandardCharsets.US_ASCII).equals("%PDF-"))throw new BadRequestException("Arquivo não é um PDF válido.");
        if(!r.conferenciaFisica())throw new BadRequestException("Confirme o recebimento físico do exemplar e acessórios.");
        c.realizadaEm=r.realizadaEm();c.certificado=texto(r.certificado(),"Número do certificado",255);c.arquivoNome=texto(r.arquivoNome(),"Nome do PDF",500);c.arquivo=pdf;c.resultados=texto(r.resultados(),"Resultados, incerteza e ajustes",4000);c.conferenciaFisica=true;c.recebidaEm=agora().toLocalDate();c.status="EM_ANALISE";f.condicao="EM_ANALISE";
        f.statusCalibracao="EM_ANALISE";
        evento(f,null,u,"CERTIFICADO_RECEBIDO","Ciclo #"+c.id+"; certificado "+c.certificado+". Aguarda decisão técnica.");return c;
    }
    @Transactional public FerramentaCalibracao analisar(Long id,Analise r,Usuario u) {
        if(r==null)throw new BadRequestException("Informe a decisão e sua justificativa.");
        exigir(u,CAL);FerramentaCalibracao ref=FerramentaCalibracao.find("id", id).firstResult();if(ref==null)throw new NotFoundException();Ferramenta f=ferramenta(ref.ferramentaId);
        FerramentaCalibracao c=bloqueado(FerramentaCalibracao.class,id);
        if(!"EM_ANALISE".equals(c.status) || c.arquivo==null || !c.conferenciaFisica)throw new BadRequestException("Certificado e conferência física são obrigatórios.");
        if(r.aprovada())exigirCriterioDefinitivo(f.criterio);
        c.analise=texto(r.justificativa(),"Análise frente ao critério de aceitação",4000);c.analisadoPor=u.id;c.analisadaEm=agora();c.intervaloAplicado=f.intervalo;c.unidadeAplicada=f.unidade;c.proximaCalculada=proxima(c.realizadaEm,f.intervalo,f.unidade);c.status=r.aprovada()?"APROVADA":"REPROVADA";
        if(r.aprovada()) {
            if(c.proximaCalculada.isBefore(agora().toLocalDate()))throw new BadRequestException("Esta calibração já venceu. Registre um novo ciclo.");
            f.ultimaCalibracao=c.realizadaEm;f.proximaCalibracao=c.proximaCalculada;f.condicao=f.bloqueioOperacional==null?"REGULAR":f.bloqueioOperacional;
        } else f.condicao=f.bloqueioOperacional==null?"REPROVADA":f.bloqueioOperacional;
        f.statusCalibracao=c.status;
        evento(f,null,u,"CALIBRACAO_"+c.status,"Ciclo #"+c.id+"; critério: "+f.criterio+"; próxima "+c.proximaCalculada+"; restrição operacional preservada: "+Objects.toString(f.bloqueioOperacional,"nenhuma")+". "+c.analise);return c;
    }
    public List<FerramentaEvento> historico(Long id) {return FerramentaEvento.list("ferramentaId = ?1 order by ocorridoEm desc, id desc",id);}
    public List<FerramentaCalibracao> calibracoes() {return FerramentaCalibracao.list("order by id desc");}
    public List<Map<String,Object>> impacto(Long id,LocalDate de,LocalDate ate) {
        Ferramenta f=Ferramenta.find("id", id).firstResult();if(f==null)throw new NotFoundException();
        LocalDate inicio=de!=null?de:f.ultimaCalibracao!=null?f.ultimaCalibracao:LocalDate.of(2000,1,1);
        LocalDate fim=ate!=null?ate:agora().toLocalDate();if(fim.isBefore(inicio))throw new BadRequestException("Período inválido.");
        return FerramentaCustodia.<FerramentaCustodia>list("ferramentaId = ?1 and retiradaEm < ?2 and (encerradaEm is null or encerradaEm >= ?3) order by retiradaEm",id,fim.plusDays(1).atStartOfDay(),inicio.atStartOfDay()).stream()
            .map(c->Map.<String,Object>of("custodia",c,"osNumero",numero(c.osId),"mecanico",nome(c.mecanicoId))).toList();
    }
    public void exigirOsSemPendencias(Long osId) {
        List<String> pendencias=new ArrayList<>();
        for(FerramentaCustodia c:FerramentaCustodia.<FerramentaCustodia>find("osId = ?1 and encerradaEm is null",osId).withLock(LockModeType.PESSIMISTIC_WRITE).list()){
            Ferramenta f=Ferramenta.find("id", c.ferramentaId).firstResult();Usuario u=usuarioNoTenant(c.mecanicoId);
            pendencias.add(f.codigo+" — "+(u==null?"Usuário #"+c.mecanicoId:u.nome)+"; local: "+c.localizacao+"; retorno: "+c.retornoPrevisto);
        }
        for(FerramentaMovimento m:FerramentaMovimento.<FerramentaMovimento>find("osId = ?1 and status = 'PENDENTE' and tipo <> 'INTERESSE'",osId).withLock(LockModeType.PESSIMISTIC_WRITE).list()){
            Ferramenta f=Ferramenta.find("id", m.ferramentaId).firstResult();
            pendencias.add(f.codigo+" — "+m.tipo+" #"+m.id+" aguardando confirmações");
        }
        if(!pendencias.isEmpty())throw new ClientErrorException("Ferramentas pendentes nesta OS: "+String.join(" | ",pendencias)+". Devolva, transfira ou formalize o encerramento por ocorrência na ferramentaria antes de concluir.", 409);
    }
}
