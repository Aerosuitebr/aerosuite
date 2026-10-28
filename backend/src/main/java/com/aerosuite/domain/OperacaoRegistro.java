package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.math.BigDecimal;
import java.time.*;
@Entity @Table(name="operacao_registro")
public class OperacaoRegistro extends PanacheEntityBase {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 @TenantId @Column(name="tenant_id",nullable=false) public String tenantId;
 @Version public Long version;
 @Column(nullable=false,length=24) public String modulo;
 @Column(name="os_id") public Long osId;
 @Column(name="item_id") public Long itemId;
 @Column(name="ferramenta_id") public Long ferramentaId;
 @Column(name="tecnico_id") public Integer tecnicoId;
 @Column(name="origem_id") public Long origemId;
 @Column(nullable=false,length=180) public String titulo;
 @Column(nullable=false,length=30) public String status;
 @Column(length=40) public String tipo;
 @Column(length=180) public String responsavel;
 @Column(length=180) public String referencia;
 @Column(length=180) public String recurso;
 @Column(name="proxima_acao",length=1000) public String proximaAcao;
 @Column(columnDefinition="TEXT") public String observacao;
 public LocalDate prazo;
 public LocalDate inicio;
 public LocalDate fim;
 @Column(precision=15,scale=3) public BigDecimal quantidade;
 @Column(name="quantidade_consumida",precision=15,scale=3) public BigDecimal quantidadeConsumida = BigDecimal.ZERO;
 @Column(precision=15,scale=2) public BigDecimal valor;
 @Column(precision=10,scale=2) public BigDecimal horas;
 @Column(precision=10,scale=2) public BigDecimal capacidade;
 @Column(name="created_at",nullable=false) public LocalDateTime createdAt;
 @Column(name="updated_at",nullable=false) public LocalDateTime updatedAt;
 @Column(name="closed_at") public LocalDateTime closedAt;
 @Column(name="created_by") public Integer createdBy;
 @PrePersist void create(){createdAt=updatedAt=LocalDateTime.now();}
 @PreUpdate void update(){updatedAt=LocalDateTime.now();}
}
