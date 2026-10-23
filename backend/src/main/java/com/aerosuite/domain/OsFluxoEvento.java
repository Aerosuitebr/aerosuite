package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;
@Entity @Table(name = "os_fluxo_evento")
public class OsFluxoEvento extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @TenantId @Column(name = "tenant_id", nullable = false) public String tenantId;
    public Long osId;
    public Long etapaId;
    public String acao;
    public Boolean sucesso;
    @Column(length = 2000) public String mensagem;
    public String codigoOsLido;
    public String codigoEtapaLido;
    public String origem;
    public String estacao;
    public Integer usuarioId;
    public String usuarioNome;
    public LocalDateTime ocorridoEm;
}