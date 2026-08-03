package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "fabricante")
public class Fabricante extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(length = 255)
    public String nome;
    
    @Column(name = "isActive", nullable = false)
    public Boolean isActive = true; // Valor padrão true para novos registros
}
