package com.aerosuite.service;

import com.aerosuite.dto.studio.AeroStudioCollabStateDto;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

@ApplicationScoped
public class StudioCollaborationBroadcaster {

    private final Map<String, AeroStudioCollabStateDto> latest = new ConcurrentHashMap<>();
    private final Map<String, CopyOnWriteArrayList<Consumer<AeroStudioCollabStateDto>>> listeners =
            new ConcurrentHashMap<>();

    public AeroStudioCollabStateDto publish(String sessionId, AeroStudioCollabStateDto state) {
        if (sessionId == null || sessionId.isBlank() || state == null) {
            return state;
        }
        state.updatedAt = Instant.now().toString();
        latest.put(sessionId, state);
        listeners.getOrDefault(sessionId, new CopyOnWriteArrayList<>()).forEach(l -> {
            try {
                l.accept(state);
            } catch (Exception ignored) {
                // drop broken SSE client
            }
        });
        return state;
    }

    public AeroStudioCollabStateDto getLatest(String sessionId) {
        return latest.get(sessionId);
    }

    public void addListener(String sessionId, Consumer<AeroStudioCollabStateDto> listener) {
        listeners.computeIfAbsent(sessionId, k -> new CopyOnWriteArrayList<>()).add(listener);
    }

    public void removeListener(String sessionId, Consumer<AeroStudioCollabStateDto> listener) {
        CopyOnWriteArrayList<Consumer<AeroStudioCollabStateDto>> list = listeners.get(sessionId);
        if (list != null) {
            list.remove(listener);
        }
    }
}
