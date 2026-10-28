package com.aerosuite.service;
import com.aerosuite.domain.*;
import com.aerosuite.security.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import java.math.*;
import java.time.*;
import java.util.*;
import static com.aerosuite.service.OperacaoRegras.*;
@ApplicationScoped
public class OperacaoService {
 @Inject TenantDataAccess tenant;
 @Inject InternalUserContext user;
 @Inject OperacaoReservaGuard reservas;
 @Inject EstoqueService estoque;
 @Inject ConformidadeEnforcementService conformidade;
 public void acesso(String modulo){
  if(!ESTADOS.containsKey(modulo))throw new NotFoundException();
  if(!modulo.equals("custos")&&!user.getFuncionalidadeCodigos().contains("CENTRAL_OPERACIONAL"))throw new ForbiddenException("Sem permissão para a central operacional.");
  if(modulo.equals("custos")&&!user.getFuncionalidadeCodigos().contains("CUSTOS_OPERACIONAIS"))throw new ForbiddenException("Sem permissão para resultados financeiros.");
 }
 public List<OperacaoRegistro> listar(String modulo,Long osId){
  acesso(modulo);
  return osId==null?OperacaoRegistro.find("modulo = ?1 order by updatedAt desc",modulo).range(0,499).list():OperacaoRegistro.find("modulo = ?1 and osId = ?2 order by updatedAt desc",modulo,tenant.requireOS(osId).id).range(0,499).list();
 }
 public List<OperacaoEvento> eventos(Long id){OperacaoRegistro r=require(id);acesso(r.modulo);return OperacaoEvento.find("registroId = ?1 order by id desc",id).range(0,99).list();}
 private OperacaoRegistro require(Long id){OperacaoRegistro r=OperacaoRegistro.findById(id);if(r==null||!tenant.matchesTenant(r.tenantId))throw new NotFoundException();return r;}
 private String text(String s,int max){if(s==null)return null;s=s.trim();if(s.length()>max)throw new BadRequestException("Texto acima do limite de "+max+" caracteres.");return s;}
 @Transactional public OperacaoRegistro salvar(Long id,OperacaoRegistro b){
  if(b==null)throw new BadRequestException("Informe os dados.");acesso(b.modulo);validar(b.modulo,b.status,b.quantidade,b.valor);
  OperacaoRegistro r=id==null?new OperacaoRegistro():require(id);
  if(id!=null){
   if(!Objects.equals(r.version,b.version))throw new ClientErrorException("Este registro foi alterado. Atualize antes de salvar.",409);
   if(!r.modulo.equals(b.modulo)||!Objects.equals(r.osId,b.osId)||(!Objects.equals(r.itemId,b.itemId)&&!(r.modulo.equals("materiais")&&r.status.equals("PENDENTE")&&r.itemId==null))||!Objects.equals(r.ferramentaId,b.ferramentaId))throw new BadRequestException("Os vínculos do registro não podem ser alterados.");
   if(encerrado(r.status)&&!(r.modulo.equals("custos")&&b.status.equals("CANCELADO")&&b.observacao!=null&&!b.observacao.isBlank()))throw new BadRequestException("Registro encerrado. Crie um novo registro para preservar o histórico.");
  }
  if(b.modulo.equals("planejamento")) Tenant.find("id = ?1",tenant.currentTenantId()).withLock(LockModeType.PESSIMISTIC_WRITE).firstResult();
  String anterior=r.status;
  OS os=b.osId==null?null:tenant.requireOS(b.osId);
  if(os!=null&&(os.dataFechamento!=null||Boolean.FALSE.equals(os.isActive))&&!Set.of("retornos","custos").contains(b.modulo)&&!Set.of("CANCELADO","DEVOLVIDO").contains(b.status))throw new BadRequestException("A OS está encerrada ou inativa.");
  if(Set.of("impedimentos","materiais","compras","prontidao","custos","planejamento","retornos").contains(b.modulo)&&os==null)throw new BadRequestException("Selecione uma OS.");
  if(b.titulo==null||b.titulo.isBlank())throw new BadRequestException("Informe um título.");
  if(Set.of("impedimentos","compras","planejamento","ferramentas").contains(b.modulo)&&(b.responsavel==null||b.responsavel.isBlank()||b.prazo==null))throw new BadRequestException("Informe responsável e prazo.");
  if(b.modulo.equals("impedimentos")&&(b.proximaAcao==null||b.proximaAcao.isBlank()))throw new BadRequestException("Descreva a próxima ação.");
  if(b.modulo.equals("compras")){
   if(b.quantidade==null||b.referencia==null||b.referencia.isBlank())throw new BadRequestException("Informe PN e quantidade.");
   if(b.status.equals("PEDIDO")&&(b.recurso==null||b.recurso.isBlank()))throw new BadRequestException("Informe o fornecedor.");
   if(b.status.equals("RECEBIDO")&&(b.observacao==null||b.observacao.isBlank()))throw new BadRequestException("Informe a referência do recebimento. A entrada física continua no módulo de estoque.");
   if(b.origemId!=null){OperacaoRegistro origem=require(b.origemId);if(!origem.modulo.equals("materiais")||!Objects.equals(origem.osId,b.osId))throw new BadRequestException("Demanda de origem inválida.");}
  }
  if(b.modulo.equals("materiais")){
   if(b.quantidade==null)throw new BadRequestException("Informe a quantidade.");
   if(id==null&&!Set.of("PENDENTE","RESERVADO").contains(b.status))throw new BadRequestException("Comece por demanda ou reserva.");
   if(b.status.equals("CONSUMIDO"))throw new BadRequestException("Use a ação consumir para registrar a saída física.");
   if(b.itemId!=null){
    ItemEstoque item=ItemEstoque.find("id = ?1",b.itemId).withLock(LockModeType.PESSIMISTIC_WRITE).firstResult();
    if(item==null||!tenant.matchesTenant(item.tenantId))throw new NotFoundException("Item não encontrado.");
    if(reservado(b.status)){
     if(item.status!=ItemEstoque.StatusItemEstoque.DISPONIVEL||Boolean.FALSE.equals(item.isActive)||(item.dataValidade!=null&&item.dataValidade.isBefore(LocalDate.now())))throw new BadRequestException("Item indisponível ou vencido.");
     if(b.quantidade.subtract(zero(r.quantidadeConsumida)).compareTo(disponivel(item.quantidade,reservas.reservado(item.id,id)))>0)throw new BadRequestException("Quantidade maior que o saldo livre.");
    }
    b.referencia=item.partNumber;
   }else if(reservado(b.status))throw new BadRequestException("Selecione um item/lote para reservar.");
   if(b.quantidade.compareTo(zero(r.quantidadeConsumida))<0)throw new BadRequestException("Quantidade inferior ao consumo já registrado.");
  }
  if(b.modulo.equals("ferramentas")){
   if(b.ferramentaId==null)throw new BadRequestException("Selecione o instrumento.");
   ConformidadeCalibracaoFerramenta f=ConformidadeCalibracaoFerramenta.find("id = ?1",b.ferramentaId).withLock(LockModeType.PESSIMISTIC_WRITE).firstResult();
   if(f==null||!tenant.matchesTenant(f.tenantId))throw new NotFoundException();
   if(b.status.equals("RETIRADO")){
    if(!Boolean.TRUE.equals(f.ativo)||f.dataProximaCalibracao==null||f.dataProximaCalibracao.isBefore(LocalDate.now()))throw new BadRequestException("Instrumento inativo ou sem calibração válida.");
    List<OperacaoRegistro> usos=OperacaoRegistro.find("modulo = 'ferramentas' and ferramentaId = ?1 and status = 'RETIRADO'",f.id).list();
    if(usos.stream().anyMatch(x->!Objects.equals(x.id,id)))throw new BadRequestException("Instrumento já retirado.");
   }else if(id==null)throw new BadRequestException("Registre a retirada antes da devolução.");
   b.referencia=f.identificador;
  }
  if(b.modulo.equals("prontidao")&&b.status.equals("CONFERIDO")&&(b.observacao==null||b.observacao.isBlank()))throw new BadRequestException("Registre a evidência da conferência.");
  if(b.modulo.equals("custos")&&b.valor==null)throw new BadRequestException("Informe o valor do custo.");
  if(b.modulo.equals("planejamento")){
   if(b.inicio==null||b.fim==null||b.fim.isBefore(b.inicio)||b.recurso==null||b.recurso.isBlank()||zero(b.horas).signum()<=0||zero(b.capacidade).signum()<=0)throw new BadRequestException("Informe recurso, período válido, horas de trabalho e capacidade diária.");
   b.recurso=b.recurso.trim().toUpperCase(Locale.ROOT);
   if(b.tipo!=null&&b.tipo.equals("TECNICO")){
    Usuario tecnico=b.tecnicoId==null?null:Usuario.find("id = ?1 and orgTenantId = ?2",b.tecnicoId,tenant.currentTenantId()).firstResult();
    if(tecnico==null||!Boolean.TRUE.equals(tecnico.ativo))throw new BadRequestException("Selecione um técnico ativo desta empresa.");
    conformidade.assertTreinamentoObrigatorioAtendido(tecnico.id,tecnico.perfil==null?null:tecnico.perfil.getCodigo());
    b.recurso="TECNICO #"+tecnico.id+" • "+tecnico.nome;
   }
   List<OperacaoRegistro> outros=OperacaoRegistro.find("modulo = 'planejamento' and recurso = ?1 and status in ('PLANEJADO','CONFIRMADO') and inicio <= ?2 and fim >= ?3",b.recurso,b.fim,b.inicio).list();
   long dias=java.time.temporal.ChronoUnit.DAYS.between(b.inicio,b.fim)+1;
   if(dias>366||b.capacidade.compareTo(BigDecimal.valueOf(24))>0)throw new BadRequestException("Planeje até 366 dias, com capacidade diária de até 24 horas.");
   if(!encerrado(b.status))for(LocalDate dia=b.inicio;!dia.isAfter(b.fim);dia=dia.plusDays(1)){
    BigDecimal usadas=b.horas.divide(BigDecimal.valueOf(dias),6,RoundingMode.HALF_UP),limite=b.capacidade;
    for(OperacaoRegistro x:outros){if(Objects.equals(x.id,id)||dia.isBefore(x.inicio)||dia.isAfter(x.fim))continue;
     long duracao=java.time.temporal.ChronoUnit.DAYS.between(x.inicio,x.fim)+1;
     usadas=usadas.add(zero(x.horas).divide(BigDecimal.valueOf(duracao),6,RoundingMode.HALF_UP));limite=limite.min(x.capacidade);
    }
    if(usadas.compareTo(limite)>0)throw new BadRequestException("Capacidade do recurso excedida em "+dia+". Replaneje a carga.");
   }
  }
  if(b.modulo.equals("retornos")&&b.origemId!=null){OS origem=tenant.requireOS(b.origemId);if(os==null||Objects.equals(origem.id,os.id)||os.partNumber==null||os.serialNumber==null||!Objects.equals(origem.partNumber,os.partNumber)||!Objects.equals(origem.serialNumber,os.serialNumber))throw new BadRequestException("A OS anterior deve ser do mesmo PN/SN e diferente da OS atual.");}
  r.tenantId=tenant.currentTenantIdStr();r.modulo=b.modulo;r.osId=b.osId;r.itemId=b.itemId;r.ferramentaId=b.ferramentaId;r.origemId=b.origemId;r.tecnicoId=b.tecnicoId;
  r.titulo=text(b.titulo,180);r.status=b.status;r.tipo=text(b.tipo,40);r.responsavel=text(b.responsavel,180);r.referencia=text(b.referencia,180);r.recurso=text(b.recurso,180);
  r.proximaAcao=text(b.proximaAcao,1000);r.observacao=text(b.observacao,10000);r.prazo=b.prazo;r.inicio=b.inicio;r.fim=b.fim;
  r.quantidade=b.quantidade;r.valor=b.valor;r.horas=b.horas;r.capacidade=b.capacidade;
  if(id==null)r.createdBy=user.getUserId();if(encerrado(r.status))r.closedAt=LocalDateTime.now();r.persistAndFlush();
  evento(r,(id==null?"Criado":anterior+" → "+r.status)+": "+r.titulo);return r;
 }
 private void evento(OperacaoRegistro r,String descricao){OperacaoEvento e=new OperacaoEvento();e.tenantId=r.tenantId;e.registroId=r.id;e.descricao=descricao;e.autor=user.getNome();e.createdAt=LocalDateTime.now();e.persist();}
 @Transactional public OperacaoRegistro consumir(Long id,Long version){
  OperacaoRegistro r=require(id);acesso(r.modulo);if(!Objects.equals(version,r.version))throw new ClientErrorException("Registro alterado. Atualize.",409);
  if(!r.modulo.equals("materiais")||!reservado(r.status))throw new BadRequestException("A reserva não está disponível para consumo.");
  estoque.saidaEstoque(r.itemId,r.osId,r.quantidade.subtract(zero(r.quantidadeConsumida)),user.getUserId().longValue(),user.getNome(),"Consumo da reserva operacional #"+r.id);
  r.flush();return r;
 }
 public Map<String,Object> contexto(String q){
  String termo=q==null?"":q.trim().toLowerCase(Locale.ROOT);if(termo.length()>100)termo=termo.substring(0,100);String like="%"+termo+"%";
  List<OS> oss=OS.find("isActive = true and (lower(clienteNome) like ?1 or lower(partNumber) like ?1 or lower(serialNumber) like ?1 or str(idOs) like ?1) order by id desc",like).range(0,99).list();
  List<ItemEstoque> itens=ItemEstoque.find("isActive = true and status = ?1 and (lower(partNumber) like ?2 or lower(codigoRastreio) like ?2) order by partNumber",ItemEstoque.StatusItemEstoque.DISPONIVEL,like).range(0,99).list();
  Map<Long,BigDecimal> comprometido=new HashMap<>();
  if(!itens.isEmpty()){
   List<OperacaoRegistro> reservadas=OperacaoRegistro.find("modulo = 'materiais' and itemId in ?1 and status in ('RESERVADO','SEPARADO')",itens.stream().map(i->i.id).toList()).list();
   for(OperacaoRegistro reserva:reservadas)comprometido.merge(reserva.itemId,reserva.quantidade.subtract(zero(reserva.quantidadeConsumida)),BigDecimal::add);
  }
  List<ConformidadeCalibracaoFerramenta> fs=ConformidadeCalibracaoFerramenta.find("ativo = true order by identificador").range(0,99).list();
  return Map.of("os",oss.stream().map(o->Map.of("id",o.id,"codigo",o.idOs,"cliente",Objects.toString(o.clienteNome,""),"pn",Objects.toString(o.partNumber,""),"sn",Objects.toString(o.serialNumber,""))).toList(),
   "itens",itens.stream().map(i->Map.of("id",i.id,"pn",i.partNumber,"rastreio",i.codigoRastreio,"lote",i.lote==null?"—":i.lote.codigoLote,"fisico",zero(i.quantidade),"reservado",comprometido.getOrDefault(i.id,BigDecimal.ZERO),"livre",disponivel(i.quantidade,comprometido.getOrDefault(i.id,BigDecimal.ZERO)))).toList(),
   "tecnicos",Usuario.<Usuario>find("orgTenantId = ?1 and ativo = true order by nome",tenant.currentTenantId()).range(0,199).list().stream().map(u->Map.of("id",u.id,"nome",Objects.toString(u.nome,""))).toList(),
   "ferramentas",fs.stream().map(f->Map.of("id",f.id,"identificador",f.identificador,"descricao",f.descricao,"validade",Objects.toString(f.dataProximaCalibracao,""))).toList(),"operacoesPermitidas",user.getFuncionalidadeCodigos().contains("CENTRAL_OPERACIONAL"),"saidaPermitida",user.getFuncionalidadeCodigos().contains("ESTOQUE_SAIDA"),"custosPermitidos",user.getFuncionalidadeCodigos().contains("CUSTOS_OPERACIONAIS"));
 }
 public Map<String,Object> resumo(Long osId){
  OS o=tenant.requireOS(osId);List<OperacaoRegistro> rs=OperacaoRegistro.find("osId = ?1",osId).list();
  long impedimentos=rs.stream().filter(r->r.modulo.equals("impedimentos")&&!encerrado(r.status)).count();
  long materiais=rs.stream().filter(r->r.modulo.equals("materiais")&&r.status.equals("PENDENTE")).count();
  List<OS> historico=o.partNumber==null||o.partNumber.isBlank()||o.serialNumber==null||o.serialNumber.isBlank()?List.of():OS.find("partNumber = ?1 and serialNumber = ?2 and id <> ?3 order by id desc",o.partNumber,o.serialNumber,o.id).range(0,49).list();
  BigDecimal horas=OsJobCardApontamento.<OsJobCardApontamento>find("osId = ?1",osId).list().stream().map(a->zero(a.horas)).reduce(BigDecimal.ZERO,BigDecimal::add);
  Map<String,Object> out=new LinkedHashMap<>();out.put("impedimentos",impedimentos);out.put("materiaisPendentes",materiais);out.put("horasApontadas",horas);
  out.put("checagens",List.of(Map.of("nome","Sem impedimentos abertos","ok",impedimentos==0),Map.of("nome","Sem demandas de material pendentes","ok",materiais==0),Map.of("nome","Apontamentos registrados","ok",horas.signum()>0),Map.of("nome","Dado técnico vinculado","ok",OsTarefaDadoTecnico.count("osId = ?1",osId)>0),Map.of("nome","CRS registrado","ok",o.crsEmitidoEm!=null)));
  out.put("historico",historico.stream().map(h->Map.of("id",h.id,"codigo",h.idOs,"abertura",Objects.toString(h.dtAbertura,""),"servico",Objects.toString(h.tipoServico,""),"fechamento",Objects.toString(h.dataFechamento,""))).toList());
  if(user.getFuncionalidadeCodigos().contains("CUSTOS_OPERACIONAIS")){
   BigDecimal manual=rs.stream().filter(r->r.modulo.equals("custos")&&r.status.equals("REALIZADO")).map(r->zero(r.valor)).reduce(BigDecimal.ZERO,BigDecimal::add);
   BigDecimal previsto=rs.stream().filter(r->r.modulo.equals("custos")&&r.status.equals("PREVISTO")).map(r->zero(r.valor)).reduce(BigDecimal.ZERO,BigDecimal::add);
   List<MovimentacaoEstoque> movs=MovimentacaoEstoque.find("osId = ?1 and tipoMovimentacao = ?2",osId,MovimentacaoEstoque.TipoMovimentacao.SAIDA).list();
   BigDecimal materiaisCusto=movs.stream().map(m->zero(m.quantidade).multiply(zero(m.itemEstoque.valorUnitarioBrl))).reduce(BigDecimal.ZERO,BigDecimal::add);
   PropostaComercial proposta=PropostaComercial.findByOsId(tenant.currentTenantId(),osId);
   BigDecimal receita=null;
   if(proposta!=null&&"APROVADA".equals(proposta.status)&&"BRL".equals(proposta.moedaProposta)&&proposta.totalGeralBrl!=null){
    receita=proposta.totalGeralBrl.add(PropostaComercialAditivo.<PropostaComercialAditivo>find("propostaId = ?1 and status = 'APROVADO'",proposta.id).list().stream().map(a->zero(a.valor)).reduce(BigDecimal.ZERO,BigDecimal::add));
   }
   if(receita!=null){out.put("receitaAprovada",receita);out.put("resultadoOperacional",receita.subtract(manual.add(materiaisCusto)));}
   out.put("custos",Map.of("previsto",previsto,"lancado",manual,"materiais",materiaisCusto,"realizado",manual.add(materiaisCusto),"desvio",manual.add(materiaisCusto).subtract(previsto),"materiaisSemCusto",movs.stream().filter(m->m.itemEstoque.valorUnitarioBrl==null).count()));
  }
  return out;
 }
}
