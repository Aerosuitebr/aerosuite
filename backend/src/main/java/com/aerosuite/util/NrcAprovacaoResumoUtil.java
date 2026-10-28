package com.aerosuite.util;

import com.aerosuite.domain.Nrc;

import java.time.LocalDateTime;

/** Resolves the most relevant Quality approval indicator for list/search views. */
public final class NrcAprovacaoResumoUtil {

    public record Resumo(String etapa, String status, String porNome, LocalDateTime em) {}

    private NrcAprovacaoResumoUtil() {}

    public static Resumo resolve(Nrc entity) {
        if (entity == null) {
            return null;
        }

        Resumo pending = resolvePending(entity);
        if (pending != null) {
            return pending;
        }

        Resumo rejected = resolveRejected(entity);
        if (rejected != null) {
            return rejected;
        }

        return resolveLatestApproved(entity);
    }

    private static Resumo resolvePending(Nrc entity) {
        if ("PENDENTE_APROVACAO".equals(entity.contencaoAprovacaoStatus)) {
            return new Resumo("CONTENCAO", "AGUARDANDO", null, entity.contencaoSolicitadoEm);
        }
        if (AnaliseCausaStatus.AGUARDANDO_APROVACAO == AnaliseCausaStatus.fromDb(entity.analiseCausaStatus)) {
            return new Resumo("CAUSA", "AGUARDANDO", null, entity.analiseCausaSolicitadoEm);
        }
        if (PlanoAcoesStatus.AGUARDANDO_APROVACAO == PlanoAcoesStatus.fromDb(entity.acoesPlanoStatus)) {
            return new Resumo("ACOES", "AGUARDANDO", null, entity.acoesPlanoSolicitadoEm);
        }
        if ("PENDENTE_APROVACAO".equals(entity.tratamentoPropostaStatus)) {
            return new Resumo("TRATAMENTO", "AGUARDANDO", null, entity.tratamentoPropostaEm);
        }
        return null;
    }

    private static Resumo resolveRejected(Nrc entity) {
        if ("REJEITADA".equals(entity.contencaoAprovacaoStatus)) {
            return new Resumo("CONTENCAO", "REJEITADO", entity.contencaoAprovadoPorNome, entity.contencaoAprovadoEm);
        }
        if (AnaliseCausaStatus.REJEITADO == AnaliseCausaStatus.fromDb(entity.analiseCausaStatus)) {
            return new Resumo("CAUSA", "REJEITADO", entity.analiseCausaAprovadoPorNome, entity.analiseCausaAprovadoEm);
        }
        if (PlanoAcoesStatus.REJEITADO == PlanoAcoesStatus.fromDb(entity.acoesPlanoStatus)) {
            return new Resumo("ACOES", "REJEITADO", entity.acoesPlanoAprovadoPorNome, entity.acoesPlanoAprovadoEm);
        }
        return null;
    }

    private static Resumo resolveLatestApproved(Nrc entity) {
        Resumo best = null;
        if (Boolean.TRUE.equals(entity.contencaoConcluida) && entity.contencaoAprovadoEm != null) {
            best = maxByEm(best, new Resumo("CONTENCAO", "APROVADO", entity.contencaoAprovadoPorNome, entity.contencaoAprovadoEm));
        }
        if (AnaliseCausaStatus.APROVADO == AnaliseCausaStatus.fromDb(entity.analiseCausaStatus)
            && entity.analiseCausaAprovadoEm != null) {
            best = maxByEm(best, new Resumo("CAUSA", "APROVADO", entity.analiseCausaAprovadoPorNome, entity.analiseCausaAprovadoEm));
        }
        if (PlanoAcoesStatus.APROVADO == PlanoAcoesStatus.fromDb(entity.acoesPlanoStatus)
            && entity.acoesPlanoAprovadoEm != null) {
            best = maxByEm(best, new Resumo("ACOES", "APROVADO", entity.acoesPlanoAprovadoPorNome, entity.acoesPlanoAprovadoEm));
        }
        if (entity.tratamentoAprovadoEm != null) {
            best = maxByEm(best, new Resumo("TRATAMENTO", "APROVADO", entity.tratamentoAprovadoPorNome, entity.tratamentoAprovadoEm));
        }
        return best;
    }

    private static Resumo maxByEm(Resumo current, Resumo candidate) {
        if (candidate == null) {
            return current;
        }
        if (current == null) {
            return candidate;
        }
        if (candidate.em() == null) {
            return current;
        }
        if (current.em() == null) {
            return candidate;
        }
        return candidate.em().isAfter(current.em()) ? candidate : current;
    }
}
