package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidade que representa a associação entre usuários externos e funcionalidades permitidas.
 */
@Entity
@Table(name = "usuario_externo_funcionalidade")
public class UsuarioExternoFuncionalidade extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_externo_id", nullable = false)
    public UsuarioExterno usuarioExterno;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funcionalidade_externa_id", nullable = false)
    public FuncionalidadeExterna funcionalidadeExterna;
    
    @Column(name = "concedido_por")
    public Integer concedidoPor;
    
    @Column(name = "data_concessao")
    public LocalDateTime dataConcessao;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (dataConcessao == null) {
            dataConcessao = LocalDateTime.now();
        }
    }
    
    // Métodos de busca estáticos
    public static List<UsuarioExternoFuncionalidade> findByUsuarioExterno(Integer usuarioExternoId) {
        return list("usuarioExterno.id = ?1", usuarioExternoId);
    }
    
    public static List<FuncionalidadeExterna> findFuncionalidadesByUsuarioExterno(Integer usuarioExternoId) {
        return getEntityManager()
            .createQuery(
                "SELECT uef.funcionalidadeExterna FROM UsuarioExternoFuncionalidade uef " +
                "WHERE uef.usuarioExterno.id = :usuarioId " +
                "AND uef.funcionalidadeExterna.ativo = true " +
                "ORDER BY uef.funcionalidadeExterna.ordem",
                FuncionalidadeExterna.class
            )
            .setParameter("usuarioId", usuarioExternoId)
            .getResultList();
    }
    
    public static void deleteByUsuarioExterno(Integer usuarioExternoId) {
        delete("usuarioExterno.id = ?1", usuarioExternoId);
    }
    
    public static boolean existsAssociacao(Integer usuarioExternoId, Integer funcionalidadeId) {
        return count("usuarioExterno.id = ?1 and funcionalidadeExterna.id = ?2", usuarioExternoId, funcionalidadeId) > 0;
    }
}
