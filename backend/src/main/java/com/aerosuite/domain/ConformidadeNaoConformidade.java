package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "conformidade_nao_conformidade")
public class ConformidadeNaoConformidade extends PanacheEntityBase {

    public enum Severidade {
        BAIXA,
        MEDIA,
        ALTA,
        CRITICA
    }

    public enum StatusNc {
        ABERTA,
        EM_ACAO,
        FECHADA
    }

    public enum CapaFase {
        REGISTRO,
        CONTENCAO,
        CAUSA,
        ACAO,
        VERIFICACAO,
        FECHADA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "numero", nullable = false, length = 40)
    public String numero;

    @Column(name = "titulo", nullable = false, length = 255)
    public String titulo;

    @Column(name = "descricao", columnDefinition = "TEXT")
    public String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "severidade", nullable = false, length = 16)
    public Severidade severidade = Severidade.MEDIA;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    public StatusNc status = StatusNc.ABERTA;

    @Enumerated(EnumType.STRING)
    @Column(name = "capa_fase", nullable = false, length = 24)
    public CapaFase capaFase = CapaFase.REGISTRO;

    /** Referência à PK interna {@link OS#id}, não ao número de negócio {@link OS#idOs}. */
    @Column(name = "os_id")
    public Integer osId;

    @Column(name = "data_abertura", nullable = false)
    public LocalDate dataAbertura;

    @Column(name = "data_fechamento")
    public LocalDate dataFechamento;

    @Column(name = "acao_corretiva", columnDefinition = "TEXT")
    public String acaoCorretiva;

    @Column(name = "causa_raiz", columnDefinition = "TEXT")
    public String causaRaiz;

    @Column(name = "acao_contencao", columnDefinition = "TEXT")
    public String acaoContencao;

    @Column(name = "verificacao_eficacia", columnDefinition = "TEXT")
    public String verificacaoEficacia;

    @Column(name = "eficacia_confirmada")
    public Boolean eficaciaConfirmada = false;

    @Column(name = "data_verificacao")
    public LocalDate dataVerificacao;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (dataAbertura == null) {
            dataAbertura = LocalDate.now();
        }
        if (severidade == null) {
            severidade = Severidade.MEDIA;
        }
        if (status == null) {
            status = StatusNc.ABERTA;
        }
        if (capaFase == null) {
            capaFase = CapaFase.REGISTRO;
        }
        if (eficaciaConfirmada == null) {
            eficaciaConfirmada = false;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
