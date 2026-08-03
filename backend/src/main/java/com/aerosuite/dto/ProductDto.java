package com.aerosuite.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductDto(
        Integer id,
        String description,
        Integer invoice,
        String name,
        BigDecimal price,
        String productpn,
        Integer quantity,
        String status,
        String local,
        String photoUrl,
        Integer idFabricante,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        Boolean isActive,
        String codigoBarras,
        String fabricanteNome
) {}
