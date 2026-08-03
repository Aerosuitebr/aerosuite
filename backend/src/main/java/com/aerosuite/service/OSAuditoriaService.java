package com.aerosuite.service;

import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.OSAuditoria;
import com.aerosuite.domain.OSAuditoria.AcaoAuditoria;
import com.aerosuite.dto.OSAuditoriaDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.transaction.Transactional.TxType;
import io.quarkus.panache.common.Sort;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço para gerenciar auditoria de Ordens de Serviço
 */
@ApplicationScoped
public class OSAuditoriaService {

    private final ObjectMapper objectMapper;

    // Campos que devem ser ignorados na auditoria
    private static final Set<String> CAMPOS_IGNORADOS = Set.of(
        "createdAt", "updatedAt", "id",
        // Campos internos do Hibernate - IGNORAR
        "$$_hibernate_entityEntryHolder",
        "$$_hibernate_previousManagedEntity",
        "$$_hibernate_nextManagedEntity",
        "$$_hibernate_attributeInterceptor",
        "$$_hibernate_tracker",
        "$$_hibernate_useTracker"
    );
    
    // Prefixos de campos a ignorar
    private static final String[] PREFIXOS_IGNORADOS = {
        "$$_hibernate_",
        "$$_javassist_",
        "CGLIB$"
    };

    public OSAuditoriaService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    /**
     * Registra a criação de uma nova OS
     */
    @Transactional
    public void registrarCriacao(OS os, String usuarioNome, String usuarioEmail, Long usuarioId, String ipOrigem, String userAgent) {
        
        OSAuditoria auditoria = new OSAuditoria();
        auditoria.idOs = os.id;
        auditoria.numeroOs = os.idOs;
        auditoria.acao = AcaoAuditoria.CRIACAO;
        auditoria.usuarioId = usuarioId;
        auditoria.usuarioNome = usuarioNome;
        auditoria.usuarioEmail = usuarioEmail;
        auditoria.ipOrigem = ipOrigem;
        auditoria.userAgent = userAgent;
        auditoria.dataHora = LocalDateTime.now();
        
        // Salvar snapshot completo da OS
        try {
            auditoria.snapshotOs = objectMapper.writeValueAsString(osToMap(os));
        } catch (Exception e) {
            auditoria.snapshotOs = "Erro ao serializar: " + e.getMessage();
        }
        
        auditoria.persist();
    }

    /**
     * Registra alterações em uma OS
     * Compara o estado anterior com o novo e registra cada campo alterado
     */
    @Transactional
    public void registrarAlteracao(OS osAnterior, OS osNovo, String usuarioNome, String usuarioEmail, Long usuarioId, String ipOrigem, String userAgent) {
        
        List<CampoAlterado> alteracoes = compararOS(osAnterior, osNovo);
        
        
        if (alteracoes.isEmpty()) {
            return; // Nenhuma alteração detectada
        }

        for (CampoAlterado alteracao : alteracoes) {
            
            OSAuditoria auditoria = new OSAuditoria();
            auditoria.idOs = osNovo.id;
            auditoria.numeroOs = osNovo.idOs;
            auditoria.acao = AcaoAuditoria.ALTERACAO;
            auditoria.campoAlterado = alteracao.campo;
            auditoria.valorAnterior = alteracao.valorAnterior;
            auditoria.valorNovo = alteracao.valorNovo;
            auditoria.usuarioId = usuarioId;
            auditoria.usuarioNome = usuarioNome;
            auditoria.usuarioEmail = usuarioEmail;
            auditoria.ipOrigem = ipOrigem;
            auditoria.userAgent = userAgent;
            auditoria.dataHora = LocalDateTime.now();
            
            auditoria.persist();
        }
    }

