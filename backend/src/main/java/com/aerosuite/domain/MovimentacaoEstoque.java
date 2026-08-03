package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimentacao_estoque")
public class MovimentacaoEstoque extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_estoque_id", nullable = false)
    public ItemEstoque itemEstoque;
    
    @Column(name = "item_estoque_id", insertable = false, updatable = false)
    public Long itemEstoqueId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_movimentacao", nullable = false)
    public TipoMovimentacao tipoMovimentacao;
    
    @Column(name = "quantidade", nullable = false, precision = 10, scale = 3)
    public BigDecimal quantidade;
    
    @Column(name = "quantidade_anterior", precision = 10, scale = 3)
    public BigDecimal quantidadeAnterior;
    
    @Column(name = "quantidade_posterior", precision = 10, scale = 3)
    public BigDecimal quantidadePosterior;
    
    @Column(name = "invoice_id")
    public Long invoiceId;
    
    @Column(name = "os_id")
    public Long osId;
    
    @Column(name = "lote_id")
    public Long loteId;
    
    @Column(name = "localizacao_origem", length = 100)
    public String localizacaoOrigem;
    
    @Column(name = "localizacao_destino", length = 100)
    public String localizacaoDestino;
    
    @Column(name = "usuario_id", nullable = false)
    public Long usuarioId;
    
    @Column(name = "usuario_nome", length = 255)
    public String usuarioNome;
    
    @Column(name = "motivo", columnDefinition = "TEXT")
    public String motivo;
    
    @Column(name = "observacoes", columnDefinition = "TEXT")
    public String observacoes;
    
    @Column(name = "data_movimentacao")
    public LocalDateTime dataMovimentacao;

    /** OS_FCU_KIT, TROCAS_EVENTUAL, etc. */
    @Column(name = "origem_saida", length = 40)
    public String origemSaida;

    @Column(name = "id_produto_catalogo")
    public Integer idProdutoCatalogo;

    @Column(name = "chave_idempotencia", length = 160)
    public String chaveIdempotencia;
    
    @PrePersist
    public void prePersist() {
        if (dataMovimentacao == null) {
            dataMovimentacao = LocalDateTime.now();
        }
    }
    
    /**
     * Cria uma movimentação de entrada (recebimento de mercadoria)
     */
    public static MovimentacaoEstoque criarEntrada(ItemEstoque item, BigDecimal quantidade, 
            Long invoiceId, Long usuarioId, String usuarioNome) {
        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.itemEstoque = item;
        mov.tipoMovimentacao = TipoMovimentacao.ENTRADA;
        mov.quantidade = quantidade;
        mov.quantidadeAnterior = BigDecimal.ZERO;
        mov.quantidadePosterior = quantidade;
        mov.invoiceId = invoiceId;
        mov.usuarioId = usuarioId;
        mov.usuarioNome = usuarioNome;
        mov.localizacaoDestino = item.localizacao;
        mov.motivo = "Entrada de mercadoria via invoice";
        return mov;
    }
    
    /**
     * Cria uma movimentação de saída (consumo em OS)
     */
    public static MovimentacaoEstoque criarSaida(ItemEstoque item, BigDecimal quantidade,
            Long osId, Long usuarioId, String usuarioNome, String motivo) {
        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.itemEstoque = item;
        mov.tipoMovimentacao = TipoMovimentacao.SAIDA;
        mov.quantidade = quantidade;
        mov.quantidadeAnterior = item.quantidade;
        mov.quantidadePosterior = item.quantidade.subtract(quantidade);
        mov.osId = osId;
        mov.usuarioId = usuarioId;
        mov.usuarioNome = usuarioNome;
        mov.localizacaoOrigem = item.localizacao;
        mov.motivo = motivo != null ? motivo : "Consumo em Ordem de Serviço";
        return mov;
    }
    
    /**
     * Cria uma movimentação de transferência
     */
    public static MovimentacaoEstoque criarTransferencia(ItemEstoque item, 
            String localizacaoOrigem, String localizacaoDestino,
            Long usuarioId, String usuarioNome) {
        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.itemEstoque = item;
        mov.tipoMovimentacao = TipoMovimentacao.TRANSFERENCIA;
        mov.quantidade = item.quantidade;
        mov.quantidadeAnterior = item.quantidade;
        mov.quantidadePosterior = item.quantidade;
        mov.localizacaoOrigem = localizacaoOrigem;
        mov.localizacaoDestino = localizacaoDestino;
        mov.usuarioId = usuarioId;
        mov.usuarioNome = usuarioNome;
        mov.motivo = "Transferência de localização";
        return mov;
    }
    
    public enum TipoMovimentacao {
        ENTRADA, SAIDA, TRANSFERENCIA, AJUSTE, DEVOLUCAO, DESCARTE, QUARENTENA, LIBERACAO_QUARENTENA
    }
}
