package com.aerosuite.domain;

import com.aerosuite.service.TicketSlaPolicy;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
        name = "ticket",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_ticket_tenant_numero",
                columnNames = {"tenant_id", "numero"}))
public class Ticket extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "numero", nullable = false, length = 20)
    public String numero;

    @Column(name = "titulo", nullable = false, length = 255)
    public String titulo;

    @Column(name = "descricao", columnDefinition = "TEXT")
    public String descricao;

    @Column(name = "tipo", nullable = false, length = 50)
    public String tipo; // ERRO, MELHORIA, DUVIDA, SOLICITACAO

    @Column(name = "prioridade", nullable = false, length = 20)
    public String prioridade; // BAIXA, MEDIA, ALTA, CRITICA

    @Column(name = "status", nullable = false, length = 30)
    public String status; // ABERTO, EM_ANALISE, EM_ANDAMENTO, AGUARDANDO_USUARIO, RESOLVIDO, FECHADO

    @Column(name = "categoria", length = 100)
    public String categoria; // Módulo do sistema afetado

    @Column(name = "subcategoria", length = 100)
    public String subcategoria;

    @Column(name = "passos_reproduzir", columnDefinition = "TEXT")
    public String passosReproduzir;

    @Column(name = "comportamento_esperado", columnDefinition = "TEXT")
    public String comportamentoEsperado;

    @Column(name = "comportamento_atual", columnDefinition = "TEXT")
    public String comportamentoAtual;

    @Column(name = "ambiente", length = 50)
    public String ambiente; // PRODUCAO, HOMOLOGACAO, DESENVOLVIMENTO

    @Column(name = "navegador", length = 100)
    public String navegador;

    @Column(name = "sistema_operacional", length = 100)
    public String sistemaOperacional;

    @Column(name = "versao_sistema", length = 50)
    public String versaoSistema;

    // Relacionamentos com usuário
    @Column(name = "usuario_id")
    public Long usuarioId;

    @Column(name = "usuario_nome", length = 255)
    public String usuarioNome;

    @Column(name = "usuario_email", length = 255)
    public String usuarioEmail;

    // Atendente responsável
    @Column(name = "atendente_id")
    public Long atendenteId;

    @Column(name = "atendente_nome", length = 255)
    public String atendenteNome;

    // SLA e datas
    @Column(name = "data_abertura", nullable = false)
    public LocalDateTime dataAbertura;

    @Column(name = "data_primeira_resposta")
    public LocalDateTime dataPrimeiraResposta;

    @Column(name = "data_resolucao")
    public LocalDateTime dataResolucao;

    @Column(name = "data_fechamento")
    public LocalDateTime dataFechamento;

    @Column(name = "data_ultima_atualizacao")
    public LocalDateTime dataUltimaAtualizacao;

    @Column(name = "sla_primeira_resposta_horas")
    public Integer slaPrimeiraRespostaHoras;

    @Column(name = "sla_resolucao_horas")
    public Integer slaResolucaoHoras;

    @Column(name = "sla_primeira_resposta_minutos")
    public Integer slaPrimeiraRespostaMinutos;

    @Column(name = "sla_resolucao_minutos")
    public Integer slaResolucaoMinutos;

    @Column(name = "sla_primeira_resposta_estourado")
    public Boolean slaPrimeiraRespostaEstourado = false;

    @Column(name = "sla_resolucao_estourado")
    public Boolean slaResolucaoEstourado = false;

    // Feedback do usuário
    @Column(name = "avaliacao")
    public Integer avaliacao; // 1 a 5 estrelas

    @Column(name = "comentario_avaliacao", columnDefinition = "TEXT")
    public String comentarioAvaliacao;

    @Column(name = "is_active")
    public Boolean isActive = true;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    public List<TicketAttachment> anexos;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    public List<TicketComment> comentarios;

    @PrePersist
    public void prePersist() {
        if (this.dataAbertura == null) {
            this.dataAbertura = LocalDateTime.now();
        }
        if (this.dataUltimaAtualizacao == null) {
            this.dataUltimaAtualizacao = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "ABERTO";
        }
        if (this.numero == null) {
            this.numero = gerarNumeroTicket();
        }
        definirSLA();
    }

    /** Recalcula SLA (prioridade + ambiente + categoria). */
    public void aplicarPoliticaSla() {
        definirSLA();
    }

    @PreUpdate
    public void preUpdate() {
        this.dataUltimaAtualizacao = LocalDateTime.now();
    }

    private String gerarNumeroTicket() {
        // Formato: TKT-YYYYMMDD-XXXX
        String dataFormatada = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now());
        Long count = Ticket.count("numero like ?1", "TKT-" + dataFormatada + "-%");
        return String.format("TKT-%s-%04d", dataFormatada, count + 1);
    }

    private void definirSLA() {
        TicketSlaPolicy.SlaTargets sla =
                TicketSlaPolicy.calcular(this.prioridade, this.ambiente, this.categoria);
        this.slaPrimeiraRespostaMinutos = sla.primeiraRespostaMinutos();
        this.slaResolucaoMinutos = sla.resolucaoMinutos();
        this.slaPrimeiraRespostaHoras = sla.primeiraRespostaHoras();
        this.slaResolucaoHoras = sla.resolucaoHoras();
    }
}
