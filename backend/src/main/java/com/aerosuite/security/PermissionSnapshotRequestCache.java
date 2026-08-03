package com.aerosuite.security;

import jakarta.enterprise.context.RequestScoped;
import java.util.function.IntFunction;

/** Evita múltiplas cargas de permissões no mesmo pedido HTTP (ex.: /meu-menu). */
@RequestScoped
public class PermissionSnapshotRequestCache {

    private Integer cachedUserId;
    private PermissionProfileService.PermissionSnapshot cachedSnapshot;

    public PermissionProfileService.PermissionSnapshot getOrLoad(
            int userId, IntFunction<PermissionProfileService.PermissionSnapshot> loader) {
        if (cachedUserId != null && cachedUserId == userId && cachedSnapshot != null) {
            return cachedSnapshot;
        }
        cachedSnapshot = loader.apply(userId);
        cachedUserId = userId;
        return cachedSnapshot;
    }
}