    /**
     * Registra exclusão (desativação) de uma OS
     */
    @Transactional
    public void registrarExclusao(OS os, String usuarioNome, String usuarioEmail, Long usuarioId, String ipOrigem, String userAgent) {
        OSAuditoria auditoria = new OSAuditoria();
        auditoria.idOs = os.id;
        auditoria.numeroOs = os.idOs;
        auditoria.acao = AcaoAuditoria.EXCLUSAO;
        auditoria.usuarioId = usuarioId;
        auditoria.usuarioNome = usuarioNome;
        auditoria.usuarioEmail = usuarioEmail;
        auditoria.ipOrigem = ipOrigem;
        auditoria.userAgent = userAgent;
        auditoria.dataHora = LocalDateTime.now();
        
        // Salvar snapshot completo da OS antes da exclusão
        try {
            auditoria.snapshotOs = objectMapper.writeValueAsString(osToMap(os));
        } catch (Exception e) {
            auditoria.snapshotOs = "Erro ao serializar: " + e.getMessage();
        }
        
        auditoria.persist();
    }

    /**
     * Registra restauração de uma OS
     */
    @Transactional
    public void registrarRestauracao(OS os, String usuarioNome, String usuarioEmail, Long usuarioId, String ipOrigem, String userAgent) {
        OSAuditoria auditoria = new OSAuditoria();
        auditoria.idOs = os.id;
        auditoria.numeroOs = os.idOs;
        auditoria.acao = AcaoAuditoria.RESTAURACAO;
        auditoria.usuarioId = usuarioId;
        auditoria.usuarioNome = usuarioNome;
        auditoria.usuarioEmail = usuarioEmail;
        auditoria.ipOrigem = ipOrigem;
        auditoria.userAgent = userAgent;
        auditoria.dataHora = LocalDateTime.now();
        
        auditoria.persist();
    }

    /**
     * Registra evento de arquivo (upload, associação da pasta disponível ou exclusão lógica).
     */
    @Transactional
    public void registrarEventoArquivo(
        Long idOsInternal,
        Integer numeroOsNegocio,
        AcaoAuditoria acao,
        String campoAlterado,
        String valorAnteriorJson,
        String valorNovoJson,
        AuditoriaUsuarioContext ctx
    ) {
        if (idOsInternal == null || numeroOsNegocio == null) {
            return;
        }
        if (ctx == null) {
            ctx = new AuditoriaUsuarioContext("Sistema", null, null, "—", null);
        }
        OSAuditoria auditoria = new OSAuditoria();
        auditoria.idOs = idOsInternal;
        auditoria.numeroOs = numeroOsNegocio;
        auditoria.acao = acao;
        auditoria.campoAlterado = campoAlterado;
        auditoria.valorAnterior = valorAnteriorJson;
        auditoria.valorNovo = valorNovoJson;
        auditoria.usuarioId = ctx.userId;
        auditoria.usuarioNome = ctx.nome;
        auditoria.usuarioEmail = ctx.email;
        auditoria.ipOrigem = ctx.ip != null && ctx.ip.length() > 50 ? ctx.ip.substring(0, 50) : ctx.ip;
        String ua = ctx.userAgent;
        auditoria.userAgent = ua != null && ua.length() > 500 ? ua.substring(0, 500) : ua;
        auditoria.dataHora = LocalDateTime.now();
        auditoria.persist();
    }

    /**
     * Registra reabertura controlada de OS encerrada (justificativa obrigatória).
     */
    @Transactional
    public void registrarReabertura(
            OS os,
            String justificativa,
            boolean crsAnulado,
            String usuarioNome,
            String usuarioEmail,
            Long usuarioId,
            String ipOrigem,
            String userAgent) {
        if (os == null || os.id == null) {
            return;
        }
        OSAuditoria auditoria = new OSAuditoria();
        auditoria.idOs = os.id;
        auditoria.numeroOs = os.idOs;
        auditoria.acao = AcaoAuditoria.REABERTURA;
        auditoria.campoAlterado = "REABERTURA";
        auditoria.valorAnterior =
                crsAnulado ? "ENCERRADA_COM_CRS" : (os.dataFechamento != null ? "FECHADA" : "CRS_EMITIDO");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("justificativa", justificativa);
        payload.put("crsAnulado", crsAnulado);
        try {
            auditoria.valorNovo = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            auditoria.valorNovo = justificativa;
        }
        auditoria.usuarioId = usuarioId;
        auditoria.usuarioNome = usuarioNome;
        auditoria.usuarioEmail = usuarioEmail;
        auditoria.ipOrigem = ipOrigem;
        auditoria.userAgent = userAgent;
        auditoria.dataHora = LocalDateTime.now();
        auditoria.persist();
    }

