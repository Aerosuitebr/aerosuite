package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "fornecedor",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_fornecedor_tenant_codigo",
                columnNames = {"tenant_id", "codigo"}))
public class Fornecedor extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "codigo", nullable = false, length = 50)
    public String codigo;
    
    @Column(name = "razao_social", nullable = false, length = 255)
    public String razaoSocial;
    
    @Column(name = "nome_fantasia", length = 255)
    public String nomeFantasia;
    
    @Column(name = "cnpj_cpf", length = 20)
    public String cnpjCpf;
    
    @Column(name = "inscricao_estadual", length = 50)
    public String inscricaoEstadual;
    
    @Column(name = "pais_origem", length = 100)
    public String paisOrigem = "Estados Unidos";
    
    @Column(name = "endereco", length = 255)
    public String endereco;
    
    @Column(name = "numero", length = 20)
    public String numero;
    
    @Column(name = "complemento", length = 100)
    public String complemento;
    
    @Column(name = "bairro", length = 100)
    public String bairro;
    
    @Column(name = "cidade", length = 100)
    public String cidade;
    
    @Column(name = "estado", length = 50)
    public String estado;
    
    @Column(name = "cep", length = 20)
    public String cep;
    
    @Column(name = "telefone", length = 50)
    public String telefone;
    
    @Column(name = "email", length = 255)
    public String email;
    
    @Column(name = "website", length = 255)
    public String website;
    
    @Column(name = "contato_nome", length = 255)
    public String contatoNome;
    
    @Column(name = "contato_telefone", length = 50)
    public String contatoTelefone;
    
    @Column(name = "contato_email", length = 255)
    public String contatoEmail;
    
    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;

    @Column(name = "asl_status", length = 24)
    public String aslStatus = "PENDENTE";

    @Column(name = "asl_escopo", length = 255)
    public String aslEscopo;

    @Column(name = "asl_validade")
    public java.time.LocalDate aslValidade;

    @Column(name = "asl_aprovado_em")
    public java.time.LocalDate aslAprovadoEm;

    @Column(name = "asl_observacoes", columnDefinition = "TEXT")
    public String aslObservacoes;
    
    @Column(name = "is_active")
    public Boolean isActive = true;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
    
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
