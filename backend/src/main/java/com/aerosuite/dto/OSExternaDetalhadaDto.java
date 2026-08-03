package com.aerosuite.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO detalhado para ordem de serviço visualizada por usuário externo.
 * Somente leitura - não inclui campos internos/sensíveis.
 */
public record OSExternaDetalhadaDto(
    Long id,
    Integer idOs,
    String clienteNome,
    String partNumber,
    String serialNumber,
    String tipoServico,
    String fabricanteNome,
    String modeloFcu,
    LocalDate dtAbertura,
    LocalDate dataConclusaoServ,
    LocalDate dataFechamento,
    String status,
    String tsn,
    String tso,
    String ataManual,
    String numRevisao,
    LocalDate dataRevManual,
    String obsConclusaoServ,
    String adsDas,
    String tituloAds,
    String tituloAfins,
    String boletinsServAfins,
    List<DocumentoExternoDto> documentos,
    /** Proposta comercial de origem (P4.1), quando existir vínculo. */
    Long propostaId,
    String propostaNumero
) {}
