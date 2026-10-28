package com.aerosuite.service;

import com.aerosuite.domain.Nrc;
import com.aerosuite.domain.NrcAcao;
import com.aerosuite.domain.NrcAuditoria;
import com.aerosuite.domain.NrcResponsavelHistorico;
import com.aerosuite.domain.Fcu;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.Usuario;
import com.aerosuite.model.Perfil;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.dto.*;
import com.aerosuite.mapping.NrcMapper;
import com.aerosuite.util.AnaliseCausaStatus;
import com.aerosuite.util.PlanoAcoesStatus;
import com.aerosuite.util.NrcAccessRules;
import com.aerosuite.util.NrcBusinessException;
import com.aerosuite.util.NrcEmailMessages;
import com.aerosuite.util.NrcEnums;
import com.aerosuite.util.NrcErrorCode;
import com.aerosuite.util.NrcFuncionalidade;
import com.aerosuite.util.NrcNotFoundException;
import com.aerosuite.util.NrcRelatorioMessages;
import com.aerosuite.util.NrcRequisitosCatalog;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class NrcService {

    private static final DateTimeFormatter AUDIT_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
        "dataDeteccao", "numero", "status", "severidade", "origem", "prazoTratamento", "responsavelTratamentoNome"
    );

    private static final String ACCESS_SCOPE_PANACHE =
        "(responsavelTratamentoId = :accessUid or detectadoPorId = :accessUid "
            + "or contencaoResponsavelId = :accessUid "
            + "or id in (select h.nrc.id from NrcResponsavelHistorico h where h.usuarioId = :accessUid) "
            + "or id in (select a.nrc.id from NrcAcao a where a.responsavelId = :accessUid))";

    private static final String ACCESS_SCOPE_JPQL =
        "(n.responsavelTratamentoId = :accessUid OR n.detectadoPorId = :accessUid "
            + "OR n.contencaoResponsavelId = :accessUid "
            + "OR EXISTS (SELECT 1 FROM NrcResponsavelHistorico h WHERE h.nrc = n AND h.usuarioId = :accessUid) "
            + "OR EXISTS (SELECT 1 FROM NrcAcao a WHERE a.nrc = n AND a.responsavelId = :accessUid))";

    @Inject
    NrcMapper mapper;

    @Inject
    EntityManager entityManager;

    @Inject
    NrcMailer nrcMailer;

    @Inject
    NotificacaoService notificacaoService;

    @Inject
    NrcAuthorization nrcAuthorization;

    @Inject
    TenantDataAccess tenants;

    @ConfigProperty(name = "frontend.url", defaultValue = "https://app.aerosuite.com.br")
    String frontendUrl;

    public record SearchResult(List<NrcSummaryDto> items, long total) {}

    public NrcDto getById(Long id, Long usuarioId) {
        requireNrcLeitura(usuarioId);
        requireAccess(id, usuarioId);
        Nrc entity = requireNrc(id);
        loadCollections(entity);
        return mapper.toDto(entity);
    }

    public SearchResult search(Integer page, Integer size, String sort, String q,
                               String status, String origem, String severidade,
                               Long osId, LocalDate dataInicio, LocalDate dataFim,
                               Long responsavelTratamentoId, Long responsavelTratamentoOuHistoricoId,
                               String excluirStatus, Boolean prontaParaEficacia, Boolean vencidas,
                               Boolean proximasVencimento,
                               String etapaAtual, LocalDate dataEncerramentoInicio,
                               LocalDate dataEncerramentoFim, Boolean emTratamento,
                               String localOcorrencia, Boolean origemInterna, Long accessUserId) {
        requireNrcLeitura(accessUserId);
        int p = page != null && page >= 0 ? page : 0;
        int s = size != null && size > 0 ? size : 10;

        NrcEnums.requireStatusFiltro(status);
        NrcEnums.requireOrigemFiltro(origem);
        NrcEnums.requireSeveridadeFiltro(severidade);
        NrcEnums.requireEtapaFiltro(etapaAtual);
        if (excluirStatus != null && !excluirStatus.isBlank()) {
            NrcEnums.requireStatusFiltro(excluirStatus);
        }

        Sort sortObj = Sort.by("dataDeteccao").descending();
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            if (ALLOWED_SORT_FIELDS.contains(field)) {
                boolean desc = parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc");
                sortObj = desc ? Sort.by(field).descending() : Sort.by(field).ascending();
            }
        }

        StringJoiner where = new StringJoiner(" and ");
        Map<String, Object> params = new HashMap<>();
        where.add("isActive = :isActive");
        params.put("isActive", true);

        if (q != null && !q.isBlank()) {
            where.add("(LOWER(numero) like :q or LOWER(descricaoOcorrido) like :q or LOWER(clienteNome) like :q "
                + "or LOWER(osNumero) like :q or LOWER(responsavelTratamentoNome) like :q "
                + "or LOWER(detectadoPorNome) like :q "
                + "or responsavelTratamentoId in (select cast(u.id as long) from Usuario u "
                + "where LOWER(u.nome) like :q or LOWER(u.email) like :q) "
                + "or id in (select h.nrc.id from NrcResponsavelHistorico h where LOWER(h.usuarioNome) like :q))");
            params.put("q", "%" + q.toLowerCase(Locale.ROOT) + "%");
        }
        if (status != null && !status.isBlank()) {
            where.add("status = :status");
            params.put("status", status);
        }
        if (origem != null && !origem.isBlank()) {
            where.add("origem = :origem");
            params.put("origem", origem);
        } else if (origemInterna != null) {
            if (Boolean.TRUE.equals(origemInterna)) {
                where.add("origem in ('OFICINA', 'ESTOQUE', 'INSPECAO', 'AUDITORIA_INTERNA')");
            } else {
                where.add("origem = 'CLIENTE'");
            }
        }
        if (localOcorrencia != null && !localOcorrencia.isBlank()) {
            where.add("localOcorrencia = :localOcorrencia");
            params.put("localOcorrencia", localOcorrencia.trim());
        }
        if (severidade != null && !severidade.isBlank()) {
            where.add("severidade = :severidade");
            params.put("severidade", severidade);
        }
        if (osId != null) {
            where.add("osId = :osId");
            params.put("osId", osId);
        }
        if (dataInicio != null) {
            where.add("dataDeteccao >= :dataInicio");
            params.put("dataInicio", dataInicio.atStartOfDay());
        }
        if (dataFim != null) {
            where.add("dataDeteccao < :dataFim");
            params.put("dataFim", dataFim.plusDays(1).atStartOfDay());
        }
        if (responsavelTratamentoId != null) {
            where.add("responsavelTratamentoId = :responsavelTratamentoId");
            params.put("responsavelTratamentoId", responsavelTratamentoId);
        }
        if (responsavelTratamentoOuHistoricoId != null) {
            where.add("(responsavelTratamentoId = :respHistId or id in "
                + "(select h.nrc.id from NrcResponsavelHistorico h where h.usuarioId = :respHistId))");
            params.put("respHistId", responsavelTratamentoOuHistoricoId);
        }
        if (excluirStatus != null && !excluirStatus.isBlank()) {
            where.add("status <> :excluirStatus");
            params.put("excluirStatus", excluirStatus);
        }
        if (Boolean.TRUE.equals(prontaParaEficacia)) {
            where.add("status = 'EM_TRATAMENTO'");
            where.add("(contencaoConcluida = true or contencaoNaoAplicavel = true)");
            where.add("causaRaiz is not null and trim(causaRaiz) <> ''");
            where.add("id in (select a.nrc.id from NrcAcao a)");
            where.add("id not in (select a2.nrc.id from NrcAcao a2 where a2.status <> 'CONCLUIDA')");
        }
        if (Boolean.TRUE.equals(vencidas)) {
            where.add("status <> 'ENCERRADA'");
            where.add("prazoTratamento is not null and prazoTratamento < :hojeVencidas");
            params.put("hojeVencidas", LocalDate.now());
        }
        if (Boolean.TRUE.equals(proximasVencimento)) {
            LocalDate hoje = LocalDate.now();
            where.add("status <> 'ENCERRADA'");
            where.add("prazoTratamento is not null and prazoTratamento >= :hojeProximas "
                + "and prazoTratamento <= :limiteProximas");
            params.put("hojeProximas", hoje);
            params.put("limiteProximas", hoje.plusDays(2));
        }
        if (Boolean.TRUE.equals(emTratamento)) {
            where.add("status in ('CONTENCAO', 'EM_ANALISE', 'EM_TRATAMENTO')");
        }
        if (dataEncerramentoInicio != null) {
            where.add("dataEncerramento >= :dataEncerramentoInicio");
            params.put("dataEncerramentoInicio", dataEncerramentoInicio.atStartOfDay());
        }
        if (dataEncerramentoFim != null) {
            where.add("dataEncerramento < :dataEncerramentoFim");
            params.put("dataEncerramentoFim", dataEncerramentoFim.plusDays(1).atStartOfDay());
        }
        if (accessUserId != null && !isUsuarioQualidade(accessUserId)) {
            where.add("(responsavelTratamentoId = :accessUid or detectadoPorId = :accessUid "
                + "or id in (select h.nrc.id from NrcResponsavelHistorico h where h.usuarioId = :accessUid) "
                + "or id in (select a.nrc.id from NrcAcao a where a.responsavelId = :accessUid))");
            params.put("accessUid", accessUserId);
        }
        if (etapaAtual != null && !etapaAtual.isBlank()) {
            switch (etapaAtual) {
                case "REGISTRO" -> {
                    where.add("status = 'ABERTA'");
                    where.add("contencaoConcluida = false and contencaoNaoAplicavel = false");
                }
                case "CONTENCAO" -> {
                    where.add("status = 'CONTENCAO'");
                }
                case "CAUSA" -> {
                    where.add("status <> 'ENCERRADA'");
                    where.add("(contencaoConcluida = true or contencaoNaoAplicavel = true)");
                    where.add("(causaRaiz is null or trim(causaRaiz) = '')");
                }
                case "ACOES" -> {
                    where.add("status <> 'ENCERRADA'");
                    where.add("(contencaoConcluida = true or contencaoNaoAplicavel = true)");
                    where.add("causaRaiz is not null and trim(causaRaiz) <> ''");
                    where.add("(id not in (select a.nrc.id from NrcAcao a) "
                        + "or id in (select a2.nrc.id from NrcAcao a2 where a2.status <> 'CONCLUIDA'))");
                }
                case "EFICACIA" -> {
                    where.add("status = 'EM_TRATAMENTO'");
                    where.add("(contencaoConcluida = true or contencaoNaoAplicavel = true)");
                    where.add("causaRaiz is not null and trim(causaRaiz) <> ''");
                    where.add("id in (select a.nrc.id from NrcAcao a)");
                    where.add("id not in (select a2.nrc.id from NrcAcao a2 where a2.status <> 'CONCLUIDA')");
                }
                default -> { /* ignore unknown */ }
            }
        }

        PanacheQuery<Nrc> query = Nrc.find(where.toString(), sortObj, params);
        long total = query.count();
        List<NrcSummaryDto> items = query.page(Page.of(p, s)).list().stream()
            .map(n -> toSummaryDto(n, accessUserId))
            .toList();
        return new SearchResult(items, total);
    }

    private NrcSummaryDto toSummaryDto(Nrc entity, Long accessUserId) {
        NrcSummaryDto base = mapper.toSummaryDto(entity);
        if (accessUserId == null) {
            return base;
        }
        boolean pendingAcao = NrcAccessRules.hasPendingAcaoForUser(entity.id, accessUserId);
        boolean mostrarTratar = NrcAccessRules.canShowTratarCta(entity, accessUserId, pendingAcao);
        return new NrcSummaryDto(
            base.id(), base.numero(), base.status(), base.dataDeteccao(), base.origem(),
            base.severidade(), base.osId(), base.osNumero(), base.clienteNome(),
            base.prazoTratamento(), base.responsavelTratamentoId(), base.responsavelTratamentoNome(),
            base.vencida(), base.etapaAtual(), base.prontaParaEficacia(), base.dataEncerramento(),
            mostrarTratar,
            base.aprovacaoEtapa(), base.aprovacaoStatus(), base.aprovacaoPorNome(), base.aprovacaoEm());
    }

    public boolean canShowTratarWorkflow(Long nrcId, Long usuarioId) {
        if (nrcId == null || usuarioId == null) {
            return false;
        }
        Nrc entity = Nrc.find("id = ?1 and isActive = true", nrcId).firstResult();
        if (entity == null || entity.isEncerrada()) {
            return false;
        }
        boolean pendingAcao = NrcAccessRules.hasPendingAcaoForUser(nrcId, usuarioId);
        return NrcAccessRules.canShowTratarCta(entity, usuarioId, pendingAcao);
    }

    public NrcDashboardDto dashboard(Long accessUserId, NrcDashboardFilter filter) {
        requireNrcDashboard(accessUserId);
        NrcDashboardFilter effective = filter != null ? filter : new NrcDashboardFilter(null, null, null, null);
        if (accessUserId == null || isUsuarioQualidade(accessUserId)) {
            return dashboardGlobal(effective);
        }
        return dashboardScoped(accessUserId, effective);
    }

    public NrcCatalogDto catalog(Long accessUserId) {
        requireNrcLeitura(accessUserId);
        List<String> locais = buildLocaisCatalog(accessUserId);
        return new NrcCatalogDto(locais, NrcRequisitosCatalog.CODIGOS);
    }

    private static final List<String> LOCAIS_SUGERIDOS = List.of(
        "Almoxarifado", "Linha de Montagem A", "Linha de Montagem B", "Expedição",
        "Inspeção Final", "Oficina", "RH", "Compras", "Recebimento", "Manutenção"
    );

    private NrcDashboardDto dashboardGlobal(NrcDashboardFilter filter) {
        return buildDashboard(null, filter);
    }

    private NrcDashboardDto dashboardScoped(Long accessUserId, NrcDashboardFilter filter) {
        return buildDashboard(accessUserId, filter);
    }

    private NrcDashboardDto buildDashboard(Long accessUserId, NrcDashboardFilter filter) {
        long abertas = countNrc("status = :st", Map.of("st", "ABERTA"), accessUserId, filter);
        long contencao = countNrc("status = :st", Map.of("st", "CONTENCAO"), accessUserId, filter);
        long analise = countNrc("status = :st", Map.of("st", "EM_ANALISE"), accessUserId, filter);
        long tratamento = countNrc("status = :st", Map.of("st", "EM_TRATAMENTO"), accessUserId, filter);
        long emTratamento = contencao + analise + tratamento;

        LocalDate hoje = LocalDate.now();
        long vencidas = countNrc(
            "status <> :enc and prazoTratamento is not null and prazoTratamento < :hoje",
            Map.of("enc", "ENCERRADA", "hoje", hoje),
            accessUserId, filter);

        LocalDate limiteProximas = hoje.plusDays(2);
        long proximasVencimento = countNrc(
            "status <> :enc and prazoTratamento is not null and prazoTratamento >= :hoje "
                + "and prazoTratamento <= :limite",
            Map.of("enc", "ENCERRADA", "hoje", hoje, "limite", limiteProximas),
            accessUserId, filter);

        LocalDateTime inicioMes = hoje.withDayOfMonth(1).atStartOfDay();
        long encerradasMes = countNrc(
            "status = :enc and dataEncerramento >= :inicioMes",
            Map.of("enc", "ENCERRADA", "inicioMes", inicioMes),
            accessUserId, filter);

        long total = countNrc("status <> :enc", Map.of("enc", "ENCERRADA"), accessUserId, filter);

        long etapaContencao = countNrc("status = :st", Map.of("st", "CONTENCAO"), accessUserId, filter);
        long etapaCausa = countNrc(
            "status <> :enc and (contencaoConcluida = true or contencaoNaoAplicavel = true) "
                + "and (causaRaiz is null or trim(causaRaiz) = '')",
            Map.of("enc", "ENCERRADA"),
            accessUserId, filter);
        long etapaAcoes = countEtapaAcoes(accessUserId, filter);
        long etapaEficacia = countProntaParaEficacia(accessUserId, filter);

        List<NrcDashboardTrendPoint> tendenciaMensal = buildTendenciaMensal(accessUserId, filter);
        List<NrcDashboardCountItem> porSeveridade = buildPorSeveridade(accessUserId, filter);
        List<NrcDashboardCountItem> porOrigem = buildPorOrigem(accessUserId, filter);
        Double taxaEncerramentoMes = computeTaxaEncerramentoMes(encerradasMes, accessUserId, filter);
        Double taxaEficacia = etapaEficacia > 0 ? computeTaxaEficacia(accessUserId, filter) : null;
        Double leadTimeMedioDias = computeLeadTimeMedio(accessUserId, filter);
        Double custoConsolidado = computeCustoConsolidado(accessUserId, filter);
        List<String> locaisDisponiveis = buildLocaisDisponiveis(accessUserId);

        return new NrcDashboardDto(abertas, emTratamento, vencidas, proximasVencimento, encerradasMes, total,
            etapaContencao, etapaCausa, etapaAcoes, etapaEficacia,
            tendenciaMensal, porSeveridade, porOrigem, taxaEncerramentoMes,
            taxaEficacia, leadTimeMedioDias, custoConsolidado, locaisDisponiveis);
    }

    private long countNrc(String extraWhere, Map<String, Object> extraParams, Long accessUserId) {
        return countNrc(extraWhere, extraParams, accessUserId, null);
    }

    private long countNrc(String extraWhere, Map<String, Object> extraParams, Long accessUserId,
                          NrcDashboardFilter filter) {
        StringJoiner where = new StringJoiner(" and ");
        Map<String, Object> params = new HashMap<>(extraParams != null ? extraParams : Map.of());
        where.add("isActive = true");
        if (extraWhere != null && !extraWhere.isBlank()) {
            where.add(extraWhere);
        }
        applyDashboardFilter(where, params, filter);
        if (accessUserId != null && !isUsuarioQualidade(accessUserId)) {
            where.add(ACCESS_SCOPE_PANACHE);
            params.put("accessUid", accessUserId);
        }
        return Nrc.count(where.toString(), params);
    }

    private void applyDashboardFilter(StringJoiner where, Map<String, Object> params, NrcDashboardFilter filter) {
        if (filter == null) {
            return;
        }
        if (filter.dataInicio() != null) {
            where.add("dataDeteccao >= :dashInicio");
            params.put("dashInicio", filter.dataInicio().atStartOfDay());
        }
        if (filter.dataFim() != null) {
            where.add("dataDeteccao < :dashFim");
            params.put("dashFim", filter.dataFim().plusDays(1).atStartOfDay());
        }
        if (filter.origem() != null && !filter.origem().isBlank()) {
            NrcEnums.requireOrigemFiltro(filter.origem());
            where.add("origem = :dashOrigem");
            params.put("dashOrigem", filter.origem());
        }
        if (filter.localOcorrencia() != null && !filter.localOcorrencia().isBlank()) {
            where.add("localOcorrencia = :dashLocal");
            params.put("dashLocal", filter.localOcorrencia().trim());
        }
        if (filter.origemInterna() != null) {
            if (Boolean.TRUE.equals(filter.origemInterna())) {
                where.add("origem in ('OFICINA', 'ESTOQUE', 'INSPECAO', 'AUDITORIA_INTERNA')");
            } else {
                where.add("origem = 'CLIENTE'");
            }
        }
    }

    private void applyDashboardFilterJpql(StringBuilder jpql, Map<String, Object> params, NrcDashboardFilter filter) {
        if (filter == null) {
            return;
        }
        if (filter.dataInicio() != null) {
            jpql.append(" AND n.dataDeteccao >= :dashInicio");
            params.put("dashInicio", filter.dataInicio().atStartOfDay());
        }
        if (filter.dataFim() != null) {
            jpql.append(" AND n.dataDeteccao < :dashFim");
            params.put("dashFim", filter.dataFim().plusDays(1).atStartOfDay());
        }
        if (filter.origem() != null && !filter.origem().isBlank()) {
            NrcEnums.requireOrigemFiltro(filter.origem());
            jpql.append(" AND n.origem = :dashOrigem");
            params.put("dashOrigem", filter.origem());
        }
        if (filter.localOcorrencia() != null && !filter.localOcorrencia().isBlank()) {
            jpql.append(" AND n.localOcorrencia = :dashLocal");
            params.put("dashLocal", filter.localOcorrencia().trim());
        }
        if (filter.origemInterna() != null) {
            if (Boolean.TRUE.equals(filter.origemInterna())) {
                jpql.append(" AND n.origem IN ('OFICINA', 'ESTOQUE', 'INSPECAO', 'AUDITORIA_INTERNA')");
            } else {
                jpql.append(" AND n.origem = 'CLIENTE'");
            }
        }
    }

    private List<NrcDashboardTrendPoint> buildTendenciaMensal(Long accessUserId, NrcDashboardFilter filter) {
        NrcDashboardFilter effective = filter != null ? filter : new NrcDashboardFilter(null, null, null, null);
        int meses = effective.mesesEfetivos();
        List<NrcDashboardTrendPoint> points = new ArrayList<>();
        LocalDate hoje = effective.dataFim() != null ? effective.dataFim() : LocalDate.now();
        if (effective.dataInicio() != null) {
            meses = (int) java.time.temporal.ChronoUnit.MONTHS.between(
                effective.dataInicio().withDayOfMonth(1), hoje.withDayOfMonth(1)) + 1;
            meses = Math.max(1, meses);
        }
        DateTimeFormatter mesFmt = DateTimeFormatter.ofPattern("yyyy-MM");
        for (int i = meses - 1; i >= 0; i--) {
            LocalDate mes = hoje.minusMonths(i).withDayOfMonth(1);
            LocalDateTime inicio = mes.atStartOfDay();
            LocalDateTime fim = mes.plusMonths(1).atStartOfDay();
            long abertas = countNrc(
                "dataDeteccao >= :inicio and dataDeteccao < :fim",
                Map.of("inicio", inicio, "fim", fim),
                accessUserId, filter);
            long encerradas = countNrc(
                "status = :enc and dataEncerramento >= :inicio and dataEncerramento < :fim",
                Map.of("enc", "ENCERRADA", "inicio", inicio, "fim", fim),
                accessUserId, filter);
            points.add(new NrcDashboardTrendPoint(mes.format(mesFmt), abertas, encerradas));
        }
        return trimLeadingEmptyTrendMonths(points);
    }

    private List<NrcDashboardTrendPoint> trimLeadingEmptyTrendMonths(List<NrcDashboardTrendPoint> points) {
        if (points.size() <= 1) {
            return points;
        }
        int start = 0;
        while (start < points.size() - 1
            && points.get(start).abertas() == 0
            && points.get(start).encerradas() == 0) {
            start++;
        }
        return new ArrayList<>(points.subList(start, points.size()));
    }

    private List<NrcDashboardCountItem> buildPorSeveridade(Long accessUserId, NrcDashboardFilter filter) {
        List<NrcDashboardCountItem> items = new ArrayList<>();
        for (String severidade : NrcEnums.SEVERIDADES) {
            long total = countNrc(
                "status <> :enc and severidade = :sev",
                Map.of("enc", "ENCERRADA", "sev", severidade),
                accessUserId, filter);
            if (total > 0) {
                items.add(new NrcDashboardCountItem(severidade, total));
            }
        }
        return items;
    }

    private List<NrcDashboardCountItem> buildPorOrigem(Long accessUserId, NrcDashboardFilter filter) {
        List<NrcDashboardCountItem> items = new ArrayList<>();
        for (String origem : NrcEnums.ORIGENS) {
            long total = countNrc(
                "status <> :enc and origem = :orig",
                Map.of("enc", "ENCERRADA", "orig", origem),
                accessUserId, filter);
            if (total > 0) {
                items.add(new NrcDashboardCountItem(origem, total));
            }
        }
        return items;
    }

    private Double computeTaxaEncerramentoMes(long encerradasMes, Long accessUserId, NrcDashboardFilter filter) {
        LocalDate hoje = LocalDate.now();
        LocalDateTime inicioMes = hoje.withDayOfMonth(1).atStartOfDay();
        LocalDateTime fimMes = hoje.plusMonths(1).withDayOfMonth(1).atStartOfDay();
        long abertasNoMes = countNrc(
            "dataDeteccao >= :inicio and dataDeteccao < :fim",
            Map.of("inicio", inicioMes, "fim", fimMes),
            accessUserId, filter);
        if (abertasNoMes <= 0) {
            return null;
        }
        return Math.round(encerradasMes * 1000.0 / abertasNoMes) / 10.0;
    }

    private Double computeTaxaEficacia(Long accessUserId, NrcDashboardFilter filter) {
        long eficazes = countNrc(
            "status = :enc and eficaciaDecisao = :dec",
            Map.of("enc", "ENCERRADA", "dec", "EFICAZ"),
            accessUserId, filter);
        long ineficazes = countNrc(
            "status = :enc and eficaciaDecisao = :dec",
            Map.of("enc", "ENCERRADA", "dec", "INEFICAZ"),
            accessUserId, filter);
        long total = eficazes + ineficazes;
        if (total <= 0) {
            return null;
        }
        return Math.round(eficazes * 1000.0 / total) / 10.0;
    }

    private Double computeLeadTimeMedio(Long accessUserId, NrcDashboardFilter filter) {
        StringBuilder jpql = new StringBuilder(
            "SELECT n.dataDeteccao, n.dataEncerramento FROM Nrc n WHERE n.isActive = true "
                + "AND n.status = 'ENCERRADA' AND n.dataDeteccao IS NOT NULL AND n.dataEncerramento IS NOT NULL");
        Map<String, Object> params = new HashMap<>();
        applyDashboardFilterJpql(jpql, params, filter);
        if (accessUserId != null && !isUsuarioQualidade(accessUserId)) {
            jpql.append(" AND ").append(ACCESS_SCOPE_JPQL);
            params.put("accessUid", accessUserId);
        }
        var query = entityManager.createQuery(jpql.toString(), Object[].class);
        params.forEach(query::setParameter);
        List<Object[]> rows = query.getResultList();
        if (rows.isEmpty()) {
            return null;
        }
        double sumDays = 0;
        for (Object[] row : rows) {
            LocalDateTime deteccao = (LocalDateTime) row[0];
            LocalDateTime encerramento = (LocalDateTime) row[1];
            sumDays += ChronoUnit.DAYS.between(deteccao.toLocalDate(), encerramento.toLocalDate());
        }
        return Math.round((sumDays / rows.size()) * 10.0) / 10.0;
    }

    private Double computeCustoConsolidado(Long accessUserId, NrcDashboardFilter filter) {
        StringBuilder jpql = new StringBuilder(
            "SELECT COALESCE(SUM(n.custoNaoConformidade), 0) FROM Nrc n WHERE n.isActive = true "
                + "AND n.custoNaoConformidade IS NOT NULL");
        Map<String, Object> params = new HashMap<>();
        applyDashboardFilterJpql(jpql, params, filter);
        if (accessUserId != null && !isUsuarioQualidade(accessUserId)) {
            jpql.append(" AND ").append(ACCESS_SCOPE_JPQL);
            params.put("accessUid", accessUserId);
        }
        var query = entityManager.createQuery(jpql.toString(), java.math.BigDecimal.class);
        params.forEach(query::setParameter);
        java.math.BigDecimal sum = query.getSingleResult();
        if (sum == null || sum.signum() == 0) {
            return null;
        }
        return sum.setScale(2, java.math.RoundingMode.HALF_UP).doubleValue();
    }

    private List<String> buildLocaisDisponiveis(Long accessUserId) {
        return buildLocaisCatalog(accessUserId);
    }

    private List<String> buildLocaisCatalog(Long accessUserId) {
        java.util.LinkedHashSet<String> merged = new java.util.LinkedHashSet<>(LOCAIS_SUGERIDOS);
        StringBuilder jpql = new StringBuilder(
            "SELECT DISTINCT n.localOcorrencia FROM Nrc n WHERE n.isActive = true "
                + "AND n.localOcorrencia IS NOT NULL AND trim(n.localOcorrencia) <> ''");
        Map<String, Object> params = new HashMap<>();
        if (accessUserId != null && !isUsuarioQualidade(accessUserId)) {
            jpql.append(" AND ").append(ACCESS_SCOPE_JPQL);
            params.put("accessUid", accessUserId);
        }
        jpql.append(" ORDER BY n.localOcorrencia");
        var query = entityManager.createQuery(jpql.toString(), String.class);
        params.forEach(query::setParameter);
        query.getResultList().stream()
            .filter(s -> s != null && !s.isBlank())
            .map(String::trim)
            .forEach(merged::add);
        return merged.stream().toList();
    }

    private long countEtapaAcoes(Long accessUserId, NrcDashboardFilter filter) {
        StringBuilder jpql = new StringBuilder(
            "SELECT COUNT(n) FROM Nrc n WHERE n.isActive = true AND n.status <> 'ENCERRADA' "
                + "AND (n.contencaoConcluida = true OR n.contencaoNaoAplicavel = true) "
                + "AND n.causaRaiz IS NOT NULL AND trim(n.causaRaiz) <> '' "
                + "AND (NOT EXISTS (SELECT a FROM NrcAcao a WHERE a.nrc = n) "
                + "OR EXISTS (SELECT a2 FROM NrcAcao a2 WHERE a2.nrc = n AND a2.status <> 'CONCLUIDA'))");
        Map<String, Object> params = new HashMap<>();
        applyDashboardFilterJpql(jpql, params, filter);
        if (accessUserId != null && !isUsuarioQualidade(accessUserId)) {
            jpql.append(" AND ").append(ACCESS_SCOPE_JPQL);
            params.put("accessUid", accessUserId);
        }
        var query = entityManager.createQuery(jpql.toString(), Long.class);
        params.forEach(query::setParameter);
        Number n = (Number) query.getSingleResult();
        return n != null ? n.longValue() : 0L;
    }

    private long countProntaParaEficacia(Long accessUserId, NrcDashboardFilter filter) {
        StringBuilder jpql = new StringBuilder(
            "SELECT COUNT(n) FROM Nrc n WHERE n.isActive = true AND n.status = 'EM_TRATAMENTO' "
                + "AND (n.contencaoConcluida = true OR n.contencaoNaoAplicavel = true) "
                + "AND n.causaRaiz IS NOT NULL AND trim(n.causaRaiz) <> '' "
                + "AND EXISTS (SELECT a FROM NrcAcao a WHERE a.nrc = n) "
                + "AND NOT EXISTS (SELECT a2 FROM NrcAcao a2 WHERE a2.nrc = n AND a2.status <> 'CONCLUIDA')");
        Map<String, Object> params = new HashMap<>();
        applyDashboardFilterJpql(jpql, params, filter);
        if (accessUserId != null && !isUsuarioQualidade(accessUserId)) {
            jpql.append(" AND ").append(ACCESS_SCOPE_JPQL);
            params.put("accessUid", accessUserId);
        }
        var query = entityManager.createQuery(jpql.toString(), Long.class);
        params.forEach(query::setParameter);
        Number n = (Number) query.getSingleResult();
        return n != null ? n.longValue() : 0L;
    }

    private long countEtapaAcoes(Long accessUserId) {
        return countEtapaAcoes(accessUserId, null);
    }

    private long countProntaParaEficacia(Long accessUserId) {
        return countProntaParaEficacia(accessUserId, null);
    }

    @Transactional
    public NrcDto create(NrcDto dto, NrcUsuarioContext usuario) {
        requireNrcAbrir(usuario);
        if (dto.responsavelTratamentoId() == null) {
            throw new NrcBusinessException(NrcErrorCode.RESPONSAVEL_REQUIRED);
        }
        NrcEnums.requireOrigem(dto.origem());
        NrcEnums.requireTipoNc(dto.tipoNc());
        NrcEnums.requireSeveridade(dto.severidade());
        validarCustoNaoConformidade(dto.custoNaoConformidade());
        validarDataOcorrencia(dto.dataOcorrencia());
        Usuario resp = resolveActiveUsuario(dto.responsavelTratamentoId());
        Nrc entity = mapper.toEntity(dto);
        entity.responsavelTratamentoId = resp.id.longValue();
        entity.responsavelTratamentoNome = formatUsuarioNome(resp);
        entity.numero = gerarNumeroNrc();
        entity.status = "ABERTA";
        entity.isActive = true;
        entity.dataDeteccao = dto.dataDeteccao() != null ? dto.dataDeteccao() : LocalDateTime.now();
        entity.dataOcorrencia = dto.dataOcorrencia() != null ? dto.dataOcorrencia() : entity.dataDeteccao;

        if (usuario != null) {
            entity.detectadoPorId = usuario.usuarioId();
            entity.detectadoPorNome = usuario.usuarioNome();
        }

        enrichOsLink(entity);
        entity.persist();
        registrarAuditoria(entity, "CRIACAO", null, null, null, usuario);
        if (entity.responsavelTratamentoId != null) {
            registrarHistoricoResponsavel(entity);
            registrarAuditoria(entity, "DELEGACAO_TRATAMENTO", "responsavelTratamentoNome",
                null, entity.responsavelTratamentoNome, usuario);
            notificarResponsavelTratamento(entity, usuario);
        }
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto assumirTratamento(Long id, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        if ("ENCERRADA".equals(entity.status)) {
            throw new NrcBusinessException(NrcErrorCode.NRC_ENCERRADA);
        }
        if (usuario == null || usuario.usuarioId() == null) {
            throw new NrcBusinessException(NrcErrorCode.USUARIO_NAO_IDENTIFICADO);
        }
        if (entity.responsavelTratamentoId != null
            && !Objects.equals(entity.responsavelTratamentoId, usuario.usuarioId())) {
            throw new NrcBusinessException(NrcErrorCode.RESPONSAVEL_JA_ATRIBUIDO);
        }
        if (Objects.equals(entity.responsavelTratamentoId, usuario.usuarioId())) {
            return mapper.toDto(entity);
        }
        String responsavelAnterior = entity.responsavelTratamentoNome;
        entity.responsavelTratamentoId = usuario.usuarioId();
        entity.responsavelTratamentoNome = usuario.usuarioNome();
        registrarHistoricoResponsavel(entity);
        registrarAuditoria(entity, "DELEGACAO_TRATAMENTO", "responsavelTratamentoNome",
            responsavelAnterior, entity.responsavelTratamentoNome, usuario);
        notificarResponsavelTratamento(entity, usuario);
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto delegarTratamento(Long id, NrcDelegarRequest req, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        if (usuario == null || usuario.usuarioId() == null) {
            throw new NrcBusinessException(NrcErrorCode.USUARIO_NAO_IDENTIFICADO);
        }
        if (entity.responsavelTratamentoId == null) {
            throw new NrcBusinessException(NrcErrorCode.SEM_RESPONSAVEL);
        }
        if (!Objects.equals(entity.responsavelTratamentoId, usuario.usuarioId())
            && !isUsuarioQualidade(usuario.usuarioId())) {
            throw new NrcBusinessException(NrcErrorCode.DELEGAR_NAO_PERMITIDO);
        }
        if (req.responsavelTratamentoId() == null) {
            throw new NrcBusinessException(NrcErrorCode.NOVO_RESPONSAVEL_REQUIRED);
        }
        if (Objects.equals(req.responsavelTratamentoId(), usuario.usuarioId())) {
            throw new NrcBusinessException(NrcErrorCode.NOVO_RESPONSAVEL_IGUAL);
        }
        if (Objects.equals(req.responsavelTratamentoId(), entity.responsavelTratamentoId)) {
            return mapper.toDto(entity);
        }
        Usuario target = resolveActiveUsuario(req.responsavelTratamentoId());
        String targetNome = formatUsuarioNome(target);
        String responsavelAnterior = entity.responsavelTratamentoNome;
        entity.responsavelTratamentoId = req.responsavelTratamentoId();
        entity.responsavelTratamentoNome = targetNome;
        registrarHistoricoResponsavel(entity);
        registrarAuditoria(entity, "DELEGACAO_TRATAMENTO", "responsavelTratamentoNome",
            responsavelAnterior, entity.responsavelTratamentoNome, usuario);
        notificarResponsavelTratamento(entity, usuario);
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto updateAbertura(Long id, NrcAberturaUpdateDto dto, NrcUsuarioContext usuario) {
        requireNrcAbrir(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        if (!List.of("ABERTA", "CONTENCAO").contains(entity.status)) {
            throw new NrcBusinessException(NrcErrorCode.EDICAO_STATUS_INVALIDO,
                "RNC não pode ser editada neste status: " + entity.status);
        }
        validarResponsavelOuQualidadeEdicao(entity, usuario);
        validarCustoNaoConformidade(dto.custoNaoConformidade());
        validarDataOcorrencia(dto.dataOcorrencia());
        mapper.applyAberturaUpdate(dto, entity);
        enrichOsLink(entity);
        registrarAuditoria(entity, "ATUALIZACAO", "dados_abertura", null, "alterado", usuario);
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto registrarContencao(Long id, NrcContencaoRequest req, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        validarResponsavelOuContencao(entity, usuario);

        if (Boolean.TRUE.equals(req.contencaoNaoAplicavel())) {
            if (!canBypassContencaoAprovacao(usuario)) {
                throw new NrcBusinessException(NrcErrorCode.CONTENCAO_OBRIGATORIA);
            }
            entity.contencaoNaoAplicavel = true;
            entity.contencaoConcluida = true;
            entity.contencaoDataConclusao = LocalDateTime.now();
            entity.contencaoAprovacaoStatus = null;
            entity.status = "EM_ANALISE";
            registrarAuditoria(entity, "CONTENCAO", "contencaoNaoAplicavel", null, "NAO_APLICAVEL", usuario);
            return mapper.toDto(entity);
        }

        persistContencaoDraft(entity, req, usuario);
        registrarAuditoria(entity, "CONTENCAO", "contencaoAcao", null, entity.contencaoAcao, usuario);

        if (Boolean.TRUE.equals(req.concluirContencao())) {
            if (canBypassContencaoAprovacao(usuario)) {
                return aplicarAprovacaoContencao(entity, usuario);
            }
            throw new NrcBusinessException(NrcErrorCode.CONTENCAO_USE_SOLICITAR_APROVACAO);
        }
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto solicitarAprovacaoContencao(Long id, NrcContencaoRequest req, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        validarResponsavelOuContencao(entity, usuario);

        if (Boolean.TRUE.equals(req.contencaoNaoAplicavel())) {
            throw new NrcBusinessException(NrcErrorCode.CONTENCAO_OBRIGATORIA);
        }
        if (Boolean.TRUE.equals(entity.contencaoConcluida)) {
            throw new NrcBusinessException(NrcErrorCode.CONTENCAO_INCOMPLETA);
        }
        if ("PENDENTE_APROVACAO".equals(entity.contencaoAprovacaoStatus)) {
            throw new NrcBusinessException(NrcErrorCode.CONTENCAO_APROVACAO_PENDENTE);
        }

        persistContencaoDraft(entity, req, usuario);
        entity.contencaoAprovacaoStatus = "PENDENTE_APROVACAO";
        entity.contencaoSolicitadoEm = LocalDateTime.now();
        entity.contencaoSolicitadoPorId = usuario != null ? usuario.usuarioId() : null;
        entity.contencaoSolicitadoPorNome = usuario != null ? usuario.usuarioNome() : null;
        entity.contencaoRejeicaoObservacoes = null;
        registrarAuditoria(entity, "CONTENCAO_SOLICITACAO_APROVACAO", "contencaoAprovacaoStatus",
            null, "PENDENTE_APROVACAO", usuario);
        notificarContencaoAprovacaoQualidade(entity, usuario);
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto aprovarContencao(Long id, NrcUsuarioContext usuario) {
        requireNrcEncerrar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        if (!"PENDENTE_APROVACAO".equals(entity.contencaoAprovacaoStatus)) {
            throw new NrcBusinessException(NrcErrorCode.CONTENCAO_SEM_SOLICITACAO_PENDENTE);
        }
        return aplicarAprovacaoContencao(entity, usuario);
    }

    @Transactional
    public NrcDto rejeitarContencao(Long id, NrcContencaoRejeicaoRequest req, NrcUsuarioContext usuario) {
        requireNrcEncerrar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        if (!"PENDENTE_APROVACAO".equals(entity.contencaoAprovacaoStatus)) {
            throw new NrcBusinessException(NrcErrorCode.CONTENCAO_SEM_SOLICITACAO_PENDENTE);
        }
        if (req == null || req.observacoes() == null || req.observacoes().isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.CONTENCAO_REJEICAO_OBSERVACOES_REQUIRED);
        }
        String obs = req.observacoes().trim();
        entity.contencaoAprovacaoStatus = "REJEITADA";
        entity.contencaoConcluida = false;
        entity.contencaoDataConclusao = null;
        entity.contencaoRejeicaoObservacoes = obs;
        entity.contencaoAprovadoPorId = usuario != null ? usuario.usuarioId() : null;
        entity.contencaoAprovadoPorNome = usuario != null ? usuario.usuarioNome() : null;
        entity.contencaoAprovadoEm = LocalDateTime.now();
        registrarAuditoria(entity, "CONTENCAO_REJEITADA", "contencaoAprovacaoStatus",
            "PENDENTE_APROVACAO", "REJEITADA", usuario);
        registrarAuditoria(entity, "CONTENCAO_REJEICAO_OBS", "contencaoRejeicaoObservacoes", null, obs, usuario);
        notificarContencaoRejeitada(entity, obs, usuario);
        return mapper.toDto(entity);
    }

    private void persistContencaoDraft(Nrc entity, NrcContencaoRequest req, NrcUsuarioContext usuario) {
        validarContencao3W(req);
        entity.contencaoNaoAplicavel = false;
        entity.contencaoOque = req.contencaoOque();
        entity.contencaoQuem = req.contencaoQuem();
        entity.contencaoQuando = req.contencaoQuando();
        entity.contencaoAcao = buildContencaoTexto(req);
        entity.contencaoResponsavelId = req.contencaoResponsavelId() != null ? req.contencaoResponsavelId()
            : (usuario != null ? usuario.usuarioId() : null);
        entity.contencaoResponsavelNome = req.contencaoResponsavelNome() != null ? req.contencaoResponsavelNome()
            : (usuario != null ? usuario.usuarioNome() : null);
        entity.contencaoData = LocalDateTime.now();
        entity.status = "CONTENCAO";
    }

    private NrcDto aplicarAprovacaoContencao(Nrc entity, NrcUsuarioContext usuario) {
        String statusAnterior = entity.contencaoAprovacaoStatus;
        entity.contencaoConcluida = true;
        entity.contencaoDataConclusao = LocalDateTime.now();
        entity.contencaoAprovacaoStatus = null;
        entity.contencaoRejeicaoObservacoes = null;
        entity.contencaoAprovadoPorId = usuario != null ? usuario.usuarioId() : null;
        entity.contencaoAprovadoPorNome = usuario != null ? usuario.usuarioNome() : null;
        entity.contencaoAprovadoEm = LocalDateTime.now();
        entity.status = "EM_ANALISE";
        registrarAuditoria(entity, "CONTENCAO_CONCLUIDA", "contencaoConcluida", null, "true", usuario);
        registrarAuditoria(entity, "CONTENCAO_APROVADA", "contencaoAprovacaoStatus",
            statusAnterior, "APROVADA", usuario);
        notificarEtapa(entity, "CAUSA", entity.responsavelTratamentoId, entity.responsavelTratamentoNome,
            null, usuario);
        return mapper.toDto(entity);
    }

    private boolean canBypassContencaoAprovacao(NrcUsuarioContext usuario) {
        return usuario != null && usuario.usuarioId() != null
            && (isUsuarioQualidade(usuario.usuarioId()) || temNrcEncerrar(usuario.usuarioId()));
    }

    private void notificarContencaoAprovacaoQualidade(Nrc entity, NrcUsuarioContext usuario) {
        Set<Long> notificados = new HashSet<>();
        String detalhe = entity.contencaoAcao != null ? entity.contencaoAcao : "Correção imediata (3W)";
        for (Usuario aprovador : findUsuariosNotificacaoQualidade(null)) {
            Long uid = aprovador.id.longValue();
            if (notificados.add(uid)) {
                notificarEtapa(entity, "CONTENCAO_APROVACAO", uid, formatUsuarioNome(aprovador), detalhe, usuario);
            }
        }
        if (notificados.isEmpty()) {
            registrarAuditoria(entity, "NOTIFICACAO_EMAIL_FALHA", "CONTENCAO_APROVACAO", null,
                "Nenhum utilizador do perfil Qualidade/SGQ com e-mail disponível para aprovar correção imediata", usuario);
        }
    }

    private void notificarContencaoRejeitada(Nrc entity, String observacoes, NrcUsuarioContext usuario) {
        Long destinatarioId = entity.contencaoSolicitadoPorId != null
            ? entity.contencaoSolicitadoPorId
            : entity.responsavelTratamentoId;
        String destinatarioNome = entity.contencaoSolicitadoPorNome != null
            ? entity.contencaoSolicitadoPorNome
            : entity.responsavelTratamentoNome;
        String detalhe = observacoes;
        if (entity.contencaoAcao != null && !entity.contencaoAcao.isBlank()) {
            detalhe = observacoes + "\n\n— Correção registada —\n" + entity.contencaoAcao;
        }
        notificarEtapa(entity, "CONTENCAO_REJEITADA", destinatarioId, destinatarioNome, detalhe, usuario);
    }

    @Transactional
    public NrcDto registrarAnalise(Long id, NrcAnaliseRequest req, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        AnaliseCausaStatus causaStatus = AnaliseCausaStatus.fromDb(entity.analiseCausaStatus);
        validarResponsavelTratamentoOuSolicitante(
            entity, usuario, entity.analiseCausaSolicitadoPorId,
            causaStatus == AnaliseCausaStatus.REJEITADO);
        validarContencaoConcluida(entity);
        validarAnaliseCausaEditavel(entity, usuario);

        persistAnaliseCausaDraft(entity, req, usuario);

        if (Boolean.TRUE.equals(req.concluirAnalise())) {
            if (!canBypassAnaliseCausaAprovacao(usuario)) {
                throw new NrcBusinessException(NrcErrorCode.CAUSA_USE_SOLICITAR_APROVACAO);
            }
            return aplicarAprovacaoAnaliseCausa(entity, usuario);
        }
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto solicitarAprovacaoAnaliseCausa(Long id, NrcAnaliseRequest req, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        AnaliseCausaStatus causaStatusInicial = AnaliseCausaStatus.fromDb(entity.analiseCausaStatus);
        validarResponsavelTratamentoOuSolicitante(
            entity, usuario, entity.analiseCausaSolicitadoPorId,
            causaStatusInicial == AnaliseCausaStatus.REJEITADO);
        validarContencaoConcluida(entity);
        validarAnaliseCausaEditavel(entity, usuario);

        AnaliseCausaStatus status = causaStatusInicial;
        if (status == AnaliseCausaStatus.AGUARDANDO_APROVACAO) {
            throw new NrcBusinessException(NrcErrorCode.CAUSA_APROVACAO_PENDENTE);
        }
        if (status == AnaliseCausaStatus.APROVADO) {
            throw new NrcBusinessException(NrcErrorCode.CAUSA_JA_APROVADA);
        }

        persistAnaliseCausaDraft(entity, req, usuario);
        validarAnaliseCausaMinima(entity);

        entity.analiseCausaStatus = AnaliseCausaStatus.AGUARDANDO_APROVACAO.toDb();
        entity.analiseCausaSolicitadoEm = LocalDateTime.now();
        entity.analiseCausaSolicitadoPorId = usuario != null ? usuario.usuarioId() : null;
        entity.analiseCausaSolicitadoPorNome = usuario != null ? usuario.usuarioNome() : null;
        entity.analiseCausaRejeicaoObservacoes = null;
        entity.status = "EM_ANALISE";
        registrarAuditoria(entity, "CAUSA_SOLICITACAO_APROVACAO", "analiseCausaStatus",
            status.toDb(), AnaliseCausaStatus.AGUARDANDO_APROVACAO.toDb(), usuario);
        notificarAnaliseCausaAprovacaoQualidade(entity, usuario);
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto aprovarAnaliseCausa(Long id, NrcUsuarioContext usuario) {
        requireNrcEncerrar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        if (!AnaliseCausaStatus.AGUARDANDO_APROVACAO.toDb().equals(entity.analiseCausaStatus)) {
            throw new NrcBusinessException(NrcErrorCode.CAUSA_SEM_SOLICITACAO_PENDENTE);
        }
        return aplicarAprovacaoAnaliseCausa(entity, usuario);
    }

    @Transactional
    public NrcDto rejeitarAnaliseCausa(Long id, NrcContencaoRejeicaoRequest req, NrcUsuarioContext usuario) {
        requireNrcEncerrar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        if (!AnaliseCausaStatus.AGUARDANDO_APROVACAO.toDb().equals(entity.analiseCausaStatus)) {
            throw new NrcBusinessException(NrcErrorCode.CAUSA_SEM_SOLICITACAO_PENDENTE);
        }
        if (req == null || req.observacoes() == null || req.observacoes().isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.CAUSA_REJEICAO_OBSERVACOES_REQUIRED);
        }
        String obs = req.observacoes().trim();
        entity.analiseCausaStatus = AnaliseCausaStatus.REJEITADO.toDb();
        entity.analiseCausaRejeicaoObservacoes = obs;
        entity.analiseCausaAprovadoPorId = usuario != null ? usuario.usuarioId() : null;
        entity.analiseCausaAprovadoPorNome = usuario != null ? usuario.usuarioNome() : null;
        entity.analiseCausaAprovadoEm = LocalDateTime.now();
        registrarAuditoria(entity, "CAUSA_REJEITADA", "analiseCausaStatus",
            AnaliseCausaStatus.AGUARDANDO_APROVACAO.toDb(), AnaliseCausaStatus.REJEITADO.toDb(), usuario);
        registrarAuditoria(entity, "CAUSA_REJEICAO_OBS", "analiseCausaRejeicaoObservacoes", null, obs, usuario);
        notificarAnaliseCausaRejeitada(entity, obs, usuario);
        return mapper.toDto(entity);
    }

    private void persistAnaliseCausaDraft(Nrc entity, NrcAnaliseRequest req, NrcUsuarioContext usuario) {
        if (req.metodoCausa() == null || req.metodoCausa().isBlank()) {
            entity.metodoCausa = "CINCO_PORQUES";
        } else {
            NrcEnums.requireMetodoCausa(req.metodoCausa());
            entity.metodoCausa = req.metodoCausa();
        }
        if (req.causaRaiz() != null) {
            entity.causaRaiz = req.causaRaiz().trim();
        }
        entity.porque1 = req.porque1();
        entity.porque2 = req.porque2();
        entity.porque3 = req.porque3();
        entity.porque4 = req.porque4();
        entity.porque5 = req.porque5();
        entity.porquesExtra = mapper.serializePorquesExtra(req.porquesExtra());
        entity.ishikawaMaterial = req.ishikawaMaterial();
        if (req.disposicao() != null && !req.disposicao().isBlank()) {
            NrcEnums.requireDisposicao(req.disposicao());
            validarDisposicaoCritica(entity, req.disposicao(), req.disposicaoObservacao(), usuario);
            entity.disposicao = req.disposicao();
            entity.disposicaoObservacao = req.disposicaoObservacao();
            entity.disposicaoAprovadaPorId = usuario != null ? usuario.usuarioId() : null;
            entity.disposicaoAprovadaPorNome = usuario != null ? usuario.usuarioNome() : null;
            entity.disposicaoData = LocalDateTime.now();
            registrarAuditoria(entity, "DISPOSICAO", "disposicao", null, req.disposicao(), usuario);
        }
        AnaliseCausaStatus status = AnaliseCausaStatus.fromDb(entity.analiseCausaStatus);
        if (status == AnaliseCausaStatus.RASCUNHO || entity.analiseCausaStatus == null) {
            entity.analiseCausaStatus = AnaliseCausaStatus.RASCUNHO.toDb();
        }
        entity.status = "EM_ANALISE";
        registrarAuditoria(entity, "ANALISE_CAUSA", "causaRaiz", null, entity.causaRaiz, usuario);
    }

    private void validarAnaliseCausaMinima(Nrc entity) {
        if (entity.porque1 == null || entity.porque1.isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.CAUSA_PORQUE1_REQUIRED);
        }
        if (entity.causaRaiz == null || entity.causaRaiz.isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.CAUSA_ANTES_ACOES);
        }
    }

    private NrcDto aplicarAprovacaoAnaliseCausa(Nrc entity, NrcUsuarioContext usuario) {
        validarAnaliseCausaMinima(entity);
        String statusAnterior = entity.analiseCausaStatus;
        entity.analiseCausaStatus = AnaliseCausaStatus.APROVADO.toDb();
        entity.analiseCausaRejeicaoObservacoes = null;
        entity.analiseCausaAprovadoPorId = usuario != null ? usuario.usuarioId() : null;
        entity.analiseCausaAprovadoPorNome = usuario != null ? usuario.usuarioNome() : null;
        entity.analiseCausaAprovadoEm = LocalDateTime.now();
        entity.status = "EM_ANALISE";
        registrarAuditoria(entity, "CAUSA_APROVADA", "analiseCausaStatus",
            statusAnterior, AnaliseCausaStatus.APROVADO.toDb(), usuario);
        Long destinatarioId = entity.analiseCausaSolicitadoPorId != null
            ? entity.analiseCausaSolicitadoPorId
            : entity.responsavelTratamentoId;
        String destinatarioNome = entity.analiseCausaSolicitadoPorNome != null
            ? entity.analiseCausaSolicitadoPorNome
            : entity.responsavelTratamentoNome;
        notificarEtapa(entity, "CAUSA", destinatarioId, destinatarioNome, entity.causaRaiz, usuario);
        return mapper.toDto(entity);
    }

    private boolean canBypassAnaliseCausaAprovacao(NrcUsuarioContext usuario) {
        return usuario != null && usuario.usuarioId() != null
            && (isUsuarioQualidade(usuario.usuarioId()) || temNrcEncerrar(usuario.usuarioId()));
    }

    private void validarAnaliseCausaEditavel(Nrc entity, NrcUsuarioContext usuario) {
        AnaliseCausaStatus status = AnaliseCausaStatus.fromDb(entity.analiseCausaStatus);
        if (status == AnaliseCausaStatus.AGUARDANDO_APROVACAO) {
            if (!canBypassAnaliseCausaAprovacao(usuario)) {
                throw new NrcBusinessException(NrcErrorCode.CAUSA_APROVACAO_PENDENTE);
            }
        }
        if (status == AnaliseCausaStatus.APROVADO && !canBypassAnaliseCausaAprovacao(usuario)) {
            throw new NrcBusinessException(NrcErrorCode.CAUSA_APROVADA_READONLY);
        }
    }

    private void notificarAnaliseCausaAprovacaoQualidade(Nrc entity, NrcUsuarioContext usuario) {
        Set<Long> notificados = new HashSet<>();
        String detalhe = buildResumoAnaliseCausa(entity);
        for (Usuario aprovador : findUsuariosNotificacaoQualidade(null)) {
            Long uid = aprovador.id.longValue();
            if (notificados.add(uid)) {
                notificarEtapa(entity, "CAUSA_APROVACAO", uid, formatUsuarioNome(aprovador), detalhe, usuario);
            }
        }
        if (notificados.isEmpty()) {
            registrarAuditoria(entity, "NOTIFICACAO_EMAIL_FALHA", "CAUSA_APROVACAO", null,
                "Nenhum utilizador do perfil Qualidade/SGQ com e-mail disponível para aprovar análise de causa", usuario);
        }
    }

    private void notificarAnaliseCausaRejeitada(Nrc entity, String observacoes, NrcUsuarioContext usuario) {
        Long destinatarioId = entity.analiseCausaSolicitadoPorId != null
            ? entity.analiseCausaSolicitadoPorId
            : entity.responsavelTratamentoId;
        String destinatarioNome = entity.analiseCausaSolicitadoPorNome != null
            ? entity.analiseCausaSolicitadoPorNome
            : entity.responsavelTratamentoNome;
        String detalhe = observacoes;
        String resumo = buildResumoAnaliseCausa(entity);
        if (resumo != null && !resumo.isBlank()) {
            detalhe = observacoes + "\n\n— Análise registada —\n" + resumo;
        }
        notificarEtapa(entity, "CAUSA_REJEITADA", destinatarioId, destinatarioNome, detalhe, usuario);
    }

    private String buildResumoAnaliseCausa(Nrc entity) {
        StringBuilder sb = new StringBuilder();
        if (entity.porque1 != null && !entity.porque1.isBlank()) {
            sb.append("1º porquê: ").append(entity.porque1.trim());
        }
        if (entity.causaRaiz != null && !entity.causaRaiz.isBlank()) {
            if (sb.length() > 0) {
                sb.append("\n");
            }
            sb.append("Causa raiz: ").append(entity.causaRaiz.trim());
        }
        return sb.toString();
    }

    private void validarAnaliseCausaAprovada(Nrc entity) {
        if (!mapper.isAnaliseCausaAprovada(entity)) {
            AnaliseCausaStatus status = AnaliseCausaStatus.fromDb(entity.analiseCausaStatus);
            if (status == AnaliseCausaStatus.AGUARDANDO_APROVACAO) {
                throw new NrcBusinessException(NrcErrorCode.CAUSA_APROVACAO_PENDENTE);
            }
            if (status == AnaliseCausaStatus.REJEITADO) {
                throw new NrcBusinessException(NrcErrorCode.CAUSA_APROVACAO_REJEITADA);
            }
            throw new NrcBusinessException(NrcErrorCode.CAUSA_NAO_APROVADA);
        }
    }

    @Transactional
    public NrcDto registrarAcoes(Long id, NrcAcoesRequest req, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        PlanoAcoesStatus planoStatusInicial = PlanoAcoesStatus.fromDb(entity.acoesPlanoStatus);
        validarResponsavelTratamentoOuSolicitante(
            entity, usuario, entity.acoesPlanoSolicitadoPorId,
            planoStatusInicial == PlanoAcoesStatus.REJEITADO);
        validarContencaoConcluida(entity);
        validarAnaliseCausaAprovada(entity);
        validarPlanoAcoesEditavel(entity, usuario);
        if (entity.causaRaiz == null || entity.causaRaiz.isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.CAUSA_ANTES_ACOES);
        }
        if (req.acoes() == null || req.acoes().isEmpty()) {
            throw new NrcBusinessException(NrcErrorCode.ACOES_REQUIRED);
        }

        loadCollections(entity);
        Set<Long> incomingIds = req.acoes().stream()
            .map(NrcAcaoDto::id)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        for (NrcAcao existing : new ArrayList<>(entity.acoes)) {
            if (existing.id != null && !incomingIds.contains(existing.id)) {
                if ("CONCLUIDA".equals(existing.status)) {
                    throw new NrcBusinessException(NrcErrorCode.ACAO_CONCLUIDA_NAO_REMOVER);
                }
                entity.acoes.remove(existing);
            }
        }

        Map<Long, NrcAcao> byId = entity.acoes.stream()
            .filter(a -> a.id != null)
            .collect(Collectors.toMap(a -> a.id, a -> a, (a, b) -> a));

        boolean planoRejeitado = PlanoAcoesStatus.REJEITADO
            == PlanoAcoesStatus.fromDb(entity.acoesPlanoStatus);

        int ordem = 0;
        Set<Long> notificados = new HashSet<>();
        for (NrcAcaoDto acaoDto : req.acoes()) {
            if ("CONCLUIDA".equals(acaoDto.status())) {
                throw new NrcBusinessException(NrcErrorCode.ACAO_CONCLUIR_ENDPOINT);
            }
            if (acaoDto.responsavelId() == null) {
                if (entity.responsavelTratamentoId == null) {
                    throw new NrcBusinessException(NrcErrorCode.SEM_RESPONSAVEL);
                }
            }
            if (acaoDto.id() != null && byId.containsKey(acaoDto.id())) {
                NrcAcao acao = byId.get(acaoDto.id());
                if ("CONCLUIDA".equals(acao.status) && !planoRejeitado) {
                    acao.ordemItem = ordem++;
                    continue;
                }
                if (planoRejeitado && "CONCLUIDA".equals(acao.status)) {
                    reopenAcaoParaEdicao(acao);
                }
                applyAcaoDto(entity, acao, acaoDto, ordem++);
            } else {
                NrcAcao acao = mapAcaoDto(entity, acaoDto, ordem++);
                entity.acoes.add(acao);
                Long destinatarioId = acao.responsavelId;
                if (destinatarioId != null && !notificados.contains(destinatarioId)) {
                    notificados.add(destinatarioId);
                    String detalhe = acaoDto.oQue() != null && !acaoDto.oQue().isBlank()
                        ? acaoDto.oQue()
                        : acaoDto.descricao();
                    notificarEtapa(entity, "ACAO_CORRETIVA", destinatarioId, acao.responsavelNome,
                        detalhe, usuario);
                }
            }
        }
        if (req.prazoTratamento() != null && !Objects.equals(entity.prazoTratamento, req.prazoTratamento())) {
            String prazoAnterior = entity.prazoTratamento != null ? entity.prazoTratamento.toString() : null;
            entity.prazoTratamento = req.prazoTratamento();
            registrarAuditoria(entity, "PRAZO_TRATAMENTO", "prazoTratamento",
                prazoAnterior, entity.prazoTratamento.toString(), usuario);
        }
        entity.status = "EM_TRATAMENTO";
        PlanoAcoesStatus planoStatus = PlanoAcoesStatus.fromDb(entity.acoesPlanoStatus);
        if (planoStatus != PlanoAcoesStatus.APROVADO
            && planoStatus != PlanoAcoesStatus.AGUARDANDO_APROVACAO) {
            entity.acoesPlanoStatus = PlanoAcoesStatus.RASCUNHO.toDb();
        }
        registrarAuditoria(entity, "ACOES_CORRETIVAS", "quantidade", null,
            String.valueOf(req.acoes().size()), usuario);
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto solicitarAprovacaoPlanoAcoes(Long id, NrcAcoesRequest req, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        PlanoAcoesStatus planoStatusInicial = PlanoAcoesStatus.fromDb(entity.acoesPlanoStatus);
        validarResponsavelTratamentoOuSolicitante(
            entity, usuario, entity.acoesPlanoSolicitadoPorId,
            planoStatusInicial == PlanoAcoesStatus.REJEITADO);
        validarContencaoConcluida(entity);
        validarAnaliseCausaAprovada(entity);
        validarPlanoAcoesEditavel(entity, usuario);

        PlanoAcoesStatus status = planoStatusInicial;
        if (status == PlanoAcoesStatus.AGUARDANDO_APROVACAO) {
            throw new NrcBusinessException(NrcErrorCode.ACOES_APROVACAO_PENDENTE);
        }
        if (status == PlanoAcoesStatus.APROVADO) {
            throw new NrcBusinessException(NrcErrorCode.ACOES_JA_APROVADO);
        }

        registrarAcoes(id, req, usuario);
        entity = requireNrcEditableWithAccess(id, usuario);
        loadCollections(entity);
        validarPlanoAcoesMinimoAprovacao(entity);

        entity.acoesPlanoStatus = PlanoAcoesStatus.AGUARDANDO_APROVACAO.toDb();
        entity.acoesPlanoSolicitadoEm = LocalDateTime.now();
        entity.acoesPlanoSolicitadoPorId = usuario != null ? usuario.usuarioId() : null;
        entity.acoesPlanoSolicitadoPorNome = usuario != null ? usuario.usuarioNome() : null;
        entity.acoesPlanoRejeicaoObservacoes = null;
        registrarAuditoria(entity, "ACOES_SOLICITACAO_APROVACAO", "acoesPlanoStatus",
            status.toDb(), PlanoAcoesStatus.AGUARDANDO_APROVACAO.toDb(), usuario);
        notificarPlanoAcoesAprovacaoQualidade(entity, usuario);
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto aprovarPlanoAcoes(Long id, NrcUsuarioContext usuario) {
        requireNrcEncerrar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        if (!PlanoAcoesStatus.AGUARDANDO_APROVACAO.toDb().equals(entity.acoesPlanoStatus)) {
            throw new NrcBusinessException(NrcErrorCode.ACOES_SEM_SOLICITACAO_PENDENTE);
        }
        return aplicarAprovacaoPlanoAcoes(entity, usuario);
    }

    @Transactional
    public NrcDto rejeitarPlanoAcoes(Long id, NrcContencaoRejeicaoRequest req, NrcUsuarioContext usuario) {
        requireNrcEncerrar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        if (!PlanoAcoesStatus.AGUARDANDO_APROVACAO.toDb().equals(entity.acoesPlanoStatus)) {
            throw new NrcBusinessException(NrcErrorCode.ACOES_SEM_SOLICITACAO_PENDENTE);
        }
        if (req == null || req.observacoes() == null || req.observacoes().isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.ACOES_REJEICAO_OBSERVACOES_REQUIRED);
        }
        String obs = req.observacoes().trim();
        entity.acoesPlanoStatus = PlanoAcoesStatus.REJEITADO.toDb();
        entity.acoesPlanoRejeicaoObservacoes = obs;
        entity.acoesPlanoAprovadoPorId = usuario != null ? usuario.usuarioId() : null;
        entity.acoesPlanoAprovadoPorNome = usuario != null ? usuario.usuarioNome() : null;
        entity.acoesPlanoAprovadoEm = LocalDateTime.now();
        loadCollections(entity);
        reopenAcoesAposReprovacaoPlano(entity);
        registrarAuditoria(entity, "ACOES_REJEITADAS", "acoesPlanoStatus",
            PlanoAcoesStatus.AGUARDANDO_APROVACAO.toDb(), PlanoAcoesStatus.REJEITADO.toDb(), usuario);
        registrarAuditoria(entity, "ACOES_REJEICAO_OBS", "acoesPlanoRejeicaoObservacoes", null, obs, usuario);
        notificarPlanoAcoesRejeitada(entity, obs, usuario);
        return mapper.toDto(entity);
    }

    private NrcDto aplicarAprovacaoPlanoAcoes(Nrc entity, NrcUsuarioContext usuario) {
        validarPlanoAcoesMinimoAprovacao(entity);
        String statusAnterior = entity.acoesPlanoStatus;
        entity.acoesPlanoStatus = PlanoAcoesStatus.APROVADO.toDb();
        entity.acoesPlanoRejeicaoObservacoes = null;
        entity.acoesPlanoAprovadoPorId = usuario != null ? usuario.usuarioId() : null;
        entity.acoesPlanoAprovadoPorNome = usuario != null ? usuario.usuarioNome() : null;
        entity.acoesPlanoAprovadoEm = LocalDateTime.now();
        registrarAuditoria(entity, "ACOES_APROVADAS", "acoesPlanoStatus",
            statusAnterior, PlanoAcoesStatus.APROVADO.toDb(), usuario);
        Long destinatarioId = entity.acoesPlanoSolicitadoPorId != null
            ? entity.acoesPlanoSolicitadoPorId
            : entity.responsavelTratamentoId;
        String destinatarioNome = entity.acoesPlanoSolicitadoPorNome != null
            ? entity.acoesPlanoSolicitadoPorNome
            : entity.responsavelTratamentoNome;
        notificarEtapa(entity, "ACOES", destinatarioId, destinatarioNome, buildResumoPlanoAcoes(entity), usuario);
        return mapper.toDto(entity);
    }

    private void validarPlanoAcoesMinimoAprovacao(Nrc entity) {
        loadCollections(entity);
        if (entity.acoes == null || entity.acoes.isEmpty()) {
            throw new NrcBusinessException(NrcErrorCode.ACOES_REQUIRED);
        }
        if (entity.prazoTratamento == null) {
            throw new NrcBusinessException(NrcErrorCode.PRAZO_TRATAMENTO_REQUIRED);
        }
        boolean allDone = entity.acoes.stream().allMatch(a -> "CONCLUIDA".equals(a.status));
        if (!allDone) {
            throw new NrcBusinessException(NrcErrorCode.ACOES_INCOMPLETAS_APROVACAO);
        }
    }

    private boolean canBypassPlanoAcoesAprovacao(NrcUsuarioContext usuario) {
        return usuario != null && usuario.usuarioId() != null
            && (isUsuarioQualidade(usuario.usuarioId()) || temNrcEncerrar(usuario.usuarioId()));
    }

    private void validarPlanoAcoesEditavel(Nrc entity, NrcUsuarioContext usuario) {
        PlanoAcoesStatus status = PlanoAcoesStatus.fromDb(entity.acoesPlanoStatus);
        if (status == PlanoAcoesStatus.AGUARDANDO_APROVACAO) {
            if (!canBypassPlanoAcoesAprovacao(usuario)) {
                throw new NrcBusinessException(NrcErrorCode.ACOES_APROVACAO_PENDENTE);
            }
        }
        if (status == PlanoAcoesStatus.APROVADO && !canBypassPlanoAcoesAprovacao(usuario)) {
            throw new NrcBusinessException(NrcErrorCode.ACOES_APROVADO_READONLY);
        }
    }

    private void validarPlanoAcoesAprovado(Nrc entity) {
        if (!mapper.isPlanoAcoesAprovado(entity)) {
            PlanoAcoesStatus status = PlanoAcoesStatus.fromDb(entity.acoesPlanoStatus);
            if (status == PlanoAcoesStatus.AGUARDANDO_APROVACAO) {
                throw new NrcBusinessException(NrcErrorCode.ACOES_APROVACAO_PENDENTE);
            }
            if (status == PlanoAcoesStatus.REJEITADO) {
                throw new NrcBusinessException(NrcErrorCode.ACOES_APROVACAO_REJEITADA);
            }
            throw new NrcBusinessException(NrcErrorCode.ACOES_NAO_APROVADO);
        }
    }

    private void notificarPlanoAcoesAprovacaoQualidade(Nrc entity, NrcUsuarioContext usuario) {
        Set<Long> notificados = new HashSet<>();
        String detalhe = buildResumoPlanoAcoes(entity);
        for (Usuario aprovador : findUsuariosNotificacaoQualidade(null)) {
            Long uid = aprovador.id.longValue();
            if (notificados.add(uid)) {
                notificarEtapa(entity, "ACOES_APROVACAO", uid, formatUsuarioNome(aprovador), detalhe, usuario);
            }
        }
        if (notificados.isEmpty()) {
            registrarAuditoria(entity, "NOTIFICACAO_EMAIL_FALHA", "ACOES_APROVACAO", null,
                "Nenhum utilizador do perfil Qualidade/SGQ com e-mail disponível para aprovar plano de ações", usuario);
        }
    }

    private void notificarPlanoAcoesRejeitada(Nrc entity, String observacoes, NrcUsuarioContext usuario) {
        Long destinatarioId = entity.acoesPlanoSolicitadoPorId != null
            ? entity.acoesPlanoSolicitadoPorId
            : entity.responsavelTratamentoId;
        String destinatarioNome = entity.acoesPlanoSolicitadoPorNome != null
            ? entity.acoesPlanoSolicitadoPorNome
            : entity.responsavelTratamentoNome;
        String detalhe = observacoes;
        String resumo = buildResumoPlanoAcoes(entity);
        if (resumo != null && !resumo.isBlank()) {
            detalhe = observacoes + "\n\n— Plano registado —\n" + resumo;
        }
        notificarEtapa(entity, "ACOES_REJEITADA", destinatarioId, destinatarioNome, detalhe, usuario);
    }

    private String buildResumoPlanoAcoes(Nrc entity) {
        loadCollections(entity);
        if (entity.acoes == null || entity.acoes.isEmpty()) {
            return "Plano de ações corretivas registado";
        }
        StringBuilder sb = new StringBuilder();
        int i = 1;
        for (NrcAcao acao : entity.acoes) {
            if (sb.length() > 0) {
                sb.append("\n");
            }
            String desc = acao.oQue != null && !acao.oQue.isBlank()
                ? acao.oQue.trim()
                : (acao.descricao != null ? acao.descricao.trim() : "—");
            sb.append("Ação ").append(i++).append(": ").append(desc);
        }
        if (entity.prazoTratamento != null) {
            sb.append("\nPrazo de tratamento: ").append(entity.prazoTratamento);
        }
        return sb.toString();
    }

    @Transactional
    public NrcDto solicitarApreciacaoQualidade(Long id, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        validarResponsavelTratamento(entity, usuario);
        validarPrazoTratamentoDefinido(entity);
        validarProntaParaEficacia(entity);
        notificarQualidadeAposAcoesConcluidas(entity, usuario);
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto propostaTratamento(Long id, NrcPropostaTratamentoRequest req, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        validarResponsavelTratamento(entity, usuario);
        if (req.responsavelTratamentoId() != null) {
            throw new NrcBusinessException(NrcErrorCode.TRATAMENTO_RESPONSAVEL_USE_DELEGAR);
        }
        if (req.prazoTratamento() == null) {
            throw new NrcBusinessException(NrcErrorCode.TRATAMENTO_PROPOSTA_VAZIA);
        }
        boolean prazoIgual = Objects.equals(entity.prazoTratamento, req.prazoTratamento());
        if (prazoIgual) {
            throw new NrcBusinessException(NrcErrorCode.TRATAMENTO_PROPOSTA_IGUAL);
        }
        entity.responsavelTratamentoPropostoId = null;
        entity.responsavelTratamentoPropostoNome = null;
        entity.prazoTratamentoProposto = req.prazoTratamento();
        entity.tratamentoPropostaEm = LocalDateTime.now();
        entity.tratamentoAprovadoPorId = null;
        entity.tratamentoAprovadoPorNome = null;
        entity.tratamentoAprovadoEm = null;
        registrarAuditoria(entity, "PROPOSTA_TRATAMENTO", "tratamentoPropostaStatus",
            null, "PENDENTE_APROVACAO", usuario);

        entity.tratamentoPropostaStatus = "PENDENTE_APROVACAO";
        notificarPropostaTratamentoQualidade(entity, usuario);
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto aprovarTratamento(Long id, NrcUsuarioContext usuario) {
        requireNrcEncerrar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        if (!"PENDENTE_APROVACAO".equals(entity.tratamentoPropostaStatus)) {
            throw new NrcBusinessException(NrcErrorCode.TRATAMENTO_SEM_PROPOSTA_PENDENTE);
        }
        return aplicarAprovacaoTratamento(entity, usuario);
    }

    private NrcDto aplicarAprovacaoTratamento(Nrc entity, NrcUsuarioContext usuario) {
        requireNrcEncerrar(usuario);
        String prazoAnterior = entity.prazoTratamento != null ? entity.prazoTratamento.toString() : null;
        if (entity.prazoTratamentoProposto != null) {
            entity.prazoTratamento = entity.prazoTratamentoProposto;
        }
        entity.tratamentoPropostaStatus = null;
        entity.prazoTratamentoProposto = null;
        entity.responsavelTratamentoPropostoId = null;
        entity.responsavelTratamentoPropostoNome = null;
        entity.tratamentoPropostaEm = null;
        entity.tratamentoAprovadoPorId = usuario != null ? usuario.usuarioId() : null;
        entity.tratamentoAprovadoPorNome = usuario != null ? usuario.usuarioNome() : null;
        entity.tratamentoAprovadoEm = LocalDateTime.now();
        if (entity.prazoTratamento != null) {
            registrarAuditoria(entity, "TRATAMENTO_APROVADO", "prazoTratamento",
                prazoAnterior, entity.prazoTratamento.toString(), usuario);
        }
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto concluirAcao(Long id, Long acaoId, NrcConcluirAcaoRequest req, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        loadCollections(entity);
        NrcAcao acao = entity.acoes.stream()
            .filter(a -> Objects.equals(a.id, acaoId))
            .findFirst()
            .orElseThrow(() -> new NrcNotFoundException(NrcErrorCode.ACAO_NOT_FOUND, acaoId));
        validarResponsavelOuAssigneeAcao(entity, acao, usuario);

        if (req.evidenciaConclusao() == null || req.evidenciaConclusao().isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.EVIDENCIA_CONCLUSAO_REQUIRED);
        }

        acao.status = "CONCLUIDA";
        acao.dataConclusao = LocalDateTime.now();
        acao.evidenciaConclusao = req.evidenciaConclusao();
        acao.concluidoPorId = usuario.usuarioId();
        acao.concluidoPorNome = usuario.usuarioNome();

        registrarAuditoria(entity, "ACAO_CONCLUIDA", "descricao", null, acao.descricao, usuario);
        loadCollections(entity);
        if (mapper.isProntaParaEficacia(entity)) {
            notificarQualidadeAposAcoesConcluidas(entity, usuario);
        }
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto registrarVerificacaoEficacia(Long id, NrcVerificacaoEficaciaRequest req,
                                               NrcUsuarioContext usuario) {
        requireNrcEncerrar(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        validarProntaParaEficacia(entity);
        if (req.verificacaoEficacia() == null || req.verificacaoEficacia().isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.VERIFICACAO_EFICACIA_REQUIRED);
        }
        if (req.eficaciaDecisao() == null || req.eficaciaDecisao().isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.EFICACIA_DECISAO_REQUIRED);
        }
        NrcEnums.requireEficaciaDecisao(req.eficaciaDecisao());

        entity.verificacaoEficacia = req.verificacaoEficacia().trim();
        entity.verificacaoData = LocalDateTime.now();
        entity.eficaciaDecisao = req.eficaciaDecisao();
        entity.eficaciaAtualizarRiscos = req.eficaciaAtualizarRiscos();
        entity.eficaciaMudancasSgq = req.eficaciaMudancasSgq();
        registrarAuditoria(entity, "VERIFICACAO_EFICACIA", "verificacaoEficacia",
            null, req.verificacaoEficacia(), usuario);
        registrarAuditoria(entity, "EFICACIA_DECISAO", "eficaciaDecisao", null, req.eficaciaDecisao(), usuario);
        return mapper.toDto(entity);
    }

    @Transactional
    public NrcDto encerrar(Long id, NrcEncerramentoRequest req, NrcUsuarioContext usuario) {
        requireUsuario(usuario);
        Nrc entity = requireNrcEditableWithAccess(id, usuario);
        validarProntaParaEficacia(entity);
        loadCollections(entity);

        if (req.eficaciaDecisao() == null || req.eficaciaDecisao().isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.EFICACIA_DECISAO_REQUIRED);
        }
        NrcEnums.requireEficaciaDecisao(req.eficaciaDecisao());
        if (req.verificacaoEficacia() == null || req.verificacaoEficacia().isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.VERIFICACAO_EFICACIA_REQUIRED);
        }

        if ("INEFICAZ".equals(req.eficaciaDecisao())) {
            requireNrcEncerrar(usuario);
            return registrarEficaciaIneficaz(entity, req, usuario);
        }

        requireNrcEncerrar(usuario);

        String statusAnterior = entity.status;
        entity.verificacaoEficacia = req.verificacaoEficacia();
        entity.verificacaoData = LocalDateTime.now();
        entity.eficaciaDecisao = req.eficaciaDecisao();
        entity.eficaciaAtualizarRiscos = req.eficaciaAtualizarRiscos();
        entity.eficaciaMudancasSgq = req.eficaciaMudancasSgq();
        entity.encerradoPorId = usuario != null ? usuario.usuarioId() : null;
        entity.encerradoPorNome = usuario != null ? usuario.usuarioNome() : null;
        entity.dataEncerramento = LocalDateTime.now();
        entity.status = "ENCERRADA";
        if (req.verificacaoEficacia() != null && !req.verificacaoEficacia().isBlank()) {
            registrarAuditoria(entity, "VERIFICACAO_EFICACIA", "verificacaoEficacia",
                null, req.verificacaoEficacia(), usuario);
        }
        registrarAuditoria(entity, "ENCERRAMENTO", "status", statusAnterior, "ENCERRADA", usuario);
        registrarAuditoria(entity, "EFICACIA_DECISAO", "eficaciaDecisao", null, req.eficaciaDecisao(), usuario);
        return mapper.toDto(entity);
    }

    @Transactional
    public void delete(Long id, NrcUsuarioContext usuario) {
        requireNrcEncerrar(usuario);
        requireUsuario(usuario);
        if (!isUsuarioQualidade(usuario.usuarioId())) {
            throw new NrcBusinessException(NrcErrorCode.INATIVAR_SOMENTE_QUALIDADE);
        }
        requireAccess(id, usuario.usuarioId());
        Nrc entity = requireNrc(id);
        entity.isActive = false;
        registrarAuditoria(entity, "INATIVACAO", "isActive", "true", "false", usuario);
    }

    public List<NrcAuditoriaDto> listAuditoria(Long id, Long usuarioId) {
        requireNrcLeitura(usuarioId);
        requireAccess(id, usuarioId);
        Nrc entity = requireNrc(id);
        return NrcAuditoria.find("nrc.id = ?1 order by dataHora desc, id desc", entity.id)
            .list().stream()
            .map(a -> mapper.toAuditoriaDto((NrcAuditoria) a))
            .toList();
    }

    public void assertCanUploadAnexo(Long nrcId, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(nrcId, usuario);
        validarResponsavelOuQualidadeAnexo(entity, usuario);
    }

    @Transactional
    public NrcAnexoDto addAnexo(Long nrcId, NrcAnexoDto dto, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(nrcId, usuario);
        validarResponsavelOuQualidadeAnexo(entity, usuario);
        com.aerosuite.domain.NrcAnexo anexo = new com.aerosuite.domain.NrcAnexo();
        anexo.nrc = entity;
        anexo.nomeArquivo = dto.nomeArquivo();
        anexo.nomeOriginal = dto.nomeOriginal();
        anexo.tipoArquivo = dto.tipoArquivo();
        anexo.tamanhoBytes = dto.tamanhoBytes();
        anexo.caminhoArquivo = dto.caminhoArquivo();
        anexo.descricao = dto.descricao();
        anexo.categoria = normalizeAnexoCategoria(dto.categoria());
        anexo.usuarioId = dto.usuarioId() != null ? dto.usuarioId()
            : (usuario != null ? usuario.usuarioId() : null);
        anexo.usuarioNome = dto.usuarioNome() != null ? dto.usuarioNome()
            : (usuario != null ? usuario.usuarioNome() : null);
        anexo.dataUpload = LocalDateTime.now();
        anexo.isActive = true;
        anexo.persist();
        registrarAuditoria(entity, "ANEXO", "nomeOriginal", null, dto.nomeOriginal(), usuario);
        return mapper.toAnexoDtoEnriched(anexo);
    }

    @Transactional
    public void deleteAnexo(Long nrcId, Long anexoId, NrcUsuarioContext usuario) {
        requireNrcAnalisar(usuario);
        Nrc entity = requireNrcEditableWithAccess(nrcId, usuario);
        validarResponsavelOuQualidadeAnexo(entity, usuario);
        com.aerosuite.domain.NrcAnexo anexo = com.aerosuite.domain.NrcAnexo.find(
            "id = ?1 and nrc.id = ?2 and isActive = true", anexoId, entity.id
        ).firstResult();
        if (anexo == null) {
            throw new NrcNotFoundException(NrcErrorCode.ANEXO_NOT_FOUND, anexoId);
        }
        anexo.isActive = false;
        deleteAnexoFile(anexo);
        registrarAuditoria(entity, "ANEXO_REMOVIDO", "nomeOriginal", anexo.nomeOriginal, null, usuario);
    }

    private void deleteAnexoFile(com.aerosuite.domain.NrcAnexo anexo) {
        if (anexo == null) {
            return;
        }
        if (anexo.caminhoArquivo != null && !anexo.caminhoArquivo.isBlank()) {
            try {
                Files.deleteIfExists(Paths.get(anexo.caminhoArquivo));
            } catch (IOException ignored) {
                // best effort — DB record already soft-deleted
            }
        }
        if (anexo.nrc != null && anexo.nrc.id != null && anexo.nomeArquivo != null) {
            Path fallback = Paths.get("uploads/nrc/evidencias", anexo.nrc.id.toString(), anexo.nomeArquivo);
            try {
                Files.deleteIfExists(fallback);
            } catch (IOException ignored) {
                // best effort
            }
        }
    }

    public com.aerosuite.domain.NrcAnexo findAnexo(Long nrcId, String filename) {
        return com.aerosuite.domain.NrcAnexo.find(
            "nrc.id = ?1 and nomeArquivo = ?2 and isActive = true", nrcId, filename
        ).firstResult();
    }

    public String buildRelatorioHtml(Long id, Long usuarioId) {
        return buildRelatorioHtml(id, usuarioId, null);
    }

    public String buildRelatorioHtml(Long id, Long usuarioId, String localeTag) {
        requireNrcRelatorio(usuarioId);
        requireAccess(id, usuarioId);
        NrcRelatorioMessages msg = NrcRelatorioMessages.forLocale(localeTag);
        Nrc entity = requireNrc(id);
        loadCollections(entity);
        NrcDto nrc = mapper.toDto(entity);
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html lang=\"").append(escape(msg.localeTag())).append("\">");
        html.append("<head><meta charset=\"UTF-8\"><title>").append(escape(msg.titlePrefix())).append(escape(nrc.numero())).append("</title>");
        html.append("<style>body{font-family:Arial,sans-serif;margin:24px;color:#1a1a2e}");
        html.append("h1,h2{color:#0f3460}h2{margin-top:24px;border-bottom:1px solid #c9a227;padding-bottom:6px}");
        html.append("table{width:100%;border-collapse:collapse;margin:12px 0}");
        html.append("td,th{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}");
        html.append("th{background:#f4f6f9;width:28%}.badge{display:inline-block;padding:4px 10px;border-radius:4px;background:#e8eef5}");
        html.append("@media print{button{display:none}}</style></head><body>");
        html.append("<h1>").append(escape(msg.titlePrefix())).append(escape(nrc.numero())).append("</h1>");
        html.append("<p><span class=\"badge\">").append(escape(msg.labelStatus(nrc.status()))).append("</span> ");
        html.append(escape(msg.severidadeLabel())).append(escape(msg.labelSeveridade(nrc.severidade())));
        html.append(escape(msg.origemLabel())).append(escape(msg.labelOrigem(nrc.origem()))).append("</p>");
        html.append("<h2>").append(escape(msg.sectionIdentificacao())).append("</h2><table>");
        appendRow(html, msg, msg.fieldDataDeteccao(), fmt(nrc.dataDeteccao()));
        appendRow(html, msg, msg.fieldDetectadoPor(), nrc.detectadoPorNome());
        appendRow(html, msg, msg.fieldLocalOcorrencia(), nrc.localOcorrencia());
        appendRow(html, msg, msg.fieldResponsavelTratamento(), nrc.responsavelTratamentoNome());
        appendRow(html, msg, msg.fieldPrazoTratamento(), nrc.prazoTratamento() != null ? nrc.prazoTratamento().toString() : null);
        appendRow(html, msg, msg.fieldTipo(), msg.labelTipoNc(nrc.tipoNc()));
        appendRow(html, msg, msg.fieldOsVinculada(), nrc.osNumero());
        appendRow(html, msg, msg.fieldPartNumber(), nrc.partNumber());
        appendRow(html, msg, msg.fieldSerialNumber(), nrc.serialNumber());
        appendRow(html, msg, msg.fieldLote(), nrc.loteCodigo());
        appendRow(html, msg, msg.fieldInvoice(), nrc.invoiceNumero());
        appendRow(html, msg, msg.fieldFcu(), nrc.fcuCodigo());
        appendRow(html, msg, msg.fieldCliente(), nrc.clienteNome());
        appendRow(html, msg, msg.fieldDescricaoOcorrido(), nrc.descricaoOcorrido());
        appendRow(html, msg, msg.fieldRequisitoNaoAtendido(), nrc.requisitoNaoAtendido());
        appendRow(html, msg, msg.fieldEvidenciasTexto(), nrc.evidenciasTexto());
        html.append("</table>");
        html.append("<h2>").append(escape(msg.sectionContencao())).append("</h2><table>");
        appendRow(html, msg, msg.fieldNaoAplicavel(), Boolean.TRUE.equals(nrc.contencaoNaoAplicavel()) ? msg.yes() : msg.no());
        appendRow(html, msg, msg.fieldOque(), nrc.contencaoOque());
        appendRow(html, msg, msg.fieldQuem(), nrc.contencaoQuem());
        appendRow(html, msg, msg.fieldQuando(), nrc.contencaoQuando());
        appendRow(html, msg, msg.fieldRespContencao(), nrc.contencaoResponsavelNome());
        appendRow(html, msg, msg.fieldDataContencao(), fmt(nrc.contencaoData()));
        appendRow(html, msg, msg.fieldContencaoConcluida(), Boolean.TRUE.equals(nrc.contencaoConcluida()) ? msg.yes() : msg.no());
        appendRow(html, msg, msg.fieldDataConclusaoContencao(), fmt(nrc.contencaoDataConclusao()));
        appendRow(html, msg, msg.fieldResumo(), nrc.contencaoAcao());
        html.append("</table>");
        html.append("<h2>").append(escape(msg.sectionAnaliseCausa())).append("</h2><table>");
        appendRow(html, msg, msg.fieldMetodo(), msg.labelMetodoCausa(nrc.metodoCausa()));
        appendRow(html, msg, msg.fieldPorque1(), nrc.porque1());
        appendRow(html, msg, msg.fieldPorque2(), nrc.porque2());
        appendRow(html, msg, msg.fieldPorque3(), nrc.porque3());
        appendRow(html, msg, msg.fieldPorque4(), nrc.porque4());
        appendRow(html, msg, msg.fieldPorque5(), nrc.porque5());
        appendRow(html, msg, msg.fieldCausaRaiz(), nrc.causaRaiz());
        appendRow(html, msg, msg.fieldDisposicao(), msg.labelDisposicao(nrc.disposicao()));
        appendRow(html, msg, msg.fieldDisposicaoObs(), nrc.disposicaoObservacao());
        appendRow(html, msg, msg.fieldAprovadaPor(), nrc.disposicaoAprovadaPorNome());
        html.append("</table>");
        if (nrc.acoes() != null && !nrc.acoes().isEmpty()) {
            html.append("<h2>").append(escape(msg.sectionAcoes())).append("</h2><table><tr><th>")
                .append(escape(msg.colAcaoOque())).append("</th><th>").append(escape(msg.colAcaoPorQue())).append("</th>");
            html.append("<th>").append(escape(msg.colAcaoOnde())).append("</th><th>").append(escape(msg.colAcaoQuando())).append("</th>");
            html.append("<th>").append(escape(msg.colAcaoComo())).append("</th><th>").append(escape(msg.colAcaoQuanto())).append("</th><th>")
                .append(escape(msg.colAcaoResponsavel())).append("</th>");
            html.append("<th>").append(escape(msg.colAcaoPrazo())).append("</th><th>").append(escape(msg.colAcaoStatus())).append("</th><th>")
                .append(escape(msg.colAcaoEvidencia())).append("</th></tr>");
            for (NrcAcaoDto acao : nrc.acoes()) {
                html.append("<tr><td>").append(escape(orDash(acao.oQue() != null ? acao.oQue() : acao.descricao())));
                html.append("</td><td>").append(escape(orDash(acao.porQue())));
                html.append("</td><td>").append(escape(orDash(acao.onde())));
                html.append("</td><td>").append(escape(orDash(
                    acao.quandoAcao() != null ? acao.quandoAcao().toString() : null)));
                html.append("</td><td>").append(escape(orDash(acao.como())));
                html.append("</td><td>").append(escape(orDash(acao.quantoCusto())));
                html.append("</td><td>").append(escape(orDash(acao.responsavelNome())));
                html.append("</td><td>").append(acao.prazo() != null ? acao.prazo().toString() : msg.dash());
                html.append("</td><td>").append(escape(msg.labelAcaoStatus(acao.status())));
                html.append("</td><td>").append(escape(orDash(acao.evidenciaConclusao()))).append("</td></tr>");
            }
            html.append("</table>");
        }
        List<NrcResponsavelHistorico> respHist = NrcResponsavelHistorico.find(
            "nrc.id = ?1 order by dataAtribuicao asc", id).list();
        if (respHist != null && !respHist.isEmpty()) {
            html.append("<h2>").append(escape(msg.sectionRespHistorico())).append("</h2><table><tr><th>")
                .append(escape(msg.colData())).append("</th><th>").append(escape(msg.colResponsavel())).append("</th></tr>");
            for (NrcResponsavelHistorico h : respHist) {
                html.append("<tr><td>").append(fmt(h.dataAtribuicao));
                html.append("</td><td>").append(escape(orDash(h.usuarioNome))).append("</td></tr>");
            }
            html.append("</table>");
        }
        List<NrcAuditoriaDto> audit = listAuditoria(id, usuarioId);
        if (audit != null && !audit.isEmpty()) {
            html.append("<h2>").append(escape(msg.sectionAuditoria())).append("</h2><table><tr><th>")
                .append(escape(msg.colData())).append("</th><th>").append(escape(msg.colUsuario())).append("</th>");
            html.append("<th>").append(escape(msg.colAcao())).append("</th><th>").append(escape(msg.colDetalhe())).append("</th></tr>");
            for (NrcAuditoriaDto ev : audit) {
                html.append("<tr><td>").append(fmt(ev.dataHora()));
                html.append("</td><td>").append(escape(orDash(ev.usuarioNome())));
                html.append("</td><td>").append(escape(msg.labelAuditoriaAcao(ev.acao())));
                html.append("</td><td>").append(escape(orDash(msg.formatAuditoriaDetalhe(
                    ev.campo(), ev.valorNovo() != null ? ev.valorNovo() : ev.valorAnterior()))));
                html.append("</td></tr>");
            }
            html.append("</table>");
        }
        if (nrc.anexos() != null && !nrc.anexos().isEmpty()) {
            html.append("<h2>").append(escape(msg.sectionAnexos())).append("</h2><table><tr><th>")
                .append(escape(msg.colArquivo())).append("</th><th>").append(escape(msg.colEnviadoPor())).append("</th>");
            html.append("<th>").append(escape(msg.colDescricao())).append("</th><th>").append(escape(msg.colData())).append("</th></tr>");
            for (NrcAnexoDto anexo : nrc.anexos()) {
                html.append("<tr><td>").append(escape(orDash(anexo.nomeOriginal())));
                html.append("</td><td>").append(escape(orDash(anexo.usuarioNome())));
                html.append("</td><td>").append(escape(orDash(anexo.descricao())));
                html.append("</td><td>").append(fmt(anexo.dataUpload())).append("</td></tr>");
            }
            html.append("</table>");
        }
        html.append("<h2>").append(escape(msg.sectionEficacia())).append("</h2><table>");
        appendRow(html, msg, msg.fieldDecisaoEficacia(), msg.labelEficaciaDecisao(nrc.eficaciaDecisao()));
        appendRow(html, msg, msg.fieldVerificacaoEficacia(), nrc.verificacaoEficacia());
        appendRow(html, msg, msg.fieldAtualizarRiscos(), nrc.eficaciaAtualizarRiscos() != null && nrc.eficaciaAtualizarRiscos() ? msg.yes() : msg.no());
        appendRow(html, msg, msg.fieldMudancasSgq(), nrc.eficaciaMudancasSgq());
        appendRow(html, msg, msg.fieldEncerradoPor(), nrc.encerradoPorNome());
        appendRow(html, msg, msg.fieldDataEncerramento(), fmt(nrc.dataEncerramento()));
        html.append("</table>");
        html.append("<p><small>").append(escape(msg.footerGeneratedAt(LocalDateTime.now()))).append("</small></p>");
        html.append("<button onclick=\"window.print()\">").append(escape(msg.printButton())).append("</button></body></html>");
        return html.toString();
    }

    public List<NrcSummaryDto> listByOsId(Long osId, Long usuarioId) {
        if (osId == null) {
            return List.of();
        }
        if (usuarioId != null && !temNrcLeitura(usuarioId)) {
            return List.of();
        }
        return Nrc.<Nrc>find("isActive = true and osId = ?1 order by dataDeteccao desc", osId)
            .list().stream()
            .filter(n -> canAccessNrc(n.id, usuarioId))
            .map(n -> toSummaryDto(n, usuarioId))
            .toList();
    }

    /** Contagem de NRC não encerradas por OS (chave = os_id). */
    @SuppressWarnings("unchecked")
    public Map<Long, Long> countAbertasByOsIds(Collection<Long> osIds, Long accessUserId) {
        if (osIds == null || osIds.isEmpty()) {
            return Map.of();
        }
        if (accessUserId != null && !temNrcLeitura(accessUserId)) {
            return Map.of();
        }
        List<Long> ids = osIds.stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        String jpql = "SELECT n.osId, COUNT(n) FROM Nrc n WHERE n.isActive = true AND n.status <> 'ENCERRADA' "
            + "AND n.osId IN :ids";
        if (accessUserId != null && !isUsuarioQualidade(accessUserId)) {
            jpql += " AND " + ACCESS_SCOPE_JPQL;
        }
        jpql += " GROUP BY n.osId";
        var query = entityManager.createQuery(jpql, Object[].class).setParameter("ids", ids);
        if (accessUserId != null && !isUsuarioQualidade(accessUserId)) {
            query.setParameter("accessUid", accessUserId);
        }
        List<Object[]> rows = query.getResultList();

        Map<Long, Long> result = new HashMap<>();
        for (Object[] row : rows) {
            if (row[0] != null && row[1] != null) {
                result.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            }
        }
        return result;
    }

    public Map<Long, Long> countAbertasByOsIds(Collection<Long> osIds) {
        return countAbertasByOsIds(osIds, null);
    }

    private void enrichOsLink(Nrc entity) {
        if (entity.osId == null) {
            return;
        }
        OS os = OS.findById(entity.osId);
        if (os == null) {
            return;
        }
        if (os.idOs != null) {
            entity.osNumero = String.valueOf(os.idOs);
        }
        if (isBlank(entity.clienteNome) && os.clienteNome != null) {
            entity.clienteNome = os.clienteNome;
        }
        if (isBlank(entity.partNumber) && os.partNumber != null) {
            entity.partNumber = os.partNumber;
        }
        if (isBlank(entity.serialNumber) && os.serialNumber != null) {
            entity.serialNumber = os.serialNumber;
        }
        if (entity.fcuId == null && os.idFcu != null) {
            entity.fcuId = os.idFcu.longValue();
        }
        if (isBlank(entity.fcuCodigo) && entity.fcuId != null) {
            Fcu fcu = Fcu.findById(entity.fcuId.intValue());
            if (fcu != null) {
                entity.fcuCodigo = fcu.fcuCodigo;
                if (isBlank(entity.partNumber)) {
                    entity.partNumber = fcu.pn;
                }
                if (isBlank(entity.serialNumber)) {
                    entity.serialNumber = fcu.serialNumber;
                }
            }
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private Nrc requireNrc(Long id) {
        Nrc entity = Nrc.find("id = ?1 and isActive = true", id).firstResult();
        if (entity == null) {
            throw new NrcNotFoundException(NrcErrorCode.NRC_NOT_FOUND, id);
        }
        return entity;
    }

    private Nrc requireNrcEditable(Long id) {
        Nrc entity = requireNrc(id);
        if (entity.isEncerrada()) {
            throw new NrcBusinessException(NrcErrorCode.REGISTRO_IMUTAVEL);
        }
        return entity;
    }

    private Nrc requireNrcEditableWithAccess(Long id, NrcUsuarioContext usuario) {
        requireUsuario(usuario);
        requireAccess(id, usuario.usuarioId());
        return requireNrcEditable(id);
    }

    private Usuario resolveActiveUsuario(Long usuarioId) {
        if (usuarioId == null) {
            throw new NrcBusinessException(NrcErrorCode.RESPONSAVEL_INATIVO);
        }
        Usuario user = usuarioDoTenant(usuarioId);
        if (user == null || !Boolean.TRUE.equals(user.ativo)) {
            throw new NrcBusinessException(NrcErrorCode.RESPONSAVEL_INATIVO);
        }
        return user;
    }

    private static String formatUsuarioNome(Usuario user) {
        if (user == null) {
            return "—";
        }
        if (user.nome != null && !user.nome.isBlank()) {
            return user.nome.trim();
        }
        if (user.email != null && !user.email.isBlank()) {
            return user.email.trim();
        }
        return "Utilizador #" + user.id;
    }

    private void notificarEficaciaQualidade(Nrc entity, NrcUsuarioContext usuario) {
        List<Usuario> aprovadores = findUsuariosNotificacaoQualidade(null);
        if (aprovadores.isEmpty()) {
            registrarAuditoria(entity, "NOTIFICACAO_EMAIL_FALHA", "EFICACIA", null,
                "Nenhum utilizador do perfil Qualidade/SGQ com e-mail disponível para verificar eficácia", usuario);
            return;
        }
        String detalhe = "Verificação de eficácia e encerramento";
        Set<Long> notificados = new HashSet<>();
        for (Usuario dest : aprovadores) {
            Long uid = dest.id.longValue();
            if (notificados.add(uid)) {
                notificarEtapa(entity, "EFICACIA", uid, formatUsuarioNome(dest), detalhe, usuario);
            }
        }
    }

    /**
     * Dispara e-mail à Qualidade/SGQ quando todas as ações corretivas estão concluídas.
     * Idempotente: não reenvia se já houve notificação de eficácia neste ciclo.
     */
    private void notificarQualidadeAposAcoesConcluidas(Nrc entity, NrcUsuarioContext usuario) {
        if (jaNotificouEficaciaQualidade(entity)) {
            return;
        }
        registrarAuditoria(entity, "AGUARDANDO_EFICACIA", "etapaAtual", "ACOES", "EFICACIA", usuario);
        notificarEficaciaQualidade(entity, usuario);
    }

    private boolean jaNotificouEficaciaQualidade(Nrc entity) {
        loadCollections(entity);
        if (entity.auditorias == null || entity.auditorias.isEmpty()) {
            return false;
        }
        return entity.auditorias.stream().anyMatch(a ->
            "AGUARDANDO_EFICACIA".equals(a.acao)
                || ("NOTIFICACAO_EMAIL".equals(a.acao) && "EFICACIA".equals(a.campo)));
    }

    private void notificarPropostaTratamentoQualidade(Nrc entity, NrcUsuarioContext usuario) {
        Set<Long> notificados = new HashSet<>();
        String detalhe = "Aprovação de prazo de tratamento";

        for (Usuario aprovador : findUsuariosNotificacaoQualidade(entity.responsavelTratamentoId)) {
            Long uid = aprovador.id.longValue();
            if (notificados.add(uid)) {
                notificarEtapa(entity, "TRATAMENTO_PROPOSTA", uid, formatUsuarioNome(aprovador), detalhe, usuario);
            }
        }

        if (notificados.isEmpty()) {
            registrarAuditoria(entity, "NOTIFICACAO_EMAIL_FALHA", "TRATAMENTO_PROPOSTA", null,
                "Nenhum utilizador do perfil Qualidade com NRC_ENCERRAR disponível para aprovar prazo", usuario);
        }
    }

    private boolean temNrcEncerrar(Long usuarioId) {
        return usuarioId != null
            && nrcAuthorization.usuarioTemFuncionalidade(usuarioId, NrcFuncionalidade.ENCERRAR);
    }

    @SuppressWarnings("unchecked")
    private List<Usuario> findUsuariosNotificacaoQualidade(Long excludeUserId) {
        Map<Integer, Usuario> merged = new LinkedHashMap<>();
        for (Usuario u : findPerfilQualidadeEmailUsuariosExcluindo(excludeUserId)) {
            if (hasEmailCadastrado(u)) {
                merged.put(u.id, u);
            }
        }
        return new ArrayList<>(merged.values());
    }

    /**
     * Destinatários de e-mail de aprovação/verificação SGQ — apenas perfil Qualidade/SGQ.
     * Administrador e Diretor mantêm privilégios no fluxo, mas não recebem estes e-mails.
     */
    @SuppressWarnings("unchecked")
    private List<Usuario> findPerfilQualidadeEmailUsuariosExcluindo(Long excludeUserId) {
        return entityManager.createQuery(
            "SELECT DISTINCT u FROM Usuario u JOIN u.perfil p "
                + "WHERE u.orgTenantId = :tenantId AND (u.ativo = true OR u.ativo IS NULL) "
                + "AND upper(trim(coalesce(p.codigo, ''))) not in ('ADMIN','ADMINISTRADOR','DIRETOR') "
                + "AND (upper(trim(coalesce(p.codigo, ''))) in ('QUALIDADE','QUALITY','SGQ','P145_RT','P145_INSPETOR') "
                + "     OR upper(trim(coalesce(p.nome, ''))) like '%QUALID%' "
                + "     OR upper(trim(coalesce(p.nome, ''))) like '%SGQ%' "
                + "     OR upper(trim(coalesce(p.nome, ''))) like '%INSPET%') "
                + "AND upper(trim(coalesce(p.nome, ''))) not like '%ADMINISTR%' "
                + "AND upper(trim(coalesce(p.nome, ''))) not like '%DIRETOR%' "
                + "AND (:excludeId is null OR u.id <> :excludeId) ORDER BY u.id",
            Usuario.class
        ).setParameter("tenantId", tenants.currentTenantId())
            .setParameter("excludeId", excludeUserId != null ? excludeUserId.intValue() : null)
            .getResultList();
    }

    private static boolean hasEmailCadastrado(Usuario u) {
        return u != null && u.email != null && !u.email.isBlank();
    }

    @SuppressWarnings("unchecked")
    private List<Usuario> findQualidadeUsuariosExcluindo(Long excludeUserId) {
        return entityManager.createQuery(
            "SELECT DISTINCT u FROM Usuario u JOIN u.perfil p "
                + "WHERE u.orgTenantId = :tenantId AND (u.ativo = true OR u.ativo IS NULL) "
                + "AND (upper(trim(coalesce(p.codigo, ''))) in "
                + "('QUALIDADE','QUALITY','ADMIN','ADMINISTRADOR','DIRETOR','GERENTE','SGQ','P145_RT','P145_INSPETOR') "
                + "     OR upper(trim(coalesce(p.nome, ''))) like '%QUALID%' "
                + "     OR upper(trim(coalesce(p.nome, ''))) like '%SGQ%' "
                + "     OR upper(trim(coalesce(p.nome, ''))) like '%INSPET%' "
                + "     OR upper(trim(coalesce(p.nome, ''))) like '%ADMINISTR%' "
                + "     OR upper(trim(coalesce(p.nome, ''))) like '%DIRETOR%') "
                + "AND (:excludeId is null OR u.id <> :excludeId) ORDER BY u.id",
            Usuario.class
        ).setParameter("tenantId", tenants.currentTenantId())
            .setParameter("excludeId", excludeUserId != null ? excludeUserId.intValue() : null)
            .getResultList();
    }

    @SuppressWarnings("unchecked")
    private Usuario findQualidadeUsuarioExcluindo(Long excludeUserId) {
        List<Usuario> users = findQualidadeUsuariosExcluindo(excludeUserId);
        return users.isEmpty() ? null : users.get(0);
    }

    private void loadCollections(Nrc entity) {
        entity.acoes.size();
        entity.anexos.size();
        entity.auditorias.size();
    }

    @Transactional
    protected String gerarNumeroNrc() {
        String tenantId = tenants.currentTenantIdStr();
        int ano = Year.now().getValue();
        entityManager.createNativeQuery(
            "INSERT INTO nrc_sequencia (tenant_id, ano, ultimo_numero) VALUES (:tenantId, :ano, 1) " +
            "ON DUPLICATE KEY UPDATE ultimo_numero = ultimo_numero + 1"
        ).setParameter("tenantId", tenantId).setParameter("ano", ano).executeUpdate();

        Number seq = (Number) entityManager.createNativeQuery(
            "SELECT ultimo_numero FROM nrc_sequencia WHERE tenant_id = :tenantId AND ano = :ano"
        ).setParameter("tenantId", tenantId).setParameter("ano", ano).getSingleResult();

        return String.format("NRC-%04d-%d", seq.intValue(), ano);
    }

    private void registrarAuditoria(Nrc entity, String acao, String campo,
                                    String valorAnterior, String valorNovo, NrcUsuarioContext usuario) {
        NrcAuditoria log = new NrcAuditoria();
        log.nrc = entity;
        log.acao = acao;
        log.campo = campo;
        log.valorAnterior = valorAnterior;
        log.valorNovo = valorNovo;
        if (usuario != null) {
            log.usuarioId = usuario.usuarioId();
            log.usuarioNome = usuario.usuarioNome();
        }
        log.persist();
    }

    private void registrarHistoricoResponsavel(Nrc entity) {
        if (entity == null || entity.id == null || entity.responsavelTratamentoId == null) {
            return;
        }
        long exists = NrcResponsavelHistorico.count(
            "nrc.id = ?1 and usuarioId = ?2", entity.id, entity.responsavelTratamentoId);
        if (exists > 0) {
            return;
        }
        NrcResponsavelHistorico historico = new NrcResponsavelHistorico();
        historico.nrc = entity;
        historico.usuarioId = entity.responsavelTratamentoId;
        historico.usuarioNome = entity.responsavelTratamentoNome;
        historico.dataAtribuicao = LocalDateTime.now();
        historico.persist();
    }

    private void notificarResponsavelTratamento(Nrc entity, NrcUsuarioContext usuario) {
        notificarEtapa(entity, "TRATAMENTO", entity.responsavelTratamentoId, entity.responsavelTratamentoNome,
            null, usuario);
    }

    private String resolveRecipientLocale(Usuario responsavel, NrcUsuarioContext actor) {
        if (responsavel != null && responsavel.idioma != null && !responsavel.idioma.isBlank()) {
            return responsavel.idioma.trim();
        }
        if (actor != null && actor.localeTag() != null && !actor.localeTag().isBlank()) {
            return actor.localeTag().trim();
        }
        return "pt-BR";
    }

    private void notificarEtapa(Nrc entity, String etapaCodigo, Long destinatarioId, String destinatarioNomeFallback,
                                String etapaDetalhe, NrcUsuarioContext usuario) {
        if (destinatarioId == null) {
            return;
        }

        Usuario responsavel = usuarioDoTenant(destinatarioId);
        if (responsavel == null) {
            registrarAuditoria(entity, "NOTIFICACAO_EMAIL_FALHA", etapaCodigo, null,
                "Usuário não encontrado no cadastro (id " + destinatarioId + ")", usuario);
            return;
        }
        if (responsavel.email == null || responsavel.email.isBlank()) {
            registrarAuditoria(entity, "NOTIFICACAO_EMAIL_FALHA", etapaCodigo, null,
                "Sem e-mail: " + orDash(destinatarioNomeFallback != null ? destinatarioNomeFallback : responsavel.nome),
                usuario);
            return;
        }

        String delegadoPor = usuario != null && usuario.usuarioNome() != null && !usuario.usuarioNome().isBlank()
            ? usuario.usuarioNome()
            : entity.detectadoPorNome;
        String nrcUrl = buildNrcUrl(entity, etapaCodigo);
        String nome = destinatarioNomeFallback != null && !destinatarioNomeFallback.isBlank()
            ? destinatarioNomeFallback
            : responsavel.nome;
        String locale = resolveRecipientLocale(responsavel, usuario);
        NrcEmailMessages emailMsg = NrcEmailMessages.forLocale(locale);
        String detalheLocalizado = resolveEtapaDetalhe(etapaCodigo, etapaDetalhe, emailMsg);

        NrcNotificacaoEmailData emailData = new NrcNotificacaoEmailData(
            responsavel.email.trim(),
            nome,
            delegadoPor,
            entity.numero,
            entity.origem,
            entity.tipoNc,
            entity.severidade,
            entity.osNumero,
            entity.clienteNome,
            entity.partNumber,
            entity.loteCodigo,
            entity.prazoTratamento,
            entity.descricaoOcorrido,
            entity.requisitoNaoAtendido,
            nrcUrl,
            etapaCodigo,
            detalheLocalizado,
            locale
        );

        boolean enviado = nrcMailer.notificarEtapa(emailData);
        String destinatario = String.format("%s (%s)", orDash(nome), responsavel.email.trim());
        String dataEnvio = LocalDateTime.now().format(AUDIT_DATE_FORMAT);
        String msg = etapaCodigo + " — " + destinatario + " — " + dataEnvio;

        if (enviado) {
            registrarAuditoria(entity, "NOTIFICACAO_EMAIL", etapaCodigo, null, msg, usuario);
        } else {
            registrarAuditoria(entity, "NOTIFICACAO_EMAIL_FALHA", etapaCodigo, null,
                "Falha " + msg, usuario);
        }

        criarNotificacaoInApp(entity, etapaCodigo, destinatarioId, nome);
    }

    private static String resolveEtapaDetalhe(String etapaCodigo, String customDetalhe, NrcEmailMessages msg) {
        if (customDetalhe != null && !customDetalhe.isBlank()) {
            return customDetalhe;
        }
        return msg.etapaDetalhePadrao(etapaCodigo);
    }

    private void criarNotificacaoInApp(Nrc entity, String etapaCodigo, Long destinatarioId,
                                       String destinatarioNome) {
        if (destinatarioId == null || entity == null || entity.id == null) {
            return;
        }
        String titulo = "NRC_ETAPA|" + etapaCodigo + "|" + orDash(entity.numero);
        String mensagem = etapaCodigo;
        String link = buildNrcUrl(entity, etapaCodigo);
        notificacaoService.criar(destinatarioId, "NRC_ETAPA", titulo, mensagem, link, "NRC", entity.id);
    }

    private String buildNrcUrl(Nrc entity, String etapaCodigo) {
        String base = frontendUrl.replaceAll("/$", "");
        String mapped = mapEtapaToJornadaStep(etapaCodigo);
        String step = mapped != null && !mapped.isBlank()
            ? "?step=" + mapped.toLowerCase(Locale.ROOT)
            : "";
        return base + "/nrc/" + entity.id + step;
    }

    private static String mapEtapaToJornadaStep(String etapaCodigo) {
        if (etapaCodigo == null || etapaCodigo.isBlank()) {
            return "";
        }
        return switch (etapaCodigo.toUpperCase(Locale.ROOT)) {
            case "TRATAMENTO" -> "CONTENCAO";
            case "TRATAMENTO_PROPOSTA", "ACAO_CORRETIVA", "EFICACIA_INEFICAZ", "ACOES_PLANO" -> "ACOES";
            case "CAUSA_APROVACAO", "CAUSA_REJEITADA" -> "CAUSA";
            case "ANALISE", "EM_ANALISE" -> "CAUSA";
            default -> etapaCodigo.toUpperCase(Locale.ROOT);
        };
    }

    private NrcDto registrarEficaciaIneficaz(Nrc entity, NrcEncerramentoRequest req, NrcUsuarioContext usuario) {
        entity.verificacaoEficacia = req.verificacaoEficacia();
        entity.verificacaoData = LocalDateTime.now();
        entity.eficaciaDecisao = "INEFICAZ";
        entity.eficaciaAtualizarRiscos = req.eficaciaAtualizarRiscos();
        entity.eficaciaMudancasSgq = req.eficaciaMudancasSgq();
        entity.status = "EM_TRATAMENTO";

        if (entity.acoes != null) {
            for (NrcAcao acao : entity.acoes) {
                acao.status = "PENDENTE";
                acao.dataConclusao = null;
                acao.evidenciaConclusao = null;
                acao.concluidoPorId = null;
                acao.concluidoPorNome = null;
            }
        }

        registrarAuditoria(entity, "VERIFICACAO_EFICACIA", "verificacaoEficacia",
            null, req.verificacaoEficacia(), usuario);
        registrarAuditoria(entity, "EFICACIA_INEFICAZ", "eficaciaDecisao", null, "INEFICAZ", usuario);
        registrarAuditoria(entity, "CICLO_REABERTO", "etapaAtual", "EFICACIA", "ACOES", usuario);

        notificarEtapa(entity, "EFICACIA_INEFICAZ", entity.responsavelTratamentoId, entity.responsavelTratamentoNome,
            null, usuario);
        return mapper.toDto(entity);
    }

    private void validarCustoNaoConformidade(java.math.BigDecimal custo) {
        if (custo == null) {
            return;
        }
        if (custo.signum() < 0) {
            throw new NrcBusinessException(NrcErrorCode.VALOR_INVALIDO,
                NrcErrorCode.VALOR_INVALIDO.defaultMessage("custo da não conformidade"));
        }
    }

    private void validarRequisitoReferencia(String referencia) {
        // Catálogo opcional — requisito livre em requisitoNaoAtendido
    }

    private static String normalizeAnexoCategoria(String categoria) {
        if (categoria == null || categoria.isBlank()) {
            return "EVIDENCIA";
        }
        return switch (categoria.trim().toUpperCase(Locale.ROOT)) {
            case "DOCUMENTO_ENVOLVIDO", "EFICACIA", "EVIDENCIA" -> categoria.trim().toUpperCase(Locale.ROOT);
            default -> "EVIDENCIA";
        };
    }

    private void validarDataOcorrencia(LocalDateTime dataOcorrencia) {
        if (dataOcorrencia == null) {
            return;
        }
        if (dataOcorrencia.isAfter(LocalDateTime.now().plusMinutes(5))) {
            throw new NrcBusinessException(NrcErrorCode.VALOR_INVALIDO,
                NrcErrorCode.VALOR_INVALIDO.defaultMessage("data da ocorrência"));
        }
    }

    private void validarContencao3W(NrcContencaoRequest req) {
        if (req.contencaoOque() == null || req.contencaoOque().isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.CONTENCAO_3W_OQUE);
        }
        if (req.contencaoQuem() == null || req.contencaoQuem().isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.CONTENCAO_3W_QUEM);
        }
        if (req.contencaoQuando() == null || req.contencaoQuando().isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.CONTENCAO_3W_QUANDO);
        }
    }

    private void validarDisposicaoCritica(Nrc entity, String disposicao, String observacao,
                                          NrcUsuarioContext usuario) {
        if (!"CRITICA".equals(entity.severidade) || disposicao == null) {
            return;
        }
        if (List.of("CONCESSAO", "SUCATEAMENTO").contains(disposicao)) {
            if (observacao == null || observacao.isBlank()) {
                throw new NrcBusinessException(NrcErrorCode.DISPOSICAO_CRITICA_JUSTIFICATIVA);
            }
            if (usuario == null || !isUsuarioQualidade(usuario.usuarioId())) {
                throw new NrcBusinessException(NrcErrorCode.DISPOSICAO_CRITICA_QUALIDADE);
            }
        }
    }

    private void validarEncerramentoQualidade(Nrc entity, NrcUsuarioContext usuario) {
        requireUsuario(usuario);
        if (isUsuarioQualidade(usuario.usuarioId())) {
            return;
        }
        if (!temNrcEncerrar(usuario.usuarioId())) {
            throw new NrcBusinessException(NrcErrorCode.ENCERRAR_SOMENTE_QUALIDADE);
        }
    }

    private void validarEncerramentoEficazQualidade(NrcUsuarioContext usuario) {
        validarEncerramentoQualidade(null, usuario);
    }

    private boolean isUsuarioQualidade(Long usuarioId) {
        if (usuarioId == null) {
            return false;
        }
        Usuario u = usuarioDoTenant(usuarioId);
        if (u == null || u.perfil == null) {
            return false;
        }
        Perfil perfil = u.perfil;
        String codigo = perfil.getCodigo() == null ? "" : perfil.getCodigo().trim().toUpperCase(Locale.ROOT);
        if (Set.of("QUALIDADE", "QUALITY", "ADMIN", "ADMINISTRADOR", "DIRETOR", "GERENTE", "SGQ", "P145_RT", "P145_INSPETOR")
            .contains(codigo)) {
            return true;
        }
        String nome = perfil.getNome() == null ? "" : perfil.getNome().trim().toUpperCase(Locale.ROOT);
        return nome.contains("QUALID") || nome.contains("SGQ") || nome.contains("INSPET")
            || nome.contains("ADMINISTR") || nome.contains("DIRETOR");
    }

    private Usuario usuarioDoTenant(Long usuarioId) {
        if (usuarioId == null) {
            return null;
        }
        return Usuario.find("id = ?1 and orgTenantId = ?2", usuarioId.intValue(), tenants.currentTenantId()).firstResult();
    }

    private static boolean isPerfilCodigoPrivilegiadoNrc(String codigo) {
        return codigo.equals("QUALIDADE") || codigo.equals("QUALITY") || codigo.equals("ADMIN")
            || codigo.equals("ADMINISTRADOR") || codigo.equals("DIRETOR") || codigo.equals("SGQ");
    }

    public boolean canAccessNrc(Long nrcId, Long usuarioId) {
        if (nrcId == null || usuarioId == null) {
            return false;
        }
        if (isUsuarioQualidade(usuarioId)) {
            return true;
        }
        Nrc entity = Nrc.find("id = ?1 and isActive = true", nrcId).firstResult();
        if (entity == null) {
            return false;
        }
        if (Objects.equals(entity.detectadoPorId, usuarioId)) {
            return true;
        }
        if (Objects.equals(entity.responsavelTratamentoId, usuarioId)) {
            return true;
        }
        if (Objects.equals(entity.contencaoResponsavelId, usuarioId)) {
            return true;
        }
        if (NrcResponsavelHistorico.count("nrc.id = ?1 and usuarioId = ?2", nrcId, usuarioId) > 0) {
            return true;
        }
        return NrcAcao.count("nrc.id = ?1 and responsavelId = ?2", nrcId, usuarioId) > 0;
    }

    private boolean temNrcLeitura(Long usuarioId) {
        if (usuarioId == null) {
            return false;
        }
        if (isUsuarioQualidade(usuarioId)) {
            return true;
        }
        return nrcAuthorization.usuarioTemAlgumaFuncionalidade(usuarioId, NrcFuncionalidade.READ_ANY);
    }

    private void requireNrcLeitura(Long usuarioId) {
        if (usuarioId == null) {
            throw new NrcBusinessException(NrcErrorCode.USUARIO_NAO_IDENTIFICADO);
        }
        if (isUsuarioQualidade(usuarioId)) {
            return;
        }
        nrcAuthorization.requireAlgumaFuncionalidade(usuarioId, NrcFuncionalidade.READ_ANY);
    }

    private void requireNrcRelatorio(Long usuarioId) {
        if (isUsuarioQualidade(usuarioId)) {
            return;
        }
        nrcAuthorization.requireFuncionalidade(usuarioId, NrcFuncionalidade.RELATORIO);
    }

    private void requireNrcDashboard(Long usuarioId) {
        if (usuarioId == null) {
            throw new NrcBusinessException(NrcErrorCode.USUARIO_NAO_IDENTIFICADO);
        }
        if (isUsuarioQualidade(usuarioId)) {
            return;
        }
        nrcAuthorization.requireFuncionalidade(usuarioId, NrcFuncionalidade.DASHBOARD);
    }

    private void requireNrcAbrir(NrcUsuarioContext usuario) {
        requireUsuario(usuario);
        if (isUsuarioQualidade(usuario.usuarioId())) {
            return;
        }
        nrcAuthorization.requireFuncionalidade(usuario.usuarioId(), NrcFuncionalidade.ABRIR);
    }

    private void requireNrcAnalisar(NrcUsuarioContext usuario) {
        requireUsuario(usuario);
        if (isUsuarioQualidade(usuario.usuarioId())) {
            return;
        }
        nrcAuthorization.requireFuncionalidade(usuario.usuarioId(), NrcFuncionalidade.ANALISAR);
    }

    private void requireNrcEncerrar(NrcUsuarioContext usuario) {
        requireUsuario(usuario);
        if (isUsuarioQualidade(usuario.usuarioId())) {
            return;
        }
        nrcAuthorization.requireFuncionalidade(usuario.usuarioId(), NrcFuncionalidade.ENCERRAR);
    }

    private void requireAccess(Long nrcId, Long usuarioId) {
        if (usuarioId == null) {
            throw new NrcBusinessException(NrcErrorCode.USUARIO_NAO_IDENTIFICADO);
        }
        if (!canAccessNrc(nrcId, usuarioId)) {
            throw new NrcBusinessException(NrcErrorCode.SEM_ACESSO);
        }
    }

    public byte[] buildRelatoriosZip(List<Long> ids, Long usuarioId) {
        return buildRelatoriosZip(ids, usuarioId, null);
    }

    public byte[] buildRelatoriosZip(List<Long> ids, Long usuarioId, String localeTag) {
        if (ids == null || ids.isEmpty()) {
            throw new NrcBusinessException(NrcErrorCode.EXPORT_IDS_REQUIRED);
        }
        if (ids.size() > 25) {
            throw new NrcBusinessException(NrcErrorCode.EXPORT_LIMITE);
        }
        try (java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
             java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(baos)) {
            for (Long id : ids) {
                NrcDto dto = getById(id, usuarioId);
                String html = buildRelatorioHtml(id, usuarioId, localeTag);
                String baseName = dto.numero() != null && !dto.numero().isBlank()
                    ? dto.numero().replaceAll("[\\\\/:*?\"<>|]", "-")
                    : "nrc-" + id;
                java.util.zip.ZipEntry entry = new java.util.zip.ZipEntry(baseName + ".html");
                zos.putNextEntry(entry);
                zos.write(html.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                zos.closeEntry();
            }
            zos.finish();
            return baos.toByteArray();
        } catch (IOException e) {
            throw new NrcBusinessException(NrcErrorCode.EXPORT_ZIP_ERRO, "Erro ao gerar arquivo ZIP: " + e.getMessage(), e);
        }
    }

    private static String orDash(String value) {
        return value != null && !value.isBlank() ? value : "—";
    }

    private static void appendRow(StringBuilder html, NrcRelatorioMessages msg, String label, String value) {
        html.append("<tr><th>").append(escape(label)).append("</th><td>")
            .append(escape(value != null && !value.isBlank() ? value : msg.dash())).append("</td></tr>");
    }

    private static String fmt(LocalDateTime dt) {
        return dt != null ? dt.toString().replace('T', ' ') : "—";
    }

    private static String escape(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private void validarResponsavelOuContencao(Nrc entity, NrcUsuarioContext usuario) {
        requireUsuario(usuario);
        if (entity.responsavelTratamentoId == null) {
            throw new NrcBusinessException(NrcErrorCode.SEM_RESPONSAVEL);
        }
        if (isUsuarioQualidade(usuario.usuarioId())) {
            return;
        }
        if ("REJEITADA".equals(entity.contencaoAprovacaoStatus)
            && entity.contencaoSolicitadoPorId != null
            && Objects.equals(entity.contencaoSolicitadoPorId, usuario.usuarioId())) {
            return;
        }
        if (!NrcAccessRules.canExecuteContencaoStep(entity, usuario.usuarioId())) {
            throw new NrcBusinessException(NrcErrorCode.ETAPA_SOMENTE_RESPONSAVEL);
        }
    }

    private void validarResponsavelTratamento(Nrc entity, NrcUsuarioContext usuario) {
        validarResponsavelTratamentoOuSolicitante(entity, usuario, null, false);
    }

    private void validarResponsavelTratamentoOuSolicitante(
            Nrc entity,
            NrcUsuarioContext usuario,
            Long solicitanteId,
            boolean etapaRejeitada) {
        requireUsuario(usuario);
        if (entity.responsavelTratamentoId == null) {
            throw new NrcBusinessException(NrcErrorCode.SEM_RESPONSAVEL);
        }
        if (isUsuarioQualidade(usuario.usuarioId())) {
            return;
        }
        if (Objects.equals(entity.responsavelTratamentoId, usuario.usuarioId())) {
            return;
        }
        if (etapaRejeitada && solicitanteId != null
            && Objects.equals(solicitanteId, usuario.usuarioId())) {
            return;
        }
        throw new NrcBusinessException(NrcErrorCode.ETAPA_SOMENTE_RESPONSAVEL);
    }

    private static void reopenAcaoParaEdicao(NrcAcao acao) {
        acao.status = "PENDENTE";
        acao.dataConclusao = null;
        acao.evidenciaConclusao = null;
        acao.concluidoPorId = null;
        acao.concluidoPorNome = null;
    }

    private static void reopenAcoesAposReprovacaoPlano(Nrc entity) {
        if (entity.acoes == null) {
            return;
        }
        for (NrcAcao acao : entity.acoes) {
            reopenAcaoParaEdicao(acao);
        }
    }

    private void validarResponsavelOuQualidadeAnexo(Nrc entity, NrcUsuarioContext usuario) {
        requireUsuario(usuario);
        if (isUsuarioQualidade(usuario.usuarioId())) {
            return;
        }
        if (entity.responsavelTratamentoId == null) {
            throw new NrcBusinessException(NrcErrorCode.SEM_RESPONSAVEL);
        }
        if (Objects.equals(entity.responsavelTratamentoId, usuario.usuarioId())) {
            return;
        }
        if (NrcAccessRules.hasPendingAcaoForUser(entity.id, usuario.usuarioId())) {
            return;
        }
        loadCollections(entity);
        if (mapper.isProntaParaEficacia(entity) && temNrcEncerrar(usuario.usuarioId())) {
            return;
        }
        throw new NrcBusinessException(NrcErrorCode.ANEXO_SOMENTE_RESPONSAVEL);
    }

    private void validarResponsavelOuQualidadeParaAnalise(Nrc entity, NrcUsuarioContext usuario,
                                                            String disposicao) {
        requireUsuario(usuario);
        if ("CRITICA".equals(entity.severidade) && disposicao != null
            && List.of("CONCESSAO", "SUCATEAMENTO").contains(disposicao)
            && isUsuarioQualidade(usuario.usuarioId())) {
            return;
        }
        validarResponsavelTratamento(entity, usuario);
    }

    private void requireUsuario(NrcUsuarioContext usuario) {
        if (usuario == null || usuario.usuarioId() == null) {
            throw new NrcBusinessException(NrcErrorCode.USUARIO_NAO_IDENTIFICADO);
        }
    }

    private void validarContencaoConcluida(Nrc entity) {
        if (Boolean.TRUE.equals(entity.contencaoNaoAplicavel)) {
            return;
        }
        if (Boolean.TRUE.equals(entity.contencaoConcluida)) {
            return;
        }
        if ("PENDENTE_APROVACAO".equals(entity.contencaoAprovacaoStatus)) {
            throw new NrcBusinessException(NrcErrorCode.CONTENCAO_APROVACAO_PENDENTE);
        }
        if ("REJEITADA".equals(entity.contencaoAprovacaoStatus)) {
            throw new NrcBusinessException(NrcErrorCode.CONTENCAO_APROVACAO_REJEITADA);
        }
        throw new NrcBusinessException(NrcErrorCode.CONTENCAO_INCOMPLETA);
    }

    private void validarProntaParaEficacia(Nrc entity) {
        loadCollections(entity);
        if (!mapper.isProntaParaEficacia(entity)) {
            throw new NrcBusinessException(NrcErrorCode.ACOES_PENDENTES);
        }
    }

    private void validarPrazoTratamentoDefinido(Nrc entity) {
        if (entity.prazoTratamento == null) {
            throw new NrcBusinessException(NrcErrorCode.PRAZO_TRATAMENTO_REQUIRED);
        }
    }

    private void validarResponsavelOuQualidadeEdicao(Nrc entity, NrcUsuarioContext usuario) {
        requireUsuario(usuario);
        if (isUsuarioQualidade(usuario.usuarioId())) {
            return;
        }
        if (entity.responsavelTratamentoId == null) {
            throw new NrcBusinessException(NrcErrorCode.SEM_RESPONSAVEL);
        }
        if (!Objects.equals(entity.responsavelTratamentoId, usuario.usuarioId())) {
            throw new NrcBusinessException(NrcErrorCode.EDICAO_SOMENTE_RESPONSAVEL);
        }
    }

    private void validarResponsavelOuAssigneeAcao(Nrc entity, NrcAcao acao, NrcUsuarioContext usuario) {
        requireUsuario(usuario);
        if (isUsuarioQualidade(usuario.usuarioId())) {
            return;
        }
        if (Objects.equals(acao.responsavelId, usuario.usuarioId())) {
            return;
        }
        if (entity.responsavelTratamentoId != null
            && Objects.equals(entity.responsavelTratamentoId, usuario.usuarioId())) {
            return;
        }
        throw new NrcBusinessException(NrcErrorCode.ACAO_CONCLUIR_NAO_PERMITIDO);
    }

    private void applyAcaoDto(Nrc entity, NrcAcao acao, NrcAcaoDto acaoDto, int ordem) {
        Long responsavelId = acaoDto.responsavelId() != null
            ? acaoDto.responsavelId()
            : entity.responsavelTratamentoId;
        if (responsavelId == null) {
            throw new NrcBusinessException(NrcErrorCode.SEM_RESPONSAVEL);
        }
        Usuario resp = resolveActiveUsuario(responsavelId);
        acao.descricao = acaoDto.descricao() != null && !acaoDto.descricao().isBlank()
            ? acaoDto.descricao()
            : orDash(acaoDto.oQue());
        acao.oQue = acaoDto.oQue();
        acao.porQue = acaoDto.porQue();
        acao.onde = acaoDto.onde();
        acao.quandoAcao = acaoDto.quandoAcao();
        acao.como = acaoDto.como();
        acao.quantoCusto = acaoDto.quantoCusto();
        acao.responsavelId = resp.id.longValue();
        acao.responsavelNome = acaoDto.responsavelNome() != null && !acaoDto.responsavelNome().isBlank()
            ? acaoDto.responsavelNome()
            : formatUsuarioNome(resp);
        acao.prazo = acaoDto.prazo();
        acao.status = "PENDENTE";
        acao.ordemItem = ordem;
    }

    private NrcAcao mapAcaoDto(Nrc entity, NrcAcaoDto acaoDto, int ordem) {
        NrcAcao acao = new NrcAcao();
        acao.nrc = entity;
        applyAcaoDto(entity, acao, acaoDto, ordem);
        return acao;
    }

    private static String buildContencaoTexto(NrcContencaoRequest req) {
        if (req.contencaoAcao() != null && !req.contencaoAcao().isBlank()) {
            return req.contencaoAcao();
        }
        StringJoiner j = new StringJoiner(" | ");
        if (req.contencaoOque() != null && !req.contencaoOque().isBlank()) {
            j.add("O quê: " + req.contencaoOque());
        }
        if (req.contencaoQuem() != null && !req.contencaoQuem().isBlank()) {
            j.add("Quem: " + req.contencaoQuem());
        }
        if (req.contencaoQuando() != null && !req.contencaoQuando().isBlank()) {
            j.add("Quando: " + req.contencaoQuando());
        }
        return j.toString();
    }
}
