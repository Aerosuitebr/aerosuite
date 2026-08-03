package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "password_reset_token")
public class PasswordResetToken extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    
    @Column(name = "token", nullable = false, unique = true, length = 255)
    public String token;
    
    @Column(name = "email", nullable = false, length = 255)
    public String email;

    /** Tenant da conta que solicitou o reset (obrigatório em instalações multi-tenant). */
    @Column(name = "org_tenant_id")
    public Long orgTenantId;
    
    @Column(name = "expires_at", nullable = false)
    public LocalDateTime expiresAt;
    
    @Column(name = "used", nullable = false)
    public Boolean used = false;
    
    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (expiresAt == null) {
            // Token expira em 1 hora por padrão
            expiresAt = LocalDateTime.now().plusHours(1);
        }
    }
    
    public static PasswordResetToken findByToken(String token) {
        PanacheEntityBase result = find("token = ?1 AND used = false AND expiresAt > ?2", 
                    token, LocalDateTime.now()).firstResult();
        return result != null ? (PasswordResetToken) result : null;
    }
    
    public static PasswordResetToken findByEmail(String email) {
        PanacheEntityBase result = find("email = ?1 AND used = false AND expiresAt > ?2 ORDER BY createdAt DESC", 
                    email, LocalDateTime.now()).firstResult();
        return result != null ? (PasswordResetToken) result : null;
    }
    
    public boolean isValid() {
        return !used && expiresAt.isAfter(LocalDateTime.now());
    }
    
    @Transactional
    public static void invalidateTokensByEmail(String email) {
        List<PanacheEntityBase> tokens = find("email = ?1 AND used = false", email).list();
        for (PanacheEntityBase tokenBase : tokens) {
            PasswordResetToken token = (PasswordResetToken) tokenBase;
            token.used = true;
            token.persist();
        }
    }
}

