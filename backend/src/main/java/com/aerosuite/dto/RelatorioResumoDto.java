package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

public class RelatorioResumoDto {
    public List<RelatorioChartSliceDto> produtosPorFabricante = new ArrayList<>();
    public List<RelatorioChartSliceDto> osPorMes = new ArrayList<>();
    public List<RelatorioProdutoRowDto> produtos = new ArrayList<>();
    public long totalProdutos;
    public long totalFabricantes;
    public long totalOs;
    public long totalFcu;
    /** Tipo de relatório solicitado (eco dos filtros). */
    public String tipoRelatorio;
    public String dataInicio;
    public String dataFim;
}
