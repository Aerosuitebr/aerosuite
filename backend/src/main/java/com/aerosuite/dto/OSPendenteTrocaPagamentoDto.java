package com.aerosuite.dto;

/**
 * Resumo de OS com ao menos um item de troca eventual sem pagamento confirmado (pago null ou false).
 */
public class OSPendenteTrocaPagamentoDto {
    public Long id;
    public Integer idOs;
    public String clienteNome;
    /** Quantidade de itens com pago IS NULL ou pago = 0 */
    public int itensPendentesPagamento;

    public OSPendenteTrocaPagamentoDto() {}

    public OSPendenteTrocaPagamentoDto(Long id, Integer idOs, String clienteNome, int itensPendentesPagamento) {
        this.id = id;
        this.idOs = idOs;
        this.clienteNome = clienteNome;
        this.itensPendentesPagamento = itensPendentesPagamento;
    }
}
