package com.aerosuite.integration.bling;

import java.util.ArrayList;
import java.util.List;

/** Diagnóstico de webhook Bling para homologação em staging. */
public class BlingWebhookHomologationDto {
    public boolean success;
    public String message;
    public boolean webhookEnabled;
    public boolean syncEnabled;
    public boolean companyIdMapped;
    public String webhookUrl;
    public String webhookUrlTenant;
    public String tenantCodigo;
    public String blingCompanyId;
    public String lastWebhookAt;
    public long pendingJobs;
    public boolean probeAccepted;
    public List<String> steps = new ArrayList<>();
}
