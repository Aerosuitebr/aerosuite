package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenant")
public class Tenant extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "codigo", nullable = false, length = 64, unique = true)
    public String codigo;

    @Column(name = "nome", nullable = false)
    public String nome;

    @Column(name = "ativo", nullable = false)
    public Boolean ativo = true;

    /** Módulos SaaS habilitados: MRO, ESTOQUE, COMERCIAL (vírgula). */
    @Column(name = "modulos_habilitados", nullable = false, length = 255)
    public String modulosHabilitados = "MRO,ESTOQUE,COMERCIAL";

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
