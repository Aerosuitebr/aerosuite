package com.aerosuite.dto;

/**
 * Resultado de {@code POST /api/propostas-comerciais/{id}/gerar-os} (P4.1).
 */
public class GerarOsPropostaResultDto {

    public PropostaComercialDto proposta;
    public OSDto os;

    public GerarOsPropostaResultDto() {}

    public GerarOsPropostaResultDto(PropostaComercialDto proposta, OSDto os) {
        this.proposta = proposta;
        this.os = os;
    }
}
