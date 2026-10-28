package com.aerosuite.service;
import com.aerosuite.domain.OperacaoRegistro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
@ApplicationScoped public class OperacaoProntidaoGuard {
 public void conferir(Long osId,String fase){
  long pendentes=OperacaoRegistro.count("osId = ?1 and modulo = 'prontidao' and tipo = ?2 and status = 'PENDENTE'",osId,fase);
  if(pendentes>0)throw new BadRequestException("Há "+pendentes+" conferência(s) pendente(s) de "+fase.toLowerCase()+" na central operacional.");
 }
}
