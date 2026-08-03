package com.aerosuite.service;

import org.jboss.logging.Logger;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

@ApplicationScoped
public class SistemaAtualizacaoBroadcaster {

    private static final Logger LOG = Logger.getLogger(SistemaAtualizacaoBroadcaster.class);
    private final Map<String, AtualizacaoProgress> progressMap = new ConcurrentHashMap<>();
    private final CopyOnWriteArrayList<Consumer<AtualizacaoProgress>> listeners = new CopyOnWriteArrayList<>();
    
    public void broadcast(AtualizacaoProgress progress) {
        progressMap.put(progress.updateId(), progress);
        LOG.debugf("Broadcasting atualização - ID: %s, Status: %s, Contador: %ss, Listeners ativos: %d",
                progress.updateId(), progress.status(), progress.contadorRegressivo(), listeners.size());
        listeners.forEach(listener -> {
            try {
                listener.accept(progress);
            } catch (Exception e) {
                LOG.warnf(e, "Erro ao notificar listener de atualização: %s", e.getMessage());
                LOG.warnf(e, "Erro inesperado");
            }
        });
    }
    
    public void addListener(Consumer<AtualizacaoProgress> listener) {
        listeners.add(listener);
    }
    
    public void removeListener(Consumer<AtualizacaoProgress> listener) {
        listeners.remove(listener);
    }
    
    public AtualizacaoProgress getProgress(String updateId) {
        return progressMap.get(updateId);
    }
    
    public java.util.Optional<AtualizacaoProgress> getProgressOptional(String updateId) {
        return java.util.Optional.ofNullable(progressMap.get(updateId));
    }
    
    public record AtualizacaoProgress(
        String updateId,
        String status, // "DISPONIVEL", "APROVADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"
        Integer contadorRegressivo, // segundos restantes
        String mensagem,
        String versaoDisponivel,
        String versaoAtual,
        Integer aprovadoPor
    ) {}
}

