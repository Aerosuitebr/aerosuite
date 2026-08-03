package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "os")
public class OS extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "id_os", nullable = false)
    public Integer idOs;

    @Column(name = "ads_das", length = 255)
    public String adsDas;

    @Column(name = "ata_manual", length = 50)
    public String ataManual;

    @Column(name = "cliente_nome", length = 255)
    public String clienteNome;

    @Column(name = "data_conclusao_serv")
    public LocalDate dataConclusaoServ;

    @Column(name = "data_fechamento")
    public LocalDate dataFechamento;

    @Column(name = "data_rev_manual")
    public LocalDate dataRevManual;

    @Column(name = "dt_abertura")
    public LocalDate dtAbertura;

    @Column(name = "id_fabricante")
    public Integer idFabricante;

    @Column(name = "id_fcu")
    public Integer idFcu;

    @Column(name = "tsn", length = 100)
    public String tsn;

    @Column(name = "tso", length = 100)
    public String tso;

    @Column(name = "marcas_matricula", length = 50)
    public String marcasMatricula;

    @Column(name = "motor", length = 30)
    public String motor;

    @Column(name = "sn_motor", length = 30)
    public String snMotor;

    @Column(name = "manual_pn", length = 5000)
    public String manualPn;

    @Column(name = "num_os_original", length = 100)
    public String numOsOriginal;

    @Column(name = "num_revisao", length = 100)
    public String numRevisao;

    @Column(name = "obs_conclusao_serv", columnDefinition = "TEXT")
    public String obsConclusaoServ;

    @Column(name = "obs_fim_serv", columnDefinition = "TEXT")
    public String obsFimServ;

    @Column(name = "serial_number", length = 100)
    public String serialNumber;

    @Column(name = "obs_ini_serv", columnDefinition = "TEXT")
    public String obsIniServ;

    @Column(name = "solicitacao_trocas_comentario", columnDefinition = "TEXT")
    public String solicitacaoTrocasComentario;

    /** Evita reenvio de e-mail a cada salvamento enquanto ainda houver itens não pagos */
    @Column(name = "email_trocas_nao_pagas_enviado")
    public Boolean emailTrocasNaoPagasEnviado = false;

    @Column(name = "inicio_servico", columnDefinition = "TEXT")
    public String inicioServico;

    @Column(name = "fim_servico", columnDefinition = "TEXT")
    public String fimServico;

    @Column(name = "tipo_servico", length = 100)
    public String tipoServico;

    @Column(name = "titulo_ads", length = 255)
    public String tituloAds;

    @Column(name = "titulo_afins", length = 255)
    public String tituloAfins;

    @Column(name = "boletins_serv_afins", columnDefinition = "TEXT")
    public String boletinsServAfins;

    @Column(name = "part_number", length = 100)
    public String partNumber;

    // Audit fields
    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    public String createdBy;

    @Column(name = "is_active")
    public Boolean isActive = true;

    /** P5.3 — fila de capacidade: NORMAL ou AOG */
    @Column(name = "prioridade_fila", length = 20, nullable = false)
    public String prioridadeFila = "NORMAL";

    /** P5.3 — estágio no quadro kanban */
    @Column(name = "fila_estagio", length = 30, nullable = false)
    public String filaEstagio = "AGUARDANDO";

    @Column(name = "data_prevista_conclusao")
    public LocalDate dataPrevistaConclusao;

    /** P5.3.4 — quando true, sync de déficit não altera {@code fila_estagio}. */
    @Column(name = "fila_estagio_travada", nullable = false)
    public Boolean filaEstagioTravada = false;

    /** P5.3.2 — bay / hangar físico da OS no quadro de capacidade. */
    @Column(name = "hangar_id")
    public Long hangarId;

    @Column(name = "crs_emitido_em")
    public LocalDateTime crsEmitidoEm;

    @Column(name = "crs_liberado_por_usuario_id")
    public Long crsLiberadoPorUsuarioId;

    @Column(name = "crs_liberado_por_nome", length = 255)
    public String crsLiberadoPorNome;

    @Column(name = "crs_liberado_por_cargo", length = 120)
    public String crsLiberadoPorCargo;

    @Column(name = "crs_certificado_numero", length = 80)
    public String crsCertificadoNumero;

    @Column(name = "crs_observacoes", columnDefinition = "TEXT")
    public String crsObservacoes;

    @Column(name = "crs_checklist_json", columnDefinition = "TEXT")
    public String crsChecklistJson;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
