package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDateTime;

@Entity
@Table(name = "os_tarefa_dado_tecnico")
public class OsTarefaDadoTecnico extends PanacheEntityBase {

    public enum TipoDado {
        AD_SB,
        MANUAL,
        OUTRO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "os_id", nullable = false)
    public Long osId;

    @Column(name = "ordem", nullable = false)
    public Integer ordem = 0;

    @Column(name = "tarefa_descricao", nullable = false, length = 500)
    public String tarefaDescricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_dado", nullable = false, length = 16)
    public TipoDado tipoDado;

    @Column(name = "aero_diretriz_id")
    public Long aeroDiretrizId;

    @Column(name = "publicacao_tecnica_id")
    public Integer publicacaoTecnicaId;

    @Column(name = "referencia_externa", length = 255)
    public String referenciaExterna;

    @Column(name = "titulo_exibicao", length = 500)
    public String tituloExibicao;

    @Column(name = "numero_exibicao", length = 120)
    public String numeroExibicao;

    @Column(name = "observacao", length = 1000)
    public String observacao;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @Column(name = "created_by_usuario_id")
    public Integer createdByUsuarioId;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
