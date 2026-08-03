package com.aerosuite.service;

import com.aerosuite.domain.OS;
import com.aerosuite.domain.OsNotificacaoDeficitTroca;
import com.aerosuite.domain.OsSolicitacaoTrocaItem;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.Usuario;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.dto.ConsultaDisponibilidadeLinhaDto;
import com.aerosuite.dto.DisponibilidadePnResultDto;
import com.aerosuite.dto.OsNotificacaoDeficitTrocaDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Notificações in-app (persistência) para perfis Suprimento, Comercial, Admin e Diretor:
 * déficit de estoque em itens da Solicitação de Troca Eventual, ou nova solicitação com produtos inseridos.
 */
@ApplicationScoped
public class OsNotificacaoDeficitTrocaService {

    public static final String KIND_DEFICIT = "DEFICIT";
    public static final String KIND_SOLICITACAO_TROCA = "SOLICITACAO_TROCA";

    @Inject
    EstoqueService estoqueService;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    ObjectMapper objectMapper;

    @PersistenceContext
    EntityManager em;

    @Transactional
    public void criarSeDeficitAposSalvarOs(OS os) {
        if (os == null || os.id == null) {
            return;
        }
        OS osRef = tenantDataAccess.requireOS(os.id);
        List<OsSolicitacaoTrocaItem> itens = OsSolicitacaoTrocaItem.list("osId = ?1 order by ordem asc, id asc", osRef.id);
        if (itens == null || itens.isEmpty()) {
            return;
        }
        List<ConsultaDisponibilidadeLinhaDto> linhas = agregarLinhasConsulta(itens);
        if (linhas.isEmpty()) {
            return;
        }
        List<DisponibilidadePnResultDto> resultados = estoqueService.consultarDisponibilidadeParaLinhas(linhas);
        List<DisponibilidadePnResultDto> deficits = resultados.stream()
                .filter(r -> r.semEstoque)
                .collect(Collectors.toList());
        if (deficits.isEmpty()) {
            return;
        }

        String detalheJson;
        try {
            detalheJson = objectMapper.writeValueAsString(montarDetalhe(deficits, itens));
        } catch (JsonProcessingException e) {
            return;
        }

        List<Integer> usuarioIds = listarUsuarioIdsPerfisNotificacao(osRef.tenantId);
        if (usuarioIds.isEmpty()) {
            return;
        }

        for (Integer uid : usuarioIds) {
            OsNotificacaoDeficitTroca.delete(
                    "osId = ?1 and usuarioId = ?2 and acknowledgedAt is null and kind = ?3",
                    osRef.id, uid, KIND_DEFICIT);
            OsNotificacaoDeficitTroca row = new OsNotificacaoDeficitTroca();
            row.usuarioId = uid;
            row.osId = osRef.id;
            row.idOs = osRef.idOs;
            row.clienteNome = osRef.clienteNome;
            row.detalheJson = detalheJson;
            row.kind = KIND_DEFICIT;
            row.createdAt = LocalDateTime.now();
            row.persist();
        }
    }

    /**
     * Quando há criação de produto na Solicitação de Troca Eventual ou mudança de status (pago/recusado),
     * registra alerta in-app para os perfis autorizados.
     */
    @Transactional
    public void criarNotificacaoSolicitacaoTrocaEventual(long osId) {
        OS osRef;
        try {
            osRef = tenantDataAccess.requireOS(osId);
        } catch (jakarta.ws.rs.NotFoundException e) {
            return;
        }
        List<OsSolicitacaoTrocaItem> itens = OsSolicitacaoTrocaItem.list("osId = ?1 order by ordem asc, id asc", osRef.id);
        if (itens == null || itens.isEmpty()) {
            return;
        }
        List<Map<String, Object>> detalhe = new ArrayList<>();
        for (OsSolicitacaoTrocaItem it : itens) {
            if (it == null || !linhaSolicitacaoTemConteudo(it)) {
                continue;
            }
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("nome", it.produtoNome != null ? it.produtoNome : "");
            m.put("pn", it.produtoPn != null ? it.produtoPn : "");
            m.put("quantidade", it.quantidade != null && it.quantidade > 0 ? it.quantidade : 1);
            m.put("descricao", it.produtoDescricao != null ? it.produtoDescricao : "");
            m.put("statusPagamento", statusPagamentoLabel(it.pago));
            detalhe.add(m);
        }
        if (detalhe.isEmpty()) {
            return;
        }
        String detalheJson;
        try {
            detalheJson = objectMapper.writeValueAsString(detalhe);
        } catch (JsonProcessingException e) {
            return;
        }
        List<Integer> usuarioIds = listarUsuarioIdsPerfisNotificacao(osRef.tenantId);
        if (usuarioIds.isEmpty()) {
            return;
        }
        for (Integer uid : usuarioIds) {
            OsNotificacaoDeficitTroca.delete(
                    "osId = ?1 and usuarioId = ?2 and acknowledgedAt is null and kind = ?3",
                    osRef.id, uid, KIND_SOLICITACAO_TROCA);
            OsNotificacaoDeficitTroca row = new OsNotificacaoDeficitTroca();
            row.usuarioId = uid;
            row.osId = osRef.id;
            row.idOs = osRef.idOs;
            row.clienteNome = osRef.clienteNome;
            row.detalheJson = detalheJson;
            row.kind = KIND_SOLICITACAO_TROCA;
            row.createdAt = LocalDateTime.now();
            row.persist();
        }
    }

