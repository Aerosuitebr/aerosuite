package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Linha do tempo de rastreabilidade de um item de estoque (compliance / auditoria).
 */
public class ItemLinhaTempoDto {

    public ItemResumo item;
    public List<LinhaTempoEventoDto> eventos = new ArrayList<>();
    public int totalEventos;

    public static class ItemResumo {
        public Long id;
        public String codigoRastreio;
        public String partNumber;
        public String serialNumber;
        public String descricao;
        public String status;
        public String certificadoConformidade;
        public String dataValidade;
        public String loteCodigo;
        public String invoiceNumero;
        public String fornecedorNome;
        public String localizacao;
        public Integer osConsumoNumero;
        public Long osConsumoId;
    }

    public static class LinhaTempoEventoDto {
        public Long movimentacaoId;
        public String tipo;
        public String dataHora;
        public String quantidade;
        public String quantidadeAnterior;
        public String quantidadePosterior;
        public String usuarioNome;
        public String motivo;
        public Integer osNumero;
        public Long osIdInterno;
        public String origemSaida;
        public String localizacaoOrigem;
        public String localizacaoDestino;
    }
}
