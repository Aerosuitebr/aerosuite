package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;
@Entity @Table(name = "os_fluxo_estacao_nome")
public class OsFluxoEstacaoNome extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @TenantId @Column(name = "tenant_id", nullable = false) public String tenantId;
    public String codigo;
    public String nome;
    public String setor;
    public Boolean ativa = true;
}