    private static boolean linhaSolicitacaoTemConteudo(OsSolicitacaoTrocaItem it) {
        if (it.idProduto != null) {
            return true;
        }
        if (it.produtoPn != null && !it.produtoPn.isBlank()) {
            return true;
        }
        return it.produtoNome != null && !it.produtoNome.isBlank();
    }

    public List<OsNotificacaoDeficitTrocaDto> listarPendentesParaUsuario(long usuarioId) {
        List<OsNotificacaoDeficitTroca> rows = OsNotificacaoDeficitTroca.list(
                "usuarioId = ?1 and acknowledgedAt is null order by createdAt asc",
                (int) usuarioId
        );
        if (rows.isEmpty()) {
            return List.of();
        }
        Set<Long> osIds = rows.stream()
                .map(r -> r.osId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, OS> osPorId = new HashMap<>();
        if (!osIds.isEmpty()) {
            List<OS> oss = OS.list("id in ?1", osIds);
            for (OS o : oss) {
                if (o.id != null) {
                    osPorId.put(o.id, o);
                }
            }
        }
        List<OsNotificacaoDeficitTrocaDto> out = new ArrayList<>();
        for (OsNotificacaoDeficitTroca r : rows) {
            OS o = r.osId != null ? osPorId.get(r.osId) : null;
            if (r.osId != null && o == null) {
                continue;
            }
            OsNotificacaoDeficitTrocaDto d = new OsNotificacaoDeficitTrocaDto();
            d.id = r.id;
            d.osId = r.osId;
            d.idOs = r.idOs;
            d.clienteNome = r.clienteNome;
            d.kind = r.kind != null ? r.kind : KIND_DEFICIT;
            d.detalheJson = r.detalheJson;
            d.createdAt = r.createdAt;
            d.osExibicao = formatarOsBEL(o, r);
            out.add(d);
        }
        return out;
    }

    /**
     * Igual ao {@code formatOSId} do Angular na lista de OS: BEL-{id}/{ano de dtAbertura}.
     */
    private static String formatarOsBEL(OS o, OsNotificacaoDeficitTroca r) {
        if (o != null && o.id != null) {
            int year = o.dtAbertura != null ? o.dtAbertura.getYear() : LocalDate.now().getYear();
            return "BEL-" + o.id + "/" + year;
        }
        if (r.idOs != null && r.idOs != 0) {
            return String.valueOf(r.idOs);
        }
        if (r.osId != null) {
            return "#" + r.osId;
        }
        return "-";
    }

    @Transactional
    public boolean usuarioRecebeNotificacaoDeficitTroca(long usuarioId) {
        try {
            @SuppressWarnings("unchecked")
            List<String> rows = em.createQuery(
                            "select upper(trim(p.codigo)) from Usuario u join u.perfil p where u.id = ?1 and u.ativo = true",
                            String.class
                    )
                    .setParameter(1, (int) usuarioId)
                    .setMaxResults(1)
                    .getResultList();
            if (rows.isEmpty()) {
                return false;
            }
            String r = rows.get(0);
            return r != null
                    && ("SUPRIMENTO".equals(r) || "COMERCIAL".equals(r) || "ADMIN".equals(r)
                        || "DIRETOR".equals(r) || "MECANICO".equals(r));
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional
    public boolean marcarCiente(long notificacaoId, long usuarioId) {
        int uid = (int) usuarioId;
        OsNotificacaoDeficitTroca row = OsNotificacaoDeficitTroca.findById(notificacaoId);
        if (row == null || row.usuarioId == null || !row.usuarioId.equals(uid)) {
            return false;
        }
        if (row.osId != null) {
            OS os = OS.find("id = ?1", row.osId).firstResult();
            if (os == null) {
                return false;
            }
        }
        if (row.acknowledgedAt != null) {
            return true;
        }
        LocalDateTime agora = LocalDateTime.now();
        int updated = OsNotificacaoDeficitTroca.update(
                "acknowledgedAt = ?1 where id = ?2 and usuarioId = ?3 and acknowledgedAt is null",
                agora,
                notificacaoId,
                uid
        );
        if (updated > 0) {
            em.flush();
            return true;
        }
        // Idempotência: já estava marcada entre o find e o update
        OsNotificacaoDeficitTroca again = OsNotificacaoDeficitTroca.findById(notificacaoId);
        return again != null
                && again.usuarioId != null
                && again.usuarioId.equals(uid)
                && again.acknowledgedAt != null;
    }

    private List<Integer> listarUsuarioIdsPerfisNotificacao(String tenantIdStr) {
        Long tenantId = tenantIdStr != null ? Long.parseLong(tenantIdStr) : null;
        return listarUsuarioIdsPerfisNotificacaoInApp(tenantId);
    }

    private static long tenantIdDoUsuario(long usuarioId) {
        Usuario u = Usuario.findById((int) usuarioId);
        if (u != null && u.orgTenantId != null) {
            return u.orgTenantId;
        }
        return TenantConstants.DEFAULT_TENANT_ID;
    }

    /** Perfis que recebem modais in-app (sem exigir e-mail cadastrado), no mesmo tenant da OS. */
    private List<Integer> listarUsuarioIdsPerfisNotificacaoInApp(Long tenantId) {
        long tid = tenantId != null ? tenantId : TenantConstants.DEFAULT_TENANT_ID;
        try {
            @SuppressWarnings("unchecked")
            List<Integer> ids = em.createQuery(
                            "select u.id from Usuario u join u.perfil p where u.ativo = true and u.orgTenantId = ?1 "
                                    + "and (upper(trim(p.codigo)) = 'SUPRIMENTO' or upper(trim(p.codigo)) = 'COMERCIAL' "
                                    + "or upper(trim(p.codigo)) = 'ADMIN' or upper(trim(p.codigo)) = 'DIRETOR' "
                                    + "or upper(trim(p.codigo)) = 'MECANICO')",
                            Integer.class
                    )
                    .setParameter(1, tid)
                    .getResultList();
            return ids.stream().distinct().collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<ConsultaDisponibilidadeLinhaDto> agregarLinhasConsulta(List<OsSolicitacaoTrocaItem> itens) {
        Map<String, BigDecimal> solicitadoPorChave = new LinkedHashMap<>();
        Map<String, String> pnPorChave = new LinkedHashMap<>();
        for (OsSolicitacaoTrocaItem it : itens) {
            if (it == null || it.produtoPn == null || it.produtoPn.isBlank()) {
                continue;
            }
            String exib = it.produtoPn.trim();
            String chave = exib.toLowerCase(Locale.ROOT);
            int q = it.quantidade != null && it.quantidade > 0 ? it.quantidade : 1;
            solicitadoPorChave.merge(chave, BigDecimal.valueOf(q), BigDecimal::add);
            pnPorChave.putIfAbsent(chave, exib);
        }
        List<ConsultaDisponibilidadeLinhaDto> linhas = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> e : solicitadoPorChave.entrySet()) {
            ConsultaDisponibilidadeLinhaDto l = new ConsultaDisponibilidadeLinhaDto();
            l.partNumber = pnPorChave.getOrDefault(e.getKey(), e.getKey());
            l.quantidade = e.getValue().doubleValue();
            linhas.add(l);
        }
        return linhas;
    }

    private List<Map<String, Object>> montarDetalhe(List<DisponibilidadePnResultDto> deficits, List<OsSolicitacaoTrocaItem> itens) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (DisponibilidadePnResultDto r : deficits) {
            String pn = r.partNumber != null ? r.partNumber.trim() : "";
            String nome = itens.stream()
                    .filter(i -> i.produtoPn != null && i.produtoPn.trim().equalsIgnoreCase(pn))
                    .map(i -> i.produtoNome)
                    .filter(n -> n != null && !n.isBlank())
                    .findFirst()
                    .orElse(pn);
            double sol = r.quantidadeSolicitada;
            double disp = r.quantidadeDisponivel;
            double deficit = Math.max(0, sol - disp);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("nome", nome);
            m.put("pn", r.partNumber);
            m.put("solicitado", sol);
            m.put("disponivel", disp);
            m.put("deficit", deficit);
            list.add(m);
        }
        return list;
    }

    private static String statusPagamentoLabel(Boolean pago) {
        if (Boolean.TRUE.equals(pago)) {
            return "PAGO";
        }
        if (Boolean.FALSE.equals(pago)) {
            return "RECUSADO";
        }
        return "PENDENTE";
    }
}
