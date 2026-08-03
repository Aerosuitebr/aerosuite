package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Preview de déficit do kit FCU para um determinado FCU (antes de salvar a OS).
 * Permite ao frontend confirmar com o usuário se ele deseja prosseguir mesmo
 * sabendo que parte do kit não poderá ser baixada do estoque.
 */
public class KitFcuDeficitPreviewDto {
    public Integer fcuId;
    public boolean temDeficit;
    /** Quantos itens (linhas/P/N distintos) estão em déficit. */
    public int quantidadeItensFaltantes;
    public List<KitFcuDeficitItemDto> itens = new ArrayList<>();
}
