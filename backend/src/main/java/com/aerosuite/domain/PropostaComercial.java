package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidade para Proposta Comercial
 */
@Entity
@Table(
        name = "proposta_comercial",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_proposta_comercial_tenant_numero",
                columnNames = {"tenant_id", "numero_proposta"}))
public class PropostaComercial extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "numero_proposta", length = 50)
    public String numeroProposta;

    // ========== DADOS DO PRODUTO ==========
    @Column(name = "produto_nome", length = 200)
    public String produtoNome;

    @Column(name = "produto_pn", length = 100)
    public String produtoPn;

    @Column(name = "produto_sn", length = 100)
    public String produtoSn;

    @Column(name = "produto_manual", length = 200)
    public String produtoManual;

    @Column(name = "produto_valor", precision = 15, scale = 2)
    public BigDecimal produtoValor;

    @Column(name = "aplicacao_motor", length = 200)
    public String aplicacaoMotor;

    @Column(name = "aeronave_prefixo", length = 50)
    public String aeronavePrefixo;

    @Column(name = "servico_executado", length = 1000)
    public String servicoExecutado;

    @Column(name = "id_tipo_servico")
    public Integer idTipoServico;

    @Column(name = "tipo_servico_nome", length = 200)
    public String tipoServicoNome;

    // ========== DADOS DO CLIENTE ==========
    @Column(name = "cliente_nome", length = 200)
    public String clienteNome;

    @Column(name = "cliente_cnpj_cpf", length = 20)
    public String clienteCnpjCpf;

    @Column(name = "cliente_email", length = 150)
    public String clienteEmail;

    @Column(name = "cliente_telefone", length = 30)
    public String clienteTelefone;

    @Column(name = "cliente_endereco", length = 500)
    public String clienteEndereco;

    @Column(name = "cliente_bairro", length = 150)
    public String clienteBairro;

    @Column(name = "cliente_cidade", length = 100)
    public String clienteCidade;

    @Column(name = "cliente_estado", length = 2)
    public String clienteEstado;

    @Column(name = "cliente_cep", length = 10)
    public String clienteCep;

    @Column(name = "cliente_contato", length = 150)
    public String clienteContato;

    @Column(name = "cliente_observacao", length = 5000)
    public String clienteObservacao;

    @Column(name = "cliente_proposta_id")
    public Integer clientePropostaId;

    // ========== DADOS DA PROPOSTA ==========
    @Column(name = "data_proposta")
    public LocalDate dataProposta;

    @Column(name = "validade_proposta")
    public LocalDate validadeProposta;

    @Column(name = "prazo_entrega", length = 100)
    public String prazoEntrega;

    @Column(name = "forma_pagamento", length = 200)
    public String formaPagamento;

    /** Observação opcional da proposta (exibida só se preenchida). TEXT para textos longos. */
    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;

    @Column(name = "condicoes_gerais", columnDefinition = "TEXT")
    public String condicoesGerais;

    /** Flag {@code comercial.proposta.camposExtras} */
    @Column(name = "referencia_cliente", length = 120)
    public String referenciaCliente;

    @Column(name = "contato_tecnico", length = 150)
    public String contatoTecnico;

    @Column(name = "centro_custo", length = 80)
    public String centroCusto;

    @Column(name = "status", length = 30)
    public String status; // RASCUNHO, ENVIADA, APROVADA, REJEITADA, CANCELADA

    // ========== DADOS DO DESCONTO ==========
    @Column(name = "desconto_tipo", length = 20)
    public String descontoTipo; // 'percent' ou 'fixed'

    @Column(name = "desconto_percentual", precision = 5, scale = 2)
    public BigDecimal descontoPercentual; // Percentual de desconto (0-100)

    @Column(name = "desconto_valor_fixo", precision = 15, scale = 2)
    public BigDecimal descontoValorFixo; // Valor fixo de desconto

    @Column(name = "desconto_valor_calculado", precision = 15, scale = 2)
    public BigDecimal descontoValorCalculado; // Valor do desconto calculado

    @Column(name = "valor_total_final", precision = 15, scale = 2)
    public BigDecimal valorTotalFinal; // Valor final após desconto

    // ========== CUSTOS ADICIONAIS (BRL) ==========
    @Column(name = "frete_brl", precision = 15, scale = 2)
    public BigDecimal freteBrl; // Valor do frete em Reais

    @Column(name = "mao_de_obra_brl", precision = 15, scale = 2)
    public BigDecimal maoDeObraBrl; // Valor da mão de obra em Reais

    // ========== DADOS DA COTAÇÃO ==========
    @Column(name = "cotacao_dolar", precision = 10, scale = 4)
    public BigDecimal cotacaoDolar; // Cotação do dólar usada

    @Column(name = "data_cotacao")
    public LocalDateTime dataCotacao; // Data/hora da cotação

    // ========== VALORES CONVERTIDOS (USD) ==========
    @Column(name = "frete_usd", precision = 15, scale = 2)
    public BigDecimal freteUsd; // Frete convertido para USD

    @Column(name = "mao_de_obra_usd", precision = 15, scale = 2)
    public BigDecimal maoDeObraUsd; // Mão de obra convertida para USD

    @Column(name = "subtotal_produtos_usd", precision = 15, scale = 2)
    public BigDecimal subtotalProdutosUsd; // Subtotal dos produtos em USD

    @Column(name = "total_geral_usd", precision = 15, scale = 2)
    public BigDecimal totalGeralUsd; // Total geral final em USD

    /** Moeda de negociação/exibição da proposta (USD, BRL ou EUR). */
    @Column(name = "moeda_proposta", length = 3)
    public String moedaProposta;

    /** Total geral em reais quando {@link #moedaProposta} = BRL. */
    @Column(name = "total_geral_brl", precision = 15, scale = 2)
    public BigDecimal totalGeralBrl;

    /** Total geral em euros quando {@link #moedaProposta} = EUR. */
    @Column(name = "total_geral_eur", precision = 15, scale = 2)
    public BigDecimal totalGeralEur;

    // ========== DADOS DA ASSINATURA ==========
    @Column(name = "assinatura_nome", length = 200)
    public String assinaturaNome;

    @Column(name = "assinatura_estilo", length = 50)
    public String assinaturaEstilo;

    @Column(name = "assinatura_font_family", length = 100)
    public String assinaturaFontFamily;

    @Column(name = "assinatura_color", length = 30)
    public String assinaturaColor;

    @Column(name = "assinatura_timestamp")
    public LocalDateTime assinaturaTimestamp;

    // ========== METADADOS ==========
    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    public String createdBy;

    // ========== VÍNCULO OS (P4.1) ==========
    @Column(name = "os_id")
    public Long osId;

    @Column(name = "os_gerada_em")
    public LocalDateTime osGeradaEm;

    @Column(name = "os_gerada_por", length = 100)
    public String osGeradaPor;

    // ========== DECISÃO CLIENTE (P4.2 portal) ==========
    @Column(name = "cliente_decisao_em")
    public LocalDateTime clienteDecisaoEm;

    @Column(name = "cliente_decisao_ip", length = 45)
    public String clienteDecisaoIp;

    @Column(name = "cliente_decisao_user_agent", length = 500)
    public String clienteDecisaoUserAgent;

    @Column(name = "cliente_decisao_motivo", columnDefinition = "TEXT")
    public String clienteDecisaoMotivo;

    @Column(name = "cliente_decisao_usuario_externo_id")
    public Integer clienteDecisaoUsuarioExternoId;

    // ========== RELACIONAMENTOS ==========
    @OneToMany(mappedBy = "propostaComercial", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordem ASC")
    public List<PropostaComercialItem> itens;

    @OneToMany(mappedBy = "propostaComercial", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("dataEnvio DESC")
    public List<PropostaComercialEnvio> envios;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "RASCUNHO";
        }
        if (this.dataProposta == null) {
            this.dataProposta = LocalDate.now();
        }
        if (this.moedaProposta == null || this.moedaProposta.isBlank()) {
            this.moedaProposta = "USD";
        }
        // Gerar número da proposta se não existir
        if (this.numeroProposta == null || this.numeroProposta.isEmpty()) {
            this.numeroProposta = gerarNumeroProposta();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    private String gerarNumeroProposta() {
        // Formato: PROP-YYYYMMDD-XXXX (fallback @PrePersist; create() usa gerarProximoNumeroPropostaUnico no service)
        String prefixo = "PROP-" + java.time.LocalDate.now().toString().replace("-", "");
        long seq = PropostaComercial.count() + 1;
        return prefixo + "-" + String.format("%04d", seq);
    }

    public static PropostaComercial findByOsId(long tenantId, long osId) {
        String tenantKey = String.valueOf(tenantId);
        return find("osId = ?1 and tenantId = ?2", osId, tenantKey).firstResult();
    }
}
