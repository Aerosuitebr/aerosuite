package com.aerosuite.service;
import com.aerosuite.domain.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
@ApplicationScoped
public class OperacaoReservaGuard {
 public void conferirEdicao(ItemEstoque item,com.aerosuite.dto.ItemEstoqueDto dto){
  BigDecimal comprometido=reservado(item.id,null);if(comprometido.signum()<=0)return;
  if(dto.quantidade!=null&&dto.quantidade.compareTo(comprometido)<0)throw new BadRequestException("O saldo não pode ser inferior às reservas ativas.");
  if((dto.partNumber!=null&&!dto.partNumber.isBlank()&&!dto.partNumber.trim().equals(item.partNumber))||(dto.loteId!=null&&!Objects.equals(dto.loteId,item.loteId))||(dto.invoiceId!=null&&!Objects.equals(dto.invoiceId,item.invoiceId)))throw new BadRequestException("Cancele as reservas antes de alterar PN, lote ou invoice do item.");
 }
 public void conferirExclusao(ItemEstoque item){if(reservado(item.id,null).signum()>0)throw new BadRequestException("Cancele as reservas ativas antes de excluir o item.");}
 public BigDecimal livreParaOs(ItemEstoque item,Long osId){
  java.util.List<OperacaoRegistro> rs=OperacaoRegistro.find("modulo = 'materiais' and itemId = ?1 and status in ('RESERVADO','SEPARADO')",item.id).list();
  BigDecimal outros=rs.stream().filter(r->!Objects.equals(r.osId,osId)).map(r->r.quantidade.subtract(OperacaoRegras.zero(r.quantidadeConsumida))).reduce(BigDecimal.ZERO,BigDecimal::add);
  return OperacaoRegras.disponivel(item.quantidade,outros);
 }
 public BigDecimal reservado(Long itemId,Long excluirId){
  List<OperacaoRegistro> rs=OperacaoRegistro.find("modulo = 'materiais' and itemId = ?1 and status in ('RESERVADO','SEPARADO')",itemId).list();
  return rs.stream().filter(r->!Objects.equals(r.id,excluirId)).map(r->OperacaoRegras.zero(r.quantidade).subtract(OperacaoRegras.zero(r.quantidadeConsumida))).reduce(BigDecimal.ZERO,BigDecimal::add);
 }
 /** Called under the same item write lock as the debit, including existing FIFO and automatic exits. */
 public void consumir(ItemEstoque item,Long osId,BigDecimal quantidade){
  List<OperacaoRegistro> rs=OperacaoRegistro.find("modulo = 'materiais' and itemId = ?1 and status in ('RESERVADO','SEPARADO') order by id",item.id).list();
  BigDecimal outros=rs.stream().filter(r->!Objects.equals(r.osId,osId)).map(r->r.quantidade.subtract(OperacaoRegras.zero(r.quantidadeConsumida))).reduce(BigDecimal.ZERO,BigDecimal::add);
  if(quantidade.compareTo(OperacaoRegras.disponivel(item.quantidade,outros))>0)throw new BadRequestException("Saldo comprometido por reservas de outras OS. Revise as reservas antes de consumir.");
  BigDecimal restante=quantidade;
  for(OperacaoRegistro r:rs){
   if(!Objects.equals(r.osId,osId)||restante.signum()<=0)continue;
   BigDecimal usado=r.quantidade.subtract(OperacaoRegras.zero(r.quantidadeConsumida)).min(restante);
   r.quantidadeConsumida=OperacaoRegras.zero(r.quantidadeConsumida).add(usado);restante=restante.subtract(usado);
   if(r.quantidadeConsumida.compareTo(r.quantidade)>=0){r.status="CONSUMIDO";r.closedAt=LocalDateTime.now();}
   OperacaoEvento e=new OperacaoEvento();e.tenantId=r.tenantId;e.registroId=r.id;e.autor="Estoque";e.descricao="Consumo vinculado à OS: "+usado;e.createdAt=LocalDateTime.now();e.persist();
  }
 }
}
