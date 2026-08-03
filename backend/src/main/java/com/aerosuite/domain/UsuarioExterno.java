package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidade que representa um usuário externo (cliente) do sistema.
 * Usuários externos têm acesso restrito a funcionalidades específicas
 * e podem visualizar apenas as informações que foram explicitamente liberadas.
 */
@Entity
@Table(
        name = "usuario_externo",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_usuario_externo_tenant_email",
                columnNames = {"tenant_id", "email"}))
public class UsuarioExterno extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;

    @Column(name = "tenant_id", nullable = false)
    public Long orgTenantId = TenantConstants.DEFAULT_TENANT_ID;
    
    @Column(name = "nome", nullable = false)
    public String nome;
    
    @Column(name = "email", nullable = false)
    public String email;
    
    @Column(name = "senha", nullable = false)
    public String senha;
    
    @Column(name = "empresa")
    public String empresa;
    
    @Column(name = "telefone")
    public String telefone;
    
    @Column(name = "cargo")
    public String cargo;
    
    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;
    
    @Column(name = "foto_perfil")
    public String fotoPerfil;
    
    @Column(name = "ativo")
    public Boolean ativo = true;
    
    @Column(name = "precisa_trocar_senha")
    public Boolean precisaTrocarSenha = true;
    
    @Column(name = "data_cadastro")
    public LocalDate dataCadastro;
    
    @Column(name = "ultimo_acesso")
    public LocalDateTime ultimoAcesso;

    @Column(name = "convite_enviado_em")
    public LocalDateTime conviteEnviadoEm;
    
    @Column(name = "criado_por")
    public Integer criadoPor;

    @Column(name = "cliente_proposta_id")
    public Integer clientePropostaId;

    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (dataCadastro == null) {
            dataCadastro = LocalDate.now();
        }
        if (ativo == null) {
            ativo = true;
        }
        if (precisaTrocarSenha == null) {
            precisaTrocarSenha = true;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // ========================================
    // Métodos de busca estáticos
    // ========================================
    
    public static UsuarioExterno findByEmail(String email) {
        return find("email = ?1", email).firstResult();
    }
    
    public static UsuarioExterno findByEmailAndAtivo(String email) {
        return find("email = ?1 and ativo = ?2", email, true).firstResult();
    }
    
    public static List<UsuarioExterno> findAllAtivos() {
        return list("ativo = ?1", true);
    }
    
    public static List<UsuarioExterno> findByEmpresa(String empresa) {
        return list("empresa = ?1 and ativo = ?2", empresa, true);
    }
    
    public static List<UsuarioExterno> findByCriadoPor(Integer usuarioId) {
        return list("criadoPor = ?1", usuarioId);
    }
    
    public static long countAtivos() {
        return count("ativo = ?1", true);
    }
}
