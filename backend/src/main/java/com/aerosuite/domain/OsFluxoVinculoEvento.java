package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;
@Entity @Table(name="os_fluxo_vinculo_evento")
public class OsFluxoVinculoEvento extends PanacheEntityBase {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 @TenantId @Column(name="tenant_id",nullable=false) public String tenantId;
 @Column(name="terminal_id") public String terminalId;
 public String apelido;
 @Column(name="estacao_anterior") public String estacaoAnterior;
 @Column(name="estacao_nova") public String estacaoNova;
 public String acao;
 public String responsavel;
 @Column(name="ocorrido_em") public LocalDateTime ocorridoEm;
}
