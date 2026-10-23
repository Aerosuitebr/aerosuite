package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;
@Entity @Table(name = "os_fluxo_registro")
public class OsFluxoRegistro extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @TenantId @Column(name = "tenant_id", nullable = false) public String tenantId;
    public Long osId;
    public Long etapaId;
    public Integer sequencia;
    public LocalDateTime entradaEm;
    public Integer entradaUsuarioId;
    public String entradaUsuarioNome;
    public String entradaOrigem;
    public String entradaEstacao;
    public LocalDateTime saidaEm;
    public Integer saidaUsuarioId;
    public String saidaUsuarioNome;
    public String saidaOrigem;
    public String saidaEstacao;
    public Boolean forcado = false;
    @Column(length = 2000) public String observacao;
    public Boolean anulado = false;
    public LocalDateTime anuladoEm;
    public String anuladoUsuarioNome;
    @Column(length = 2000) public String anuladoMotivo;
}