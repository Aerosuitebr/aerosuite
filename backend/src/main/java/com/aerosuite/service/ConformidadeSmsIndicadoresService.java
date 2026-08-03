package com.aerosuite.service;

import com.aerosuite.domain.ConformidadeNaoConformidade;
import com.aerosuite.domain.ConformidadeNaoConformidade.CapaFase;
import com.aerosuite.domain.ConformidadeNaoConformidade.Severidade;
import com.aerosuite.domain.ConformidadeNaoConformidade.StatusNc;
import com.aerosuite.dto.ConformidadeSmsIndicadoresDto;
import com.aerosuite.dto.ConformidadeSmsTendenciaMesDto;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/** P5.3 — KPIs SMS a partir de não conformidades e fluxo CAPA. */
@ApplicationScoped
public class ConformidadeSmsIndicadoresService {

    private static final DateTimeFormatter MES = DateTimeFormatter.ofPattern("yyyy-MM");

    public ConformidadeSmsIndicadoresDto indicadores(int diasJanela) {
        int janela = Math.min(Math.max(diasJanela, 1), 365);
        LocalDate hoje = LocalDate.now();
        LocalDate inicio = hoje.minusDays(janela);

        ConformidadeSmsIndicadoresDto dto = new ConformidadeSmsIndicadoresDto();
        dto.diasJanela = janela;

        List<ConformidadeNaoConformidade> abertas =
                ConformidadeNaoConformidade.find("status <> ?1", StatusNc.FECHADA).list();
        dto.ncAbertas = abertas.size();

        dto.ncFechadasPeriodo =
                (int) ConformidadeNaoConformidade.count(
                        "status = ?1 and dataFechamento is not null and dataFechamento >= ?2",
                        StatusNc.FECHADA,
                        inicio);
        dto.ncAbertasPeriodo =
                (int) ConformidadeNaoConformidade.count("dataAbertura >= ?1", inicio);

        Map<Severidade, Integer> porSev = new EnumMap<>(Severidade.class);
        for (Severidade s : Severidade.values()) {
            porSev.put(s, 0);
        }
        Map<CapaFase, Integer> porFase = new EnumMap<>(CapaFase.class);
        for (CapaFase f : CapaFase.values()) {
            porFase.put(f, 0);
        }

        long somaDias = 0;
        int criticasSemAcao = 0;
        for (ConformidadeNaoConformidade nc : abertas) {
            Severidade sev = nc.severidade != null ? nc.severidade : Severidade.MEDIA;
            porSev.merge(sev, 1, Integer::sum);
            CapaFase fase = nc.capaFase != null ? nc.capaFase : CapaFase.REGISTRO;
            porFase.merge(fase, 1, Integer::sum);
            LocalDate ref = nc.dataAbertura != null ? nc.dataAbertura : hoje;
            somaDias += ChronoUnit.DAYS.between(ref, hoje);
            if ((sev == Severidade.ALTA || sev == Severidade.CRITICA)
                    && (fase == CapaFase.REGISTRO || fase == CapaFase.CONTENCAO)) {
                criticasSemAcao++;
            }
        }
        dto.ncCriticasSemAcao = criticasSemAcao;
        dto.ncMediaDiasAbertas = abertas.isEmpty() ? 0 : (int) Math.round((double) somaDias / abertas.size());

        for (Severidade s : Severidade.values()) {
            dto.porSeveridade.put(s.name(), porSev.getOrDefault(s, 0));
        }
        for (CapaFase f : CapaFase.values()) {
            dto.porCapaFase.put(f.name(), porFase.getOrDefault(f, 0));
        }

        int totalPeriodo = dto.ncAbertasPeriodo + dto.ncFechadasPeriodo;
        dto.taxaFechamentoPercent =
                totalPeriodo == 0 ? 100 : Math.min(100, Math.round(100f * dto.ncFechadasPeriodo / totalPeriodo));

        int criticasAbertas = porSev.getOrDefault(Severidade.CRITICA, 0) + porSev.getOrDefault(Severidade.ALTA, 0);
        int score = dto.ncAbertas * 4
                + criticasAbertas * 12
                + criticasSemAcao * 8
                + Math.min(25, dto.ncMediaDiasAbertas / 3)
                + Math.max(0, 100 - dto.taxaFechamentoPercent) / 5;
        dto.scoreRisco = Math.min(100, score);

        YearMonth atual = YearMonth.from(hoje);
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = atual.minusMonths(i);
            LocalDate mesIni = ym.atDay(1);
            LocalDate mesFim = ym.atEndOfMonth();
            int ab = (int) ConformidadeNaoConformidade.count(
                    "dataAbertura >= ?1 and dataAbertura <= ?2", mesIni, mesFim);
            int fe = (int) ConformidadeNaoConformidade.count(
                    "status = ?1 and dataFechamento is not null and dataFechamento >= ?2 and dataFechamento <= ?3",
                    StatusNc.FECHADA,
                    mesIni,
                    mesFim);
            dto.tendenciaMensal.add(new ConformidadeSmsTendenciaMesDto(ym.format(MES), ab, fe));
        }

        return dto;
    }
}
