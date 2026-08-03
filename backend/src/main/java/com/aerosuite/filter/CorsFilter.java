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

// DESABILITADO: CORS nativo do Quarkus está funcionando corretamente
// Habilitar este filtro causa duplicação de headers CORS
// @Provider
// @PreMatching
// @Priority(1) // Alta prioridade para garantir que seja executado primeiro
public class CorsFilter implements ContainerRequestFilter, ContainerResponseFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String method = requestContext.getMethod();
        String path = requestContext.getUriInfo().getPath();
        
        // IMPORTANTE: Processar TODAS as requisições OPTIONS para /api/
        // O VertxCorsFilter pode não estar sendo executado, então este filtro deve processar
        if (path != null && path.contains("/api/")) {
            // Log para rastrear requisições aos endpoints de auth e SSE
            if (path.contains("/api/auth/login") || path.contains("/api/sistema-atualizacao/events") || "OPTIONS".equalsIgnoreCase(method)) {
            }
            
            // Interceptar requisições OPTIONS (preflight) para /api/
            // Processar IMEDIATAMENTE para garantir que os headers CORS sejam retornados
            if ("OPTIONS".equalsIgnoreCase(method)) {
                String origin = requestContext.getHeaderString("Origin");
                String originHeader = getOriginHeader(origin);
                
                
                Response.ResponseBuilder responseBuilder = Response.ok()
                    .header("Access-Control-Allow-Origin", originHeader)
                    .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Last-Event-ID")
                    .header("Access-Control-Allow-Credentials", "true")
                    .header("Access-Control-Max-Age", "3600");
                
                // Para SSE, adicionar headers específicos
                if (path.contains("/events")) {
                    responseBuilder.header("Access-Control-Expose-Headers", "Content-Type, Cache-Control, Last-Event-ID");
                }
                
                requestContext.abortWith(responseBuilder.build());
                return;
            }
        }
    }

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
        String path = requestContext.getUriInfo().getPath();
        String origin = requestContext.getHeaderString("Origin");
        String originHeader = getOriginHeader(origin);
        
        // IMPORTANTE: Processar TODAS as requisições /api/ para garantir headers CORS
        if (path != null && path.contains("/api/")) {
            // Log para debug
            if (path.contains("/api/auth/login") || path.contains("/api/sistema-atualizacao/events")) {
            }
            
            // Sempre garantir que os headers CORS estão presentes
            // Usar putSingle para evitar duplicação
            responseContext.getHeaders().putSingle("Access-Control-Allow-Origin", originHeader);
            responseContext.getHeaders().putSingle("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
            responseContext.getHeaders().putSingle("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Last-Event-ID");
            responseContext.getHeaders().putSingle("Access-Control-Allow-Credentials", "true");
            responseContext.getHeaders().putSingle("Access-Control-Max-Age", "3600");
            
            // Para SSE, adicionar headers específicos
            boolean isSse = path.contains("/events");
            String contentType = responseContext.getHeaderString("Content-Type");
            boolean isSseContentType = contentType != null && contentType.contains("text/event-stream");
            
            if (isSse || isSseContentType) {
                responseContext.getHeaders().putSingle("Access-Control-Expose-Headers", "Content-Type, Cache-Control, Last-Event-ID");
                responseContext.getHeaders().putSingle("Cache-Control", "no-cache");
                responseContext.getHeaders().putSingle("Connection", "keep-alive");
                if (!isSseContentType) {
                    responseContext.getHeaders().putSingle("Content-Type", "text/event-stream");
                }
            }
            
            return; // Processar apenas /api/, não outras rotas
        }
        
        // Para outras rotas (não /api/), adicionar headers CORS também se necessário
        if (!responseContext.getHeaders().containsKey("Access-Control-Allow-Origin")) {
            responseContext.getHeaders().putSingle("Access-Control-Allow-Origin", originHeader);
            responseContext.getHeaders().putSingle("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
            responseContext.getHeaders().putSingle("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
            responseContext.getHeaders().putSingle("Access-Control-Allow-Credentials", "true");
        }
    }
    
    private String getOriginHeader(String origin) {
        // Para desenvolvimento local, aceitar qualquer origem localhost
        if (origin != null && (origin.contains("localhost") || origin.contains("127.0.0.1") || 
            origin.contains("4200") || origin.contains("8081"))) {
            return origin;
        }
        // Se não houver origin (pode acontecer em alguns casos), retornar * para permitir
        if (origin == null || origin.isEmpty()) {
            return "*";
        }
        return "*";
    }
}
