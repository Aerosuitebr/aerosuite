package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoice_auditoria")
public class InvoiceAuditoria extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "invoice_id", nullable = false)
    public Long invoiceId;

    @Column(name = "numero_invoice", nullable = false, length = 100)
    public String numeroInvoice;

    @Enumerated(EnumType.STRING)
    @Column(name = "acao", nullable = false, length = 40)
    public AcaoAuditoria acao;

    @Column(name = "motivo", nullable = false, columnDefinition = "TEXT")
    public String motivo;

    @Column(name = "status_anterior", length = 30)
    public String statusAnterior;

    @Column(name = "status_novo", length = 30)
    public String statusNovo;

    @Column(name = "is_active_anterior")
    public Boolean isActiveAnterior;

    @Column(name = "is_active_novo")
    public Boolean isActiveNovo;

    @Column(name = "qtd_itens_estoque")
    public Integer qtdItensEstoque = 0;

    @Column(name = "qtd_lotes")
    public Integer qtdLotes = 0;

    @Column(name = "detalhe_bloqueio", columnDefinition = "TEXT")
    public String detalheBloqueio;

    @Column(name = "usuario_id")
    public Long usuarioId;

    @Column(name = "usuario_nome", length = 200)
    public String usuarioNome;

    @Column(name = "usuario_email", length = 200)
    public String usuarioEmail;

    @Column(name = "ip_origem", length = 50)
    public String ipOrigem;

    @Column(name = "user_agent", length = 500)
    public String userAgent;

    @Column(name = "data_hora", nullable = false)
    public LocalDateTime dataHora;

    @PrePersist
    public void prePersist() {
        if (dataHora == null) {
            dataHora = LocalDateTime.now();
        }
    }

    public enum AcaoAuditoria {
        INATIVACAO,
        CANCELAMENTO,
        TENTATIVA_INATIVACAO_BLOQUEADA,
        RESTAURACAO
    }
}
