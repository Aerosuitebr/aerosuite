package com.aerosuite.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class PlatformBillingHistoryEventDto {
    public Long id;
    public String eventType;
    public String title;
    public String detail;
    public String status;
    public Long amountCents;
    public String operatorEmail;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    public LocalDateTime createdAt;

    public PlatformBillingHistoryEventDto() {}
}
