package com.aerosuite.domain;

import com.aerosuite.domain.ConformidadeNaoConformidade.CapaFase;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDateTime;

@Entity
@Table(name = "conformidade_nc_anexo")
public class ConformidadeNcAnexo extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "nc_id", nullable = false)
    public Long ncId;

    @Enumerated(EnumType.STRING)
    @Column(name = "capa_fase", length = 24)
    public CapaFase capaFase;

    @Column(name = "nome_arquivo", nullable = false, length = 255)
    public String nomeArquivo;

    @Column(name = "nome_original", length = 255)
    public String nomeOriginal;

    @Column(name = "tipo_arquivo", length = 100)
    public String tipoArquivo;

    @Column(name = "tamanho_bytes")
    public Long tamanhoBytes;

    @Column(name = "caminho_arquivo", nullable = false, length = 500)
    public String caminhoArquivo;

    @Column(name = "descricao", length = 500)
    public String descricao;

    @Column(name = "usuario_id")
    public Integer usuarioId;

    @Column(name = "usuario_nome", length = 255)
    public String usuarioNome;

    @Column(name = "data_upload", nullable = false)
    public LocalDateTime dataUpload;

    @Column(name = "ativo", nullable = false)
    public Boolean ativo = true;

    @PrePersist
    public void prePersist() {
        if (dataUpload == null) {
            dataUpload = LocalDateTime.now();
        }
    }
}
