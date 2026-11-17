package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
@Entity @Table(name="ferramenta_laboratorio")
public class FerramentaLaboratorio extends PanacheEntityBase {
    @org.hibernate.annotations.TenantId @Column(name = "tenant_id", nullable = false) public String tenantId;
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    public String nome;
    public String contato;
    @Column(length=2000) public String escopo;
    public java.time.LocalDate consultaAcreditacao;
}
