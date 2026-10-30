package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;
@Entity @Table(name="os_fluxo_estacao_monitor")
public class OsFluxoEstacaoMonitor extends PanacheEntityBase {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 @TenantId @Column(name="tenant_id",nullable=false) public String tenantId;
 public String codigo;
 @Column(name="monitorado_desde") public LocalDateTime monitoradoDesde;
 @Column(name="sem_vinculo_desde") public LocalDateTime semVinculoDesde;
}
