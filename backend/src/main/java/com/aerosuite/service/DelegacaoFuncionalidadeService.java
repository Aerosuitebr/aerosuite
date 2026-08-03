package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.CriarDelegacaoFuncionalidadeRequest;
import com.aerosuite.dto.DelegacaoFuncionalidadeDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class DelegacaoFuncionalidadeService {

    @Inject
    EntityManager em;

    @SuppressWarnings("unchecked")
    public List<DelegacaoFuncionalidadeDto> listarPorGrantee(int granteeId) {
        List<Object[]> rows = (List<Object[]>) (List<?>) em.createNativeQuery(
                        "SELECT id, usuario_grantee_id, funcionalidade_codigo, concedido_por_usuario_id, "
                                + "data_inicio, data_fim, ativo, observacao "
                                + "FROM usuario_delegacao_funcionalidade WHERE usuario_grantee_id = ?1 ORDER BY id DESC")
                .setParameter(1, granteeId)
                .getResultList();
        List<DelegacaoFuncionalidadeDto> out = new ArrayList<>();
        for (Object[] r : rows) {
            out.add(mapRow(r));
        }
        return out;
    }

    @Transactional
    public DelegacaoFuncionalidadeDto criar(CriarDelegacaoFuncionalidadeRequest req, int concedenteId) {
        if (req == null || req.usuarioGranteeId == null || req.funcionalidadeCodigo == null
                || req.funcionalidadeCodigo.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.DELEGACAO_FIELDS_REQUIRED));
        }
        em.createNativeQuery(
                        "INSERT INTO usuario_delegacao_funcionalidade "
                                + "(usuario_grantee_id, funcionalidade_codigo, concedido_por_usuario_id, data_inicio, data_fim, ativo, observacao) "
                                + "VALUES (?1, ?2, ?3, UTC_TIMESTAMP(), ?4, 1, ?5)")
                .setParameter(1, req.usuarioGranteeId)
                .setParameter(2, req.funcionalidadeCodigo.trim())
                .setParameter(3, concedenteId)
                .setParameter(4, req.dataFim)
                .setParameter(5, req.observacao)
                .executeUpdate();
        em.flush();
        Object idObj = em.createNativeQuery("SELECT LAST_INSERT_ID()").getSingleResult();
        long id = ((Number) idObj).longValue();
        return obterPorId(id);
    }

    @SuppressWarnings("unchecked")
    public DelegacaoFuncionalidadeDto obterPorId(long id) {
        List<Object[]> list = (List<Object[]>) (List<?>) em.createNativeQuery(
                        "SELECT id, usuario_grantee_id, funcionalidade_codigo, concedido_por_usuario_id, "
                                + "data_inicio, data_fim, ativo, observacao "
                                + "FROM usuario_delegacao_funcionalidade WHERE id = ?1")
                .setParameter(1, id)
                .getResultList();
        if (list.isEmpty()) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.DELEGACAO_NOT_FOUND, "id", String.valueOf(id)));
        }
        return mapRow(list.get(0));
    }

    @Transactional
    public void revogar(long id) {
        int n = em.createNativeQuery(
                        "UPDATE usuario_delegacao_funcionalidade SET ativo = 0, updated_at = UTC_TIMESTAMP() WHERE id = ?1")
                .setParameter(1, id)
                .executeUpdate();
        if (n == 0) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.DELEGACAO_NOT_FOUND, "id", String.valueOf(id)));
        }
    }

    private static DelegacaoFuncionalidadeDto mapRow(Object[] r) {
        DelegacaoFuncionalidadeDto d = new DelegacaoFuncionalidadeDto();
        d.id = r[0] != null ? ((Number) r[0]).longValue() : null;
        d.usuarioGranteeId = r[1] != null ? ((Number) r[1]).intValue() : null;
        d.funcionalidadeCodigo = r[2] != null ? r[2].toString() : null;
        d.concedidoPorUsuarioId = r[3] != null ? ((Number) r[3]).intValue() : null;
        d.dataInicio = toLd(r[4]);
        d.dataFim = toLd(r[5]);
        d.ativo = r[6] != null && ((Number) r[6]).intValue() != 0;
        d.observacao = r[7] != null ? r[7].toString() : null;
        return d;
    }

    private static LocalDateTime toLd(Object sqlDate) {
        if (sqlDate == null) {
            return null;
        }
        if (sqlDate instanceof Timestamp ts) {
            return ts.toLocalDateTime();
        }
        if (sqlDate instanceof LocalDateTime ldt) {
            return ldt;
        }
        if (sqlDate instanceof java.util.Date d) {
            return LocalDateTime.ofInstant(d.toInstant(), java.time.ZoneOffset.UTC);
        }
        return null;
    }
}
