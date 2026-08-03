package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sgq_documento_controlado")
public class SgqDocumentoControlado extends PanacheEntityBase {

    public enum TipoDocumento {
        MOE,
        POP,
        PROCEDIMENTO,
        MANUAL,
        FORMULARIO,
        OUTRO
    }

    public enum StatusDocumento {
        RASCUNHO,
        VIGENTE,
        OBSOLETO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 32)
    public TipoDocumento tipo;

    @Column(name = "codigo", nullable = false, length = 80)
    public String codigo;

    @Column(name = "titulo", nullable = false, length = 255)
    public String titulo;

    @Column(name = "revisao", nullable = false, length = 32)
    public String revisao = "00";

    @Column(name = "data_revisao")
    public LocalDate dataRevisao;

    @Column(name = "data_vigencia")
    public LocalDate dataVigencia;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    public StatusDocumento status = StatusDocumento.VIGENTE;

    @Column(name = "referencia_arquivo", length = 512)
    public String referenciaArquivo;

    @Column(name = "arquivo_path", length = 512)
    public String arquivoPath;

    @Column(name = "arquivo_nome", length = 255)
    public String arquivoNome;

    @Column(name = "arquivo_content_type", length = 120)
    public String arquivoContentType;

    @Column(name = "arquivo_tamanho")
    public Long arquivoTamanho;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;

    @Column(name = "ativo", nullable = false)
    public Boolean ativo = true;

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
        if (ativo == null) {
            ativo = true;
        }
        if (status == null) {
            status = StatusDocumento.VIGENTE;
        }
        if (revisao == null || revisao.isBlank()) {
            revisao = "00";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
