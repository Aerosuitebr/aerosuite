package com.aerosuite.dto;

import java.time.LocalDateTime;

public class PlatformOnboardingMessageDto {
    public long id;
    public String templateCode;
    public String channel;
    public String recipientEmail;
    public String recipientPhone;
    public String recipientName;
    public String subject;
    public String deliveryStatus;
    public String operatorEmail;
    public LocalDateTime createdAt;
}
