package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;
@Entity @Table(name = "os_fluxo_terminal")
public class OsFluxoTerminal extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @TenantId @Column(name = "tenant_id", nullable = false) public String tenantId;
    public String terminalId;
    public String apelido;
    public String estacaoCodigo;
    public String usuarioNome;
    public String ip;
    public String userAgent;
    public LocalDateTime vinculadoEm;
    public LocalDateTime ultimoAcesso;
    public Boolean ativa = false;
    public String codigoPareamento;
    public LocalDateTime expiraEm;
}