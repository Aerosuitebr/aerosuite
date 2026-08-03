package com.aerosuite.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PropostaAditivoDto {
    public Long id;
    public Long propostaId;
    public String descricao;
    public BigDecimal valor;
    public String status;
    public LocalDateTime createdAt;
    public LocalDateTime clienteDecisaoEm;
    public String clienteDecisaoMotivo;
    public boolean podeAprovar;
    public boolean podeRejeitar;
    /** true quando o cliente solicitou no portal; false = proposto pela oficina. */
    public boolean solicitadoPeloCliente;
}
