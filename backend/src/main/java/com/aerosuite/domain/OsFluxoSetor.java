package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "os_fluxo_setor", uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "nome"}))
public class OsFluxoSetor extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @TenantId @Column(name = "tenant_id", nullable = false) public String tenantId;
    @Column(nullable = false, length = 120) public String nome;
}
