package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "nrc",
    uniqueConstraints = @UniqueConstraint(name = "uk_nrc_tenant_numero", columnNames = {"tenant_id", "numero"})
)
public class Nrc extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, length = 64)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "numero", nullable = false, length = 32)
    public String numero;

    @Column(name = "status", nullable = false, length = 30)
    public String status = "ABERTA";

    @Column(name = "data_deteccao", nullable = false)
    public LocalDateTime dataDeteccao;

    @Column(name = "data_ocorrencia")
    public LocalDateTime dataOcorrencia;

    @Column(name = "detectado_por_id")
    public Long detectadoPorId;

    @Column(name = "detectado_por_nome", length = 255)
    public String detectadoPorNome;

    @Column(name = "origem", nullable = false, length = 255)
    public String origem;

    @Column(name = "tipo_nc", nullable = false, length = 30)
    public String tipoNc;

    @Column(name = "severidade", nullable = false, length = 20)
    public String severidade = "MENOR";

    @Column(name = "descricao_ocorrido", nullable = false, columnDefinition = "TEXT")
    public String descricaoOcorrido;

    @Column(name = "requisito_nao_atendido", columnDefinition = "TEXT")
    public String requisitoNaoAtendido;

    @Column(name = "documento_envolvido", columnDefinition = "TEXT")
    public String documentoEnvolvido;

    @Column(name = "requisito_referencia", length = 100)
    public String requisitoReferencia;

    @Column(name = "evidencias_texto", columnDefinition = "TEXT")
    public String evidenciasTexto;

    @Column(name = "local_ocorrencia", length = 255)
    public String localOcorrencia;

    @Column(name = "os_id")
    public Long osId;

    @Column(name = "os_numero", length = 30)
    public String osNumero;

    @Column(name = "part_number", length = 100)
    public String partNumber;

    @Column(name = "serial_number", length = 100)
    public String serialNumber;

    @Column(name = "invoice_id")
    public Long invoiceId;

    @Column(name = "invoice_numero", length = 50)
    public String invoiceNumero;

    @Column(name = "lote_id")
    public Long loteId;

    @Column(name = "lote_codigo", length = 50)
    public String loteCodigo;

    @Column(name = "cliente_nome", length = 255)
    public String clienteNome;

    @Column(name = "fcu_id")
    public Long fcuId;

    @Column(name = "fcu_codigo", length = 50)
    public String fcuCodigo;

    @Column(name = "prazo_tratamento")
    public LocalDate prazoTratamento;

    @Column(name = "custo_nao_conformidade", precision = 15, scale = 2)
    public BigDecimal custoNaoConformidade;

    @Column(name = "responsavel_tratamento_id")
    public Long responsavelTratamentoId;

    @Column(name = "responsavel_tratamento_nome", length = 255)
    public String responsavelTratamentoNome;

    @Column(name = "prazo_tratamento_proposto")
    public LocalDate prazoTratamentoProposto;

    @Column(name = "responsavel_tratamento_proposto_id")
    public Long responsavelTratamentoPropostoId;

    @Column(name = "responsavel_tratamento_proposto_nome", length = 255)
    public String responsavelTratamentoPropostoNome;

    @Column(name = "tratamento_proposta_status", length = 30)
    public String tratamentoPropostaStatus;

    @Column(name = "tratamento_proposta_em")
    public LocalDateTime tratamentoPropostaEm;

    @Column(name = "tratamento_aprovado_por_id")
    public Long tratamentoAprovadoPorId;

    @Column(name = "tratamento_aprovado_por_nome", length = 255)
    public String tratamentoAprovadoPorNome;

    @Column(name = "tratamento_aprovado_em")
    public LocalDateTime tratamentoAprovadoEm;

    @Column(name = "contencao_acao", columnDefinition = "TEXT")
    public String contencaoAcao;

    @Column(name = "contencao_responsavel_id")
    public Long contencaoResponsavelId;

    @Column(name = "contencao_responsavel_nome", length = 255)
    public String contencaoResponsavelNome;

    @Column(name = "contencao_data")
    public LocalDateTime contencaoData;

    @Column(name = "contencao_nao_aplicavel")
    public Boolean contencaoNaoAplicavel = false;

    @Column(name = "contencao_oque", columnDefinition = "TEXT")
    public String contencaoOque;

    @Column(name = "contencao_quem", length = 255)
    public String contencaoQuem;

    @Column(name = "contencao_quando", length = 255)
    public String contencaoQuando;

    @Column(name = "contencao_concluida")
    public Boolean contencaoConcluida = false;

    @Column(name = "contencao_data_conclusao")
    public LocalDateTime contencaoDataConclusao;

    @Column(name = "contencao_aprovacao_status", length = 30)
    public String contencaoAprovacaoStatus;

    @Column(name = "contencao_solicitado_em")
    public LocalDateTime contencaoSolicitadoEm;

    @Column(name = "contencao_solicitado_por_id")
    public Long contencaoSolicitadoPorId;

    @Column(name = "contencao_solicitado_por_nome", length = 255)
    public String contencaoSolicitadoPorNome;

    @Column(name = "contencao_aprovado_por_id")
    public Long contencaoAprovadoPorId;

    @Column(name = "contencao_aprovado_por_nome", length = 255)
    public String contencaoAprovadoPorNome;

    @Column(name = "contencao_aprovado_em")
    public LocalDateTime contencaoAprovadoEm;

    @Column(name = "contencao_rejeicao_observacoes", columnDefinition = "TEXT")
    public String contencaoRejeicaoObservacoes;

    @Column(name = "causa_raiz", columnDefinition = "TEXT")
    public String causaRaiz;

    @Column(name = "metodo_causa", length = 30)
    public String metodoCausa;

    @Column(name = "porque_1", columnDefinition = "TEXT")
    public String porque1;

    @Column(name = "porque_2", columnDefinition = "TEXT")
    public String porque2;

    @Column(name = "porque_3", columnDefinition = "TEXT")
    public String porque3;

    @Column(name = "porque_4", columnDefinition = "TEXT")
    public String porque4;

    @Column(name = "porque_5", columnDefinition = "TEXT")
    public String porque5;

    @Column(name = "porques_extra", columnDefinition = "TEXT")
    public String porquesExtra;

    @Column(name = "ishikawa_material", columnDefinition = "TEXT")
    public String ishikawaMaterial;

    @Column(name = "analise_causa_status", length = 30)
    public String analiseCausaStatus;

    @Column(name = "analise_causa_solicitado_em")
    public LocalDateTime analiseCausaSolicitadoEm;

    @Column(name = "analise_causa_solicitado_por_id")
    public Long analiseCausaSolicitadoPorId;

    @Column(name = "analise_causa_solicitado_por_nome", length = 255)
    public String analiseCausaSolicitadoPorNome;

    @Column(name = "analise_causa_aprovado_por_id")
    public Long analiseCausaAprovadoPorId;

    @Column(name = "analise_causa_aprovado_por_nome", length = 255)
    public String analiseCausaAprovadoPorNome;

    @Column(name = "analise_causa_aprovado_em")
    public LocalDateTime analiseCausaAprovadoEm;

    @Column(name = "analise_causa_rejeicao_observacoes", columnDefinition = "TEXT")
    public String analiseCausaRejeicaoObservacoes;

    @Column(name = "acoes_plano_status", length = 30)
    public String acoesPlanoStatus;

    @Column(name = "acoes_plano_solicitado_em")
    public LocalDateTime acoesPlanoSolicitadoEm;

    @Column(name = "acoes_plano_solicitado_por_id")
    public Long acoesPlanoSolicitadoPorId;

    @Column(name = "acoes_plano_solicitado_por_nome", length = 255)
    public String acoesPlanoSolicitadoPorNome;

    @Column(name = "acoes_plano_aprovado_por_id")
    public Long acoesPlanoAprovadoPorId;

    @Column(name = "acoes_plano_aprovado_por_nome", length = 255)
    public String acoesPlanoAprovadoPorNome;

    @Column(name = "acoes_plano_aprovado_em")
    public LocalDateTime acoesPlanoAprovadoEm;

    @Column(name = "acoes_plano_rejeicao_observacoes", columnDefinition = "TEXT")
    public String acoesPlanoRejeicaoObservacoes;

    @Column(name = "disposicao", length = 30)
    public String disposicao;

    @Column(name = "disposicao_observacao", columnDefinition = "TEXT")
    public String disposicaoObservacao;

    @Column(name = "disposicao_aprovada_por_id")
    public Long disposicaoAprovadaPorId;

    @Column(name = "disposicao_aprovada_por_nome", length = 255)
    public String disposicaoAprovadaPorNome;

    @Column(name = "disposicao_data")
    public LocalDateTime disposicaoData;

    @Column(name = "verificacao_eficacia", columnDefinition = "TEXT")
    public String verificacaoEficacia;

    @Column(name = "verificacao_data")
    public LocalDateTime verificacaoData;

    @Column(name = "eficacia_decisao", length = 20)
    public String eficaciaDecisao;

    @Column(name = "eficacia_atualizar_riscos")
    public Boolean eficaciaAtualizarRiscos;

    @Column(name = "eficacia_mudancas_sgq", columnDefinition = "TEXT")
    public String eficaciaMudancasSgq;

    @Column(name = "encerrado_por_id")
    public Long encerradoPorId;

    @Column(name = "encerrado_por_nome", length = 255)
    public String encerradoPorNome;

    @Column(name = "data_encerramento")
    public LocalDateTime dataEncerramento;

    @Column(name = "data_ultima_atualizacao")
    public LocalDateTime dataUltimaAtualizacao;

    @Column(name = "is_active")
    public Boolean isActive = true;

    @OneToMany(mappedBy = "nrc", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    public List<NrcAcao> acoes = new ArrayList<>();

    @OneToMany(mappedBy = "nrc", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    public List<NrcAnexo> anexos = new ArrayList<>();

    @OneToMany(mappedBy = "nrc", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    public List<NrcAuditoria> auditorias = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (dataDeteccao == null) {
            dataDeteccao = LocalDateTime.now();
        }
        if (dataUltimaAtualizacao == null) {
            dataUltimaAtualizacao = LocalDateTime.now();
        }
        if (status == null) {
            status = "ABERTA";
        }
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        dataUltimaAtualizacao = LocalDateTime.now();
    }

    public boolean isEncerrada() {
        return "ENCERRADA".equals(status);
    }
}
