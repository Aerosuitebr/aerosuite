package com.aerosuite.dto;

public final class OsFluxoDtos {
    private OsFluxoDtos() {}
    public static class BiparRequest {
        public String osCodigo, etapaCodigo, acao, origem, estacao, observacao, motivo, terminalId;
        public Long etapaId;
        public boolean forcar;
    }
    public static class AjusteRequest {
        public String tipo, situacao, motivo;
        public Long etapaId;
        public boolean preencherIntermediarias;
    }
}
