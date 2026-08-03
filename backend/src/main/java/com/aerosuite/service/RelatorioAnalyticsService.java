package com.aerosuite.service;

import com.aerosuite.domain.Fabricante;
import com.aerosuite.domain.Fcu;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.Product;
import com.aerosuite.dto.RelatorioChartSliceDto;
import com.aerosuite.dto.RelatorioProdutoRowDto;
import com.aerosuite.dto.RelatorioResumoDto;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@ApplicationScoped
public class RelatorioAnalyticsService {

    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("yyyy-MM", Locale.ROOT);
    private static final DateTimeFormatter DISPLAY = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.ROOT);

    public RelatorioResumoDto resumo(String tipoRelatorio, LocalDate dataInicio, LocalDate dataFim) {
        RelatorioResumoDto dto = new RelatorioResumoDto();
        dto.tipoRelatorio = tipoRelatorio != null && !tipoRelatorio.isBlank() ? tipoRelatorio.trim() : null;
        dto.dataInicio = dataInicio != null ? dataInicio.format(DISPLAY) : null;
        dto.dataFim = dataFim != null ? dataFim.format(DISPLAY) : null;
        dto.totalProdutos = Product.count("isActive = true");
        dto.totalFabricantes = Fabricante.count("isActive = true");
        dto.totalOs = OS.count("isActive = true");
        dto.totalFcu = Fcu.count("isActive = true");

        Map<String, Long> byFab = new LinkedHashMap<>();
        List<Product> products = Product.list("isActive = true order by name asc");
        for (Product p : products) {
            String fabLabel = resolveFabricanteNome(p);
            byFab.merge(fabLabel, 1L, Long::sum);
            dto.produtos.add(
                    new RelatorioProdutoRowDto(
                            p.id,
                            p.name,
                            fabLabel,
                            p.status != null ? p.status : "ATIVO",
                            p.createdAt != null ? p.createdAt.toLocalDate().format(DISPLAY) : ""));
        }
        byFab.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .forEach(e -> dto.produtosPorFabricante.add(new RelatorioChartSliceDto(e.getKey(), e.getValue())));

        Map<String, Long> byMonth = new LinkedHashMap<>();
        List<OS> ordens = OS.list("isActive = true order by dtAbertura desc");
        for (OS os : ordens) {
            LocalDate ref = os.dtAbertura != null ? os.dtAbertura : (os.createdAt != null ? os.createdAt.toLocalDate() : null);
            if (ref == null) {
                continue;
            }
            if (dataInicio != null && ref.isBefore(dataInicio)) {
                continue;
            }
            if (dataFim != null && ref.isAfter(dataFim)) {
                continue;
            }
            String key = ref.format(MONTH);
            byMonth.merge(key, 1L, Long::sum);
        }
        byMonth.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .limit(12)
                .forEach(e -> dto.osPorMes.add(new RelatorioChartSliceDto(formatMonthLabel(e.getKey()), e.getValue())));

        if (dto.produtosPorFabricante.isEmpty()) {
            dto.produtosPorFabricante.add(new RelatorioChartSliceDto("—", 0));
        }
        if (dto.osPorMes.isEmpty()) {
            dto.osPorMes.add(new RelatorioChartSliceDto("—", 0));
        }
        return dto;
    }

    private static String resolveFabricanteNome(Product p) {
        if (p.fabricante != null && p.fabricante.nome != null && !p.fabricante.nome.isBlank()) {
            return p.fabricante.nome.trim();
        }
        if (p.idFabricante != null) {
            Fabricante f = Fabricante.findById(p.idFabricante);
            if (f != null && f.nome != null && !f.nome.isBlank()) {
                return f.nome.trim();
            }
            return "#" + p.idFabricante;
        }
        return "—";
    }

    private static String formatMonthLabel(String yyyyMm) {
        try {
            LocalDate d = LocalDate.parse(yyyyMm + "-01");
            return d.format(DateTimeFormatter.ofPattern("MM/yyyy", Locale.ROOT));
        } catch (Exception e) {
            return yyyyMm;
        }
    }
}
