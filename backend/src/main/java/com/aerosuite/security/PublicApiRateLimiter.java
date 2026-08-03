package com.aerosuite.security;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limit em memória por chave (IP + path prefix) para rotas {@code /api/public/*}.
 * Adequado a single-tenant / poucos nós; em cluster usar Redis ou gateway (Kong/NGINX).
 */
@ApplicationScoped
public class PublicApiRateLimiter {

    @ConfigProperty(name = "aero.suite.public-api.rate-limit.enabled", defaultValue = "true")
    boolean enabled;

    @ConfigProperty(name = "aero.suite.public-api.rate-limit.requests-per-minute", defaultValue = "120")
    int requestsPerMinute;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public boolean isEnabled() {
        return enabled && requestsPerMinute > 0;
    }

    public int limitPerMinute() {
        return Math.max(1, requestsPerMinute);
    }

    /**
     * @return segundos até a janela atual expirar (para header Retry-After), ou 60 se nova janela.
     */
    public RateLimitDecision tryAcquire(String clientKey, String pathPrefix) {
        if (!isEnabled()) {
            return RateLimitDecision.allowed();
        }
        String key = clientKey + "|" + pathPrefix;
        long now = System.currentTimeMillis();
        long windowMs = Duration.ofMinutes(1).toMillis();
        Window w = windows.compute(key, (k, existing) -> {
            if (existing == null || now >= existing.windowEndMs) {
                return new Window(now + windowMs, new AtomicInteger(0));
            }
            return existing;
        });
        int n = w.count.incrementAndGet();
        int limit = limitPerMinute();
        if (n > limit) {
            int retryAfter = (int) Math.max(1, (w.windowEndMs - now) / 1000);
            return RateLimitDecision.denied(limit, retryAfter);
        }
        return RateLimitDecision.allowed(limit, (int) Math.max(1, (w.windowEndMs - now) / 1000));
    }

    /** Limpa estado (testes). */
    void resetForTests() {
        windows.clear();
    }

    private static final class Window {
        final long windowEndMs;
        final AtomicInteger count;

        Window(long windowEndMs, AtomicInteger count) {
            this.windowEndMs = windowEndMs;
            this.count = count;
        }
    }

    public record RateLimitDecision(boolean granted, int limit, int retryAfterSeconds) {
        static RateLimitDecision allowed() {
            return new RateLimitDecision(true, 0, 0);
        }

        static RateLimitDecision allowed(int limit, int retryAfter) {
            return new RateLimitDecision(true, limit, retryAfter);
        }

        static RateLimitDecision denied(int limit, int retryAfter) {
            return new RateLimitDecision(false, limit, retryAfter);
        }
    }
}
