package com.aerosuite.service;

import com.aerosuite.domain.Fcu;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.PropostaComercialItem;
import com.aerosuite.dto.GerarOsPropostaResultDto;
import com.aerosuite.dto.OSDto;
import com.aerosuite.dto.PropostaComercialDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.i18n.PropostaOsBridgeMessages;
import com.aerosuite.i18n.UserLocaleResolver;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.TenantDataAccess;
import io.quarkus.arc.Arc;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.logging.Logger;

/**
 * P4.1 — gera OS a partir de proposta aprovada e persiste vínculo 1:1.
 */
@ApplicationScoped
public class PropostaComercialOsBridgeService {

    private static final Logger LOGGER = Logger.getLogger(PropostaComercialOsBridgeService.class.getName());

    static final String STATUS_APROVADA = "APROVADA";

    @Inject
    OSService osService;

    @Inject
    PropostaComercialService propostaComercialService;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    BlingPropostaFluxoService blingPropostaFluxoService;

    @Transactional
    public GerarOsPropostaResultDto gerarOs(Long propostaId) {
        PropostaComercial proposta = requireProposta(propostaId);

        if (proposta.osId != null) {
            throw conflict("Proposta já possui ordem de serviço vinculada (OS id=" + proposta.osId + ").");
        }
        if (!STATUS_APROVADA.equalsIgnoreCase(nullToEmpty(proposta.status))) {
            throw badRequest("Somente propostas com status APROVADA podem gerar ordem de serviço. Status atual: "
                    + proposta.status);
        }
        if (isBlank(proposta.clienteNome)) {
            throw badRequest("Informe o nome do cliente na proposta antes de gerar a ordem de serviço.");
        }

        List<PropostaComercialItem> itens = PropostaComercialItem.find(
                "propostaComercial.id = ?1", Sort.by("ordem").ascending(), proposta.id).list();

        String locale =
                UserLocaleResolver.resolve(
                        internalUserContext != null ? internalUserContext.getUserId() : null);
        OSDto osDto = buildOsDto(proposta, itens, locale);
        OSDto created = osService.create(osDto);

        if (created == null || created.id == null) {
            throw new IllegalStateException(
                    ApiI18nMessages.encode(
                            ApiI18nMessages.OS_CREATE_FROM_PROPOSTA_FAILED,
                            "propostaId",
                            String.valueOf(propostaId)));
        }

        proposta.osId = created.id;
        proposta.osGeradaEm = LocalDateTime.now();
        proposta.osGeradaPor = resolveGeradaPor();
        proposta.persist();

        LOGGER.info("Proposta " + proposta.numeroProposta + " (id=" + proposta.id + ") → OS id=" + created.id);

        try {
            long tenantId = Long.parseLong(proposta.tenantId);
            blingPropostaFluxoService.recordOsGeradaManual(tenantId, proposta.id, created.id);
        } catch (Exception e) {
            LOGGER.fine("Registro fluxo Bling ignorado: " + e.getMessage());
        }

        PropostaComercialDto propostaDto = propostaComercialService.findById(proposta.id);
        return new GerarOsPropostaResultDto(propostaDto, created);
    }

    /**
     * Gera OS sem propagar erro — usado por automações Bling (pedido vinculado).
     */
    public boolean tryGerarOs(Long propostaId) {
        try {
            gerarOs(propostaId);
            return true;
        } catch (Exception e) {
            LOGGER.warning("OS automática falhou para proposta " + propostaId + ": " + e.getMessage());
            return false;
        }
    }

    static OSDto buildOsDto(PropostaComercial proposta, List<PropostaComercialItem> itens) {
        return buildOsDto(proposta, itens, UserLocaleResolver.normalize(null));
    }

    static OSDto buildOsDto(
            PropostaComercial proposta, List<PropostaComercialItem> itens, String locale) {
        OSDto dto = new OSDto();
        dto.dtAbertura = LocalDate.now();
        dto.isActive = true;
        dto.clienteNome = trimToNull(proposta.clienteNome);
        dto.serialNumber = firstNonBlank(proposta.produtoSn, null);
        dto.partNumber = firstNonBlank(proposta.produtoPn, null);
        dto.ataManual = trimToNull(proposta.produtoManual);
        dto.marcasMatricula = trimToNull(proposta.aeronavePrefixo);
        dto.motor = trimToNull(proposta.aplicacaoMotor);
        dto.tipoServicoId = proposta.idTipoServico;
        dto.tipoServico = trimToNull(proposta.tipoServicoNome);
        dto.numOsOriginal = trimToNull(proposta.numeroProposta);
        dto.obsIniServ = buildObsIniServ(proposta, itens, locale);

        Integer fcuId = resolveFcuId(proposta);
        if (fcuId != null) {
            dto.idFcuId = fcuId;
            Fcu fcu = Fcu.findById(fcuId);
            if (fcu != null) {
                dto.idFabricanteId = fcu.idFabricante;
            }
        }
        return dto;
    }

    static String buildObsIniServ(PropostaComercial proposta, List<PropostaComercialItem> itens) {
        return buildObsIniServ(proposta, itens, UserLocaleResolver.normalize(null));
    }

    static String buildObsIniServ(
            PropostaComercial proposta, List<PropostaComercialItem> itens, String locale) {
        return PropostaOsBridgeMessages.buildObsIniServ(proposta, itens, locale);
    }

    static Integer resolveFcuId(PropostaComercial proposta) {
        String pn = trimToNull(proposta.produtoPn);
        if (pn == null) {
            return null;
        }
        var arc = Arc.container();
        if (arc == null || !arc.isRunning()) {
            LOGGER.fine("FCU não resolvido fora do runtime Quarkus (P/N " + pn + ").");
            return null;
        }
        Fcu fcu = Fcu.find("pn = ?1 and (isActive is null or isActive = true)", pn).firstResult();
        if (fcu == null) {
            LOGGER.fine("FCU não encontrado para P/N " + pn + " — OS será criada sem FCU.");
            return null;
        }
        String sn = trimToNull(proposta.produtoSn);
        if (sn != null && fcu.serialNumber != null && !sn.equalsIgnoreCase(fcu.serialNumber.trim())) {
            LOGGER.fine("S/N da proposta difere do FCU id=" + fcu.id + " — vínculo por P/N apenas.");
        }
        return fcu.id;
    }

    private PropostaComercial requireProposta(Long id) {
        PropostaComercial entity = PropostaComercial.find("id = ?1", id).firstResult();
        if (entity == null) {
            throw new jakarta.ws.rs.NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_NOT_FOUND, "id", String.valueOf(id)));
        }
        if (!tenantDataAccess.matchesTenant(entity.tenantId)) {
            throw new jakarta.ws.rs.ForbiddenException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.PROPOSTA_WRONG_TENANT));
        }
        return entity;
    }

    private String resolveGeradaPor() {
        if (internalUserContext != null && internalUserContext.isAuthenticated()) {
            String email = internalUserContext.getEmail();
            if (!isBlank(email)) {
                return email.trim();
            }
            String nome = internalUserContext.getNome();
            if (!isBlank(nome)) {
                return nome.trim();
            }
        }
        return "sistema";
    }

    private static WebApplicationException conflict(String message) {
        return new WebApplicationException(message, Response.status(Response.Status.CONFLICT).entity(message).build());
    }

    private static BadRequestException badRequest(String message) {
        return new BadRequestException(message);
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String firstNonBlank(String a, String b) {
        String x = trimToNull(a);
        if (x != null) {
            return x;
        }
        return trimToNull(b);
    }
}
