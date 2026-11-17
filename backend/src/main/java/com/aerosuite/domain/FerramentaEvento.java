package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.*;
@Entity @Table(name="ferramenta_evento")
public class FerramentaEvento extends PanacheEntityBase {
    @org.hibernate.annotations.TenantId @Column(name = "tenant_id", nullable = false) public String tenantId;
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    public Long ferramentaId;
    public Long osId;
    public Integer autorId;
    public String autor;
    public String tipo;
    public String terminalId;
    public String estacaoCodigo;
    public String estacaoNome;
    public String maquina;
    @Column(columnDefinition="TEXT") public String detalhe;
    public LocalDateTime ocorridoEm;
}
