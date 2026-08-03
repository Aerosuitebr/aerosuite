package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Resultado agregado de importação go-live.
 */
public class GoLiveImportResultDto {
    public boolean dryRun;
    public int totalLinhas;
    public int criados;
    public int ignorados;
    public int erros;
    public List<GoLiveLinhaResultDto> linhas = new ArrayList<>();

    public static class GoLiveLinhaResultDto {
        public int linha;
        public String status; // OK, IGNORADO, ERRO
        public String mensagem;
        public String referencia;
        public Integer idCriado;
        /** Apenas importação de utilizadores externos (senha temporária — tratar como confidencial). */
        public String senhaTemporaria;
    }
}
