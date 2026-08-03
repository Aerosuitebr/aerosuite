package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;

@Entity
@Table(name = "cliente_proposta")
public class ClienteProposta extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
    
    @Column(name = "nome", length = 200, nullable = false)
    public String nome;
    
    @Column(name = "cnpj_cpf", length = 20)
    public String cnpjCpf;
    
    @Column(name = "email", length = 100)
    public String email;
    
    @Column(name = "telefone", length = 20)
    public String telefone;
    
    @Column(name = "contato", length = 100)
    public String contato;
    
    @Column(name = "endereco", length = 300)
    public String endereco;
    
    @Column(name = "cidade", length = 100)
    public String cidade;
    
    @Column(name = "estado", length = 2)
    public String estado;
    
    @Column(name = "cep", length = 10)
    public String cep;
    
    @Column(name = "observacao", length = 5000)
    public String observacao;
    
    @Column(name = "is_active")
    public Boolean isActive = true;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    public Integer createdBy;

    /** Locale preferido para e-mails transacionais (pt-BR, en-US, es-ES, fr-FR). */
    @Column(name = "idioma", length = 10)
    public String idioma;
    
    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
