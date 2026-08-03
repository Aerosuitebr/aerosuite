package com.aerosuite.filter;

import jakarta.annotation.Priority;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;

/**
 * Filtro específico para garantir CORS em endpoints SSE (Server-Sent Events)
 * Este filtro tem prioridade mais alta que o CorsFilter geral para garantir
 * que os headers CORS sejam adicionados antes que a conexão SSE seja estabelecida
 */
@Provider
@PreMatching
@Priority(0) // Prioridade mais alta que CorsFilter (que tem Priority(1))
public class SseCorsFilter implements ContainerRequestFilter, ContainerResponseFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String path = requestContext.getUriInfo().getPath();
        String method = requestContext.getMethod();
        
        // Apenas processar endpoints SSE
        if (path == null || !path.contains("/events")) {
            return;
        }
        
        
        // Interceptar requisições OPTIONS (preflight) para SSE
        if ("OPTIONS".equalsIgnoreCase(method)) {
            String origin = requestContext.getHeaderString("Origin");
            String originHeader = getOriginHeader(origin);
            
            
            Response.ResponseBuilder responseBuilder = Response.ok()
                .header("Access-Control-Allow-Origin", originHeader)
                .header("Access-Control-Allow-Methods", "GET, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Last-Event-ID")
                .header("Access-Control-Allow-Credentials", "true")
                .header("Access-Control-Expose-Headers", "Content-Type, Cache-Control, Last-Event-ID")
                .header("Access-Control-Max-Age", "3600");
            
            requestContext.abortWith(responseBuilder.build());
        }
    }

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
        String path = requestContext.getUriInfo().getPath();
        
        // Apenas processar endpoints SSE
        if (path == null || !path.contains("/events")) {
            return;
        }
        
        // Verificar se os headers CORS já foram adicionados pelo CORS nativo do Quarkus
        // Se sim, não adicionar novamente para evitar duplicação
        if (responseContext.getHeaders().containsKey("Access-Control-Allow-Origin")) {
            return;
        }
        
        String origin = requestContext.getHeaderString("Origin");
        String originHeader = getOriginHeader(origin);
        
        
        // Remover headers CORS existentes se houver
        responseContext.getHeaders().remove("Access-Control-Allow-Origin");
        responseContext.getHeaders().remove("Access-Control-Allow-Methods");
        responseContext.getHeaders().remove("Access-Control-Allow-Headers");
        responseContext.getHeaders().remove("Access-Control-Allow-Credentials");
        responseContext.getHeaders().remove("Access-Control-Max-Age");
        responseContext.getHeaders().remove("Access-Control-Expose-Headers");
        
        // Adicionar headers CORS específicos para SSE
        responseContext.getHeaders().add("Access-Control-Allow-Origin", originHeader);
        responseContext.getHeaders().add("Access-Control-Allow-Methods", "GET, OPTIONS");
        responseContext.getHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Last-Event-ID");
        responseContext.getHeaders().add("Access-Control-Allow-Credentials", "true");
        responseContext.getHeaders().add("Access-Control-Expose-Headers", "Content-Type, Cache-Control, Last-Event-ID");
        responseContext.getHeaders().add("Access-Control-Max-Age", "3600");
        responseContext.getHeaders().add("Cache-Control", "no-cache");
        responseContext.getHeaders().add("Connection", "keep-alive");
        
        // Garantir que Content-Type está correto para SSE
        String contentType = responseContext.getHeaderString("Content-Type");
        if (contentType == null || !contentType.contains("text/event-stream")) {
            responseContext.getHeaders().putSingle("Content-Type", "text/event-stream");
        }
        
    }
    
    private String getOriginHeader(String origin) {
        // Para desenvolvimento local, aceitar qualquer origem localhost
        if (origin != null && (origin.contains("localhost") || origin.contains("127.0.0.1") || 
            origin.contains("4200") || origin.contains("8081"))) {
            return origin;
        }
        // Se não houver origin, retornar * para permitir
        return "*";
    }
}

