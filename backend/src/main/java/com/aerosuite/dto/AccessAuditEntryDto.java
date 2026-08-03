package com.aerosuite.dto;

import java.time.LocalDateTime;

public class AccessAuditEntryDto {
    public Long id;
    public Long tenantId;
    public Integer usuarioId;
    public String email;
    public String evento;
    public Boolean sucesso;
    public String detalhe;
    public String ip;
    public String recurso;
    public LocalDateTime createdAt;
}
