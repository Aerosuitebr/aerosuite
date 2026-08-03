package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "password_history", indexes = {
    @Index(name = "idx_password_history_usuario", columnList = "usuario_id"),
    @Index(name = "idx_password_history_data", columnList = "created_at")
})
public class PasswordHistory extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    
    @Column(name = "usuario_id", nullable = false)
    public Integer usuarioId;
    
    @Column(name = "senha_hash", nullable = false, length = 255)
    public String senhaHash;
    
    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;
    
    // Métodos estáticos para consultas
    public static java.util.List<PasswordHistory> findLastPasswordsByUsuario(Integer usuarioId, int limit) {
        return find("usuarioId = ?1 ORDER BY createdAt DESC", usuarioId)
            .page(0, limit)
            .list();
    }
    
    public static void deleteOldPasswords(Integer usuarioId, int keepCount) {
        // Buscar IDs das senhas antigas que devem ser removidas
        java.util.List<PasswordHistory> allPasswords = find("usuarioId = ?1 ORDER BY createdAt DESC", usuarioId).list();
        
        if (allPasswords.size() > keepCount) {
            java.util.List<Long> idsToDelete = allPasswords.stream()
                .skip(keepCount)
                .map(p -> p.id)
                .collect(java.util.stream.Collectors.toList());
            
            if (!idsToDelete.isEmpty()) {
                delete("id IN ?1", idsToDelete);
            }
        }
    }
}

