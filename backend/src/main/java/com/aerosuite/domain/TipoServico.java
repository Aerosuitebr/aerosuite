package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "tipo_servico")
public class TipoServico extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    public String nome;
    
    @Column(name = "isActive", nullable = false)
    public Boolean isActive = true; // Valor padrão true para novos registros
}
