package com.aerosuite.dto;

import java.time.LocalDate;

public record FcuDto(
        Long id,
        String fcuCodigo,
        String fcuDescription,
        Integer idProduct,
        Integer idFabricante,
        String modelo,
        String pn,
        String serialNumber,
        String ataManual,
        LocalDate dataRevManual,
        String numRevisao,
        Boolean isActive
) {}