package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.*;
@Entity @Table(name="ferramenta_custodia")
public class FerramentaCustodia extends PanacheEntityBase {
    @org.hibernate.annotations.TenantId @Column(name = "tenant_id", nullable = false) public String tenantId;
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    public Long ferramentaId;
    public Long osId;
    public Integer mecanicoId;
    public Integer entreguePor;
    public String localizacao;
    public LocalDateTime retiradaEm;
    public LocalDateTime retornoPrevisto;
    public LocalDateTime previsaoAtualizadaEm;
    public LocalDateTime encerradaEm;
    public String encerramento;
}
