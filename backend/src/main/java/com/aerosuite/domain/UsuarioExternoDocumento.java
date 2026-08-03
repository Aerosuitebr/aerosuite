package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidade que representa documentos disponibilizados para usuários externos.
 */
@Entity
@Table(name = "usuario_externo_documento")
public class UsuarioExternoDocumento extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_externo_id", nullable = false)
    public UsuarioExterno usuarioExterno;
    
    @Column(name = "os_file_id")
    public Long osFileId;
    
    @Column(name = "tp_file_id")
    public Long tpFileId;
    
    @Column(name = "nome_arquivo", nullable = false)
    public String nomeArquivo;
    
    @Column(name = "descricao", columnDefinition = "TEXT")
    public String descricao;
    
    @Column(name = "pode_download")
    public Boolean podeDownload = true;
    
    @Column(name = "concedido_por")
    public Integer concedidoPor;
    
    @Column(name = "data_concessao")
    public LocalDateTime dataConcessao;
    
    @Column(name = "data_expiracao")
    public LocalDate dataExpiracao;
    
    @Column(name = "visualizacoes")
    public Integer visualizacoes = 0;
    
    @Column(name = "ultimo_acesso")
    public LocalDateTime ultimoAcesso;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (dataConcessao == null) {
            dataConcessao = LocalDateTime.now();
        }
        if (visualizacoes == null) {
            visualizacoes = 0;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Métodos de busca estáticos
    public static List<UsuarioExternoDocumento> findByUsuarioExterno(Integer usuarioExternoId) {
        return list("usuarioExterno.id = ?1 and (dataExpiracao is null or dataExpiracao >= ?2)", 
            usuarioExternoId, LocalDate.now());
    }
    
    public static UsuarioExternoDocumento findByUsuarioExternoAndOsFile(Integer usuarioExternoId, Long osFileId) {
        return find("usuarioExterno.id = ?1 and osFileId = ?2", usuarioExternoId, osFileId).firstResult();
    }
    
    public static boolean podeAcessarDocumento(Integer usuarioExternoId, Integer documentoId) {
        UsuarioExternoDocumento doc = findById(documentoId);
        if (doc == null || !doc.usuarioExterno.id.equals(usuarioExternoId)) {
            return false;
        }
        if (doc.dataExpiracao != null && doc.dataExpiracao.isBefore(LocalDate.now())) {
            return false;
        }
        return true;
    }
    
    public static void registrarVisualizacao(Integer documentoId) {
        UsuarioExternoDocumento doc = findById(documentoId);
        if (doc != null) {
            doc.visualizacoes = (doc.visualizacoes == null ? 0 : doc.visualizacoes) + 1;
            doc.ultimoAcesso = LocalDateTime.now();
            doc.persist();
        }
    }
    
    public static void deleteByUsuarioExterno(Integer usuarioExternoId) {
        delete("usuarioExterno.id = ?1", usuarioExternoId);
    }
}
