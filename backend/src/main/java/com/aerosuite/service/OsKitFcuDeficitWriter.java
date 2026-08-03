package com.aerosuite.service;

import com.aerosuite.domain.OS;
import com.aerosuite.domain.OsKitFcuDeficit;
import com.aerosuite.dto.KitFcuDeficitItemDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Bean dedicado às escritas em {@code os_kit_fcu_deficit}, isolado em uma transação própria
 * ({@link Transactional.TxType#REQUIRES_NEW}) para que falhas (DDL ausente, restrições, etc.) não
 * derrubem a transação que está salvando a OS.
 */
@ApplicationScoped
public class OsKitFcuDeficitWriter {

    private static final Logger LOG = Logger.getLogger(OsKitFcuDeficitWriter.class);

    @PersistenceContext
    EntityManager em;

    @Inject
    CapacidadeFilaSyncService capacidadeFilaSync;

    /**
     * Substitui os registros de déficit do kit FCU para a OS informada (limpa antigos e grava novos).
     * Roda em transação separada: se algo falhar aqui, a transação principal (do save da OS) não é afetada.
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void substituirDeficitsDaOs(OS os, List<KitFcuDeficitItemDto> itens) {
        if (os == null || os.id == null) {
            return;
        }
        try {
            // Limpa registros prévios e força flush para evitar conflitos com a unique key (os_id, product_pn).
            OsKitFcuDeficit.delete("osId = ?1", os.id);
            em.flush();
        } catch (Exception e) {
            LOG.warnf(e, "OsKitFcuDeficitWriter - falha ao limpar deficits prévios (OS %s): %s",
                    os.id, e.getMessage());
            return;
        }
        if (itens == null || itens.isEmpty()) {
            capacidadeFilaSync.aplicarRegraDeficitKit(os.id);
            return;
        }
        for (KitFcuDeficitItemDto it : itens) {
            try {
                OsKitFcuDeficit row = new OsKitFcuDeficit();
                row.osId = os.id;
                row.idFcu = os.idFcu;
                row.idProdutoCatalogo = it.produtoCatalogoId;
                row.productPn = it.productPn;
                row.productName = it.productName;
                row.quantidadeNecessaria = it.quantidadeNecessaria;
                row.quantidadeDisponivel = BigDecimal.valueOf(it.quantidadeDisponivel);
                row.deficit = BigDecimal.valueOf(it.deficit);
                row.createdAt = LocalDateTime.now();
                row.persist();
                em.flush();
            } catch (Exception e) {
                LOG.warnf(e, "OsKitFcuDeficitWriter - falha ao gravar deficit (OS %s, PN %s): %s",
                        os.id, it.productPn, e.getMessage());
                // Limpa estado inconsistente do EntityManager para não afetar próximos persists.
                try { em.clear(); } catch (Exception ignored) {}
            }
        }
        capacidadeFilaSync.aplicarRegraDeficitKit(os.id);
    }
}
