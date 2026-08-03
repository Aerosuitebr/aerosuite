package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mensagem_anexo")
public class MensagemAnexo extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mensagem_id", nullable = false)
    public Mensagem mensagem;
    
    @Column(name = "nome_original", nullable = false, length = 255)
    public String nomeOriginal;
    
    @Column(name = "nome_arquivo", nullable = false, length = 255)
    public String nomeArquivo;
    
    @Column(name = "tipo_arquivo", length = 100)
    public String tipoArquivo;
    
    @Column(name = "tamanho_bytes")
    public Long tamanhoBytes;
    
    @Column(name = "caminho", nullable = false, length = 500)
    public String caminho;
    
    @Column(name = "data_upload", nullable = false)
    public LocalDateTime dataUpload;
    
    @Column(name = "ativo")
    public Boolean ativo = true;
    
    @PrePersist
    public void prePersist() {
        if (dataUpload == null) {
            dataUpload = LocalDateTime.now();
        }
    }
}
