package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import org.jboss.logging.Logger;
import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.domain.Hangar;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.OSAuditoria.AcaoAuditoria;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.CapacidadeExternoItemDto;
import com.aerosuite.dto.CapacidadeOsBatchItemDto;
import com.aerosuite.dto.CapacidadeOsBatchRequest;
import com.aerosuite.dto.CapacidadeOsUpdateRequest;
import com.aerosuite.dto.CapacidadeQuadroCardDto;
import com.aerosuite.dto.CapacidadeQuadroColunaDto;
import com.aerosuite.dto.CapacidadeQuadroDto;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.util.PanacheMaps;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class CapacidadeFilaService {

    private static final Logger LOG = Logger.getLogger(CapacidadeFilaService.class);

    private static final DateTimeFormatter D = DateTimeFormatter.ISO_LOCAL_DATE;

    public static final List<String> ESTAGIOS_ORDEM = List.of(
            "AGUARDANDO", "EM_EXECUCAO", "AGUARDANDO_PECAS", "INSPECAO");

    public static final Set<String> PRIORIDADES = Set.of("NORMAL", "AOG");

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    OsEstoqueSaidaAutomacaoService osEstoqueSaidaAutomacaoService;

    @Inject
    OSAuditoriaService osAuditoriaService;

    @Inject
    CapacidadeFilaNotificacaoService capacidadeFilaNotificacaoService;

    public CapacidadeQuadroDto obterQuadro(Long hangarId) {
        List<OS> abertas = listarOsAbertasTenant(hangarId);
        Map<Long, Integer> posicoes = calcularPosicoes(abertas);
        Set<Long> comDeficit = idsComDeficitKit(abertas);
        Map<Long, Hangar> hangares = loadHangaresForOs(abertas);

        Map<String, List<CapacidadeQuadroCardDto>> porEstagio = new LinkedHashMap<>();
        for (String estagio : ESTAGIOS_ORDEM) {
            porEstagio.put(estagio, new ArrayList<>());
        }
        Comparator<CapacidadeQuadroCardDto> ordenacaoCartao = Comparator
                .comparing((CapacidadeQuadroCardDto c) -> !"AOG".equals(c.prioridadeFila))
                .thenComparingInt(c -> c.posicaoFila);

        for (OS os : abertas) {
            String est = normalizarEstagio(os.filaEstagio);
            List<CapacidadeQuadroCardDto> destino = porEstagio.get(est);
            if (destino != null) {
                destino.add(toCard(os, posicoes.getOrDefault(os.id, 0), comDeficit, hangares));
            }
        }

        CapacidadeQuadroDto quadro = new CapacidadeQuadroDto();
        quadro.totalAbertas = abertas.size();
        for (String estagio : ESTAGIOS_ORDEM) {
            CapacidadeQuadroColunaDto col = new CapacidadeQuadroColunaDto();
            col.estagio = estagio;
            List<CapacidadeQuadroCardDto> cartoes = porEstagio.get(estagio);
            if (cartoes != null) {
                cartoes.sort(ordenacaoCartao);
                col.cartoes.addAll(cartoes);
            }
            quadro.colunas.add(col);
        }
        return quadro;
    }

    public List<CapacidadeExternoItemDto> listarParaUsuarioExterno(Integer usuarioExternoId) {
        List<OS> oss = com.aerosuite.domain.UsuarioExternoOS.findOSsByUsuarioExterno(usuarioExternoId);
        List<OS> abertas = oss.stream()
                .filter(o -> o != null && o.isActive != null && o.isActive && o.dataFechamento == null)
                .toList();
        Map<Long, Integer> posicoes = calcularPosicoes(listarOsAbertasTenant(null));
        Set<Long> comDeficit = idsComDeficitKit(abertas);

        List<CapacidadeExternoItemDto> out = new ArrayList<>();
        for (OS os : abertas) {
            CapacidadeExternoItemDto item = new CapacidadeExternoItemDto();
            item.osId = os.id;
            item.numeroOs = os.idOs != null && os.idOs > 0 ? os.idOs : (os.id != null ? os.id.intValue() : null);
            item.clienteNome = os.clienteNome;
            item.partNumber = os.partNumber;
            item.serialNumber = os.serialNumber;
            item.filaEstagio = normalizarEstagio(os.filaEstagio);
            item.prioridadeFila = normalizarPrioridade(os.prioridadeFila);
            item.posicaoFila = posicoes.getOrDefault(os.id, 0);
            item.dataPrevistaConclusao = formatDate(calcularDataPrevista(os));
            item.slaStatus = calcularSlaStatus(os);
            item.status = statusLegivel(os);
            item.temDeficitKitFcu = os.id != null && comDeficit.contains(os.id);
            out.add(item);
        }
        out.sort(Comparator
                .comparing((CapacidadeExternoItemDto i) -> !"AOG".equals(i.prioridadeFila))
                .thenComparingInt(i -> i.posicaoFila));
        return out;
    }

    @Transactional
    public CapacidadeQuadroCardDto atualizarOs(Long osId, CapacidadeOsUpdateRequest body, AuditoriaUsuarioContext ctx) {
        OS os = requireOsAberta(osId);
        String estagioAntes = normalizarEstagio(os.filaEstagio);
        String prioridadeAntes = normalizarPrioridade(os.prioridadeFila);
        String dataPrevistaAntes = formatDate(calcularDataPrevista(os));
        Long hangarAntes = os.hangarId;

        if (body == null) {
            throw new BadRequestException(ApiI18nMessages.domain("capacidade.error.body_obrigatorio"));
        }
        if (body.prioridadeFila != null && !body.prioridadeFila.isBlank()) {
            String p = body.prioridadeFila.trim().toUpperCase(Locale.ROOT);
            if (!PRIORIDADES.contains(p)) {
                throw new BadRequestException(ApiI18nMessages.domain("capacidade.error.prioridade_invalida"));
            }
            os.prioridadeFila = p;
        }
        if (body.filaEstagio != null && !body.filaEstagio.isBlank()) {
            String e = body.filaEstagio.trim().toUpperCase(Locale.ROOT);
            if (!ESTAGIOS_ORDEM.contains(e)) {
                throw new BadRequestException(ApiI18nMessages.domain("capacidade.error.estagio_invalido"));
            }
            os.filaEstagio = e;
            os.filaEstagioTravada = true;
        }
        if (body.dataPrevistaConclusao != null) {
            String raw = body.dataPrevistaConclusao.trim();
            if (raw.isEmpty()) {
                os.dataPrevistaConclusao = null;
            } else {
                try {
                    os.dataPrevistaConclusao = LocalDate.parse(raw, D);
                } catch (Exception ex) {
                    throw new BadRequestException(ApiI18nMessages.domain("capacidade.error.data_prevista_invalida"));
                }
            }
        }
        if (body.hangarId != null) {
            if (body.hangarId <= 0) {
                os.hangarId = null;
            } else {
                Hangar hangar = Hangar.findById(body.hangarId);
                if (hangar == null || hangar.ativo == null || !hangar.ativo) {
                    throw new BadRequestException(ApiI18nMessages.domain("capacidade.error.hangar_invalido"));
                }
                os.hangarId = body.hangarId;
            }
        }
        os.persist();

        registrarAuditoriaCapacidade(os, estagioAntes, prioridadeAntes, dataPrevistaAntes, hangarAntes, ctx);
        if (!estagioAntes.equals(normalizarEstagio(os.filaEstagio))) {
            Long autorId = ctx != null ? ctx.userId : null;
            capacidadeFilaNotificacaoService.notificarMudancaEstagio(
                    os, estagioAntes, normalizarEstagio(os.filaEstagio), autorId);
        }

        Map<Long, Integer> posicoes = calcularPosicoes(listarOsAbertasTenant(null));
        Set<Long> comDeficit = idsComDeficitKit(List.of(os));
        return toCard(os, posicoes.getOrDefault(os.id, 0), comDeficit, loadHangaresForOs(List.of(os)));
    }

    @Transactional
    public List<CapacidadeQuadroCardDto> atualizarOsEmLote(
            CapacidadeOsBatchRequest body, AuditoriaUsuarioContext ctx) {
        if (body == null || body.updates == null || body.updates.isEmpty()) {
            throw new BadRequestException(ApiI18nMessages.domain("capacidade.error.batch_vazio"));
        }
        List<CapacidadeQuadroCardDto> out = new ArrayList<>();
        for (CapacidadeOsBatchItemDto item : body.updates) {
            if (item == null || item.osId == null) {
                continue;
            }
            CapacidadeOsUpdateRequest single = new CapacidadeOsUpdateRequest();
            single.filaEstagio = item.filaEstagio;
            out.add(atualizarOs(item.osId, single, ctx));
        }
        if (out.isEmpty()) {
            throw new BadRequestException(ApiI18nMessages.domain("capacidade.error.batch_vazio"));
        }
        return out;
    }

    private void registrarAuditoriaCapacidade(
            OS os,
            String estagioAntes,
            String prioridadeAntes,
            String dataPrevistaAntes,
            Long hangarAntes,
            AuditoriaUsuarioContext ctx) {
        if (os == null || os.id == null) {
            return;
        }
        String estagioDepois = normalizarEstagio(os.filaEstagio);
        String prioridadeDepois = normalizarPrioridade(os.prioridadeFila);
        String dataPrevistaDepois = formatDate(calcularDataPrevista(os));

        if (!estagioAntes.equals(estagioDepois)) {
            osAuditoriaService.registrarEventoArquivo(
                    os.id,
                    os.idOs,
                    AcaoAuditoria.ALTERACAO,
                    "fila_estagio",
                    "\"" + estagioAntes + "\"",
                    "\"" + estagioDepois + "\"",
                    ctx);
        }
        if (!prioridadeAntes.equals(prioridadeDepois)) {
            osAuditoriaService.registrarEventoArquivo(
                    os.id,
                    os.idOs,
                    AcaoAuditoria.ALTERACAO,
                    "prioridade_fila",
                    "\"" + prioridadeAntes + "\"",
                    "\"" + prioridadeDepois + "\"",
                    ctx);
        }
        if (!Objects.equals(dataPrevistaAntes, dataPrevistaDepois)) {
            osAuditoriaService.registrarEventoArquivo(
                    os.id,
                    os.idOs,
                    AcaoAuditoria.ALTERACAO,
                    "data_prevista_conclusao",
                    dataPrevistaAntes != null ? "\"" + dataPrevistaAntes + "\"" : "null",
                    dataPrevistaDepois != null ? "\"" + dataPrevistaDepois + "\"" : "null",
                    ctx);
        }
        if (!Objects.equals(hangarAntes, os.hangarId)) {
            osAuditoriaService.registrarEventoArquivo(
                    os.id,
                    os.idOs,
                    AcaoAuditoria.ALTERACAO,
                    "hangar_id",
                    hangarAntes != null ? hangarAntes.toString() : "null",
                    os.hangarId != null ? os.hangarId.toString() : "null",
                    ctx);
        }
    }

    private Set<Long> idsComDeficitKit(List<OS> abertas) {
        Set<Long> ids = abertas.stream()
                .map(o -> o.id)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Set.of();
        }
        try {
            // Leitura do déficit já persistido — evita recalcular estoque para centenas de OS no carregamento do quadro.
            return osEstoqueSaidaAutomacaoService.osIdsComDeficitPersistido(ids);
        } catch (Exception e) {
            LOG.warnf(e, "CapacidadeFilaService - falha ao consultar déficit kit: %s", e.getMessage());
            return Set.of();
        }
    }

    private List<OS> listarOsAbertasTenant(Long hangarId) {
        List<OS> list;
        if (hangarId != null && hangarId > 0) {
            list = OS.find("isActive = true and dataFechamento is null and hangarId = ?1", hangarId).list();
        } else {
            list = OS.find("isActive = true and dataFechamento is null").list();
        }
        list.sort(Comparator
                .comparing((OS o) -> !"AOG".equals(normalizarPrioridade(o.prioridadeFila)))
                .thenComparing(o -> o.dtAbertura != null ? o.dtAbertura : LocalDate.now())
                .thenComparing(o -> o.id != null ? o.id : 0L));
        return list;
    }

    private Map<Long, Integer> calcularPosicoes(List<OS> abertas) {
        List<OS> ordenadas = new ArrayList<>(abertas);
        ordenadas.sort(Comparator
                .comparing((OS o) -> !"AOG".equals(normalizarPrioridade(o.prioridadeFila)))
                .thenComparing(o -> o.dtAbertura != null ? o.dtAbertura : LocalDate.now())
                .thenComparing(o -> o.id != null ? o.id : 0L));
        Map<Long, Integer> map = new HashMap<>();
        int pos = 1;
        for (OS os : ordenadas) {
            if (os.id != null) {
                map.put(os.id, pos++);
            }
        }
        return map;
    }

    private Map<Long, Hangar> loadHangaresForOs(List<OS> oss) {
        Set<Long> ids = oss.stream()
                .map(o -> o.hangarId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        List<Hangar> hangares = Hangar.list("id in ?1", ids);
        return PanacheMaps.<Hangar, Long>byId(hangares, h -> h.id);
    }

    private CapacidadeQuadroCardDto toCard(OS os, int posicao, Set<Long> comDeficit, Map<Long, Hangar> hangares) {
        CapacidadeQuadroCardDto c = new CapacidadeQuadroCardDto();
        c.osId = os.id;
        c.numeroOs = os.idOs != null && os.idOs > 0 ? os.idOs : (os.id != null ? os.id.intValue() : null);
        c.clienteNome = os.clienteNome;
        c.partNumber = os.partNumber;
        c.serialNumber = os.serialNumber;
        c.tipoServico = os.tipoServico;
        c.dtAbertura = formatDate(os.dtAbertura);
        c.prioridadeFila = normalizarPrioridade(os.prioridadeFila);
        c.filaEstagio = normalizarEstagio(os.filaEstagio);
        c.dataPrevistaConclusao = formatDate(calcularDataPrevista(os));
        c.slaStatus = calcularSlaStatus(os);
        c.posicaoFila = posicao;
        c.temDeficitKitFcu = os.id != null && comDeficit.contains(os.id);
        if (os.hangarId != null) {
            Hangar hangar = hangares != null ? hangares.get(os.hangarId) : Hangar.findById(os.hangarId);
            if (hangar != null) {
                c.hangarId = hangar.id;
                c.hangarNome = hangar.nome;
            }
        }
        return c;
    }

    private OS requireOsAberta(Long osId) {
        OS os = OS.findById(osId);
        if (os == null || os.isActive == null || !os.isActive) {
            throw new NotFoundException(ApiI18nMessages.domain("capacidade.error.os_nao_encontrada"));
        }
        if (os.dataFechamento != null) {
            throw new BadRequestException(ApiI18nMessages.domain("capacidade.error.os_fechada"));
        }
        String tid = TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());
        if (os.tenantId != null && !os.tenantId.equals(tid)) {
            throw new NotFoundException(ApiI18nMessages.domain("capacidade.error.os_nao_encontrada"));
        }
        return os;
    }

    static String normalizarPrioridade(String p) {
        if (p == null || p.isBlank()) {
            return "NORMAL";
        }
        return "AOG".equalsIgnoreCase(p.trim()) ? "AOG" : "NORMAL";
    }

    static String normalizarEstagio(String e) {
        if (e == null || e.isBlank()) {
            return "AGUARDANDO";
        }
        String up = e.trim().toUpperCase(Locale.ROOT);
        return ESTAGIOS_ORDEM.contains(up) ? up : "AGUARDANDO";
    }

    static LocalDate calcularDataPrevista(OS os) {
        if (os.dataPrevistaConclusao != null) {
            return os.dataPrevistaConclusao;
        }
        if (os.dtAbertura == null) {
            return LocalDate.now().plusDays("AOG".equals(normalizarPrioridade(os.prioridadeFila)) ? 3 : 14);
        }
        int dias = "AOG".equals(normalizarPrioridade(os.prioridadeFila)) ? 3 : 14;
        return os.dtAbertura.plusDays(dias);
    }

    static String calcularSlaStatus(OS os) {
        LocalDate prevista = calcularDataPrevista(os);
        LocalDate hoje = LocalDate.now();
        if (hoje.isAfter(prevista)) {
            return "ATRASADO";
        }
        if (!hoje.plusDays(2).isBefore(prevista)) {
            return "ATENCAO";
        }
        return "OK";
    }

    private static String statusLegivel(OS os) {
        if (os.dataFechamento != null) {
            return "Fechada";
        }
        if (os.dataConclusaoServ != null) {
            return "Concluída";
        }
        return "Aberta";
    }

    private static String formatDate(LocalDate d) {
        return d != null ? d.format(D) : null;
    }
}
