package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;
@Entity @Table(name="operacao_evento")
public class OperacaoEvento extends PanacheEntityBase {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 @TenantId @Column(name="tenant_id",nullable=false) public String tenantId;
 @Column(name="registro_id",nullable=false) public Long registroId;
 @Column(nullable=false,length=1000) public String descricao;
 @Column(length=180) public String autor;
 @Column(name="created_at",nullable=false) public LocalDateTime createdAt;
}
