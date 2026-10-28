package com.aerosuite.service;

import com.aerosuite.domain.*;
import com.aerosuite.dto.OSDto;
import com.aerosuite.mapping.OSMapper;
import com.aerosuite.os.OsRegistroEncerradoGuard;
import com.aerosuite.security.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import java.time.*;
import java.util.*;

@ApplicationScoped
public class OsExecucaoService {
    @Inject OperacaoProntidaoGuard operacaoProntidao;
    @Inject TenantDataAccess tenants;
    @Inject InternalUserContext user;
    @Inject OSMapper mapper;
    @Inject OsRegistroEncerradoGuard encerrado;
    public record Mecanico(Integer id, String nome, String email) {}
    public record Carga(Integer mecanicoId, String mecanicoNome, long atribuidasPeriodo, long emAndamentoPeriodo, long concluidasPeriodo, long cargaAtual) {}
    public record Dashboard(String periodo, LocalDate dataInicio, LocalDate dataFim, long totalSemAtribuicao,
                            long totalAlertaSemAtribuicao5Dias, long totalEmAndamento, List<Carga> mecanicos) {}
    public boolean podeGerir() {
        return Set.of("ADMIN", "ADMINISTRADOR", "DIRETOR", "COORDENADOR").contains(Objects.toString(user.getPerfilCodigo(), "").toUpperCase(Locale.ROOT));
    }
    public void exigirGestao() { if (!podeGerir()) throw new ForbiddenException("Acesso restrito à gestão da oficina."); }
    public List<Mecanico> mecanicos() {
        return Usuario.<Usuario>list("orgTenantId = ?1 and ativo = true order by nome", tenants.currentTenantId())
                .stream().filter(u -> u.perfil != null && Set.of("MECANICO", "MECÂNICO").contains(u.perfil.getCodigo().toUpperCase(Locale.ROOT)))
                .map(u -> new Mecanico(u.id, u.nome, u.email)).toList();
    }
    @Transactional
    public OSDto encaminhar(Long id, Integer mecanicoId, String motivo) {
        exigirGestao();
        OS os = bloquear(id);
        if (os.execucaoFinalizadaEm != null || os.dataConclusaoServ != null) throw new BadRequestException("OS concluída não pode ser encaminhada.");
        Mecanico mecanico = mecanicos().stream().filter(m -> Objects.equals(m.id(), mecanicoId)).findFirst()
                .orElseThrow(() -> new BadRequestException("Selecione um mecânico ativo da empresa."));
        if (os.mecanicoResponsavelId != null && (motivo == null || motivo.isBlank())) throw new BadRequestException("Justifique o reencaminhamento.");
        os.mecanicoResponsavelId = mecanico.id(); os.mecanicoResponsavelNome = mecanico.nome();
        os.mecanicoAtribuidoPorId = user.getUserId(); os.mecanicoAtribuidoPorNome = user.getNome();
        os.mecanicoAtribuidoEm = LocalDateTime.now();
        if (os.statusExecucao == null) os.statusExecucao = "NAO_INICIADA";
        evento(os, "ENCAMINHAR", motivo);
        return mapper.toDto(os);
    }
    private OS bloquear(Long id) {
        OS os = tenants.requireOS(id);
        OS.getEntityManager().lock(os, LockModeType.PESSIMISTIC_WRITE);
        if (!Boolean.TRUE.equals(os.isActive)) throw new BadRequestException("OS inativa.");
        encerrado.assertMutacaoPermitida(os);
        return os;
    }
    @Transactional
    public OSDto executar(Long id, String acao, String observacao) {
        OS os = bloquear(id);
        if (!Objects.equals(os.mecanicoResponsavelId, user.getUserId()) && !Set.of("ADMIN", "ADMINISTRADOR").contains(Objects.toString(user.getPerfilCodigo(), ""))) throw new ForbiddenException("Somente o mecânico responsável pode controlar a execução.");
        if (os.mecanicoResponsavelId == null) throw new BadRequestException("Encaminhe a OS a um mecânico.");
        String atual = Objects.toString(os.statusExecucao, "NAO_INICIADA");
        String destino = transicao(atual, acao);
        LocalDateTime agora = LocalDateTime.now();
        if (acao.equals("iniciar")) { operacaoProntidao.conferir(os.id, "EXECUCAO"); os.execucaoIniciadaEm = agora; }
        if (acao.equals("pausar")) os.execucaoPausadaEm = agora;
        if (acao.equals("retomar")) os.execucaoPausadaEm = null;
        if (acao.equals("finalizar")) os.execucaoFinalizadaEm = agora;
        os.statusExecucao = destino;
        evento(os, acao.toUpperCase(Locale.ROOT), observacao);
        return mapper.toDto(os);
    }
    public static String transicao(String atual, String acao) {
        return switch (acao) {
            case "iniciar" -> { if (!atual.equals("NAO_INICIADA")) throw new BadRequestException("Execução já iniciada."); yield "EM_ANDAMENTO"; }
            case "pausar" -> { if (!atual.equals("EM_ANDAMENTO")) throw new BadRequestException("Execução não está em andamento."); yield "PAUSADA"; }
            case "retomar" -> { if (!atual.equals("PAUSADA")) throw new BadRequestException("Execução não está pausada."); yield "EM_ANDAMENTO"; }
            case "finalizar" -> { if (!Set.of("EM_ANDAMENTO", "PAUSADA").contains(atual)) throw new BadRequestException("Inicie a execução antes de finalizar."); yield "FINALIZADA"; }
            default -> throw new BadRequestException("Ação inválida.");
        };
    }
    private void evento(OS os, String acao, String obs) {
        if (obs != null && obs.length() > 2000) throw new BadRequestException("Observação excede 2000 caracteres.");
        OsExecucaoEvento e = new OsExecucaoEvento(); e.tenantId = tenants.currentTenantIdStr(); e.osId = os.id;
        e.usuarioId = user.getUserId(); e.acao = acao; e.observacao = obs; e.ocorridoEm = LocalDateTime.now(); e.persist();
    }
    private List<OS> ativas() { return OS.list("isActive = true order by dtAbertura, id"); }
    public List<OSDto> semAtribuicao(boolean alerta) {
        exigirGestao(); return ativas().stream().filter(o -> semMecanico(o) && (!alerta || atrasada(o))).map(mapper::toDto).toList();
    }
    private boolean semMecanico(OS o) { return o.mecanicoResponsavelId == null && o.dataConclusaoServ == null; }
    private boolean atrasada(OS o) { return o.dtAbertura != null && o.dtAbertura.isBefore(LocalDate.now().minusDays(5)); }
    public static LocalDate inicioPeriodo(String periodo, LocalDate hoje) {
        return switch (periodo) {
            case "DIA" -> hoje;
            case "SEMANA" -> hoje.with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case "MES" -> hoje.withDayOfMonth(1);
            default -> throw new BadRequestException("Período inválido.");
        };
    }
    private boolean noPeriodo(LocalDateTime data, LocalDate inicio) {
        return data != null && !data.toLocalDate().isBefore(inicio) && !data.toLocalDate().isAfter(LocalDate.now());
    }
    private boolean filtrar(OS o, LocalDate inicio, String tipo) {
        return switch(tipo) {
            case "ATRIBUIDAS" -> noPeriodo(o.mecanicoAtribuidoEm, inicio);
            case "EM_ANDAMENTO" -> "EM_ANDAMENTO".equals(o.statusExecucao) && noPeriodo(o.execucaoIniciadaEm, inicio);
            case "CONCLUIDAS" -> noPeriodo(o.execucaoFinalizadaEm, inicio);
            case "CARGA_ATUAL" -> o.execucaoFinalizadaEm == null && o.dataConclusaoServ == null;
            default -> throw new BadRequestException("Tipo de carga inválido.");
        };
    }
    public List<OSDto> listarCarga(Integer mecanicoId, String periodo, String tipo) {
        exigirGestao(); LocalDate inicio = inicioPeriodo(periodo, LocalDate.now());
        return ativas().stream().filter(o -> Objects.equals(o.mecanicoResponsavelId, mecanicoId) && filtrar(o, inicio, tipo)).map(mapper::toDto).toList();
    }
    public Dashboard dashboard(String periodo) {
        exigirGestao(); LocalDate inicio = inicioPeriodo(periodo, LocalDate.now()); List<OS> todas = ativas();
        List<Carga> cargas = mecanicos().stream().map(m -> {
            List<OS> ordens = todas.stream().filter(o -> Objects.equals(o.mecanicoResponsavelId, m.id())).toList();
            return new Carga(m.id(), m.nome(), ordens.stream().filter(o -> filtrar(o,inicio,"ATRIBUIDAS")).count(),
                    ordens.stream().filter(o -> filtrar(o,inicio,"EM_ANDAMENTO")).count(),
                    ordens.stream().filter(o -> filtrar(o,inicio,"CONCLUIDAS")).count(),
                    ordens.stream().filter(o -> filtrar(o,inicio,"CARGA_ATUAL")).count());
        }).toList();
        return new Dashboard(periodo, inicio, LocalDate.now(), todas.stream().filter(this::semMecanico).count(),
                todas.stream().filter(o -> semMecanico(o) && atrasada(o)).count(),
                todas.stream().filter(o -> "EM_ANDAMENTO".equals(o.statusExecucao)).count(), cargas);
    }
}
