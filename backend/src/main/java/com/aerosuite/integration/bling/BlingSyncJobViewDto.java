package com.aerosuite.integration.bling;

public class BlingSyncJobViewDto {
    public long id;
    public String jobType;
    public String status;
    public int attempts;
    public int maxAttempts;
    public String lastError;
    public String createdAt;
    public String processedAt;
    public String eventType;
    public String resourceId;
}
