package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

public class RetencaoRegistrosInventarioDto {
    public int anosRetencao;
    public String dataLimiteRetencao;
    public long totalOsFechadas;
    public long totalDentroRetencao;
    public long totalForaRetencao;
    public long totalOsAbertas;
    public List<OsRetencaoLinhaDto> amostraForaRetencao = new ArrayList<>();

    public static class OsRetencaoLinhaDto {
        public Long osId;
        public Integer numeroOs;
        public String clienteNome;
        public String dataFechamento;
        public String dtAbertura;
        public Boolean crsEmitido;
    }
}
