package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_attachment")
public class TicketAttachment extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    public Ticket ticket;

    @Column(name = "nome_arquivo", nullable = false, length = 255)
    public String nomeArquivo;

    @Column(name = "nome_original", length = 255)
    public String nomeOriginal;

    @Column(name = "tipo_arquivo", length = 100)
    public String tipoArquivo; // MIME type

    @Column(name = "tamanho_bytes")
    public Long tamanhoBytes;

    @Column(name = "caminho_arquivo", length = 500)
    public String caminhoArquivo;

    @Column(name = "url_download", length = 500)
    public String urlDownload;

    @Column(name = "descricao", length = 500)
    public String descricao;

    @Column(name = "tipo_anexo", length = 50)
    public String tipoAnexo; // SCREENSHOT, LOG, DOCUMENTO, VIDEO, OUTRO

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
        if (this.dataUpload == null) {
            this.dataUpload = LocalDateTime.now();
        }
    }
}
