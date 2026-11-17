package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "ferramenta_pn")
public class FerramentaPn extends PanacheEntityBase {
    @org.hibernate.annotations.TenantId @Column(name = "tenant_id", nullable = false) public String tenantId;
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(length = 100, nullable = false)
    public String pn;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ferramenta_id")
    public Ferramenta ferramenta;
}
