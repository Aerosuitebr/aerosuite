package com.aerosuite.filter;

import org.jboss.logging.Logger;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.http.HttpServerResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import io.quarkus.vertx.http.runtime.filters.Filters;

/**
 * Filtro Vert.x para adicionar headers CORS em todas as requisições,
 * especialmente para SSE que não passa pelos filtros JAX-RS normalmente.
 * Este filtro tem prioridade sobre os filtros JAX-RS.
 */
// DESABILITADO: CORS nativo do Quarkus está habilitado no application.properties
// Este filtro causava duplicação de headers CORS
// @ApplicationScoped
public class VertxCorsFilter {

    private static final Logger LOG = Logger.getLogger(VertxCorsFilter.class);

    // DESABILITADO - CORS nativo do Quarkus está ativo
    // void setup(@Observes Filters filters) {
    void setupDisabled(@Observes Filters filters) {
        
        if (filters == null) {
            LOG.warn("ERRO CRÍTICO: Filters é null!");
            return;
        }
        
        try {
            filters.register(rc -> {
                try {
                    HttpServerRequest request = rc.request();
                    HttpServerResponse response = rc.response();
                    String path = request.path();
                    String method = request.method().name();
                    
                    // Processar TODAS as requisições /api/
                    if (path != null && path.contains("/api/")) {
                        String origin = request.getHeader("Origin");
                        String originHeader = getOriginHeader(origin);
                        
                        // Log detalhado para debug
                        
                        // IMPORTANTE: Sempre adicionar headers CORS ANTES de qualquer processamento
                        // Usar putHeader (substitui) para garantir valores corretos
                        response.putHeader("Access-Control-Allow-Origin", originHeader);
                        response.putHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
                        response.putHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Last-Event-ID");
                        response.putHeader("Access-Control-Allow-Credentials", "true");
                        response.putHeader("Access-Control-Max-Age", "3600");
                        
                        // Headers específicos para SSE
                        if (path.contains("/events")) {
                            response.putHeader("Access-Control-Expose-Headers", "Content-Type, Cache-Control, Last-Event-ID");
                            response.putHeader("Cache-Control", "no-cache");
                            response.putHeader("Connection", "keep-alive");
                            
                        }
                        
                        // Responder OPTIONS preflight IMEDIATAMENTE
                        // Isso garante que a requisição OPTIONS seja respondida antes de qualquer outro processamento
                        if ("OPTIONS".equalsIgnoreCase(method)) {
                            
                            response.setStatusCode(200);
                            response.end();
                            return; // Não continuar com outros filtros
                        }
                    }
                    
                    // Continuar com o próximo filtro para requisições não-OPTIONS
                    rc.next();
                } catch (Exception e) {
                    LOG.warnf(e, "ERRO NO VERTX CORS FILTER: %s", e.getMessage());
                    LOG.warnf(e, "Erro inesperado");
                    // Em caso de erro, tentar continuar
                    rc.next();
                }
            }, 5); // Prioridade MUITO ALTA (número menor = maior prioridade)
            
        } catch (Exception e) {
            LOG.warnf(e, "ERRO AO REGISTRAR VERTX CORS FILTER: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
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

