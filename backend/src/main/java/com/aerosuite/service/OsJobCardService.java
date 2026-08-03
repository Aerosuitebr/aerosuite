package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.crs.Part145CrsSegregation;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.OsJobCardApontamento;
import com.aerosuite.domain.OsJobCardAssinatura;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.*;
import com.aerosuite.os.OsRegistroEncerradoGuard;
import com.aerosuite.security.JobCardAssinaturaIntegrity;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class OsJobCardService {

    private static final DateTimeFormatter D = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final int MAX_ASSINATURA_BYTES = 512_000;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    OSAuditoriaService auditoriaService;

    @Inject
    OSFileService osFileService;

    @Inject
    com.aerosuite.security.InternalUserContext internalUser;

    @Inject
    Part145CrsSegregation crsSegregation;

    @Inject
    OsConformidadeAlertaService conformidadeAlertaService;

    @Inject
    ConformidadeEnforcementService conformidadeEnforcement;

    @Inject
    OsRegistroEncerradoGuard registroEncerradoGuard;

    public List<OsJobCardListaItemDto> listarAbertas(String q, int limite) {
        int max = Math.min(Math.max(limite, 1), 50);
        List<OS> oss;
        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim() + "%";
            try {
                Long idSearch = Long.parseLong(q.trim());
                Integer idOsSearch = Integer.parseInt(q.trim());
                oss = OS.find(
                                "(id = ?1 or idOs = ?2 or clienteNome like ?3 or serialNumber like ?3 or partNumber like ?3 or marcasMatricula like ?3)"
                                        + " and isActive = true and dataFechamento is null"
                                        + " order by dtAbertura desc, id desc",
                                idSearch,
                                idOsSearch,
                                like)
                        .page(0, max)
                        .list();
            } catch (NumberFormatException e) {
                oss = OS.find(
                                "(clienteNome like ?1 or serialNumber like ?1 or partNumber like ?1 or marcasMatricula like ?1)"
                                        + " and isActive = true and dataFechamento is null"
                                        + " order by dtAbertura desc, id desc",
                                like)
                        .page(0, max)
                        .list();
            }
        } else {
            oss = OS.find("isActive = true and dataFechamento is null order by dtAbertura desc, id desc")
                    .page(0, max)
                    .list();
        }
        List<Long> osIds = oss.stream().map(o -> o.id).collect(Collectors.toList());
        Map<Long, Integer> assinaturasPorOs = contarAssinaturas(osIds);

        List<OsJobCardListaItemDto> out = new ArrayList<>();
        for (OS os : oss) {
            int assinaturas = assinaturasPorOs.getOrDefault(os.id, 0);
            boolean crs = os.crsEmitidoEm != null;
            OsJobCardListaItemDto item = new OsJobCardListaItemDto();
            item.osId = os.id;
            item.numeroOs = os.idOs;
            item.clienteNome = os.clienteNome;
            item.partNumber = os.partNumber;
            item.serialNumber = os.serialNumber;
            item.marcasMatricula = os.marcasMatricula;
            item.dtAbertura = os.dtAbertura != null ? os.dtAbertura.format(D) : null;
            item.tipoServico = os.tipoServico;
            item.faseJob = computeFaseJob(os, assinaturas, crs);
            item.progressPct = computeProgressPct(os, assinaturas, crs);
            item.assinaturasConcluidas = assinaturas;
            item.crsEmitido = crs;
            out.add(item);
        }
        return out;
    }

    private Map<Long, Integer> contarAssinaturas(List<Long> osIds) {
        if (osIds == null || osIds.isEmpty()) {
            return Map.of();
        }
        String tid = TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());
        List<OsJobCardAssinatura> rows =
                OsJobCardAssinatura.find("tenantId = ?1 and osId in ?2", tid, osIds).list();
        Map<Long, Integer> out = new HashMap<>();
        for (OsJobCardAssinatura row : rows) {
            if (row.assinaturaPng != null && row.assinaturaPng.length > 0) {
                out.merge(row.osId, 1, Integer::sum);
            }
        }
        return out;
    }

    private static String computeFaseJob(OS os, int assinaturas, boolean crs) {
        if (crs || (hasText(os.fimServico) && assinaturas >= 2)) {
            return "CONCLUIDO";
        }
        if (hasText(os.solicitacaoTrocasComentario) && !hasText(os.fimServico)) {
            return "AGUARDANDO_PECA";
        }
        if (hasText(os.inicioServico)) {
            return "EM_ANDAMENTO";
        }
        return "A_FAZER";
    }

    private static int computeProgressPct(OS os, int assinaturas, boolean crs) {
        if (crs) {
            return 100;
        }
        int pct = 0;
        if (hasText(os.inicioServico)) {
            pct = 20;
        }
        if (hasText(os.fimServico)) {
            pct = 50;
        }
        pct += Math.min(assinaturas, 2) * 22;
        if (hasText(os.fimServico) && assinaturas >= 2) {
            pct = 95;
        }
        return Math.min(pct, 99);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public OsJobCardDto obter(Long osId) {
        OS os = requireOs(osId);
        OsJobCardDto dto = mapOs(os);
        String tid = TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());

        List<OsJobCardApontamento> apontamentos =
                OsJobCardApontamento.find("tenantId = ?1 and osId = ?2 order by trabalhoEm desc, id desc", tid, osId)
                        .list();
        BigDecimal total = BigDecimal.ZERO;
        for (OsJobCardApontamento a : apontamentos) {
            dto.apontamentos.add(toApontamentoDto(a));
            if (a.horas != null) {
                total = total.add(a.horas);
            }
        }
        dto.totalHoras = total.setScale(2, RoundingMode.HALF_UP);

        for (OsJobCardAssinatura.PapelAssinatura papel : OsJobCardAssinatura.PapelAssinatura.values()) {
            OsJobCardAssinatura assin =
                    OsJobCardAssinatura.find("tenantId = ?1 and osId = ?2 and papel = ?3", tid, osId, papel)
                            .firstResult();
            dto.assinaturas.add(toAssinaturaDto(papel, assin));
        }

        dto.fotos = osFileService.getFilesByOSId(osId);
        if (!Boolean.TRUE.equals(dto.crsEmitido)) {
            dto.alertaCrsSegregacao =
                    crsSegregation.isBlockedFromCrsEmit(
                            osId, internalUser.getUserId(), internalUser.getPerfilCodigo());
        } else {
            dto.alertaCrsSegregacao = false;
        }
        dto.alertasConformidade.addAll(conformidadeAlertaService.alertasOs(osId).alertas);
        return dto;
    }

    @Transactional
    public OsJobCardApontamentoDto registrarApontamento(
            Long osId, OsJobCardApontamentoRequest body, AuditoriaUsuarioContext ctx) {
        OS os = requireOs(osId);
        assertOsMutavel(os);
        conformidadeEnforcement.assertOperacaoOsConformidade(
                os.idOs,
                ctx != null ? ctx.userId : toLong(internalUser.getUserId()),
                internalUser.getPerfilCodigo(),
                body != null ? body.ferramentaIdentificador : null);
        if (body == null || body.horas == null || body.horas.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(ApiI18nMessages.domain("hangar.jobcard.error.horas_invalidas"));
        }
        if (body.trabalhoEm == null || body.trabalhoEm.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("hangar.jobcard.error.data_obrigatoria"));
        }
        LocalDate trabalhoEm = LocalDate.parse(body.trabalhoEm.trim());
        OsJobCardApontamento row = new OsJobCardApontamento();
        row.osId = osId;
        row.trabalhoEm = trabalhoEm;
        row.horas = body.horas.setScale(2, RoundingMode.HALF_UP);
        row.descricao = trimOrNull(body.descricao);
        row.ferramentaIdentificador = trimOrNull(body.ferramentaIdentificador);
        if (ctx != null) {
            row.usuarioId = ctx.userId;
            row.usuarioNome = ctx.nome;
        }
        row.persist();
        return toApontamentoDto(row);
    }

    @Transactional
    public OsJobCardDto atualizarExecucao(Long osId, OsJobCardExecucaoRequest body, AuditoriaUsuarioContext ctx) {
        OS os = requireOs(osId);
        assertOsMutavel(os);
        conformidadeEnforcement.assertOperacaoOsConformidade(
                os.idOs,
                ctx != null ? ctx.userId : toLong(internalUser.getUserId()),
                internalUser.getPerfilCodigo(),
                null);
        OS anterior = copyOs(os);
        if (body != null) {
            if (body.inicioServico != null) {
                os.inicioServico = body.inicioServico;
            }
            if (body.fimServico != null) {
                os.fimServico = body.fimServico;
            }
            if (body.obsIniServ != null) {
                os.obsIniServ = body.obsIniServ;
            }
            if (body.obsFimServ != null) {
                os.obsFimServ = body.obsFimServ;
            }
        }
        os.persist();
        if (ctx != null && auditoriaService != null) {
            auditoriaService.registrarAlteracao(
                    anterior, os, ctx.nome, ctx.email, ctx.userId, ctx.ip, ctx.userAgent);
        }
        return obter(osId);
    }

    @Transactional
    public OsJobCardAssinaturaDto salvarAssinatura(
            Long osId, OsJobCardAssinaturaRequest body, AuditoriaUsuarioContext ctx) {
        OS os = requireOs(osId);
        assertOsMutavel(os);
        conformidadeEnforcement.assertOperacaoOsConformidade(
                os.idOs,
                ctx != null ? ctx.userId : toLong(internalUser.getUserId()),
                internalUser.getPerfilCodigo(),
                null);
        if (body == null || body.papel == null || body.papel.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("hangar.jobcard.error.papel_obrigatorio"));
        }
        OsJobCardAssinatura.PapelAssinatura papel;
        try {
            papel = OsJobCardAssinatura.PapelAssinatura.valueOf(body.papel.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(ApiI18nMessages.domain("hangar.jobcard.error.papel_invalido"));
        }
        byte[] png = decodePng(body.assinaturaPngBase64);
        if (png.length == 0) {
            throw new BadRequestException(ApiI18nMessages.domain("hangar.jobcard.error.assinatura_vazia"));
        }
        if (png.length > MAX_ASSINATURA_BYTES) {
            throw new BadRequestException(ApiI18nMessages.domain("hangar.jobcard.error.assinatura_grande"));
        }

        String tid = TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());
        OsJobCardAssinatura row =
                OsJobCardAssinatura.find("tenantId = ?1 and osId = ?2 and papel = ?3", tid, osId, papel)
                        .firstResult();
        if (row == null) {
            row = new OsJobCardAssinatura();
            row.osId = osId;
            row.papel = papel;
        }
        row.assinaturaPng = png;
        row.assinadoEm = JobCardAssinaturaIntegrity.serverTimestamp();
        row.assinaturaSha256 = JobCardAssinaturaIntegrity.sha256Hex(png);
        row.assinaturaTimestampServer = row.assinadoEm;
        if (ctx != null) {
            row.usuarioId = ctx.userId;
            row.usuarioNome = ctx.nome;
        }
        row.persist();
        return toAssinaturaDto(papel, row);
    }

    private OS requireOs(Long osId) {
        if (osId == null) {
            throw new BadRequestException(ApiI18nMessages.domain("hangar.jobcard.error.os_invalida"));
        }
        return tenantDataAccess.requireOS(osId);
    }

    private void assertOsMutavel(OS os) {
        registroEncerradoGuard.assertMutacaoPermitida(os);
    }

    private static OS copyOs(OS src) {
        OS c = new OS();
        c.id = src.id;
        c.idOs = src.idOs;
        c.clienteNome = src.clienteNome;
        c.inicioServico = src.inicioServico;
        c.fimServico = src.fimServico;
        c.obsIniServ = src.obsIniServ;
        c.obsFimServ = src.obsFimServ;
        c.partNumber = src.partNumber;
        c.serialNumber = src.serialNumber;
        c.tipoServico = src.tipoServico;
        c.dtAbertura = src.dtAbertura;
        c.dataFechamento = src.dataFechamento;
        return c;
    }

    private static OsJobCardDto mapOs(OS os) {
        OsJobCardDto dto = new OsJobCardDto();
        dto.osId = os.id;
        dto.numeroOs = os.idOs;
        dto.clienteNome = os.clienteNome;
        dto.partNumber = os.partNumber;
        dto.serialNumber = os.serialNumber;
        dto.tipoServico = os.tipoServico;
        dto.dtAbertura = os.dtAbertura != null ? os.dtAbertura.format(D) : null;
        dto.dataFechamento = os.dataFechamento != null ? os.dataFechamento.format(D) : null;
        dto.inicioServico = os.inicioServico;
        dto.fimServico = os.fimServico;
        dto.obsIniServ = os.obsIniServ;
        dto.obsFimServ = os.obsFimServ;
        dto.crsEmitido = os.crsEmitidoEm != null;
        return dto;
    }

    private static OsJobCardApontamentoDto toApontamentoDto(OsJobCardApontamento a) {
        OsJobCardApontamentoDto dto = new OsJobCardApontamentoDto();
        dto.id = a.id;
        dto.trabalhoEm = a.trabalhoEm != null ? a.trabalhoEm.format(D) : null;
        dto.horas = a.horas;
        dto.descricao = a.descricao;
        dto.ferramentaIdentificador = a.ferramentaIdentificador;
        dto.usuarioNome = a.usuarioNome;
        dto.createdAt = a.createdAt != null ? a.createdAt.toString() : null;
        return dto;
    }

    private static OsJobCardAssinaturaDto toAssinaturaDto(
            OsJobCardAssinatura.PapelAssinatura papel, OsJobCardAssinatura row) {
        OsJobCardAssinaturaDto dto = new OsJobCardAssinaturaDto();
        dto.papel = papel.name();
        if (row != null) {
            dto.id = row.id;
            dto.assinadoEm = row.assinadoEm != null ? row.assinadoEm.toString() : null;
            dto.usuarioNome = row.usuarioNome;
            dto.presente = row.assinaturaPng != null && row.assinaturaPng.length > 0;
            dto.assinaturaSha256 = row.assinaturaSha256;
            dto.assinaturaTimestampServer =
                    row.assinaturaTimestampServer != null ? row.assinaturaTimestampServer.toString() : null;
            dto.integridadeOk = JobCardAssinaturaIntegrity.verify(row.assinaturaPng, row.assinaturaSha256);
        } else {
            dto.presente = false;
        }
        return dto;
    }

    private static byte[] decodePng(String raw) {
        if (raw == null || raw.isBlank()) {
            return new byte[0];
        }
        String b64 = raw.trim();
        int comma = b64.indexOf(',');
        if (b64.startsWith("data:") && comma > 0) {
            b64 = b64.substring(comma + 1);
        }
        try {
            return Base64.getDecoder().decode(b64);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(ApiI18nMessages.domain("hangar.jobcard.error.assinatura_invalida"));
        }
    }

    private static String trimOrNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static Long toLong(Integer id) {
        return id != null ? id.longValue() : null;
    }
}
