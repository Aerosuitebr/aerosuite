package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entidade para Histórico de Envios de Proposta Comercial
 */
@Entity
@Table(name = "proposta_comercial_envio")
public class PropostaComercialEnvio extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proposta_comercial", nullable = false)
    public PropostaComercial propostaComercial;

    @Column(name = "tipo_envio", nullable = false, length = 20)
    public String tipoEnvio; // EMAIL, WHATSAPP

    @Column(name = "canal", length = 50)
    public String canal; // corpo, anexo, whatsapp_web, etc

    @Column(name = "destinatario_email", length = 150)
    public String destinatarioEmail;

    @Column(name = "destinatario_telefone", length = 30)
    public String destinatarioTelefone;

    @Column(name = "destinatario_nome", length = 200)
    public String destinatarioNome;

    @Column(name = "remetente_email", length = 150)
    public String remetenteEmail;

    @Column(name = "remetente_telefone", length = 30)
    public String remetenteTelefone;

    @Column(name = "remetente_nome", length = 200)
    public String remetenteNome;

    @Column(name = "assunto", length = 500)
    public String assunto;

    @Column(name = "mensagem_adicional", columnDefinition = "TEXT")
    public String mensagemAdicional;

    @Column(name = "status", length = 30)
    public String status = "ENVIADO"; // ENVIADO, FALHA, PENDENTE

    @Column(name = "mensagem_erro", columnDefinition = "TEXT")
    public String mensagemErro;

    @Column(name = "data_envio")
    public LocalDateTime dataEnvio;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.dataEnvio == null) {
            this.dataEnvio = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "ENVIADO";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
