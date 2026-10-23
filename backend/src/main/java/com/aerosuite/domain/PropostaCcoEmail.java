package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "proposta_cco_email", uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "email"}))
public class PropostaCcoEmail extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @TenantId @Column(name = "tenant_id", nullable = false)
    public String tenantId;
    @Column(nullable = false, length = 254)
    public String email;
    public Integer usuarioId;
}
