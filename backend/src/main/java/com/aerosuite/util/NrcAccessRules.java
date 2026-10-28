package com.aerosuite.util;

import com.aerosuite.domain.NrcAcao;
import com.aerosuite.domain.Nrc;

import java.util.Objects;

/** Shared access rules for NRC workflow (unit-testable). */
public final class NrcAccessRules {

    private NrcAccessRules() {
    }

    public static boolean isCurrentTreatmentOwner(Nrc entity, Long usuarioId) {
        return entity != null
            && entity.responsavelTratamentoId != null
            && usuarioId != null
            && Objects.equals(entity.responsavelTratamentoId, usuarioId);
    }

    public static boolean isContencaoDelegate(Nrc entity, Long usuarioId) {
        return entity != null
            && entity.contencaoResponsavelId != null
            && usuarioId != null
            && Objects.equals(entity.contencaoResponsavelId, usuarioId);
    }

    public static boolean hasOpenContencaoWork(Nrc entity) {
        if (entity == null || entity.isEncerrada()) {
            return false;
        }
        if (Boolean.TRUE.equals(entity.contencaoNaoAplicavel)) {
            return false;
        }
        if (Boolean.TRUE.equals(entity.contencaoConcluida)) {
            return false;
        }
        return "ABERTA".equals(entity.status) || "CONTENCAO".equals(entity.status);
    }

    /** Owner or contenção delegate while contenção work is still open. */
    public static boolean canExecuteContencaoStep(Nrc entity, Long usuarioId) {
        if (entity == null || usuarioId == null) {
            return false;
        }
        if (isCurrentTreatmentOwner(entity, usuarioId)) {
            return true;
        }
        return isContencaoDelegate(entity, usuarioId) && hasOpenContencaoWork(entity);
    }

    public static boolean canAssumirTratamento(Nrc entity) {
        return entity != null
            && !entity.isEncerrada()
            && entity.responsavelTratamentoId == null;
    }

    /** Whether list/jornada "Tratar" CTA should be shown for this user. */
    public static boolean canShowTratarCta(Nrc entity, Long usuarioId, boolean hasPendingAcao) {
        if (entity == null || usuarioId == null || entity.isEncerrada()) {
            return false;
        }
        if (isCurrentTreatmentOwner(entity, usuarioId)) {
            return true;
        }
        if (entity.responsavelTratamentoId == null) {
            return true;
        }
        if (hasPendingAcao) {
            return true;
        }
        return isContencaoDelegate(entity, usuarioId) && hasOpenContencaoWork(entity);
    }

    public static boolean canConcluirAcaoAsAssignee(Long acaoResponsavelId, Long usuarioId) {
        return usuarioId != null
            && acaoResponsavelId != null
            && Objects.equals(acaoResponsavelId, usuarioId);
    }

    public static boolean hasPendingAcaoForUser(Long nrcId, Long usuarioId) {
        if (nrcId == null || usuarioId == null) {
            return false;
        }
        return NrcAcao.count(
            "nrc.id = ?1 and responsavelId = ?2 and status <> 'CONCLUIDA'",
            nrcId, usuarioId) > 0;
    }
}
