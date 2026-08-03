package com.aerosuite.service;

import org.eclipse.microprofile.rest.client.ext.ClientHeadersFactory;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;
import java.util.Optional;

/**
 * Provider para adicionar token de autenticação do GitHub nas requisições
 */
@ApplicationScoped
public class GitHubTokenHeaderProvider implements ClientHeadersFactory {
    
    @Inject
    CommercialBrandingService commercialBrandingService;

    @Override
    public MultivaluedMap<String, String> update(
            MultivaluedMap<String, String> incomingHeaders,
            MultivaluedMap<String, String> clientOutgoingHeaders) {
        
        MultivaluedMap<String, String> headers = new MultivaluedHashMap<>();
        
        // Obter token do GitHub (pode vir de variável de ambiente ou propriedade)
        String token = Optional.ofNullable(System.getenv("GITHUB_TOKEN"))
            .orElse(System.getProperty("github.token", ""));
        
        if (token != null && !token.isEmpty()) {
            headers.add("Authorization", "token " + token);
        } else {
        }
        
        // Adicionar header User-Agent (requerido pela API do GitHub)
        headers.add("User-Agent", commercialBrandingService.productTokenForHttp() + "-Sistema-Atualizacao/1.0");
        
        return headers;
    }
}

