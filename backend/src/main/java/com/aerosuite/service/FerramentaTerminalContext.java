package com.aerosuite.service;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ForbiddenException;

/** Identidade do terminal lida do vínculo central; nomes enviados pelo cliente não são usados. */
@RequestScoped
public class FerramentaTerminalContext {
    @Inject OsFluxoEstacaoService estacoes;
    private String terminalId;
    private OsFluxoEstacaoService.TerminalInfo info;
    public void identificar(String id){terminalId=id;info=null;}
    public OsFluxoEstacaoService.TerminalInfo info(){if(info==null)info=estacoes.terminalInfo(terminalId);return info;}
    public void exigir(){
        var atual=info();
        if(!atual.vinculada())throw new ForbiddenException("Esta máquina precisa ser pareada à Ferramentaria em Gerenciar estações antes de registrar a operação física.");
        if(!atual.ferramentaria())throw new ForbiddenException("Esta máquina está vinculada a uma estação de produção. Peça à gestão para vinculá-la à Ferramentaria ou utilize um balcão pareado.");
    }
}
