package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidade que representa a associação entre usuários externos e ordens de serviço.
 */
@Entity
@Table(name = "usuario_externo_os")
public class UsuarioExternoOS extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_externo_id", nullable = false)
    public UsuarioExterno usuarioExterno;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "os_id", nullable = false)
    public OS os;
    
    @Column(name = "pode_visualizar")
    public Boolean podeVisualizar = true;
    
    @Column(name = "concedido_por")
    public Integer concedidoPor;
    
    @Column(name = "data_concessao")
    public LocalDateTime dataConcessao;
    
    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;
    
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
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Métodos de busca estáticos
    public static List<UsuarioExternoOS> findByUsuarioExterno(Integer usuarioExternoId) {
        return list("usuarioExterno.id = ?1 and podeVisualizar = true", usuarioExternoId);
    }
    
    public static List<OS> findOSsByUsuarioExterno(Integer usuarioExternoId) {
        return getEntityManager()
            .createQuery(
                "SELECT ueo.os FROM UsuarioExternoOS ueo " +
                "WHERE ueo.usuarioExterno.id = :usuarioId " +
                "AND ueo.podeVisualizar = true " +
                "AND ueo.os.isActive = true " +
                "ORDER BY ueo.os.dtAbertura DESC",
                OS.class
            )
            .setParameter("usuarioId", usuarioExternoId)
            .getResultList();
    }
    
    public static boolean podeVisualizarOS(Integer usuarioExternoId, Long osId) {
        return count("usuarioExterno.id = ?1 and os.id = ?2 and podeVisualizar = true", usuarioExternoId, osId) > 0;
    }
    
    public static void deleteByUsuarioExterno(Integer usuarioExternoId) {
        delete("usuarioExterno.id = ?1", usuarioExternoId);
    }
}
