package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "usuario_consentimento_lgpd",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_consentimento_usuario_versoes",
                        columnNames = {"usuario_id", "versao_termos", "versao_privacidade"}))
public class UsuarioConsentimentoLgpd extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "usuario_id", nullable = false)
    public Integer usuarioId;

    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Column(name = "versao_termos", nullable = false, length = 32)
    public String versaoTermos;

    @Column(name = "versao_privacidade", nullable = false, length = 32)
    public String versaoPrivacidade;

    @Column(name = "aceite_em", nullable = false)
    public LocalDateTime aceiteEm;

    @Column(name = "ip_origem", length = 64)
    public String ipOrigem;

    @Column(name = "user_agent", length = 512)
    public String userAgent;
}
