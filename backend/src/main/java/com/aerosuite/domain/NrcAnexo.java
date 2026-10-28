package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;

@Entity
@Table(name = "nrc_anexo")
public class NrcAnexo extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, length = 64)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nrc_id", nullable = false)
    public Nrc nrc;

    @Column(name = "nome_arquivo", nullable = false, length = 255)
    public String nomeArquivo;

    @Column(name = "nome_original", length = 255)
    public String nomeOriginal;

    @Column(name = "tipo_arquivo", length = 100)
    public String tipoArquivo;

    @Column(name = "tamanho_bytes")
    public Long tamanhoBytes;

    @Column(name = "caminho_arquivo", length = 500)
    public String caminhoArquivo;

    @Column(name = "descricao", length = 500)
    public String descricao;

    @Column(name = "categoria", length = 30, nullable = false)
    public String categoria = "EVIDENCIA";

    @Column(name = "usuario_id")
    public Long usuarioId;

    @Column(name = "usuario_nome", length = 255)
    public String usuarioNome;

    @Column(name = "data_upload", nullable = false)
    public LocalDateTime dataUpload;

    @Column(name = "is_active")
    public Boolean isActive = true;

    @PrePersist
    public void prePersist() {
        if (dataUpload == null) {
            dataUpload = LocalDateTime.now();
        }
        if (isActive == null) {
            isActive = true;
        }
    }
}
