package com.aerosuite.crs;

import com.aerosuite.domain.OSAuditoria;
import com.aerosuite.domain.OSAuditoria.AcaoAuditoria;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;

import java.util.Locale;
import java.util.Set;

/**
 * Regras de independência entre execução na OS e emissão de CRS (RBAC 145 / inspeção).
 */
@ApplicationScoped
public class Part145CrsSegregation {

    /** Chave i18n retornada em {@link BadRequestException#getMessage()}. */
    public static final String ERROR_I18N_KEY = "crs.error.segregation.executor";

    private static final Set<String> BYPASS_PERFIL_CODIGO =
            Set.of(
                    "ADMIN",
                    "ADMINISTRADOR",
                    "DIRETOR",
                    "GERENTE",
                    "QUALIDADE",
                    "P145_RT",
                    "P145_INSPETOR");

    /** Perfis que podem emitir CRS sem registro de habilitação técnica (override administrativo). */
    private static final Set<String> BYPASS_HABILITACAO_CRS =
            Set.of("ADMIN", "ADMINISTRADOR", "DIRETOR", "GERENTE", "QUALIDADE");

    private static final Set<AcaoAuditoria> EXECUTION_ACTIONS =
            Set.of(
                    AcaoAuditoria.CRIACAO,
                    AcaoAuditoria.ALTERACAO,
                    AcaoAuditoria.UPLOAD_ARQUIVO,
                    AcaoAuditoria.ASSOCIACAO_ARQUIVO);

    /**
     * Impede que o mesmo utilizador que executou/alterou a OS emita o CRS,
     * exceto perfis de inspeção/gestão ({@link #BYPASS_PERFIL_CODIGO}).
     */
    public void assertMayEmit(Long osId, Integer userId, String perfilCodigo) {
        if (isBlockedFromCrsEmit(osId, userId, perfilCodigo)) {
            throw new BadRequestException(ERROR_I18N_KEY);
        }
    }

    /**
     * Indica se o utilizador ficou impedido de emitir CRS por ter executado/alterado a OS
     * (regra Part 145 — independência execução vs liberação).
     */
    public boolean isBlockedFromCrsEmit(Long osId, Integer userId, String perfilCodigo) {
        if (osId == null) {
            return false;
        }
        if (userId == null) {
            return true;
        }
        if (bypassesIndependence(perfilCodigo)) {
            return false;
        }
        return OSAuditoria.<OSAuditoria>list("idOs = ?1 and usuarioId = ?2", osId, userId.longValue())
                .stream()
                .anyMatch(a -> a.acao != null && EXECUTION_ACTIONS.contains(a.acao));
    }

    static boolean bypassesIndependence(String perfilCodigo) {
        if (perfilCodigo == null || perfilCodigo.isBlank()) {
            return false;
        }
        return BYPASS_PERFIL_CODIGO.contains(perfilCodigo.trim().toUpperCase(Locale.ROOT));
    }

    public static boolean bypassesHabilitacaoCrs(String perfilCodigo) {
        if (perfilCodigo == null || perfilCodigo.isBlank()) {
            return false;
        }
        return BYPASS_HABILITACAO_CRS.contains(perfilCodigo.trim().toUpperCase(Locale.ROOT));
    }
}
