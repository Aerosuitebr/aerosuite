package com.aerosuite.dto;



import com.aerosuite.util.NrcRelatorioMessages;

import java.time.LocalDate;



public record NrcNotificacaoEmailData(

    String destinatarioEmail,

    String destinatarioNome,

    String delegadoPorNome,

    String numeroNrc,

    String origem,

    String tipoNc,

    String severidade,

    String osNumero,

    String clienteNome,

    String partNumber,

    String loteCodigo,

    LocalDate prazoTratamento,

    String descricaoOcorrido,

    String requisitoNaoAtendido,

    String nrcUrl,

    String etapaCodigo,

    String etapaDetalhe,

    String localeTag

) {

    public NrcNotificacaoEmailData(

        String destinatarioEmail,

        String destinatarioNome,

        String delegadoPorNome,

        String numeroNrc,

        String origem,

        String tipoNc,

        String severidade,

        String osNumero,

        String clienteNome,

        String partNumber,

        String loteCodigo,

        LocalDate prazoTratamento,

        String descricaoOcorrido,

        String requisitoNaoAtendido,

        String nrcUrl,

        String etapaCodigo,

        String etapaDetalhe

    ) {

        this(

            destinatarioEmail, destinatarioNome, delegadoPorNome, numeroNrc, origem, tipoNc,

            severidade, osNumero, clienteNome, partNumber, loteCodigo, prazoTratamento,

            descricaoOcorrido, requisitoNaoAtendido, nrcUrl, etapaCodigo, etapaDetalhe, null

        );

    }



    public String resolvedLocaleTag() {

        return NrcRelatorioMessages.resolveLocaleTag(localeTag, null);

    }



    public String etapaEfetiva() {

        return etapaCodigo != null && !etapaCodigo.isBlank() ? etapaCodigo : "TRATAMENTO";

    }

}


