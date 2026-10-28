package com.aerosuite.util;

import java.util.List;
import java.util.Set;

/** Códigos de funcionalidade do módulo NRC (tabela {@code funcionalidade}). */
public final class NrcFuncionalidade {

    public static final String DASHBOARD = "NRC_DASHBOARD";
    public static final String LIST = "NRC_LIST";
    public static final String RELATORIO = "NRC_RELATORIO";
    public static final String ABRIR = "NRC_ABRIR";
    public static final String ANALISAR = "NRC_ANALISAR";
    public static final String ENCERRAR = "NRC_ENCERRAR";

    /** Qualquer permissão de leitura/consulta no módulo. */
    public static final List<String> READ_ANY = List.of(
        DASHBOARD, LIST, RELATORIO, ABRIR, ANALISAR, ENCERRAR
    );

    public static final Set<String> ALL = Set.of(
        DASHBOARD, LIST, RELATORIO, ABRIR, ANALISAR, ENCERRAR
    );

    private NrcFuncionalidade() {
    }
}
