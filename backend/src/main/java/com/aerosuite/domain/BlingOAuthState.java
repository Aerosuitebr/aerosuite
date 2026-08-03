package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "bling_oauth_state")
public class BlingOAuthState extends PanacheEntityBase {

    @Id
    @Column(name = "state_token", nullable = false, length = 64)
    public String stateToken;

    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Column(name = "usuario_id", nullable = false)
    public Integer usuarioId;

    @Column(name = "expires_at", nullable = false)
    public LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    public static BlingOAuthState findValid(String stateToken) {
        if (stateToken == null || stateToken.isBlank()) {
            return null;
        }
        BlingOAuthState row = findById(stateToken.trim());
        if (row == null || row.expiresAt.isBefore(LocalDateTime.now())) {
            return null;
        }
        return row;
    }
}
