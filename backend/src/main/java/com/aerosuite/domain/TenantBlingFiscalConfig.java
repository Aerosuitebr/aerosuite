package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_bling_fiscal_config")
public class TenantBlingFiscalConfig extends PanacheEntityBase {

    @Id
    @Column(name = "tenant_id")
    public Long tenantId;

    @Column(name = "cfop_padrao", length = 10)
    public String cfopPadrao;

    @Column(name = "serie_nfe", length = 5)
    public String serieNfe;

    @Column(name = "natureza_operacao", length = 120)
    public String naturezaOperacao;

    @Column(name = "ncm_padrao", length = 10)
    public String ncmPadrao;

    @Column(name = "aliquota_icms", precision = 7, scale = 4)
    public BigDecimal aliquotaIcms;

    @Column(name = "aliquota_pis", precision = 7, scale = 4)
    public BigDecimal aliquotaPis;

    @Column(name = "aliquota_cofins", precision = 7, scale = 4)
    public BigDecimal aliquotaCofins;

    @Column(name = "auto_os_on_pedido", nullable = false)
    public boolean autoOsOnPedido = true;

    @Column(name = "auto_emitir_nfe", nullable = false)
    public boolean autoEmitirNfe = true;

    @Column(name = "certificado_tipo", length = 2)
    public String certificadoTipo;

    @Column(name = "certificado_nome", length = 255)
    public String certificadoNome;

    @Column(name = "certificado_pfx_enc", columnDefinition = "MEDIUMTEXT")
    public String certificadoPfxEnc;

    @Column(name = "certificado_senha_enc", length = 512)
    public String certificadoSenhaEnc;

    @Column(name = "certificado_valido_ate")
    public LocalDate certificadoValidoAte;

    @Column(name = "certificado_uploaded_at")
    public LocalDateTime certificadoUploadedAt;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    public static TenantBlingFiscalConfig findForTenant(long tenantId) {
        return findById(tenantId);
    }

    public static TenantBlingFiscalConfig getOrCreate(long tenantId) {
        TenantBlingFiscalConfig row = findForTenant(tenantId);
        if (row == null) {
            row = new TenantBlingFiscalConfig();
            row.tenantId = tenantId;
            row.autoOsOnPedido = true;
            row.autoEmitirNfe = true;
        }
        return row;
    }

    public boolean hasCertificado() {
        return certificadoPfxEnc != null && !certificadoPfxEnc.isBlank();
    }
}
