package com.aerosuite.domain;

import com.aerosuite.model.Perfil;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Entity
@Table(
        name = "usuario",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_usuario_tenant_email",
                columnNames = {"tenant_id", "email"}))
public class Usuario extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;

  /** Evita colisão com o parâmetro interno Hibernate {@code tenantId} em modo DISCRIMINATOR. */
    @Column(name = "tenant_id", nullable = false)
    public Long orgTenantId = TenantConstants.DEFAULT_TENANT_ID;

    public String email;
    public String nome;
    public String senha;
    @Column(name = "data_cadastro")
    public LocalDate dataCadastro;
    
    @Column(name = "ultimo_acesso")
    public LocalDateTime ultimoAcesso;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfil_id")
    public Perfil perfil;
    
    @Column(name = "ativo")
    public Boolean ativo = true;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
    @Column(name = "foto_perfil")
    public String fotoPerfil;

    /** Backup da imagem (disco + BD); usado quando o ficheiro em uploads não existe após deploy/rebuild. */
    @Lob
    @Column(name = "foto_perfil_dados")
    public byte[] fotoPerfilDados;
    
    @Column(name = "precisa_trocar_senha")
    public Boolean precisaTrocarSenha = false;

    /** Locale UI (pt-BR, en-US, es-ES, fr-FR) para notificações in-app. */
    @Column(name = "idioma", length = 10)
    public String idioma;

    /** INSTANT | DIGEST_DAILY | OFF — e-mails transacionais de chamados. */
    @Column(name = "notif_ticket_email_modo", nullable = false, length = 16)
    public String notifTicketEmailModo = TicketEmailModo.INSTANT;

    @Column(name = "mfa_totp_secret", length = 512)
    public String mfaTotpSecret;

    @Column(name = "mfa_enabled")
    public Boolean mfaEnabled = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (dataCadastro == null) {
            dataCadastro = LocalDate.now();
        }
        ultimoAcesso = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
