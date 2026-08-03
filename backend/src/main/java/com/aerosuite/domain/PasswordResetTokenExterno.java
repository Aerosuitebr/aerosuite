package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entidade para tokens de reset de senha de usuários externos.
 */
@Entity
@Table(name = "password_reset_token_externo")
public class PasswordResetTokenExterno extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    
    @Column(name = "token", nullable = false, unique = true)
    public String token;
    
    @Column(name = "email", nullable = false)
    public String email;
    
    @Column(name = "expires_at", nullable = false)
    public LocalDateTime expiresAt;
    
    @Column(name = "used")
    public Boolean used = false;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Métodos de busca estáticos
    public static PasswordResetTokenExterno findByToken(String token) {
        return find("token = ?1", token).firstResult();
    }
    
    public static void invalidateTokensByEmail(String email) {
        update("used = true where email = ?1 and used = false", email);
    }
    
    public boolean isValid() {
        return !used && expiresAt.isAfter(LocalDateTime.now());
    }
}
