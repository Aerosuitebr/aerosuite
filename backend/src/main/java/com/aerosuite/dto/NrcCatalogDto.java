package com.aerosuite.dto;

import java.util.List;

public record NrcCatalogDto(
    List<String> locais,
    List<String> requisitos
) {}
