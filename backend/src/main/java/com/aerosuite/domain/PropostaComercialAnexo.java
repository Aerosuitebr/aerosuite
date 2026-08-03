package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDateTime;

@Entity
@Table(name = "proposta_comercial_anexo")
public class PropostaComercialAnexo extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "proposta_id", nullable = false)
    public Long propostaId;

    @Column(name = "nome_arquivo", nullable = false, length = 255)
    public String nomeArquivo;

    @Column(name = "caminho_relativo", nullable = false, length = 500)
    public String caminhoRelativo;

    @Column(name = "tamanho_bytes")
    public Long tamanhoBytes;

    @Column(name = "content_type", length = 120)
    public String contentType;

    @Column(name = "uploaded_by_externo_id")
    public Integer uploadedByExternoId;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
