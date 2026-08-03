package com.aerosuite.dto;

public record DatabaseConnectionDto(
    String host,
    Integer port,
    String database,
    String username,
    String password,
    Boolean sslEnabled
) {}

