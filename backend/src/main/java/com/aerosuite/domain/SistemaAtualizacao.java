package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sistema_atualizacao")
public class SistemaAtualizacao extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    
    @Column(name = "versao_disponivel", length = 50)
    public String versaoDisponivel;
    
    @Column(name = "versao_atual", length = 50)
    public String versaoAtual;
    
    @Column(name = "status", length = 50, nullable = false)
    public String status; // DISPONIVEL, APROVADA, EM_ANDAMENTO, CONCLUIDA, CANCELADA
    
    @Column(name = "aprovado_por")
    public Integer aprovadoPor;
    
    @Column(name = "data_aprovacao")
    public LocalDateTime dataAprovacao;
    
    @Column(name = "data_inicio")
    public LocalDateTime dataInicio;
    
    @Column(name = "data_conclusao")
    public LocalDateTime dataConclusao;
    
    @Column(name = "contador_regressivo")
    public Integer contadorRegressivo; // segundos restantes
    
    @Column(name = "mensagem", columnDefinition = "TEXT")
    public String mensagem;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "DISPONIVEL";
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

