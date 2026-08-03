package com.aerosuite.dto;

import java.time.LocalDateTime;

/** Notificação pendente (modal global): déficit de estoque ou nova Solicitação de Troca Eventual. */
public class OsNotificacaoDeficitTrocaDto {
    public Long id;
    public Long osId;
    public Integer idOs;
    public String clienteNome;
    /** DEFICIT | SOLICITACAO_TROCA */
    public String kind;
    /**
     * DEFICIT: JSON [{ "nome", "pn", "solicitado", "disponivel", "deficit" }].
     * SOLICITACAO_TROCA: JSON [{ "nome", "pn", "quantidade", "descricao" }].
     */
    public String detalheJson;
    public LocalDateTime createdAt;

    /** Mesmo critério da listagem de OS no frontend: BEL-{id interno}/{ano de abertura}. */
    public String osExibicao;
}
