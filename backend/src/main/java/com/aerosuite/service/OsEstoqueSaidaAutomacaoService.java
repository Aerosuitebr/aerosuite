package com.aerosuite.service;

import org.jboss.logging.Logger;
import com.aerosuite.domain.AssociacaoFcu;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.OsKitFcuDeficit;
import com.aerosuite.domain.OsSolicitacaoTrocaItem;
import com.aerosuite.domain.Product;
import com.aerosuite.dto.ConsultaDisponibilidadeLinhaDto;
import com.aerosuite.dto.DisponibilidadePnResultDto;
import com.aerosuite.dto.KitFcuDeficitItemDto;
import com.aerosuite.dto.KitFcuDeficitPreviewDto;
import com.aerosuite.dto.OSSolicitacaoTrocaItemDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Débito automático de estoque ligado à OS: kit do FCU e itens de troca eventual marcados como pagos.
 */
@ApplicationScoped
public class OsEstoqueSaidaAutomacaoService {

    private static final Logger LOG = Logger.getLogger(OsEstoqueSaidaAutomacaoService.class);

    public static final String ORIGEM_KIT_FCU = "OS_FCU_KIT";
    public static final String ORIGEM_TROCAS_EVENTUAL = "TROCAS_EVENTUAL";

    @Inject
    EstoqueService estoqueService;

    @Inject
    OsKitFcuDeficitWriter deficitWriter;

    @Inject
    TenantDataAccess tenantDataAccess;

    /**
     * Calcula o déficit do kit FCU em relação ao estoque atualmente disponível.
     * Não persiste nada; é usado para o preview antes de salvar a OS.
     */
    public KitFcuDeficitPreviewDto previewDeficitKitFcu(Integer fcuId) {
        KitFcuDeficitPreviewDto out = new KitFcuDeficitPreviewDto();
        out.fcuId = fcuId;
        if (fcuId == null || fcuId <= 0) {
            return out;
        }
        List<KitFcuDeficitItemDto> deficits = calcularDeficitParaFcu(fcuId.longValue());
        out.itens = deficits;
        out.quantidadeItensFaltantes = deficits.size();
        out.temDeficit = !deficits.isEmpty();
        return out;
    }

    public void registrarKitFcuAposSalvarOs(OS os, Long usuarioId, String usuarioNome) {
        if (os == null || os.id == null || os.idFcu == null || os.idFcu <= 0) {
            return;
        }
        List<AssociacaoFcu> assocs = AssociacaoFcu.list(
                "idFcu = ?1 and isActive = true", os.idFcu.longValue());
        if (assocs.isEmpty()) {
            return;
        }
        Long uid = usuarioId != null ? usuarioId : 0L;
        String unome = usuarioNome != null ? usuarioNome : "Sistema";

        // Agrega quantidade necessária por P/N do kit (soma associações repetidas no mesmo FCU)
        Map<String, AggKitItem> kitPorPn = montarKitPorPn(assocs, true);

        // 1) Pré-calcula déficits ANTES de consumir, usando o disponível atual.
        List<KitFcuDeficitItemDto> deficits = new ArrayList<>();
        for (AggKitItem agg : kitPorPn.values()) {
            BigDecimal disponivel = estoqueService.somarDisponivelPorPn(agg.pn);
            if (disponivel == null) {
                disponivel = BigDecimal.ZERO;
            }
            BigDecimal necessaria = BigDecimal.valueOf(agg.quantidade);
            if (disponivel.compareTo(necessaria) < 0) {
                BigDecimal deficit = necessaria.subtract(disponivel);
                deficits.add(new KitFcuDeficitItemDto(
                        agg.idProduto, agg.pn, agg.nome, agg.quantidade,
                        disponivel.doubleValue(), deficit.doubleValue()));
            }
        }

        // 2) Consome em modo tolerante (não bloqueia o save da OS).
        for (AggKitItem agg : kitPorPn.values()) {
            String chaveLinha = ORIGEM_KIT_FCU + "|" + os.id + "|P" + agg.idProduto;
            estoqueService.consumirPorPartNumberFifo(
                    os.id,
                    agg.pn,
                    BigDecimal.valueOf(agg.quantidade),
                    uid,
                    unome,
                    "Kit FCU na OS " + os.id + " (FCU " + os.idFcu + ")",
                    ORIGEM_KIT_FCU,
                    agg.idProduto,
                    chaveLinha,
                    false);
        }

        // 3) Persiste déficits em transação separada (REQUIRES_NEW). Falhas aqui NÃO derrubam o save da OS.
        try {
            deficitWriter.substituirDeficitsDaOs(os, deficits);
        } catch (Exception e) {
            LOG.warnf(e, "OsEstoqueSaidaAutomacaoService - persistência de deficit falhou (OS %s): %s",
                    os.id, e.getMessage());
        }
    }

