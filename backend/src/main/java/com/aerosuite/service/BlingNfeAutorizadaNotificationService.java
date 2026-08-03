package com.aerosuite.service;

import com.aerosuite.domain.BlingNfeRegistro;
import com.aerosuite.domain.ClienteProposta;
import com.aerosuite.domain.Notificacao;
import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.Usuario;
import com.aerosuite.i18n.InAppNotificationMessages;
import com.aerosuite.i18n.UserLocaleResolver;
import com.aerosuite.integration.bling.BlingNfeDetailDto;
import com.aerosuite.model.Funcionalidade;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Locale;
import org.jboss.logging.Logger;

/**
 * E-mail + notificação in-app quando NF-e é autorizada/registrada (webhook ou emissão direta).
 */
@ApplicationScoped
public class BlingNfeAutorizadaNotificationService {

    private static final Logger LOG = Logger.getLogger(BlingNfeAutorizadaNotificationService.class);
    private static final String REF_TIPO = "BLING_NFE";

    @Inject
    EntityManager entityManager;

    @Inject
    NotificacaoService notificacaoService;

    @Inject
    EmailService emailService;

    @Inject
    SistemaConfigService sistemaConfigService;

    @Transactional
    public void onNfeRegistrada(long tenantId, BlingNfeRegistro row, BlingNfeDetailDto detail) {
        if (row == null || detail == null || detail.id == null) {
            return;
        }
        if (!isAuthorized(detail.situacao, detail.chaveAcesso)) {
            return;
        }
        if (alreadyNotified(tenantId, detail.id)) {
            return;
        }
        Long propostaId = row.propostaComercialId;
        PropostaComercial proposta = propostaId != null ? PropostaComercial.findById(propostaId) : null;
        String numero = detail.numero != null ? detail.numero : String.valueOf(detail.id);
        String situacao = detail.situacao != null ? detail.situacao : null;
        String numeroProposta = proposta != null ? proposta.numeroProposta : null;
        String link = propostaId != null ? "/propostas-comerciais/" + propostaId : "/propostas-comerciais";

        for (Usuario usuario : usuariosComerciais(tenantId)) {
            if (usuario.id == null) {
                continue;
            }
            InAppNotificationMessages.LocalizedText text = InAppNotificationMessages.blingNfeAuthorized(
                    UserLocaleResolver.resolve(usuario), numero, situacao, numeroProposta);
            Notificacao n = notificacaoService.criar(
                    usuario.id.longValue(), "BLING_NFE_AUTORIZADA", text.title(), text.message(), link);
            n.referenciaTipo = REF_TIPO;
            n.referenciaId = detail.id;
        }

        if (sistemaConfigService.isNotificacoesEmailEnabled() && proposta != null && proposta.clientePropostaId != null) {
            ClienteProposta cliente = ClienteProposta.findById(proposta.clientePropostaId);
            if (cliente != null && cliente.email != null && !cliente.email.isBlank()) {
                try {
                    String emailLocale = UserLocaleResolver.resolve(cliente);
                    emailService.sendBlingNfeAutorizadaEmail(
                            cliente.email.trim(),
                            cliente.nome,
                            numero,
                            situacao != null ? situacao : "Autorizada",
                            proposta.numeroProposta,
                            detail.danfeUrl,
                            emailLocale);
                } catch (Exception e) {
                    LOG.warnf(e, "Falha ao enviar e-mail NF-e autorizada para cliente proposta %d", proposta.id);
                }
            }
        }
        LOG.infof("Notificações NF-e %d enviadas (proposta=%s)", detail.id, propostaId);
    }

    private boolean alreadyNotified(long tenantId, long blingNfeId) {
        Long count = entityManager.createQuery(
                        "SELECT COUNT(n) FROM Notificacao n JOIN Usuario u ON u.id = n.usuarioId "
                                + "WHERE n.referenciaTipo = :refTipo AND n.referenciaId = :refId "
                                + "AND n.isActive = true AND u.orgTenantId = :tenantId",
                        Long.class)
                .setParameter("refTipo", REF_TIPO)
                .setParameter("refId", blingNfeId)
                .setParameter("tenantId", tenantId)
                .getSingleResult();
        return count != null && count > 0;
    }

    private List<Usuario> usuariosComerciais(long tenantId) {
        List<Usuario> usuarios = entityManager.createQuery(
                        "SELECT DISTINCT u FROM Usuario u "
                                + "LEFT JOIN u.perfil p "
                                + "LEFT JOIN p.funcionalidades f "
                                + "WHERE u.ativo = true AND u.orgTenantId = :tenantId "
                                + "AND (p IS NULL OR p.ativo = true)",
                        Usuario.class)
                .setParameter("tenantId", tenantId)
                .getResultList();
        return usuarios.stream()
                .filter(u -> u.id != null && u.perfil != null && u.perfil.getFuncionalidades() != null)
                .filter(u -> u.perfil.getFuncionalidades().stream()
                        .filter(f -> f != null && Boolean.TRUE.equals(f.getAtivo()))
                        .map(Funcionalidade::getCodigo)
                        .anyMatch(c -> "PROPOSTAS_COMERCIAIS".equals(c)
                                || "GERENCIAR_PERMISSOES".equals(c)
                                || "ADMIN".equals(c)))
                .toList();
    }

    static boolean isAuthorized(String situacao, String chaveAcesso) {
        if (chaveAcesso != null && !chaveAcesso.isBlank()) {
            return true;
        }
        String s = situacao != null ? situacao.toLowerCase(Locale.ROOT) : "";
        return s.contains("autoriz")
                || s.contains("emitid")
                || s.contains("aprov")
                || s.contains("registr");
    }
}
