package com.aerosuite.service;

import com.aerosuite.domain.*;
import com.aerosuite.dto.OsFluxoDtos.*;
import com.aerosuite.security.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import java.time.*;
import java.util.*;
import java.util.function.Function;

@ApplicationScoped
public class OsFluxoService {
    @Inject TenantDataAccess tenants;
    @Inject InternalUserContext user;
    @Inject OsFluxoEstacaoService estacoes;
    public static Map<String,Object> map(Object... pairs) {
        Map<String,Object> m = new LinkedHashMap<>();
        for (int i=0; i<pairs.length; i+=2) m.put((String)pairs[i], pairs[i+1]);
        return m;
    }
    public boolean podeGerir() {
        return Set.of("ADMIN","ADMINISTRADOR","DIRETOR").contains(Objects.toString(user.getPerfilCodigo(), ""))
                || user.hasFuncionalidadeCodigo("OS_FLUXO_AJUSTE");
    }
    public void exigirGestao() { if (!podeGerir()) throw new ForbiddenException("Sem permissão para ajustar o fluxo."); }
    @Transactional
    public List<OsFluxoEtapa> etapas() {
        List<OsFluxoEtapa> etapas = OsFluxoEtapa.list("ativo = true order by ordem, id");
        if (etapas.isEmpty()) {
            Tenant tenant = Tenant.findById(tenants.currentTenantId());
            if (tenant == null) throw new NotFoundException("Empresa não encontrada.");
            Tenant.getEntityManager().lock(tenant, LockModeType.PESSIMISTIC_WRITE);
            etapas = OsFluxoEtapa.list("ativo = true order by ordem, id");
            if (!etapas.isEmpty()) return etapas;
            String[][] defaults = {
                {"RECEBIMENTO","Recebimento","Recebimento","#2563eb"},
                {"DESMONTAGEM","Desmontagem","Oficina","#7c3aed"},
                {"LIMPEZA","Limpeza","Oficina","#0891b2"},
                {"INSPECAO","Inspeção","Oficina","#d97706"},
                {"ENSAIO_NAO_DESTRUTIVO","Ensaio não destrutivo","Oficina","#db2777"},
                {"MONTAGEM","Montagem","Oficina","#059669"},
                {"TESTE","Teste","Teste","#4f46e5"},
                {"INSPECAO_FINAL","Inspeção final","Qualidade","#0d9488"},
                {"EXPEDICAO","Expedição","Expedição","#475569"}
            };
            for (int i=0;i<defaults.length;i++) {
                OsFluxoEtapa e = new OsFluxoEtapa(); e.tenantId=tenants.currentTenantIdStr();
                e.codigo=defaults[i][0]; e.nome=defaults[i][1]; e.setor=defaults[i][2]; e.cor=defaults[i][3]; e.ordem=i+1;
                e.icone="pi pi-cog"; e.codigoBarrasEntrada="E"+(i+1); e.codigoBarrasSaida="S"+(i+1); e.persist();
            }
            etapas = OsFluxoEtapa.list("ativo = true order by ordem, id");
        }
        return etapas;
    }
    @Transactional
    public OsFluxoEtapa meta(Long id, Integer minutos) {
        exigirGestao(); if (minutos != null && (minutos < 1 || minutos > 525600)) throw new BadRequestException("Meta inválida.");
        OsFluxoEtapa e=etapa(id); e.metaMinutos=minutos; evento(null,id,"META",true,"Meta alterada para " + minutos, null); return e;
    }
    private OsFluxoEtapa etapa(Long id) {
        OsFluxoEtapa e = id == null ? null : OsFluxoEtapa.findById(id);
        if(e == null || !Boolean.TRUE.equals(e.ativo)) throw new BadRequestException("Etapa inválida."); return e;
    }
    private List<OsFluxoRegistro> registros(Long id) { return OsFluxoRegistro.list("osId = ?1 and anulado = false order by sequencia, id",id); }
    private OsFluxoRegistro aberto(List<OsFluxoRegistro> rs) { return rs.stream().filter(r->r.saidaEm==null).findFirst().orElse(null); }
    private OsFluxoEtapa proxima(List<OsFluxoRegistro> rs) {
        int ordem = rs.isEmpty() ? 0 : etapa(rs.get(rs.size()-1).etapaId).ordem;
        return etapas().stream().filter(e->e.ordem > ordem).findFirst().orElse(null);
    }
    private long concluidas(List<OsFluxoRegistro> rs) { return rs.stream().filter(r->r.saidaEm!=null).map(r->r.etapaId).distinct().count(); }
    private String situacao(List<OsFluxoRegistro> rs) { return aberto(rs)!=null ? "EM_ETAPA" : rs.isEmpty() ? null : proxima(rs)==null ? "CONCLUIDO" : "AGUARDANDO"; }
    public static Long idCodigo(String codigo) {
        if(codigo==null || !codigo.trim().toUpperCase(Locale.ROOT).matches("(?:OS)?[0-9]{1,18}")) throw new BadRequestException("Código de OS inválido.");
        return Long.valueOf(codigo.trim().toUpperCase(Locale.ROOT).replaceFirst("^OS",""));
    }
    private OS osCodigo(String codigo) { return tenants.requireOS(idCodigo(codigo)); }
    private OS bloquear(Long id) {
        OS os=tenants.requireOS(id); OS.getEntityManager().lock(os,LockModeType.PESSIMISTIC_WRITE);
        if(!Boolean.TRUE.equals(os.isActive)) throw new BadRequestException("OS inativa."); return os;
    }
    public Map<String,Object> resumoOs(OS o, List<OsFluxoRegistro> rs) {
        OsFluxoRegistro last=rs.isEmpty()?null:rs.get(rs.size()-1);
        return map("id",o.id,"codigo","OS"+o.id,"cliente",o.clienteNome,"partNumber",o.partNumber,"serialNumber",o.serialNumber,
                "numOsOriginal",o.numOsOriginal,"mecanicoNome",o.mecanicoResponsavelNome,"statusOperacional",o.statusExecucao,
                "fluxoSituacao",situacao(rs),"fluxoEtapaId",last==null?null:last.etapaId,"fluxoAtualizadoEm",last==null?null:last.saidaEm==null?last.entradaEm:last.saidaEm);
    }
    public Map<String,Object> estado(String codigo) { return estado(tenants.requireOS(idCodigo(codigo))); }
    private Map<String,Object> estado(OS os) {
        List<OsFluxoRegistro> rs=registros(os.id); OsFluxoRegistro r=aberto(rs);
        return map("os",resumoOs(os,rs),"etapaAtual",r==null?null:etapa(r.etapaId),"registroAberto",r==null?null:registroDto(r),
                "proximaEtapa",proxima(rs),"etapasConcluidas",concluidas(rs),"totalEtapas",etapas().size(),"podeGerir",podeGerir());
    }
    private Map<String,Object> registroDto(OsFluxoRegistro r) {
        OsFluxoEtapa e=etapa(r.etapaId);
        return map("id",r.id,"osId",r.osId,"etapaId",e.id,"etapaNome",e.nome,"etapaCor",e.cor,"etapaOrdem",e.ordem,
                "sequencia",r.sequencia,"entradaEm",r.entradaEm,"entradaUsuarioNome",r.entradaUsuarioNome,"entradaOrigem",r.entradaOrigem,"entradaEstacao",r.entradaEstacao,
                "saidaEm",r.saidaEm,"saidaUsuarioNome",r.saidaUsuarioNome,"saidaOrigem",r.saidaOrigem,"saidaEstacao",r.saidaEstacao,
                "duracaoSegundos",r.saidaEm==null?null:seg(r.entradaEm,r.saidaEm),"forcado",r.forcado,"observacao",r.observacao,
                "anulado",r.anulado,"anuladoEm",r.anuladoEm,"anuladoUsuarioNome",r.anuladoUsuarioNome,"anuladoMotivo",r.anuladoMotivo,"metaMinutos",e.metaMinutos);
    }
    private long seg(LocalDateTime inicio, LocalDateTime fim) { return inicio==null||fim==null?0:Math.max(0,Duration.between(inicio,fim).getSeconds()); }
    @Transactional
    public Map<String,Object> bipar(BiparRequest req) {
        if(req==null) throw new BadRequestException("Informe a leitura.");
        if(req.estacao!=null&&req.estacao.length()>120)throw new BadRequestException("Nome de estação muito longo.");
        if(req.origem!=null&&!Set.of("SCANNER","MANUAL").contains(req.origem))throw new BadRequestException("Origem inválida.");
        if(req.forcar) { exigirGestao(); motivo(req.motivo); }
        estacoes.exigirPareada(req.terminalId);
        OS os = bloquear(idCodigo(req.osCodigo)); List<OsFluxoRegistro> rs=registros(os.id); OsFluxoRegistro r=aberto(rs);
        OsFluxoEtapa e;
        if(req.etapaId!=null) e=etapa(req.etapaId);
        else if(req.etapaCodigo!=null && !req.etapaCodigo.isBlank()) {
            e=etapas().stream().filter(v->v.codigo.equalsIgnoreCase(req.etapaCodigo)||v.codigoBarrasEntrada.equalsIgnoreCase(req.etapaCodigo)||v.codigoBarrasSaida.equalsIgnoreCase(req.etapaCodigo))
                    .findFirst().orElseThrow(()->new BadRequestException("Código de etapa inválido."));
        } else e=r!=null?etapa(r.etapaId):proxima(rs);
        if(e==null) throw new BadRequestException("Fluxo já concluído.");
        estacoes.exigirEtapa(req.terminalId,e.setor);
        String acao=Objects.toString(req.acao,"AUTO").toUpperCase(Locale.ROOT);
        if(acao.equals("AUTO")) acao=r!=null&&r.etapaId.equals(e.id)?"SAIDA":"ENTRADA";
        if(!Set.of("ENTRADA","SAIDA").contains(acao)) throw new BadRequestException("Ação inválida.");
        if(acao.equals("ENTRADA")) {
            if(r!=null) throw new BadRequestException("Registre a saída da etapa atual antes de entrar em outra.");
            OsFluxoEtapa esperada=proxima(rs);
            if(!req.forcar && (esperada==null||!esperada.id.equals(e.id))) throw new BadRequestException("Etapa fora da sequência esperada.");
            r=novo(os.id,e.id,rs.size()+1,req.forcar,req.observacao); r.entradaOrigem=req.origem; r.entradaEstacao=req.estacao;
        } else {
            if(r==null||!r.etapaId.equals(e.id)) throw new BadRequestException("Não existe entrada aberta nessa etapa.");
            fechar(r); r.saidaOrigem=req.origem; r.saidaEstacao=req.estacao;
        }
        evento(os.id,e.id,acao,true,req.forcar?req.motivo:"Leitura registrada",req);
        rs=registros(os.id);
        return map("sucesso",true,"acao",acao,"mensagem","Leitura registrada com sucesso.","os",resumoOs(os,rs),"etapa",e,"registro",registroDto(r),
                "proximaEtapa",proxima(rs),"situacao",situacao(rs),"forcado",req.forcar,"etapasConcluidas",concluidas(rs),"totalEtapas",etapas().size());
    }
    private OsFluxoRegistro novo(Long osId,Long etapaId,int seq,boolean forcado,String obs) {
        if(obs!=null&&obs.length()>2000) throw new BadRequestException("Observação muito longa.");
        OsFluxoRegistro r=new OsFluxoRegistro(); r.tenantId=tenants.currentTenantIdStr(); r.osId=osId; r.etapaId=etapaId; r.sequencia=seq;
        r.entradaEm=LocalDateTime.now(); r.entradaUsuarioId=user.getUserId(); r.entradaUsuarioNome=user.getNome(); r.forcado=forcado; r.observacao=obs; r.persistAndFlush(); return r;
    }
    private void fechar(OsFluxoRegistro r) { r.saidaEm=LocalDateTime.now();r.saidaUsuarioId=user.getUserId();r.saidaUsuarioNome=user.getNome(); }
    private void motivo(String motivo) { if(motivo==null||motivo.isBlank()||motivo.length()>2000) throw new BadRequestException("Informe uma justificativa de até 2000 caracteres."); }
    private void anular(OsFluxoRegistro r,String motivo) { r.anulado=true;r.anuladoEm=LocalDateTime.now();r.anuladoUsuarioNome=user.getNome();r.anuladoMotivo=motivo; }
    private void evento(Long osId,Long etapaId,String acao,boolean sucesso,String mensagem,BiparRequest req) {
        OsFluxoEvento e=new OsFluxoEvento();e.tenantId=tenants.currentTenantIdStr();e.osId=osId;e.etapaId=etapaId;e.acao=acao;e.sucesso=sucesso;
        e.mensagem=mensagem;e.usuarioId=user.getUserId();e.usuarioNome=user.getNome();e.ocorridoEm=LocalDateTime.now();
        if(req!=null){e.codigoOsLido=limitar(req.osCodigo);e.codigoEtapaLido=limitar(req.etapaCodigo);e.origem=limitar(req.origem);e.estacao=limitar(req.estacao);} e.persist();
    }
    private String limitar(String valor){return valor==null?null:valor.substring(0,Math.min(255,valor.length()));}
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void registrarRejeicao(BiparRequest req,String mensagem) {
        Long osId=null;try {osId=osCodigo(req.osCodigo).id;}catch(Exception ignored){}
        evento(osId,null,"REJEICAO",false,mensagem==null?"Leitura rejeitada":mensagem.substring(0,Math.min(2000,mensagem.length())),req);
    }
    public Map<String,Object> detalhe(Long id) {
        OS os=tenants.requireOS(id); List<OsFluxoRegistro> validos=registros(id);
        List<OsFluxoRegistro> todos=OsFluxoRegistro.list("osId = ?1 order by sequencia, id",id);
        List<OsFluxoEvento> eventos=OsFluxoEvento.list("osId = ?1 order by ocorridoEm desc, id desc",id);
        List<Map<String,Object>> statuses=etapas().stream().map(e->{
            List<OsFluxoRegistro> rs=validos.stream().filter(r->r.etapaId.equals(e.id)).toList();
            long total=rs.stream().mapToLong(r->seg(r.entradaEm,r.saidaEm==null?LocalDateTime.now():r.saidaEm)).sum();
            return map("etapa",e,"status",rs.isEmpty()?"PENDENTE":aberto(rs)!=null?"EM_ANDAMENTO":"CONCLUIDA","passagens",rs.size(),"totalSeg",total,
                    "primeiraEntradaEm",rs.isEmpty()?null:rs.get(0).entradaEm,"ultimaSaidaEm",rs.isEmpty()?null:rs.get(rs.size()-1).saidaEm,
                    "estourado",e.metaMinutos!=null&&total>e.metaMinutos*60L);
        }).toList();
        LocalDateTime inicio=validos.isEmpty()?null:validos.get(0).entradaEm;
        LocalDateTime fim="CONCLUIDO".equals(situacao(validos))?validos.get(validos.size()-1).saidaEm:null;
        long ciclo=seg(inicio,fim==null?LocalDateTime.now():fim);
        long trabalho=validos.stream().mapToLong(r->seg(r.entradaEm,r.saidaEm==null?LocalDateTime.now():r.saidaEm)).sum();
        return map("os",resumoOs(os,validos),"etapas",statuses,"registros",todos.stream().map(this::registroDto).toList(),"eventos",eventos.stream().map(this::eventoDto).toList(),
                "resumo",map("inicioEm",inicio,"fimEm",fim,"cicloSeg",ciclo,"tempoEmEtapasSeg",trabalho,"tempoEsperaSeg",Math.max(0,ciclo-trabalho),
                        "eficienciaPct",ciclo==0?null:100.0*trabalho/ciclo,"etapasConcluidas",concluidas(validos),"totalEtapas",etapas().size(),
                        "forcados",todos.stream().filter(r->Boolean.TRUE.equals(r.forcado)).count(),"anulados",todos.stream().filter(r->Boolean.TRUE.equals(r.anulado)).count(),
                        "rejeicoes",eventos.stream().filter(e->!Boolean.TRUE.equals(e.sucesso)).count()),
                "proximaEtapa",proxima(validos),"podeGerir",podeGerir(),"geradoEm",LocalDateTime.now());
    }
    private Map<String,Object> eventoDto(OsFluxoEvento e) {
        OsFluxoEtapa etapa=e.etapaId==null?null:etapa(e.etapaId);
        return map("id",e.id,"osId",e.osId,"etapaId",e.etapaId,"etapaNome",etapa==null?null:etapa.nome,"etapaCor",etapa==null?null:etapa.cor,
                "acao",e.acao,"sucesso",e.sucesso,"mensagem",e.mensagem,"codigoOsLido",e.codigoOsLido,"codigoEtapaLido",e.codigoEtapaLido,
                "origem",e.origem,"estacao",e.estacao,"usuarioNome",e.usuarioNome,"ocorridoEm",e.ocorridoEm);
    }
    @Transactional
    public Map<String,Object> estornar(Long id,String motivo) {
        exigirGestao();motivo(motivo);bloquear(id); List<OsFluxoRegistro> rs=registros(id);
        if(rs.isEmpty()) throw new BadRequestException("Não há registros para estornar.");
        OsFluxoRegistro r=rs.get(rs.size()-1);anular(r,motivo);evento(id,r.etapaId,"ESTORNO",true,motivo,null);return detalhe(id);
    }
    public Map<String,Object> simular(Long id,AjusteRequest req) {
        exigirGestao(); tenants.requireOS(id); if(req==null||!Set.of("ZERAR","POSICIONAR").contains(Objects.toString(req.tipo,""))) throw new BadRequestException("Ajuste inválido.");
        OsFluxoEtapa destino="ZERAR".equals(req.tipo)?null:etapa(req.etapaId);
        if(destino!=null&&!Set.of("EM_ETAPA","CONCLUIDA").contains(Objects.toString(req.situacao,""))) throw new BadRequestException("Situação inválida.");
        List<OsFluxoRegistro> rs=registros(id);List<Map<String,Object>> efeitos=new ArrayList<>();
        for(OsFluxoRegistro r:rs) efeitos.add(map("tipo","ANULAR","etapaId",r.etapaId,"etapaNome",etapa(r.etapaId).nome,"registroId",r.id,"descricao","Anular passagem anterior"));
        if(destino!=null) {
            for(OsFluxoEtapa e:etapas()) if(e.id.equals(destino.id)||(req.preencherIntermediarias&&e.ordem<destino.ordem))
                efeitos.add(map("tipo",e.id.equals(destino.id)&&"EM_ETAPA".equals(req.situacao)?"CRIAR_ABERTO":"CRIAR_CONCLUIDO", "etapaId",e.id,"etapaNome",e.nome,"etapaCor",e.cor,"etapaOrdem",e.ordem,"descricao","Registrar posicionamento justificado"));
        }
        OsFluxoEtapa atual=rs.isEmpty()?null:etapa(rs.get(rs.size()-1).etapaId);
        String direcao=destino==null?"ZERAR":atual==null||destino.ordem>atual.ordem?"AVANCO":destino.ordem<atual.ordem?"RETROCESSO":"REPOSICIONAR";
        return map("os",resumoOs(tenants.requireOS(id),rs),"direcao",direcao,"situacaoAtual",situacao(rs),"etapaAtual",atual,
                "situacaoFinal",destino==null?null:"EM_ETAPA".equals(req.situacao)?"EM_ETAPA":destino.ordem.equals(etapas().get(etapas().size()-1).ordem)?"CONCLUIDO":"AGUARDANDO",
                "etapaFinal",destino,"efeitos",efeitos,"anulados",rs.size(),"criados",efeitos.size()-rs.size(),"etapasPuladas",destino==null||req.preencherIntermediarias?0:destino.ordem-1);
    }
    @Transactional
    public Map<String,Object> ajustar(Long id,AjusteRequest req) {
        bloquear(id);simular(id,req);motivo(req.motivo);List<OsFluxoRegistro> rs=registros(id);
        rs.forEach(r->anular(r,req.motivo));
        if(!"ZERAR".equals(req.tipo)) {
            OsFluxoEtapa destino=etapa(req.etapaId); int seq=rs.size()+1;
            for(OsFluxoEtapa e:etapas()) if(e.id.equals(destino.id)||(req.preencherIntermediarias&&e.ordem<destino.ordem)) {
                OsFluxoRegistro r=novo(id,e.id,seq++,true,req.motivo); if(!e.id.equals(destino.id)||"CONCLUIDA".equals(req.situacao)) fechar(r);
            }
        }
        evento(id,req.etapaId,"AJUSTE",true,req.motivo,null);return detalhe(id);
    }
    public Map<String,Object> listar(String situacao,Long etapaId,String q,int page,int size) {
        int p=Math.max(0,page),s=Math.max(1,Math.min(100,size)); List<Map<String,Object>> list=new ArrayList<>();
        for(OS o:pesquisar(q)) {
            List<OsFluxoRegistro> rs=registros(o.id);OsFluxoRegistro r=aberto(rs);OsFluxoEtapa e=r==null?proxima(rs):etapa(r.etapaId);
            if(situacao!=null&&!situacao.isBlank()&&!situacao.equals(situacao(rs))) continue;
            if(etapaId!=null&&(e==null||!etapaId.equals(e.id))) continue;
            LocalDateTime desde=r!=null?r.entradaEm:rs.isEmpty()?null:rs.get(rs.size()-1).saidaEm;
            list.add(map("os",resumoOs(o,rs),"etapa",e,"etapasConcluidas",concluidas(rs),"totalEtapas",etapas().size(),"desdeSeg",seg(desde,LocalDateTime.now()),"inicioFluxoEm",rs.isEmpty()?null:rs.get(0).entradaEm));
        }
        int from=(int)Math.min((long)p*s,list.size());return map("items",list.subList(from,Math.min(from+s,list.size())),"total",list.size(),"page",p,"size",s);
    }
    private List<OS> pesquisar(String q) {
        if(q==null||q.isBlank()) return OS.list("isActive = true order by id desc");
        return OS.list("isActive = true and (lower(clienteNome) like ?1 or lower(partNumber) like ?1 or lower(serialNumber) like ?1 or lower(numOsOriginal) like ?1 or str(id) = ?2 or str(idOs) = ?2) order by id desc",
                "%"+q.trim().toLowerCase(Locale.ROOT)+"%",q.trim().replaceFirst("(?i)^OS",""));
    }
    public List<Map<String,Object>> sugestoes(String q,int limite) {
        if(q==null||q.trim().length()<2) return List.of();
        return pesquisar(q).stream().limit(Math.max(1,Math.min(25,limite))).map(o->{List<OsFluxoRegistro> rs=registros(o.id);
            return map("os",resumoOs(o,rs),"etapa",aberto(rs)==null?proxima(rs):etapa(aberto(rs).etapaId),"dtAbertura",o.dtAbertura,"tipoServico",o.tipoServico,"marcasMatricula",o.marcasMatricula,"campoEncontrado","CODIGO");}).toList();
    }
    public List<Map<String,Object>> fila(Set<Long> ids,int limite,String terminal) {
        estacoes.exigirPareada(terminal);List<Map<String,Object>> fila=new ArrayList<>();
        for(OS o:pesquisar(null)) {
            List<OsFluxoRegistro> rs=registros(o.id);OsFluxoRegistro r=aberto(rs);OsFluxoEtapa e=r==null?proxima(rs):etapa(r.etapaId);
            if(e==null||(!ids.isEmpty()&&!ids.contains(e.id))||!estacoes.atende(terminal,e.setor)) continue;
            LocalDateTime desde=r!=null?r.entradaEm:rs.isEmpty()?o.createdAt:rs.get(rs.size()-1).saidaEm;
            fila.add(map("os",resumoOs(o,rs),"etapa",e,"acao",r==null?"ENTRADA":"SAIDA","dtAbertura",o.dtAbertura,"tipoServico",o.tipoServico,"marcasMatricula",o.marcasMatricula,"desdeSegundos",seg(desde,LocalDateTime.now())));
            if(fila.size()>=Math.max(1,Math.min(200,limite))) break;
        }return fila;
    }
    public List<Map<String,Object>> eventos(LocalDate de,LocalDate ate,Boolean sucesso,int limite) {
        return eventosPeriodo(de,ate).stream().filter(e->sucesso==null||sucesso.equals(e.sucesso)).limit(Math.max(1,Math.min(2000,limite))).map(this::eventoDto).toList();
    }
    private List<OsFluxoEvento> eventosPeriodo(LocalDate de,LocalDate ate) {
        LocalDate inicio=de==null?LocalDate.now().minusDays(30):de,fim=ate==null?LocalDate.now():ate;
        if(inicio.isAfter(fim)) throw new BadRequestException("Intervalo inválido.");
        return OsFluxoEvento.list("ocorridoEm >= ?1 and ocorridoEm < ?2 order by ocorridoEm desc, id desc",inicio.atStartOfDay(),fim.plusDays(1).atStartOfDay());
    }
    private boolean periodo(LocalDateTime t,LocalDate de,LocalDate ate) {return t!=null&&!t.toLocalDate().isBefore(de)&&!t.toLocalDate().isAfter(ate);}
    private Double media(List<Long> v) {return v.isEmpty()?null:v.stream().mapToLong(Long::longValue).average().orElse(0);}
    private Long percentil(List<Long> v,double p) {return v.isEmpty()?null:v.stream().sorted().toList().get(Math.max(0,(int)Math.ceil(v.size()*p)-1));}
    public Map<String,Object> dashboard(LocalDate de,LocalDate ate) {
        LocalDate inicio=de==null?LocalDate.now().minusDays(30):de,fim=ate==null?LocalDate.now():ate;
        if(inicio.isAfter(fim)||Duration.between(inicio.atStartOfDay(),fim.atStartOfDay()).toDays()>366) throw new BadRequestException("Selecione um intervalo de até 366 dias.");
        List<OsFluxoRegistro> todos=OsFluxoRegistro.list("anulado = false order by osId, sequencia, id");
        Map<Long,List<OsFluxoRegistro>> porOs=new LinkedHashMap<>();todos.forEach(r->porOs.computeIfAbsent(r.osId,k->new ArrayList<>()).add(r));
        List<OsFluxoEvento> ev=eventosPeriodo(inicio,fim);
        List<Map<String,Object>> abertos=new ArrayList<>();List<Long> ciclos=new ArrayList<>();long iniciadas=0,concluidas=0;
        for(var entry:porOs.entrySet()) {
            OS os=OS.findById(entry.getKey());if(os==null||!Boolean.TRUE.equals(os.isActive))continue;
            List<OsFluxoRegistro> rs=entry.getValue();OsFluxoRegistro r=aberto(rs);OsFluxoEtapa e=r!=null?etapa(r.etapaId):proxima(rs);
            if(periodo(rs.get(0).entradaEm,inicio,fim))iniciadas++;
            if(e==null) {LocalDateTime saida=rs.get(rs.size()-1).saidaEm;if(periodo(saida,inicio,fim)){concluidas++;ciclos.add(seg(rs.get(0).entradaEm,saida));}}
            else {LocalDateTime desde=r!=null?r.entradaEm:rs.get(rs.size()-1).saidaEm;long tempo=seg(desde,LocalDateTime.now());
                abertos.add(map("tipo",r!=null?"EM_ETAPA":"AGUARDANDO","registroId",r==null?null:r.id,"os",resumoOs(os,rs),"etapa",e,"desde",desde,
                        "usuarioNome",r==null?null:r.entradaUsuarioNome,"decorridoSeg",tempo,"metaMinutos",e.metaMinutos,"estourado",r!=null&&e.metaMinutos!=null&&tempo>e.metaMinutos*60L));}
        }
        List<OsFluxoRegistro> fechados=todos.stream().filter(r->periodo(r.saidaEm,inicio,fim)).toList();
        List<Map<String,Object>> metricas=etapas().stream().map(e->{
            List<OsFluxoRegistro> feitos=fechados.stream().filter(r->r.etapaId.equals(e.id)).toList();List<Long> tempos=feitos.stream().map(r->seg(r.entradaEm,r.saidaEm)).toList();
            List<Map<String,Object>> ativos=abertos.stream().filter(a->((OsFluxoEtapa)a.get("etapa")).id.equals(e.id)).toList();
            List<Long> esperas=new ArrayList<>();for(OsFluxoRegistro r:feitos){List<OsFluxoRegistro> rs=porOs.get(r.osId);int idx=rs.indexOf(r);if(idx>0)esperas.add(seg(rs.get(idx-1).saidaEm,r.entradaEm));}
            return map("etapa",e,"emAndamento",ativos.stream().filter(a->"EM_ETAPA".equals(a.get("tipo"))).count(),"aguardando",ativos.stream().filter(a->"AGUARDANDO".equals(a.get("tipo"))).count(),"concluidas",feitos.size(),
                    "mediaSeg",media(tempos),"medianaSeg",percentil(tempos,.5),"p90Seg",percentil(tempos,.9),"minSeg",tempos.stream().min(Long::compare).orElse(null),"maxSeg",tempos.stream().max(Long::compare).orElse(null),
                    "esperaMediaSeg",media(esperas),"noPrazoPct",e.metaMinutos==null||tempos.isEmpty()?null:100.0*tempos.stream().filter(t->t<=e.metaMinutos*60L).count()/tempos.size(),
                    "maisAntigoAbertoSeg",ativos.stream().filter(a->"EM_ETAPA".equals(a.get("tipo"))).map(a->(Long)a.get("decorridoSeg")).max(Long::compare).orElse(null),"estouradosAbertos",ativos.stream().filter(a->Boolean.TRUE.equals(a.get("estourado"))).count());
        }).toList();
        List<Map<String,Object>> throughput=new ArrayList<>();
        for(LocalDate dia=inicio;!dia.isAfter(fim);dia=dia.plusDays(1)){LocalDate d=dia;long terminadas=porOs.values().stream().filter(rs->proxima(rs)==null&&aberto(rs)==null&&d.equals(rs.get(rs.size()-1).saidaEm.toLocalDate())).count();
            throughput.add(map("dia",d,"entradas",todos.stream().filter(r->d.equals(r.entradaEm.toLocalDate())).count(),"saidas",fechados.stream().filter(r->d.equals(r.saidaEm.toLocalDate())).count(),"concluidas",terminadas));}
        Map<String,List<OsFluxoEvento>> usuarios=new LinkedHashMap<>();ev.stream().filter(e->Boolean.TRUE.equals(e.sucesso)&&Set.of("ENTRADA","SAIDA").contains(e.acao)).forEach(e->usuarios.computeIfAbsent(Objects.toString(e.usuarioNome,"Sistema"),k->new ArrayList<>()).add(e));
        List<Map<String,Object>> porUsuario=usuarios.entrySet().stream().map(en->map("nome",en.getKey(),"usuarioId",en.getValue().get(0).usuarioId,
                "entradas",en.getValue().stream().filter(e->"ENTRADA".equals(e.acao)).count(),"saidas",en.getValue().stream().filter(e->"SAIDA".equals(e.acao)).count(),
                "mediaEtapaSeg",media(fechados.stream().filter(r->Objects.equals(r.saidaUsuarioNome,en.getKey())).map(r->seg(r.entradaEm,r.saidaEm)).toList()))).toList();
        long leituras=ev.stream().filter(e->Set.of("ENTRADA","SAIDA","REJEICAO").contains(e.acao)).count(),rejeicoes=ev.stream().filter(e->!Boolean.TRUE.equals(e.sucesso)).count();
        List<OsFluxoRegistro> comMeta=fechados.stream().filter(r->etapa(r.etapaId).metaMinutos!=null).toList();
        return map("geradoEm",LocalDateTime.now(),"de",inicio,"ate",fim,"kpis",map("osEmFluxo",abertos.size(),"osEmEtapa",abertos.stream().filter(a->"EM_ETAPA".equals(a.get("tipo"))).count(),
                "osAguardando",abertos.stream().filter(a->"AGUARDANDO".equals(a.get("tipo"))).count(),"iniciadasPeriodo",iniciadas,"concluidasPeriodo",concluidas,
                "cicloMedioSeg",media(ciclos),"cicloMedianoSeg",percentil(ciclos,.5),"cicloP90Seg",percentil(ciclos,.9),"passagensConcluidas",fechados.size(),
                "bipagens",leituras,"rejeicoes",rejeicoes,"taxaRejeicaoPct",leituras==0?null:100.0*rejeicoes/leituras,"noPrazoPct",comMeta.isEmpty()?null:100.0*comMeta.stream().filter(r->seg(r.entradaEm,r.saidaEm)<=etapa(r.etapaId).metaMinutos*60L).count()/comMeta.size(),
                "forcados",fechados.stream().filter(r->Boolean.TRUE.equals(r.forcado)).count(),"estornos",ev.stream().filter(e->"ESTORNO".equals(e.acao)).count()),
                "etapas",metricas,"abertos",abertos,"throughput",throughput,"porUsuario",porUsuario,"ultimosEventos",ev.stream().limit(50).map(this::eventoDto).toList());
    }
}
