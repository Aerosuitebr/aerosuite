package com.aerosuite.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Uma OS no relatório de kit FCU: dados da OS + FCU; produtos do kit em {@link #produtosKit} (exibidos ao expandir).
 */
public class OsKitRastreioResumoDto {

    public Long osId;
    public Integer idOs;
    public String clienteNome;
    public LocalDate dtAberturaOs;
    public Integer idFcu;
    public String fcuPn;
    public String fcuCodigo;
    public String fcuDescription;

    public int quantidadeItensKit;
    public int quantidadeItensConfirmadosEstoque;

    public List<KitProdutoPorOsLinhaDto> produtosKit = new ArrayList<>();
}
