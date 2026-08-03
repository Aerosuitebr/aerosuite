package com.aerosuite.integration.bling;

/** Visão pública da conexão Bling do tenant (sem tokens). */
public class TenantBlingConnectionViewDto {
    public boolean platformEnabled;
    public boolean oauthConfigured;
    public boolean connected;
    public boolean linked;
    public boolean tokenOperational;
    public String tokenIssue;
    public boolean canManage;
    public String connectedAt;
    public String blingCompanyName;
    public String blingCompanyId;
    public String message;
}
