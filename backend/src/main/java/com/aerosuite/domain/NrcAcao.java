package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "nrc_acao")
public class NrcAcao extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, length = 64)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nrc_id", nullable = false)
    public Nrc nrc;

    @Column(name = "descricao", nullable = false, columnDefinition = "TEXT")
    public String descricao;

    @Column(name = "o_que", columnDefinition = "TEXT")
    public String oQue;

    @Column(name = "por_que", columnDefinition = "TEXT")
    public String porQue;

    @Column(name = "onde", length = 255)
    public String onde;

    @Column(name = "quando_acao")
    public LocalDate quandoAcao;

    @Column(name = "como", columnDefinition = "TEXT")
    public String como;

    @Column(name = "quanto_custo", length = 100)
    public String quantoCusto;

    @Column(name = "responsavel_id")
    public Long responsavelId;

    @Column(name = "responsavel_nome", length = 255)
    public String responsavelNome;

    @Column(name = "prazo")
    public LocalDate prazo;

    @Column(name = "status", nullable = false, length = 20)
    public String status = "PENDENTE";

    @Column(name = "data_conclusao")
    public LocalDateTime dataConclusao;

    @Column(name = "evidencia_conclusao", columnDefinition = "TEXT")
    public String evidenciaConclusao;

    @Column(name = "concluido_por_id")
    public Long concluidoPorId;

    @Column(name = "concluido_por_nome", length = 255)
    public String concluidoPorNome;

    @Column(name = "ordem_item", nullable = false)
    public Integer ordemItem = 0;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "PENDENTE";
        }
    }
}