    /**
     * Recalcula o déficit do kit FCU com base no estoque atual e sincroniza a tabela
     * {@code os_kit_fcu_deficit} (para o modal e o indicador na listagem).
     */
    public List<KitFcuDeficitItemDto> listarDeficitDaOs(Long osId) {
        if (osId == null) {
            return List.of();
        }
        try {
            OS os = OS.findById(osId);
            if (os == null) {
                return List.of();
            }
            return sincronizarDeficitPersistido(os);
        } catch (Exception e) {
            LOG.warnf(e, "OsEstoqueSaidaAutomacaoService.listarDeficitDaOs (OS %s): %s", osId, e.getMessage());
            return List.of();
        }
    }

    /**
     * IDs com linhas em {@code os_kit_fcu_deficit} — leitura rápida para a listagem (sem recalcular estoque).
     */
    public Set<Long> osIdsComDeficitPersistido(Set<Long> osIds) {
        if (osIds == null || osIds.isEmpty()) {
            return Set.of();
        }
        try {
            @SuppressWarnings("unchecked")
            List<OsKitFcuDeficit> rows =
                    (List<OsKitFcuDeficit>) (List<?>) OsKitFcuDeficit.list("osId in ?1", osIds);
            if (rows == null || rows.isEmpty()) {
                return Set.of();
            }
            return rows.stream()
                    .map(r -> r.osId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            LOG.warnf(e, "OsEstoqueSaidaAutomacaoService.osIdsComDeficitPersistido: %s", e.getMessage());
            return Set.of();
        }
    }

    /**
     * Subconjunto de IDs de OS que ainda possuem déficit de kit FCU após recalcular
     * contra o estoque disponível atual.
     */
    public Set<Long> filtrarOsIdsComDeficitKitFcu(Set<Long> osIds) {
        if (osIds == null || osIds.isEmpty()) {
            return Set.of();
        }
        try {
            List<OS> oss = OS.find("id in ?1", osIds).list();
            if (oss == null || oss.isEmpty()) {
                return Set.of();
            }
            Set<Long> comDeficit = new java.util.HashSet<>();
            for (OS os : oss) {
                if (os.id == null) {
                    continue;
                }
                List<KitFcuDeficitItemDto> deficits = sincronizarDeficitPersistido(os);
                if (!deficits.isEmpty()) {
                    comDeficit.add(os.id);
                }
            }
            return comDeficit;
        } catch (Exception e) {
            LOG.warnf(e, "OsEstoqueSaidaAutomacaoService.filtrarOsIdsComDeficitKitFcu: %s", e.getMessage());
            return Set.of();
        }
    }

    private List<KitFcuDeficitItemDto> sincronizarDeficitPersistido(OS os) {
        if (os == null || os.id == null) {
            return List.of();
        }
        List<KitFcuDeficitItemDto> deficits = List.of();
        if (os.idFcu != null && os.idFcu > 0) {
            deficits = calcularDeficitParaFcu(os.idFcu.longValue());
        }
        try {
            deficitWriter.substituirDeficitsDaOs(os, deficits);
        } catch (Exception e) {
            LOG.warnf(e, "OsEstoqueSaidaAutomacaoService - sync deficit falhou (OS %s): %s",
                    os.id, e.getMessage());
        }
        return deficits;
    }

    public void debitarTrocasEventuaisPagas(long osPk,
            List<OsSolicitacaoTrocaItem> existing,
            List<OSSolicitacaoTrocaItemDto> incoming,
            Long usuarioId,
            String usuarioNome) {
        if (incoming == null || incoming.isEmpty()) {
            return;
        }
        Map<Long, OsSolicitacaoTrocaItem> oldById = existing == null ? Map.of() : existing.stream()
                .filter(e -> e.id != null)
                .collect(Collectors.toMap(e -> e.id, e -> e, (x, y) -> x));
        Long uid = usuarioId != null ? usuarioId : 0L;
        String unome = usuarioNome != null ? usuarioNome : "Sistema";
        int ni = 0;
        for (OSSolicitacaoTrocaItemDto it : incoming) {
            boolean willPay = Boolean.TRUE.equals(it.pago);
            if (it.id != null) {
                OsSolicitacaoTrocaItem old = oldById.get(it.id);
                if (old != null && !Boolean.TRUE.equals(old.pago) && willPay) {
                    String chave = ORIGEM_TROCAS_EVENTUAL + "|" + osPk + "|L" + it.id;
                    debitarLinhaTroca(osPk, it, chave, uid, unome);
                }
            } else if (willPay) {
                int h = Objects.hash(it.produtoPn, it.quantidade, it.idProduto, it.ordem, ni);
                String chave = ORIGEM_TROCAS_EVENTUAL + "|" + osPk + "|N" + ni + "_" + h;
                debitarLinhaTroca(osPk, it, chave, uid, unome);
            }
            ni++;
        }
    }

    private void debitarLinhaTroca(long osPk, OSSolicitacaoTrocaItemDto it, String chaveLinha, Long uid, String unome) {
        if (it.produtoPn == null || it.produtoPn.isBlank()) {
            // Sem P/N não há como baixar no estoque; apenas registra aviso e segue (não bloqueia o pagamento).
            // A notificação de déficit em OsNotificacaoDeficitTrocaService cobrirá o caso para o Suprimento.
            LOG.warnf("OsEstoqueSaidaAutomacaoService.debitarLinhaTroca - linha sem P/N (OS %s, item id=%s, nome=%s). Pulando baixa de estoque.",
                    osPk, it.id, it.produtoNome);
            return;
        }
        int qtd = it.quantidade != null && it.quantidade > 0 ? it.quantidade.intValue() : 1;
        Integer idProd = it.idProduto != null ? it.idProduto.intValue() : null;
        // IMPORTANTE: modo tolerante (lancarSeFaltar = false). Caso o item esteja no catálogo de
        // produtos mas ainda não tenha entrada no módulo de estoque (item_estoque), a marcação de
        // "pago" pelo Suprimento NÃO pode ser bloqueada — a equipe de equalização do estoque é
        // notificada por OsNotificacaoDeficitTrocaService após o salvamento.
        try {
            estoqueService.consumirPorPartNumberFifo(
                    osPk,
                    it.produtoPn.trim(),
                    BigDecimal.valueOf(qtd),
                    uid,
                    unome,
                    "Troca eventual paga (OS " + osPk + ")",
                    ORIGEM_TROCAS_EVENTUAL,
                    idProd,
                    chaveLinha,
                    false);
        } catch (Exception e) {
            // Defesa adicional: nenhum erro inesperado aqui deve cancelar o save da OS.
            LOG.warnf(e, "OsEstoqueSaidaAutomacaoService.debitarLinhaTroca - falha ao consumir estoque (OS %s, PN %s): %s",
                    osPk, it.produtoPn, e.getMessage());
        }
    }

    /**
     * Calcula o déficit por P/N do kit do FCU comparando a quantidade necessária no
     * cadastro do FCU contra o estoque atualmente disponível. Usado no preview.
     */
    private List<KitFcuDeficitItemDto> calcularDeficitParaFcu(long fcuId) {
        List<AssociacaoFcu> assocs = AssociacaoFcu.list(
                "idFcu = ?1 and isActive = true", fcuId);
        if (assocs == null || assocs.isEmpty()) {
            return List.of();
        }
        Map<String, AggKitItem> kitPorPn = montarKitPorPn(assocs, false);
        if (kitPorPn.isEmpty()) {
            return List.of();
        }

        List<ConsultaDisponibilidadeLinhaDto> linhas = new ArrayList<>();
        for (AggKitItem agg : kitPorPn.values()) {
            ConsultaDisponibilidadeLinhaDto l = new ConsultaDisponibilidadeLinhaDto();
            l.partNumber = agg.pn;
            l.quantidade = (double) agg.quantidade;
            linhas.add(l);
        }
        List<DisponibilidadePnResultDto> resultados = estoqueService.consultarDisponibilidadeParaLinhas(linhas);

        Map<String, DisponibilidadePnResultDto> resPorChave = new LinkedHashMap<>();
        for (DisponibilidadePnResultDto r : resultados) {
            if (r.partNumber != null) {
                resPorChave.put(r.partNumber.trim().toLowerCase(Locale.ROOT), r);
            }
        }

        List<KitFcuDeficitItemDto> deficits = new ArrayList<>();
        for (Map.Entry<String, AggKitItem> e : kitPorPn.entrySet()) {
            AggKitItem agg = e.getValue();
            DisponibilidadePnResultDto r = resPorChave.get(e.getKey());
            double sol = agg.quantidade;
            double disp = r != null ? r.quantidadeDisponivel : 0.0;
            double def = Math.max(0.0, sol - disp);
            if (def > 0.0) {
                deficits.add(new KitFcuDeficitItemDto(
                        agg.idProduto, agg.pn, agg.nome, agg.quantidade, disp, def));
            }
        }
        return deficits;
    }

    /**
     * Agrega as associações por P/N (somando qtd_product). Se {@code estrito} é true, lança quando
     * encontra produto sem P/N (consistente com a lógica original do débito do kit FCU).
     */
    private Map<String, AggKitItem> montarKitPorPn(List<AssociacaoFcu> assocs, boolean estrito) {
        Map<String, AggKitItem> kitPorPn = new LinkedHashMap<>();
        for (AssociacaoFcu a : assocs) {
            if (a.idProduct == null) {
                continue;
            }
            Product p = Product.find("id = ?1", a.idProduct).firstResult();
            if (p == null || p.productpn == null || p.productpn.isBlank()) {
                if (estrito) {
                    throw new IllegalStateException(
                            ApiI18nMessages.encode(
                                    "estoque.error.fcu_assoc_sem_pn", "id", String.valueOf(a.idProduct)));
                }
                continue;
            }
            int q = a.qtdProduct != null && a.qtdProduct > 0 ? a.qtdProduct : 1;
            String pn = p.productpn.trim();
            String chave = pn.toLowerCase(Locale.ROOT);
            AggKitItem agg = kitPorPn.get(chave);
            if (agg == null) {
                agg = new AggKitItem();
                agg.pn = pn;
                agg.idProduto = a.idProduct;
                agg.nome = p.name != null ? p.name : "";
                agg.quantidade = 0;
                kitPorPn.put(chave, agg);
            }
            agg.quantidade += q;
        }
        return kitPorPn;
    }

    private static class AggKitItem {
        String pn;
        String nome;
        Integer idProduto;
        int quantidade;
    }
}
