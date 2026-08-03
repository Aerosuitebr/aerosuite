package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entidade para Auditoria de Ordens de Serviço
 * Registra todas as criações, alterações e exclusões de OS
 */
@Entity
@Table(name = "os_auditoria")
public class OSAuditoria extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "id_os", nullable = false)
    public Long idOs;

    @Column(name = "numero_os", nullable = false)
    public Integer numeroOs;

    @Enumerated(EnumType.STRING)
    @Column(name = "acao", nullable = false)
    public AcaoAuditoria acao;

    @Column(name = "campo_alterado", length = 100)
    public String campoAlterado;

    @Column(name = "valor_anterior", columnDefinition = "TEXT")
    public String valorAnterior;

    @Column(name = "valor_novo", columnDefinition = "TEXT")
    public String valorNovo;

    @Column(name = "snapshot_os", columnDefinition = "TEXT")
    public String snapshotOs;

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
    protected void onCreate() {
        if (this.dataHora == null) {
            this.dataHora = LocalDateTime.now();
        }
    }

    /**
     * Enum para tipos de ação de auditoria
     */
    public enum AcaoAuditoria {
        CRIACAO("Criação"),
        ALTERACAO("Alteração"),
        EXCLUSAO("Exclusão"),
        RESTAURACAO("Restauração"),
        UPLOAD_ARQUIVO("Upload de arquivo"),
        ASSOCIACAO_ARQUIVO("Associação de arquivo"),
        EXCLUSAO_ARQUIVO("Exclusão de arquivo"),
        REABERTURA("Reabertura");

        private final String descricao;

        AcaoAuditoria(String descricao) {
            this.descricao = descricao;
        }

        public String getDescricao() {
            return descricao;
        }
    }
}
