package com.aerosuite.integration.bling;

import java.util.ArrayList;
import java.util.List;

/** Resultado do bootstrap de homologação (contato + fiscal + escopos). */
public class BlingBootstrapResultDto {
    public boolean success;
    public String message;
    public BlingScopesStatusDto scopes;
    public Long blingContatoId;
    public String blingContatoNome;
    public Long blingProdutoId;
    public boolean fiscalConfigured;
    public boolean contactCreated;
    public boolean contactImported;
    public Integer clientePropostaId;
    public BlingWebhookHomologationDto webhookHomologation;
    public List<String> steps = new ArrayList<>();
}
