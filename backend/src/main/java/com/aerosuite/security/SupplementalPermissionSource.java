package com.aerosuite.security;

import java.util.Set;

/**
 * Extensão modular para permissões além do perfil (ex.: delegações futuras, grants
 * temporários). Implementações CDI devem ser {@code @ApplicationScoped}.
 */
public interface SupplementalPermissionSource {

    /**
     * Códigos de funcionalidade extra concedidos ao utilizador interno neste pedido.
     */
    Set<String> extraFuncionalidadeCodigosForUser(int userId);
}
