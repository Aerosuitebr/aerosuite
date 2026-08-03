package com.aerosuite.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class UserDto {
    public Integer id;
    /** Tenant lógico (claim JWT {@code tid}); alinhado a {@code usuario.orgTenantId}. */
    public Long tenantId;
    public String tenantCodigo;
    public String tenantNome;
    public String email;
    public String nome;
    public String role;
    public PerfilDto perfil;
    /** Códigos ativos do perfil + delegações (mesma semântica do {@code PermissionProfileService}). */
    public List<String> funcionalidadeCodigos;
    /** Itens de menu efetivos (perfil + delegações), pré-calculados no login para evitar {@code GET /meu-menu}. */
    public List<FuncionalidadeDTO> menuFuncionalidades;
    public LocalDate dataCadastro;
    public LocalDateTime ultimoAcesso;
    public String fotoPerfil;
    public Boolean precisaTrocarSenha = false;
    /** Módulos SaaS habilitados no tenant (MRO, ESTOQUE, COMERCIAL). */
    public List<String> modulosHabilitados;
    /** Feature flags finas habilitadas no tenant (catálogo {@code TenantFeatureCatalog}). */
    public List<String> tenantFeatures;
    public Boolean lgpdAceitePendente;
    public String billingStatus;

    public UserDto() {}
    
    public UserDto(Integer id, String email, String nome, String role) {
        this.id = id;
        this.email = email;
        this.nome = nome;
        this.role = role;
    }
    
    public static class PerfilDto {
        public Integer id;
        public String nome;
        public String descricao;
        public String codigo;
        
        public PerfilDto() {}
    }
}
