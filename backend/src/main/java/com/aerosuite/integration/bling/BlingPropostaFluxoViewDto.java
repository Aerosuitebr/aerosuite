package com.aerosuite.integration.bling;

import java.util.ArrayList;
import java.util.List;

public class BlingPropostaFluxoViewDto {
    public Long propostaComercialId;
    public Long osId;
    public boolean pedidoVinculado;
    public boolean osGerada;
    public boolean osConcluida;
    public boolean nfeEmitida;
    public boolean automacaoPendente;
    public boolean automacaoComErro;
    public boolean aguardandoConclusaoOs;
    public boolean retryDisponivel;
    /** Código para i18n: NENHUM, AGUARDANDO_OS_CONCLUSAO, AGUARDANDO_OS, AGUARDANDO_NFE, ERRO_OS, ERRO_NFE */
    public String automacaoMotivo;
    public String ultimoErro;
    public List<BlingPropostaFluxoPassoDto> passos = new ArrayList<>();
    public List<BlingPropostaFluxoEventoDto> eventos = new ArrayList<>();
}
