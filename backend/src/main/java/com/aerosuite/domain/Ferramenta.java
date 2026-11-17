package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.*;

@Entity @Table(name = "ferramenta")
public class Ferramenta extends PanacheEntityBase {
    @org.hibernate.annotations.TenantId @Column(name = "tenant_id", nullable = false) public String tenantId;
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(nullable=false, unique=true, length=80) public String codigo;
    public String descricao;
    public String tipo;
    public String marca;
    public String modelo;
    public String serie;
    public String posicao;
    public String condicao = "REGULAR";
    /** Restrição física independente do andamento da calibração. */
    public String bloqueioOperacional;
    public String statusCalibracao;
    public boolean exigeCalibracao;
    public Integer intervalo = 6;
    public String unidade = "MESES";
    public String alertas = "30,15,7";
    @Column(length=2000) public String criterio;
    public LocalDate ultimaCalibracao;
    public LocalDate proximaCalibracao;
    public LocalDateTime criadaEm;
    @Version public long versao;
}
