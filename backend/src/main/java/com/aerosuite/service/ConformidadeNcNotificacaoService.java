package com.aerosuite.service;

import com.aerosuite.domain.ConformidadeNaoConformidade;
import com.aerosuite.domain.ConformidadeNaoConformidade.CapaFase;
import com.aerosuite.domain.Notificacao;
import com.aerosuite.domain.Usuario;
import com.aerosuite.i18n.InAppNotificationMessages;
import com.aerosuite.i18n.NcCapaMessages;
import com.aerosuite.i18n.UserLocaleResolver;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.Arrays;
import java.util.List;
import org.jboss.logging.Logger;

@ApplicationScoped
public class ConformidadeNcNotificacaoService {

    private static final Logger LOG = Logger.getLogger(ConformidadeNcNotificacaoService.class);

    private static final String TIPO = "NC_CAPA_PENDENTE";
    private static final String REF_TIPO = "NC_CAPA";

    private static final List<CapaFase> ORDEM =
            Arrays.asList(
                    CapaFase.REGISTRO,
                    CapaFase.CONTENCAO,
                    CapaFase.CAUSA,
                    CapaFase.ACAO,
                    CapaFase.VERIFICACAO,
                    CapaFase.FECHADA);

    @Inject
    NotificacaoService notificacaoService;

    @Transactional
    public void notificarFasePendente(
            ConformidadeNaoConformidade nc,
            CapaFase fase,
            Integer responsavelUsuarioId,
            Integer autorUsuarioId) {
        if (nc == null || nc.id == null || fase == null || responsavelUsuarioId == null) {
            return;
        }
        if (fase == CapaFase.FECHADA) {
            return;
        }
        if (autorUsuarioId != null && autorUsuarioId.equals(responsavelUsuarioId)) {
            return;
        }
        Usuario responsavel = Usuario.findById(responsavelUsuarioId);
        if (responsavel == null || !Boolean.TRUE.equals(responsavel.ativo)) {
            return;
        }
        long refId = referenciaId(nc.id, fase);
        long duplicada =
                Notificacao.count(
                        "usuarioId = ?1 and tipo = ?2 and referenciaTipo = ?3 and referenciaId = ?4 "
                                + "and lida = false and isActive = true",
                        responsavelUsuarioId.longValue(),
                        TIPO,
                        REF_TIPO,
                        refId);
        if (duplicada > 0) {
            return;
        }
        String locale = UserLocaleResolver.resolve(responsavel);
        String faseLabel = NcCapaMessages.faseLabel(locale, fase.name());
        String numero = nc.numero != null ? nc.numero : "—";
        String titulo = nc.titulo != null ? nc.titulo : "";
        InAppNotificationMessages.LocalizedText text =
                InAppNotificationMessages.ncCapaFasePendente(locale, numero, titulo, faseLabel);
        String link = "/conformidade/nao-conformidades";
        Notificacao notif =
                notificacaoService.criar(
                        responsavelUsuarioId.longValue(), TIPO, text.title(), text.message(), link);
        notif.referenciaTipo = REF_TIPO;
        notif.referenciaId = refId;
        notif.persist();
        LOG.infof(
                "NC CAPA: notificação pendente enviada ao usuário %d — NC %s fase %s",
                responsavelUsuarioId,
                numero,
                fase.name());
    }

    static long referenciaId(Long ncId, CapaFase fase) {
        int idx = ORDEM.indexOf(fase);
        if (idx < 0) {
            idx = 0;
        }
        return ncId * 10L + idx;
    }
}
