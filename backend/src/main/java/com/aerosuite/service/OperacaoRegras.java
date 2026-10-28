package com.aerosuite.service;
import java.math.BigDecimal;
import java.util.*;
import jakarta.ws.rs.BadRequestException;
public final class OperacaoRegras {
 private OperacaoRegras(){}
 public static final Map<String,List<String>> ESTADOS=Map.of(
 "impedimentos",List.of("ABERTO","EM_ANDAMENTO","RESOLVIDO","CANCELADO"),
 "materiais",List.of("PENDENTE","RESERVADO","SEPARADO","CONSUMIDO","CANCELADO"),
 "compras",List.of("SOLICITADO","COTACAO","PEDIDO","RECEBIDO","CANCELADO"),
 "prontidao",List.of("PENDENTE","CONFERIDO","CANCELADO"),
 "custos",List.of("PREVISTO","REALIZADO","CANCELADO"),
 "planejamento",List.of("PLANEJADO","CONFIRMADO","CONCLUIDO","CANCELADO"),
 "ferramentas",List.of("RETIRADO","DEVOLVIDO","CANCELADO"),
 "retornos",List.of("ABERTO","EM_ANALISE","CONCLUIDO","CANCELADO"));
 public static boolean encerrado(String s){return Set.of("RESOLVIDO","CONSUMIDO","RECEBIDO","CONFERIDO","REALIZADO","CONCLUIDO","DEVOLVIDO","CANCELADO").contains(s);}
 public static boolean reservado(String s){return Set.of("RESERVADO","SEPARADO").contains(s);}
 public static BigDecimal zero(BigDecimal n){return n==null?BigDecimal.ZERO:n;}
 public static void validar(String modulo,String status,BigDecimal quantidade,BigDecimal valor){
  if(!ESTADOS.containsKey(modulo)||!ESTADOS.get(modulo).contains(status))throw new BadRequestException("Módulo ou situação inválida.");
  if(quantidade!=null&&quantidade.signum()<=0)throw new BadRequestException("A quantidade deve ser maior que zero.");
  if(valor!=null&&valor.signum()<0)throw new BadRequestException("O valor não pode ser negativo.");
 }
 public static BigDecimal disponivel(BigDecimal fisico,BigDecimal reservado){return zero(fisico).subtract(zero(reservado)).max(BigDecimal.ZERO);}
}
