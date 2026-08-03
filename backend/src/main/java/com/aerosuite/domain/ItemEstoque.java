package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "item_estoque",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_item_estoque_tenant_rastreio",
                columnNames = {"tenant_id", "codigo_rastreio"}))
public class ItemEstoque extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "codigo_rastreio", nullable = false, length = 100)
    public String codigoRastreio;
    
    @Column(name = "qr_code_data", columnDefinition = "TEXT")
    public String qrCodeData;
    
    // Identificação do Produto
    @Column(name = "part_number", nullable = false, length = 100)
    public String partNumber;
    
    @Column(name = "serial_number", length = 100)
    public String serialNumber;
    
    @Column(name = "descricao", length = 500)
    public String descricao;
    
    @Column(name = "unidade", length = 20)
    public String unidade = "UN";
    
    // Rastreabilidade
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lote_id")
    public Lote lote;
    
    @Column(name = "lote_id", insertable = false, updatable = false)
    public Long loteId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    public Invoice invoice;
    
    @Column(name = "invoice_id", insertable = false, updatable = false)
    public Long invoiceId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id", nullable = false)
    public Fornecedor fornecedor;
    
    @Column(name = "fornecedor_id", insertable = false, updatable = false)
    public Long fornecedorId;
    
    // Valores
    @Column(name = "quantidade", precision = 10, scale = 3)
    public BigDecimal quantidade = BigDecimal.ONE;
    
    @Column(name = "estoque_minimo", precision = 10, scale = 3)
    public BigDecimal estoqueMinimo;
    
    @Column(name = "estoque_ideal", precision = 10, scale = 3)
    public BigDecimal estoqueIdeal;
    
    @Column(name = "valor_unitario_usd", precision = 15, scale = 4)
    public BigDecimal valorUnitarioUsd;
    
    @Column(name = "valor_unitario_brl", precision = 15, scale = 4)
    public BigDecimal valorUnitarioBrl;
    
    // Certificações e Documentos
    @Column(name = "certificado_conformidade", length = 255)
    public String certificadoConformidade;

    @Column(name = "cert_tipo", length = 32)
    public String certTipo;

    @Column(name = "cert_numero", length = 128)
    public String certNumero;

    @Column(name = "cert_emissor", length = 255)
    public String certEmissor;

    @Column(name = "cert_data_emissao")
    public LocalDate certDataEmissao;

    @Column(name = "cert_orgao_aprovacao", length = 128)
    public String certOrgaoAprovacao;

    @Column(name = "cert_anexo_nome", length = 255)
    public String certAnexoNome;

    @Column(name = "cert_anexo_path", length = 500)
    public String certAnexoPath;

    @Column(name = "cert_anexo_content_type", length = 100)
    public String certAnexoContentType;

    @Column(name = "cert_anexo_tamanho")
    public Long certAnexoTamanho;

    @Column(name = "quarentena_motivo", columnDefinition = "TEXT")
    public String quarentenaMotivo;

    @Column(name = "quarentena_inicio_em")
    public LocalDateTime quarentenaInicioEm;

    @Column(name = "quarentena_inicio_usuario_id")
    public Long quarentenaInicioUsuarioId;

    @Column(name = "quarentena_inicio_usuario_nome", length = 255)
    public String quarentenaInicioUsuarioNome;

    @Column(name = "quarentena_fim_em")
    public LocalDateTime quarentenaFimEm;

    @Column(name = "quarentena_fim_usuario_id")
    public Long quarentenaFimUsuarioId;

    @Column(name = "quarentena_fim_usuario_nome", length = 255)
    public String quarentenaFimUsuarioNome;

    @Column(name = "quarentena_disposicao", length = 32)
    public String quarentenaDisposicao;

    @Column(name = "quarentena_observacoes", columnDefinition = "TEXT")
    public String quarentenaObservacoes;
    
    @Column(name = "data_fabricacao")
    public LocalDate dataFabricacao;
    
    @Column(name = "data_validade")
    public LocalDate dataValidade;
    
    @Column(name = "shelf_life_meses")
    public Integer shelfLifeMeses;
    
    // Localização
    @Column(name = "localizacao", length = 100)
    public String localizacao;
    
    @Column(name = "prateleira", length = 50)
    public String prateleira;
    
    @Column(name = "gaveta", length = 50)
    public String gaveta;
    
    // Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    public StatusItemEstoque status = StatusItemEstoque.DISPONIVEL;
    
    // Vínculo com OS (quando consumido)
    @Column(name = "os_id")
    public Long osId;
    
    @Column(name = "data_consumo")
    public LocalDateTime dataConsumo;
    
    @Column(name = "consumido_por")
    public Long consumidoPor;
    
    // Metadados
    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;
    
    @Column(name = "is_active")
    public Boolean isActive = true;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    public Long createdBy;
    
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (codigoRastreio == null || codigoRastreio.isBlank()) {
            codigoRastreio = gerarCodigoRastreio();
        }
    }
    
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * Gera código de rastreio único para QR Code
     * Formato: BLW-{ANO}{MES}-{UUID_CURTO}
     */
    public static String gerarCodigoRastreio() {
        LocalDateTime now = LocalDateTime.now();
        String uuid = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return String.format("BLW-%d%02d-%s", now.getYear(), now.getMonthValue(), uuid);
    }
    
    /** Prefixo do QR de item de estoque (evita leitores tratarem o conteúdo como telefone). */
    public static final String QR_PAYLOAD_PREFIX = "AERO:I:";

    /**
     * Conteúdo do QR: código de rastreio (melhor leitura na câmera) ou {@code AERO:I:id}.
     */
    public String gerarQrCodeData() {
        if (codigoRastreio != null && !codigoRastreio.isBlank()) {
            return codigoRastreio.trim();
        }
        return QR_PAYLOAD_PREFIX + id;
    }
    
    public enum StatusItemEstoque {
        DISPONIVEL, RESERVADO, EM_USO, CONSUMIDO, DEVOLVIDO, DESCARTADO, BLOQUEADO, QUARENTENA
    }
}
