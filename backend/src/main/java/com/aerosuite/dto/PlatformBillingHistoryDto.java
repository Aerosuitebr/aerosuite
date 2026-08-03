package com.aerosuite.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

public class PlatformBillingHistoryDto {
    public long tenantId;
    public String tenantCodigo;
    public String tenantNome;
    public List<PlatformBillingHistoryEventDto> events;

    public PlatformBillingHistoryDto() {}
}
