package com.aerosuite.util;

import java.util.Set;

public final class NrcEnums {

    public static final Set<String> ORIGENS = Set.of(
        "OFICINA", "ESTOQUE", "INSPECAO", "CLIENTE", "AUDITORIA_INTERNA"
    );
    public static final Set<String> TIPOS = Set.of(
        "PRODUTO", "PROCESSO", "DOCUMENTACAO", "FORNECEDOR", "AUDITORIA"
    );
    public static final Set<String> SEVERIDADES = Set.of("MENOR", "MAIOR", "CRITICA");
    public static final Set<String> STATUS = Set.of(
        "ABERTA", "CONTENCAO", "EM_ANALISE", "EM_TRATAMENTO", "ENCERRADA"
    );
    public static final Set<String> DISPOSICOES = Set.of(
        "RETRABALHO", "REPARO", "SUCATEAMENTO", "DEVOLUCAO", "CONCESSAO"
    );
    public static final Set<String> METODOS_CAUSA = Set.of("CINCO_PORQUES", "TEXTO_LIVRE", "ISHIKAWA");
    public static final Set<String> EFICACIA_DECISOES = Set.of("EFICAZ", "INEFICAZ");
    public static final Set<String> ETAPAS_FILTRO = Set.of(
        "REGISTRO", "CONTENCAO", "CAUSA", "ACOES", "EFICACIA"
    );

    private NrcEnums() {
    }

    public static void requireOrigem(String value) {
        requireOrigemTexto(value);
    }

    /** Origem livre — texto não vazio até 255 caracteres. */
    public static void requireOrigemTexto(String value) {
        if (value == null || value.isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.VALOR_INVALIDO,
                NrcErrorCode.VALOR_INVALIDO.defaultMessage("origem"));
        }
        if (value.trim().length() > 255) {
            throw new NrcBusinessException(NrcErrorCode.VALOR_INVALIDO,
                NrcErrorCode.VALOR_INVALIDO.defaultMessage("origem"));
        }
    }

    public static void requireOrigemFiltro(String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (value.trim().length() > 255) {
            throw new NrcBusinessException(NrcErrorCode.VALOR_INVALIDO,
                NrcErrorCode.VALOR_INVALIDO.defaultMessage("origem"));
        }
    }

    public static void requireTipoNc(String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        requireMember(value, TIPOS, "tipo");
    }

    public static void requireSeveridade(String value) {
        requireMember(value, SEVERIDADES, "severidade");
    }

    public static void requireDisposicao(String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        requireMember(value, DISPOSICOES, "disposição");
    }

    public static void requireMetodoCausa(String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        requireMember(value, METODOS_CAUSA, "método de causa");
    }

    public static void requireEficaciaDecisao(String value) {
        requireMember(value, EFICACIA_DECISOES, "decisão de eficácia");
    }

    public static void requireEtapaFiltro(String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        requireMember(value, ETAPAS_FILTRO, "etapa");
    }

    public static void requireStatusFiltro(String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        requireMember(value, STATUS, "status");
    }

    public static void requireSeveridadeFiltro(String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        requireMember(value, SEVERIDADES, "severidade");
    }

    private static void requireMember(String value, Set<String> allowed, String fieldLabel) {
        if (value == null || value.isBlank()) {
            throw new NrcBusinessException(NrcErrorCode.VALOR_INVALIDO,
                NrcErrorCode.VALOR_INVALIDO.defaultMessage(fieldLabel));
        }
        if (!allowed.contains(value.trim())) {
            throw new NrcBusinessException(NrcErrorCode.VALOR_INVALIDO_VALOR,
                NrcErrorCode.VALOR_INVALIDO_VALOR.defaultMessage(fieldLabel, value.trim()));
        }
    }
}
