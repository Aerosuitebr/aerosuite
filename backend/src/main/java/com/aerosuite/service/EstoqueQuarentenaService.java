package com.aerosuite.service;

import com.aerosuite.domain.ItemEstoque;
import com.aerosuite.domain.MovimentacaoEstoque;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.ItemEstoqueDto;
import com.aerosuite.dto.QuarentenaEnviarRequest;
import com.aerosuite.dto.QuarentenaLiberarRequest;
import com.aerosuite.estoque.QuarentenaDisposicao;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class EstoqueQuarentenaService {

    public static final String ERROR_MOTIVO_OBRIGATORIO = "estoque.quarentena.error.motivo_obrigatorio";
    public static final String ERROR_STATUS_INVALIDO_ENVIO = "estoque.quarentena.error.status_invalido_envio";
    public static final String ERROR_NAO_EM_QUARENTENA = "estoque.quarentena.error.nao_em_quarentena";
    public static final String ERROR_DISPOSICAO_OBRIGATORIA = "estoque.quarentena.error.disposicao_obrigatoria";
    public static final String ERROR_ITEM_INDISPONIVEL_SAIDA = "estoque.quarentena.error.item_indisponivel_saida";

    private static final Set<ItemEstoque.StatusItemEstoque> STATUS_ENVIA_QUARENTENA =
            EnumSet.of(ItemEstoque.StatusItemEstoque.DISPONIVEL, ItemEstoque.StatusItemEstoque.RESERVADO);

    @Inject
    Instance<EstoqueService> estoqueServiceInstance;

    @Inject
    TenantDataAccess tenantDataAccess;

    private EstoqueService estoque() {
        return estoqueServiceInstance.get();
    }

    public List<ItemEstoqueDto> listar(int page, int size, String search) {
        return estoque().listarItensEstoque(page, size, search, "QUARENTENA", null, null, null);
    }

    public long contar(String search) {
        return estoque().contarItensEstoque(search, "QUARENTENA", null, null, null);
    }

    @Transactional
    public ItemEstoqueDto enviar(Long itemId, QuarentenaEnviarRequest req, Long usuarioId, String usuarioNome) {
        if (req == null || req.motivo == null || req.motivo.isBlank()) {
            throw new IllegalStateException(ERROR_MOTIVO_OBRIGATORIO);
        }
        ItemEstoque item = requireItem(itemId);
        if (!STATUS_ENVIA_QUARENTENA.contains(item.status)) {
            throw new IllegalStateException(ERROR_STATUS_INVALIDO_ENVIO);
        }
        String statusAnterior = item.status.name();
        item.status = ItemEstoque.StatusItemEstoque.QUARENTENA;
        item.quarentenaMotivo = req.motivo.trim();
        item.quarentenaInicioEm = LocalDateTime.now();
        item.quarentenaInicioUsuarioId = usuarioId;
        item.quarentenaInicioUsuarioNome = usuarioNome;
        item.quarentenaFimEm = null;
        item.quarentenaFimUsuarioId = null;
        item.quarentenaFimUsuarioNome = null;
        item.quarentenaDisposicao = null;
        item.quarentenaObservacoes =
                req.observacoes != null && !req.observacoes.isBlank() ? req.observacoes.trim() : null;
        item.persist();

        registrarMov(
                item,
                MovimentacaoEstoque.TipoMovimentacao.QUARENTENA,
                usuarioId,
                usuarioNome,
                "Material enviado para quarentena (status anterior: " + statusAnterior + ")",
                req.motivo.trim());
        return estoque().buscarItemEstoque(item.id);
    }

    @Transactional
    public ItemEstoqueDto liberar(Long itemId, QuarentenaLiberarRequest req, Long usuarioId, String usuarioNome) {
        if (req == null) {
            throw new IllegalStateException(ERROR_DISPOSICAO_OBRIGATORIA);
        }
        QuarentenaDisposicao disposicao =
                QuarentenaDisposicao.parse(req.disposicao)
                        .orElseThrow(() -> new IllegalStateException(ERROR_DISPOSICAO_OBRIGATORIA));

        ItemEstoque item = requireItem(itemId);
        if (item.status != ItemEstoque.StatusItemEstoque.QUARENTENA) {
            throw new IllegalStateException(ERROR_NAO_EM_QUARENTENA);
        }

        item.quarentenaFimEm = LocalDateTime.now();
        item.quarentenaFimUsuarioId = usuarioId;
        item.quarentenaFimUsuarioNome = usuarioNome;
        item.quarentenaDisposicao = disposicao.name();
        if (req.observacoes != null && !req.observacoes.isBlank()) {
            String extra = req.observacoes.trim();
            item.quarentenaObservacoes =
                    item.quarentenaObservacoes != null && !item.quarentenaObservacoes.isBlank()
                            ? item.quarentenaObservacoes + "\n" + extra
                            : extra;
        }

        switch (disposicao) {
            case LIBERAR_ESTOQUE -> {
                item.status = ItemEstoque.StatusItemEstoque.DISPONIVEL;
                registrarMov(
                        item,
                        MovimentacaoEstoque.TipoMovimentacao.LIBERACAO_QUARENTENA,
                        usuarioId,
                        usuarioNome,
                        "Material liberado da quarentena para estoque disponível",
                        disposicao.name());
            }
            case DESCARTAR -> {
                item.status = ItemEstoque.StatusItemEstoque.DESCARTADO;
                item.isActive = false;
                registrarMov(
                        item,
                        MovimentacaoEstoque.TipoMovimentacao.DESCARTE,
                        usuarioId,
                        usuarioNome,
                        "Descarte após quarentena (material não conforme)",
                        disposicao.name());
            }
            case DEVOLVER_FORNECEDOR -> {
                item.status = ItemEstoque.StatusItemEstoque.DEVOLVIDO;
                registrarMov(
                        item,
                        MovimentacaoEstoque.TipoMovimentacao.DEVOLUCAO,
                        usuarioId,
                        usuarioNome,
                        "Devolução ao fornecedor após quarentena",
                        disposicao.name());
            }
            default -> throw new IllegalStateException(ERROR_DISPOSICAO_OBRIGATORIA);
        }
        item.persist();
        if (item.lote != null) {
            estoque().sincronizarQuantidadesLote(item.lote.id);
        }
        return estoque().buscarItemEstoque(item.id);
    }

    public void assertDisponivelParaSaida(ItemEstoque item) {
        if (item == null) {
            return;
        }
        if (item.status == ItemEstoque.StatusItemEstoque.QUARENTENA
                || item.status == ItemEstoque.StatusItemEstoque.BLOQUEADO) {
            throw new IllegalStateException(ERROR_ITEM_INDISPONIVEL_SAIDA);
        }
    }

    private ItemEstoque requireItem(Long id) {
        ItemEstoque item = ItemEstoque.find("id = ?1", id).firstResult();
        if (item == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode("estoque.error.item_not_found", "id", String.valueOf(id)));
        }
        return item;
    }

    private void registrarMov(
            ItemEstoque item,
            MovimentacaoEstoque.TipoMovimentacao tipo,
            Long usuarioId,
            String usuarioNome,
            String motivo,
            String obs) {
        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.tenantId =
                item.tenantId != null ? item.tenantId : TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());
        mov.itemEstoque = item;
        mov.tipoMovimentacao = tipo;
        mov.quantidade = item.quantidade != null ? item.quantidade : BigDecimal.ZERO;
        mov.quantidadeAnterior = mov.quantidade;
        mov.quantidadePosterior = mov.quantidade;
        mov.usuarioId = usuarioId != null ? usuarioId : 0L;
        mov.usuarioNome = usuarioNome;
        mov.localizacaoOrigem = item.localizacao;
        mov.motivo = motivo;
        mov.observacoes = obs;
        mov.persist();
    }
}
