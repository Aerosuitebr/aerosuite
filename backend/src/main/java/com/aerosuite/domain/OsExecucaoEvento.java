package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;
@Entity @Table(name = "os_execucao_evento")
public class OsExecucaoEvento extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @TenantId @Column(name = "tenant_id", nullable = false) public String tenantId;
    public Long osId;
    public Integer usuarioId;
    public String acao;
    @Column(length = 2000) public String observacao;
    public LocalDateTime ocorridoEm;
}