    /**
     * Busca histórico de auditoria de uma OS específica
     */
    public List<OSAuditoriaDto> buscarHistoricoPorOs(Long idOs) {
        List<OSAuditoria> auditorias = OSAuditoria.find(
            "idOs = ?1 ORDER BY dataHora DESC", idOs
        ).list();
        
        return auditorias.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    /**
     * Busca histórico de auditoria por número da OS
     */
    public List<OSAuditoriaDto> buscarHistoricoPorNumeroOs(Integer numeroOs) {
        List<OSAuditoria> auditorias = OSAuditoria.find(
            "numeroOs = ?1 ORDER BY dataHora DESC", numeroOs
        ).list();
        
        return auditorias.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    /**
     * Busca auditoria com filtros
     */
    public List<OSAuditoriaDto> buscarComFiltros(
        Long idOs,
        Integer numeroOs,
        Long refOs,
        AcaoAuditoria acao,
        LocalDateTime dataInicio,
        LocalDateTime dataFim,
        String usuarioNome,
        int page,
        int size
    ) {
        StringBuilder query = new StringBuilder("1=1");
        Map<String, Object> params = new HashMap<>();

        if (idOs != null) {
            query.append(" AND idOs = :idOs");
            params.put("idOs", idOs);
        }

        if (numeroOs != null) {
            query.append(" AND numeroOs = :numeroOs");
            params.put("numeroOs", numeroOs);
        }

        if (refOs != null && idOs == null && numeroOs == null) {
            if (refOs >= Integer.MIN_VALUE && refOs <= Integer.MAX_VALUE) {
                query.append(" AND (idOs = :refOsId OR numeroOs = :refOsNumero)");
                params.put("refOsId", refOs);
                params.put("refOsNumero", refOs.intValue());
            } else {
                query.append(" AND idOs = :refOsId");
                params.put("refOsId", refOs);
            }
        }

        if (acao != null) {
            query.append(" AND acao = :acao");
            params.put("acao", acao);
        }

        if (dataInicio != null) {
            query.append(" AND dataHora >= :dataInicio");
            params.put("dataInicio", dataInicio);
        }

        if (dataFim != null) {
            query.append(" AND dataHora <= :dataFim");
            params.put("dataFim", dataFim);
        }

        if (usuarioNome != null && !usuarioNome.isEmpty()) {
            query.append(" AND LOWER(usuarioNome) LIKE :usuarioNome");
            params.put("usuarioNome", "%" + usuarioNome.toLowerCase() + "%");
        }

        List<OSAuditoria> auditorias = OSAuditoria
            .find(query.toString(), Sort.descending("dataHora"), params)
            .page(page, size)
            .list();

        return auditorias.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    /**
     * Conta total de registros com filtros
     */
    public long contarComFiltros(
        Long idOs,
        Integer numeroOs,
        Long refOs,
        AcaoAuditoria acao,
        LocalDateTime dataInicio,
        LocalDateTime dataFim,
        String usuarioNome
    ) {
        StringBuilder query = new StringBuilder("1=1");
        Map<String, Object> params = new HashMap<>();

        if (idOs != null) {
            query.append(" AND idOs = :idOs");
            params.put("idOs", idOs);
        }

        if (numeroOs != null) {
            query.append(" AND numeroOs = :numeroOs");
            params.put("numeroOs", numeroOs);
        }

        if (refOs != null && idOs == null && numeroOs == null) {
            if (refOs >= Integer.MIN_VALUE && refOs <= Integer.MAX_VALUE) {
                query.append(" AND (idOs = :refOsId OR numeroOs = :refOsNumero)");
                params.put("refOsId", refOs);
                params.put("refOsNumero", refOs.intValue());
            } else {
                query.append(" AND idOs = :refOsId");
                params.put("refOsId", refOs);
            }
        }

        if (acao != null) {
            query.append(" AND acao = :acao");
            params.put("acao", acao);
        }

        if (dataInicio != null) {
            query.append(" AND dataHora >= :dataInicio");
            params.put("dataInicio", dataInicio);
        }

        if (dataFim != null) {
            query.append(" AND dataHora <= :dataFim");
            params.put("dataFim", dataFim);
        }

        if (usuarioNome != null && !usuarioNome.isEmpty()) {
            query.append(" AND LOWER(usuarioNome) LIKE :usuarioNome");
            params.put("usuarioNome", "%" + usuarioNome.toLowerCase() + "%");
        }

        return OSAuditoria.count(query.toString(), params);
    }

    /**
     * Converte entidade para DTO
     */
    private OSAuditoriaDto toDto(OSAuditoria auditoria) {
        OSAuditoriaDto dto = new OSAuditoriaDto();
        dto.id = auditoria.id;
        dto.idOs = auditoria.idOs;
        dto.numeroOs = auditoria.numeroOs;
        dto.acao = auditoria.acao;
        dto.acaoDescricao = auditoria.acao.getDescricao();
        dto.campoAlterado = auditoria.campoAlterado;
        dto.campoAlteradoLabel = OSAuditoriaDto.getLabelCampo(auditoria.campoAlterado);
        dto.valorAnterior = auditoria.valorAnterior;
        dto.valorNovo = auditoria.valorNovo;
        dto.snapshotOs = auditoria.snapshotOs;
        dto.usuarioId = auditoria.usuarioId;
        dto.usuarioNome = auditoria.usuarioNome;
        dto.usuarioEmail = auditoria.usuarioEmail;
        dto.ipOrigem = auditoria.ipOrigem;
        dto.userAgent = auditoria.userAgent;
        dto.dataHora = auditoria.dataHora;
        return dto;
    }

    /**
     * Compara dois objetos OS e retorna lista de campos alterados
     */
    private List<CampoAlterado> compararOS(OS anterior, OS novo) {
        List<CampoAlterado> alteracoes = new ArrayList<>();
        
        Field[] fields = OS.class.getDeclaredFields();
        
        for (Field field : fields) {
            String fieldName = field.getName();
            
            // Ignorar campos na lista de ignorados
            if (CAMPOS_IGNORADOS.contains(fieldName)) {
                continue;
            }
            
            // Ignorar campos com prefixos do Hibernate/proxy
            if (deveIgnorarCampo(fieldName)) {
                continue;
            }
            
            try {
                field.setAccessible(true);
                Object valorAnterior = field.get(anterior);
                Object valorNovo = field.get(novo);
                
                if (!Objects.equals(valorAnterior, valorNovo)) {
                    CampoAlterado alteracao = new CampoAlterado();
                    alteracao.campo = fieldName;
                    alteracao.valorAnterior = valorAnterior != null ? valorAnterior.toString() : null;
                    alteracao.valorNovo = valorNovo != null ? valorNovo.toString() : null;
                    alteracoes.add(alteracao);
                }
            } catch (IllegalAccessException e) {
                // Ignorar campos inacessíveis
            }
        }
        
        return alteracoes;
    }
    
    /**
     * Verifica se um campo deve ser ignorado baseado no prefixo
     */
    private boolean deveIgnorarCampo(String fieldName) {
        if (fieldName == null) return true;
        
        for (String prefixo : PREFIXOS_IGNORADOS) {
            if (fieldName.startsWith(prefixo) || fieldName.contains(prefixo)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Converte OS para Map para serialização
     */
    private Map<String, Object> osToMap(OS os) {
        Map<String, Object> map = new LinkedHashMap<>();
        
        Field[] fields = OS.class.getDeclaredFields();
        for (Field field : fields) {
            try {
                field.setAccessible(true);
                Object value = field.get(os);
                if (value != null) {
                    map.put(field.getName(), value.toString());
                }
            } catch (IllegalAccessException e) {
                // Ignorar
            }
        }
        
        return map;
    }

    /**
     * Classe auxiliar para representar um campo alterado
     */
    private static class CampoAlterado {
        String campo;
        String valorAnterior;
        String valorNovo;
    }
}
