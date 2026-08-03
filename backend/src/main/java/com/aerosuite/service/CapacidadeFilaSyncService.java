package com.aerosuite.service;

import com.aerosuite.domain.OS;
import com.aerosuite.domain.OsKitFcuDeficit;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

/**
 * P5.3.4 — alinha {@code fila_estagio} com déficit de kit FCU ({@code os_kit_fcu_deficit}).
 */
@ApplicationScoped
public class CapacidadeFilaSyncService {

    @Inject
    CapacidadeFilaNotificacaoService capacidadeFilaNotificacaoService;

    /**
     * Se o estágio não foi travado manualmente no quadro:
     * <ul>
     *   <li>com déficit → {@code AGUARDANDO_PECAS}</li>
     *   <li>sem déficit e estágio era {@code AGUARDANDO_PECAS} → {@code EM_EXECUCAO}</li>
     * </ul>
     */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void aplicarRegraDeficitKit(Long osId) {
        if (osId == null) {
            return;
        }
        OS os = OS.findById(osId);
        if (os == null || os.isActive == null || !os.isActive || os.dataFechamento != null) {
            return;
        }
        if (Boolean.TRUE.equals(os.filaEstagioTravada)) {
            return;
        }

        long count = OsKitFcuDeficit.count("osId = ?1", osId);
        boolean temDeficit = count > 0;
        String estagioAtual = CapacidadeFilaService.normalizarEstagio(os.filaEstagio);

        if (temDeficit) {
            if (!"AGUARDANDO_PECAS".equals(estagioAtual)) {
                os.filaEstagio = "AGUARDANDO_PECAS";
                os.persist();
                capacidadeFilaNotificacaoService.notificarMudancaEstagio(
                        os, estagioAtual, os.filaEstagio, null);
            }
            return;
        }

        if ("AGUARDANDO_PECAS".equals(estagioAtual)) {
            os.filaEstagio = "EM_EXECUCAO";
            os.persist();
            capacidadeFilaNotificacaoService.notificarMudancaEstagio(
                    os, estagioAtual, os.filaEstagio, null);
        }
    }
}
