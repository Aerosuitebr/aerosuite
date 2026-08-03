package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import org.jboss.logging.Logger;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.time.LocalDateTime;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Scheduler responsável por renovar automaticamente o token OAuth2 da Gmail API
 * Renova o token periodicamente antes que expire para garantir disponibilidade contínua
 */
@ApplicationScoped
public class OAuth2TokenRefreshScheduler {
    
    private static final Logger LOG = Logger.getLogger(OAuth2TokenRefreshScheduler.class);
    private static ScheduledExecutorService scheduler;
    private static volatile boolean schedulerInitialized = false;
    
    @Inject
    OAuth2TokenManager oauth2TokenManager;
    
    /**
     * Inicializa o scheduler quando a aplicação inicia
     */
    void onStart(@Observes StartupEvent ev) {
        if (schedulerInitialized) {
            return;
        }
        
        
        try {
            // Aguardar mais tempo para garantir que o OAuth2TokenManager terminou de inicializar
            // (incluindo tratamento de erros que podem desabilitar o OAuth2)
            Thread.sleep(5000);
            
            // Verificar se OAuth2 está habilitado e funcionando
            if (oauth2TokenManager == null) {
                LOG.info("OAuth2TokenManager não está disponível - scheduler de refresh não será iniciado");
                return;
            }
            
            // Verificar se OAuth2 está realmente habilitado e funcionando
            boolean oauth2Enabled = false;
            try {
                oauth2Enabled = oauth2TokenManager.isOAuth2Enabled();
            } catch (Exception e) {
                LOG.warn("Erro ao verificar status do OAuth2: " + e.getMessage());
            }
            
            if (!oauth2Enabled) {
                LOG.info("OAuth2 não está habilitado ou não está funcionando - scheduler de refresh não será iniciado");
                return;
            }
            
            // Criar scheduler com 1 thread
            scheduler = Executors.newScheduledThreadPool(1, r -> {
                Thread t = new Thread(r, "OAuth2-Token-Refresh-Scheduler");
                t.setDaemon(true);
                return t;
            });
            
            // Iniciar monitoramento
            startTokenRefreshMonitor();
            
            schedulerInitialized = true;
            LOG.info("Scheduler de refresh OAuth2 inicializado com sucesso");
            
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao inicializar scheduler de refresh OAuth2: %s", e.getMessage());
            LOG.error("Erro ao inicializar scheduler de refresh OAuth2: " + e.getMessage());
            LOG.warnf(e, "Erro inesperado");
        }
    }
    
    /**
     * Inicia o monitor que renova o token periodicamente
     */
    private void startTokenRefreshMonitor() {
        Runnable refreshTask = () -> {
            try {
                
                // Verificar se OAuth2 ainda está habilitado
                if (oauth2TokenManager == null || !oauth2TokenManager.isOAuth2Enabled()) {
                    LOG.warn("OAuth2 não está mais habilitado - parando scheduler");
                    if (scheduler != null && !scheduler.isShutdown()) {
                        scheduler.shutdown();
                    }
                    return;
                }
                
                // Tentar renovar o token manualmente
                try {
                    oauth2TokenManager.refreshAccessTokenManually();
                    LOG.info("Token OAuth2 renovado automaticamente pelo scheduler com sucesso");
                } catch (Exception e) {
                    LOG.warn("==========================================");
                    LOG.warn("ERRO AO RENOVAR TOKEN OAUTH2 NO SCHEDULER");
                    LOG.warn("==========================================");
                    LOG.warnf(e, "Erro: %s", e.getMessage());
                    LOG.warn("O sistema continuará tentando na próxima execução");
                    LOG.warn("==========================================");
                    LOG.warn("Erro ao renovar token OAuth2 no scheduler: " + e.getMessage());
                    // Não relançar exceção - apenas logar o erro
                }
                
            } catch (Exception e) {
                LOG.warnf(e, "Erro inesperado no scheduler de refresh OAuth2: %s", e.getMessage());
                LOG.error("Erro inesperado no scheduler de refresh OAuth2: " + e.getMessage());
                LOG.warnf(e, "Erro inesperado");
            }
        };
        
        // Executar imediatamente e depois a cada 30 minutos
        // Tokens OAuth2 geralmente expiram em 1 hora, então renovar a cada 30 minutos é seguro
        scheduler.scheduleAtFixedRate(refreshTask, 0, 30, TimeUnit.MINUTES);
        
        LOG.info("Monitor de refresh OAuth2 iniciado - executando a cada 30 minutos");
    }
    
    /**
     * Para o scheduler quando a aplicação é encerrada
     */
    void onStop(@Observes io.quarkus.runtime.ShutdownEvent ev) {
        if (scheduler != null && !scheduler.isShutdown()) {
            LOG.info("Parando scheduler de refresh OAuth2");
            scheduler.shutdown();
            try {
                if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                    scheduler.shutdownNow();
                }
            } catch (InterruptedException e) {
                scheduler.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }
    
    /**
     * Força uma renovação manual do token (útil para testes)
     */
    public void forceRefresh() {
        if (oauth2TokenManager == null || !oauth2TokenManager.isOAuth2Enabled()) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.OAUTH_NOT_ENABLED));
        }
        
        
        try {
            oauth2TokenManager.refreshAccessTokenManually();
            LOG.info("Token OAuth2 renovado manualmente com sucesso");
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao forçar refresh do token: %s", e.getMessage());
            LOG.error("Erro ao forçar refresh do token: " + e.getMessage());
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.OAUTH_REFRESH_FAILED), e);
        }
    }
}

