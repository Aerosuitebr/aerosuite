package com.aerosuite.service;

import org.jboss.logging.Logger;
import com.aerosuite.domain.*;
import com.aerosuite.dto.*;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.i18n.AuthI18nCodes;
import com.aerosuite.mapping.UsuarioExternoMapper;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.security.PasswordPolicyValidator;
import com.aerosuite.util.PasswordGenerator;
import com.aerosuite.util.PanacheMaps;
import com.aerosuite.util.ServerUrlUtil;
import com.aerosuite.util.FieldLengthValidator;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço para gerenciamento de usuários externos.
 */
@ApplicationScoped
public class UsuarioExternoService {

    private static final Logger LOG = Logger.getLogger(UsuarioExternoService.class);
    private static final java.util.regex.Pattern HAS_LETTER = java.util.regex.Pattern.compile(".*\\p{L}.*");
    private static final java.util.regex.Pattern PHONE = java.util.regex.Pattern.compile("^\\+?[0-9()\\s.\\-]{8,30}$");
    
    @Inject
    UsuarioExternoMapper mapper;
    
    @Inject
    EmailService emailService;
    
    @Inject
    ServerUrlUtil serverUrlUtil;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    TenantLoginService tenantLoginService;

    @Inject
    AccessAuditService accessAuditService;

    private static final SecureRandom secureRandom = new SecureRandom();
    
    // ========================================
    // CRUD de Usuário Externo
    // ========================================
    
    public UsuarioExternoDto getById(Integer id) {
        UsuarioExterno entity = UsuarioExterno.findById(id);
        if (entity == null || !belongsToCurrentTenant(entity)) {
            return null;
        }
        return mapper.toDto(entity);
    }

    private boolean belongsToCurrentTenant(UsuarioExterno entity) {
        return entity != null
                && entity.orgTenantId != null
                && entity.orgTenantId == tenantDataAccess.currentTenantId();
    }
    
    public UsuarioExternoDto getByIdComDetalhes(Integer id) {
        UsuarioExterno entity = UsuarioExterno.findById(id);
        if (entity == null || !belongsToCurrentTenant(entity)) {
            return null;
        }
        
        // Buscar funcionalidades
        List<FuncionalidadeExterna> funcionalidades = 
            UsuarioExternoFuncionalidade.findFuncionalidadesByUsuarioExterno(id);
        
        // Contar OS e documentos
        long totalOS = UsuarioExternoOS.count("usuarioExterno.id = ?1", id);
        long totalDocs = UsuarioExternoDocumento.count("usuarioExterno.id = ?1", id);
        
        // Buscar nome do criador
        String criadoPorNome = null;
        if (entity.criadoPor != null) {
            Usuario criador = Usuario.findById(entity.criadoPor);
            if (criador != null) {
                criadoPorNome = criador.nome;
            }
        }
        
        return new UsuarioExternoDto(
            entity.id,
            entity.nome,
            entity.email,
            null,
            entity.empresa,
            entity.telefone,
            entity.cargo,
            entity.observacoes,
            entity.fotoPerfil,
            entity.ativo,
            entity.precisaTrocarSenha,
            entity.dataCadastro,
            entity.ultimoAcesso,
            entity.criadoPor,
            criadoPorNome,
            mapper.toFuncionalidadeDtoList(funcionalidades),
            null,
            (int) totalOS,
            (int) totalDocs,
            entity.conviteEnviadoEm
        );
    }
    
    public record SearchResult(List<UsuarioExternoDto> items, long total) {}
    
    public SearchResult search(Integer page, Integer size, String q, Boolean ativo) {
        int p = page != null && page >= 0 ? page : 0;
        int s = size != null && size > 0 ? size : 10;
        
        StringBuilder where = new StringBuilder();
        Map<String, Object> params = new HashMap<>();
        
        // Filtrar apenas ativos por padrão
        if (ativo != null) {
            where.append("ativo = :ativo");
            params.put("ativo", ativo);
        }
        
        if (q != null && !q.isBlank()) {
            if (where.length() > 0) where.append(" and ");
            where.append("(LOWER(nome) like :q or LOWER(email) like :q or LOWER(empresa) like :q)");
            params.put("q", "%" + q.toLowerCase() + "%");
        }

        if (where.length() > 0) {
            where.append(" and ");
        }
        where.append("orgTenantId = :filterTid");
        params.put("filterTid", tenantDataAccess.currentTenantId());

        String query = where.toString();
        
        long total = UsuarioExterno.count(query, params);
        List<UsuarioExterno> entities = UsuarioExterno.find(query + " order by nome", params)
            .page(p, s)
            .list();
        
        List<UsuarioExternoDto> items = toListDtosWithCounts(entities);
        
        return new SearchResult(items, total);
    }

    private List<UsuarioExternoDto> toListDtosWithCounts(List<UsuarioExterno> entities) {
        if (entities == null || entities.isEmpty()) {
            return List.of();
        }
        List<Integer> ids = entities.stream().map(e -> e.id).filter(Objects::nonNull).toList();
        Map<Integer, Long> osCounts = countOsByUsuarioExternoIds(ids);
        Map<Integer, Long> docCounts = countDocsByUsuarioExternoIds(ids);
        return entities.stream()
            .map(e -> mapper.toListDto(
                e,
                osCounts.getOrDefault(e.id, 0L).intValue(),
                docCounts.getOrDefault(e.id, 0L).intValue()))
            .collect(Collectors.toList());
    }

    private Map<Integer, Long> countOsByUsuarioExternoIds(List<Integer> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        @SuppressWarnings("unchecked")
        List<Object[]> rows = UsuarioExternoOS.getEntityManager()
            .createQuery(
                "SELECT u.usuarioExterno.id, COUNT(u) FROM UsuarioExternoOS u "
                    + "WHERE u.usuarioExterno.id IN :ids GROUP BY u.usuarioExterno.id",
                Object[].class)
            .setParameter("ids", ids)
            .getResultList();
        return toCountMap(rows);
    }

    private Map<Integer, Long> countDocsByUsuarioExternoIds(List<Integer> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        @SuppressWarnings("unchecked")
        List<Object[]> rows = UsuarioExternoDocumento.getEntityManager()
            .createQuery(
                "SELECT u.usuarioExterno.id, COUNT(u) FROM UsuarioExternoDocumento u "
                    + "WHERE u.usuarioExterno.id IN :ids GROUP BY u.usuarioExterno.id",
                Object[].class)
            .setParameter("ids", ids)
            .getResultList();
        return toCountMap(rows);
    }

    private static Map<Integer, Long> toCountMap(List<Object[]> rows) {
        Map<Integer, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null) {
                continue;
            }
            map.put((Integer) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }
    
    @Transactional
    public UsuarioExternoDto create(UsuarioExternoDto dto, Integer criadoPor) {
        return create(dto, criadoPor, true);
    }

    @Transactional
    public UsuarioExternoDto create(UsuarioExternoDto dto, Integer criadoPor, boolean enviarEmailPrimeiroAcesso) {
        if (dto.email() == null || dto.email().trim().isEmpty()) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.USER_EMAIL_REQUIRED));
        }
        if (dto.nome() == null || dto.nome().trim().isEmpty()) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.USER_NAME_REQUIRED));
        }

        String nome = requireMeaningful(dto.nome(), 150, "nome");
        String empresa = optionalMeaningful(dto.empresa(), 150, "empresa");
        String cargo = optionalMeaningful(dto.cargo(), 100, "cargo");
        String telefone = validatePhone(dto.telefone());
        String observacoes = FieldLengthValidator.trimRequireMax(dto.observacoes(), 2000, "observacoes");

        long tid = tenantDataAccess.currentTenantId();
        String emailNorm = dto.email().trim().toLowerCase();
        UsuarioExterno existing = UsuarioExterno.find(
                "email = ?1 and orgTenantId = ?2", emailNorm, tid).firstResult();
        if (existing != null) {
            throw new IllegalArgumentException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_EMAIL_ALREADY_REGISTERED, "email", dto.email()));
        }

        UsuarioExterno entity = new UsuarioExterno();
        entity.orgTenantId = tid;
        entity.nome = nome;
        entity.email = emailNorm;
        entity.empresa = empresa;
        entity.telefone = telefone;
        entity.cargo = cargo;
        entity.observacoes = observacoes;
        entity.ativo = true;
        entity.precisaTrocarSenha = true;
        entity.criadoPor = criadoPor;
        entity.dataCadastro = LocalDate.now();

        String senhaTemporaria = PasswordGenerator.generateSecurePassword();
        entity.senha = senhaTemporaria;

        entity.persist();
        entity.flush();

        concederFuncionalidadesPadrao(entity.id, criadoPor);
        if (enviarEmailPrimeiroAcesso) {
            enviarEmailPrimeiroAcesso(entity, senhaTemporaria);
        }

        return mapper.toDto(entity);
    }

    public UsuarioExterno findByEmailInTenant(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        long tid = tenantDataAccess.currentTenantId();
        return UsuarioExterno.find(
                "email = ?1 and orgTenantId = ?2",
                email.trim().toLowerCase(),
                tid).firstResult();
    }

    @Transactional
    public UsuarioExternoDto createFromProposta(
            String nome,
            String email,
            String empresa,
            String telefone,
            Integer clientePropostaId,
            Integer criadoPor) {
        return createFromProposta(nome, email, empresa, telefone, clientePropostaId, criadoPor, true);
    }

    @Transactional
    public UsuarioExternoDto createFromProposta(
            String nome,
            String email,
            String empresa,
            String telefone,
            Integer clientePropostaId,
            Integer criadoPor,
            boolean enviarEmailPrimeiroAcesso) {
        UsuarioExternoDto dto = new UsuarioExternoDto(
                nome,
                email,
                empresa,
                telefone,
                null);
        UsuarioExternoDto created = create(dto, criadoPor, enviarEmailPrimeiroAcesso);
        if (clientePropostaId != null && created.id() != null) {
            UsuarioExterno entity = UsuarioExterno.findById(created.id());
            if (entity != null) {
                entity.clientePropostaId = clientePropostaId;
                entity.persist();
            }
        }
        return created;
    }

    private void enviarEmailPrimeiroAcesso(UsuarioExterno entity, String senhaTemporaria) {
        try {
            String token = createPasswordSetupTokenExterno(entity.email);
            String frontendUrl = serverUrlUtil.getFrontendUrl();
            String setupUrl = frontendUrl + "/externo/setup-password?token=" + token;

            boolean sent = emailService.sendPasswordSetupEmailExterno(
                    entity.email,
                    entity.nome,
                    senhaTemporaria,
                    setupUrl,
                    com.aerosuite.i18n.UserLocaleResolver.resolve(entity));
            if (sent) {
                entity.conviteEnviadoEm = LocalDateTime.now();
                entity.persist();
            }
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao enviar email de primeiro acesso externo: %s", e.getMessage());
        }
    }

    @Transactional
    public UsuarioExternoDto update(Integer id, UsuarioExternoDto dto) {
        UsuarioExterno entity = UsuarioExterno.findById(id);
        if (!belongsToCurrentTenant(entity)) {
            throw new IllegalArgumentException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_EXTERNO_NOT_FOUND, "id", String.valueOf(id)));
        }
        
        if (dto.nome() != null && !dto.nome().trim().isEmpty()) {
            entity.nome = requireMeaningful(dto.nome(), 150, "nome");
        }
        if (dto.empresa() != null) {
            entity.empresa = optionalMeaningful(dto.empresa(), 150, "empresa");
        }
        if (dto.telefone() != null) {
            entity.telefone = validatePhone(dto.telefone());
        }
        if (dto.cargo() != null) {
            entity.cargo = optionalMeaningful(dto.cargo(), 100, "cargo");
        }
        if (dto.observacoes() != null) {
            entity.observacoes = FieldLengthValidator.trimRequireMax(dto.observacoes(), 2000, "observacoes");
        }
        if (dto.fotoPerfil() != null) {
            entity.fotoPerfil = dto.fotoPerfil();
        }
        
        entity.persist();
        
        return mapper.toDto(entity);
    }

    private static String requireMeaningful(String value, int max, String field) {
        String normalized = FieldLengthValidator.trimRequireMax(value, max, field);
        if (normalized == null || !HAS_LETTER.matcher(normalized).matches()) {
            throw new jakarta.ws.rs.BadRequestException("O campo " + field + " deve conter texto legível.");
        }
        return normalized;
    }

    private static String optionalMeaningful(String value, int max, String field) {
        String normalized = FieldLengthValidator.trimRequireMax(value, max, field);
        if (normalized != null && !HAS_LETTER.matcher(normalized).matches()) {
            throw new jakarta.ws.rs.BadRequestException("O campo " + field + " deve conter texto legível.");
        }
        return normalized;
    }

    private static String validatePhone(String value) {
        String normalized = FieldLengthValidator.trimRequireMax(value, 30, "telefone");
        if (normalized != null && !PHONE.matcher(normalized).matches()) {
            throw new jakarta.ws.rs.BadRequestException("Informe um telefone válido.");
        }
        return normalized;
    }
    
    @Transactional
    public void delete(Integer id) {
        UsuarioExterno entity = UsuarioExterno.findById(id);
        if (!belongsToCurrentTenant(entity)) {
            throw new IllegalArgumentException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_EXTERNO_NOT_FOUND, "id", String.valueOf(id)));
        }
        
        // Soft delete
        entity.ativo = false;
        entity.persist();
    }
    
    @Transactional
    public void activate(Integer id) {
        UsuarioExterno entity = UsuarioExterno.findById(id);
        if (!belongsToCurrentTenant(entity)) {
            throw new IllegalArgumentException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_EXTERNO_NOT_FOUND, "id", String.valueOf(id)));
        }
        
        entity.ativo = true;
        entity.persist();
    }
    
    // ========================================
    // Gerenciamento de Funcionalidades
    // ========================================
    
    public List<FuncionalidadeExternaDto> getAllFuncionalidades() {
        List<FuncionalidadeExterna> funcionalidades = FuncionalidadeExterna.findAllAtivas();
        return mapper.toFuncionalidadeDtoList(funcionalidades);
    }
    
    public List<FuncionalidadeExternaDto> getFuncionalidadesUsuario(Integer usuarioExternoId) {
        List<FuncionalidadeExterna> funcionalidades = 
            UsuarioExternoFuncionalidade.findFuncionalidadesByUsuarioExterno(usuarioExternoId);
        return mapper.toFuncionalidadeDtoList(funcionalidades);
    }
    
    @Transactional
    public void concederFuncionalidade(Integer usuarioExternoId, Integer funcionalidadeId, Integer concedidoPor) {
        UsuarioExterno usuario = UsuarioExterno.findById(usuarioExternoId);
        if (usuario == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.USER_EXTERNO_NOT_FOUND));
        }
        
        FuncionalidadeExterna funcionalidade = FuncionalidadeExterna.findById(funcionalidadeId);
        if (funcionalidade == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.USER_FEATURE_NOT_FOUND));
        }
        
        // Verificar se já existe
        if (UsuarioExternoFuncionalidade.existsAssociacao(usuarioExternoId, funcionalidadeId)) {
            return; // Já existe, não fazer nada
        }
        
        UsuarioExternoFuncionalidade associacao = new UsuarioExternoFuncionalidade();
        associacao.usuarioExterno = usuario;
        associacao.funcionalidadeExterna = funcionalidade;
        associacao.concedidoPor = concedidoPor;
        associacao.dataConcessao = LocalDateTime.now();
        associacao.persist();
    }
    
    @Transactional
    public void revogarFuncionalidade(Integer usuarioExternoId, Integer funcionalidadeId) {
        UsuarioExternoFuncionalidade.delete(
            "usuarioExterno.id = ?1 and funcionalidadeExterna.id = ?2", 
            usuarioExternoId, funcionalidadeId
        );
    }
    
    @Transactional
    public void atualizarFuncionalidades(Integer usuarioExternoId, List<Integer> funcionalidadeIds, Integer concedidoPor) {
        // Remover todas as associações existentes
        UsuarioExternoFuncionalidade.deleteByUsuarioExterno(usuarioExternoId);
        
        // Adicionar novas associações
        for (Integer funcId : funcionalidadeIds) {
            concederFuncionalidade(usuarioExternoId, funcId, concedidoPor);
        }
    }
    
    private void concederFuncionalidadesPadrao(Integer usuarioExternoId, Integer concedidoPor) {
        // Conceder Home e Perfil por padrão
        FuncionalidadeExterna home = FuncionalidadeExterna.findByCodigo("home-externa");
        if (home != null) {
            concederFuncionalidade(usuarioExternoId, home.id, concedidoPor);
        }
        
        FuncionalidadeExterna perfil = FuncionalidadeExterna.findByCodigo("perfil-externo");
        if (perfil != null) {
            concederFuncionalidade(usuarioExternoId, perfil.id, concedidoPor);
        }

        FuncionalidadeExterna propostas = FuncionalidadeExterna.findByCodigo("propostas-externa");
        if (propostas != null) {
            concederFuncionalidade(usuarioExternoId, propostas.id, concedidoPor);
        }
    }
    
    // ========================================
    // Gerenciamento de Ordens de Serviço
    // ========================================
    
    public List<OSExternaResumoDto> getOSsUsuario(Integer usuarioExternoId) {
        List<OS> oss = UsuarioExternoOS.findOSsByUsuarioExterno(usuarioExternoId);
        java.util.Set<Integer> fabricanteIds = oss.stream()
            .map(os -> os.idFabricante)
            .filter(java.util.Objects::nonNull)
            .collect(Collectors.toSet());
        Map<Integer, Fabricante> fabricantes = fabricanteIds.isEmpty()
            ? Map.of()
            : PanacheMaps.<Fabricante, Integer>byId(Fabricante.list("id in ?1", fabricanteIds), f -> f.id);
        return oss.stream().map(os -> {
            String fabricanteNome = null;
            if (os.idFabricante != null) {
                Fabricante fabricante = fabricantes.get(os.idFabricante);
                if (fabricante != null) {
                    fabricanteNome = fabricante.nome;
                }
            }
            return mapper.toOSResumoDto(os, fabricanteNome);
        }).collect(Collectors.toList());
    }
    
    @Transactional
    public OSExternaDetalhadaDto getOSDetalhada(Integer usuarioExternoId, Long osId) {
        // Verificar permissão
        if (!UsuarioExternoOS.podeVisualizarOS(usuarioExternoId, osId)) {
            throw new SecurityException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.EXTERNO_OS_ACCESS_DENIED));
        }
        
        OS os = OS.findById(osId);
        if (os == null) {
            throw new IllegalArgumentException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.EXTERNO_OS_NOT_FOUND));
        }
        
        // Buscar IDs dos arquivos desta OS
        List<Long> osFileIds = OSFile.<OSFile>list("osId = ?1 and isActive = true", osId)
            .stream()
            .map(f -> f.id)
            .collect(Collectors.toList());
        
        // Buscar documentos disponíveis para o usuário DESTA OS específica
        List<UsuarioExternoDocumento> docs;
        if (osFileIds.isEmpty()) {
            docs = new ArrayList<>();
        } else {
            docs = UsuarioExternoDocumento.list(
                "usuarioExterno.id = ?1 and osFileId in ?2 and (dataExpiracao is null or dataExpiracao >= ?3)",
                usuarioExternoId, osFileIds, LocalDate.now()
            );
        }
        
        List<DocumentoExternoDto> documentosDto = mapper.toDocumentoDtoList(docs);
        
        // Registrar acesso no log
        UsuarioExterno usuario = UsuarioExterno.findById(usuarioExternoId);
        if (usuario != null) {
            LogAcessoExterno.registrarAcesso(
                usuario, 
                LogAcessoExterno.ACAO_VISUALIZACAO_OS,
                osId, "OS", null, null, null
            );
        }
        
        Long propostaId = null;
        String propostaNumero = null;
        try {
            long tenantKey = Long.parseLong(os.tenantId);
            PropostaComercial propostaOrigem = PropostaComercial.findByOsId(tenantKey, os.id);
            if (propostaOrigem != null) {
                propostaId = propostaOrigem.id;
                propostaNumero = propostaOrigem.numeroProposta;
            }
        } catch (NumberFormatException ignored) {
            // tenantId inválido — omitir vínculo proposta
        }

        return mapper.toOSDetalhadaDto(os, documentosDto, null, null, propostaId, propostaNumero);
    }
    
    @Transactional
    public void concederAcessoOS(Integer usuarioExternoId, Long osId, Integer concedidoPor, String observacoes) {
        UsuarioExterno usuario = UsuarioExterno.findById(usuarioExternoId);
        if (usuario == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.USER_EXTERNO_NOT_FOUND));
        }
        
        OS os = tenantDataAccess.requireOS(osId);

        // Verificar se já existe
        UsuarioExternoOS existing = UsuarioExternoOS.find(
            "usuarioExterno.id = ?1 and os.id = ?2", usuarioExternoId, osId
        ).firstResult();
        
        if (existing != null) {
            existing.podeVisualizar = true;
            existing.observacoes = observacoes;
            existing.persist();
            return;
        }
        
        UsuarioExternoOS associacao = new UsuarioExternoOS();
        associacao.usuarioExterno = usuario;
        associacao.os = os;
        associacao.podeVisualizar = true;
        associacao.concedidoPor = concedidoPor;
        associacao.observacoes = observacoes;
        associacao.dataConcessao = LocalDateTime.now();
        associacao.persist();
        
        // Conceder funcionalidade de OS se ainda não tiver
        FuncionalidadeExterna osExterna = FuncionalidadeExterna.findByCodigo("os-externa");
        if (osExterna != null && !UsuarioExternoFuncionalidade.existsAssociacao(usuarioExternoId, osExterna.id)) {
            concederFuncionalidade(usuarioExternoId, osExterna.id, concedidoPor);
        }
    }
    
    @Transactional
    public void revogarAcessoOS(Integer usuarioExternoId, Long osId) {
        UsuarioExternoOS associacao = UsuarioExternoOS.find(
            "usuarioExterno.id = ?1 and os.id = ?2", usuarioExternoId, osId
        ).firstResult();
        
        if (associacao != null) {
            associacao.podeVisualizar = false;
            associacao.persist();
        }
    }
    
    /**
     * Revoga acesso à OS e todos os documentos associados a ela.
     */
    @Transactional
    public void revogarAcessoOSCompleto(Integer usuarioExternoId, Long osId) {
        // Revogar acesso à OS
        UsuarioExternoOS.delete("usuarioExterno.id = ?1 and os.id = ?2", usuarioExternoId, osId);
        
        // Buscar IDs dos arquivos desta OS
        List<Long> osFileIds = OSFile.<OSFile>list("osId = ?1", osId)
            .stream()
            .map(f -> f.id)
            .collect(Collectors.toList());
        
        // Remover todos os documentos deste usuário que pertencem a esta OS
        if (!osFileIds.isEmpty()) {
            UsuarioExternoDocumento.delete(
                "usuarioExterno.id = ?1 and osFileId in ?2", 
                usuarioExternoId, osFileIds
            );
        }
    }
    
    // ========================================
    // Gerenciamento de Documentos
    // ========================================
    
    public List<DocumentoExternoDto> getDocumentosUsuario(Integer usuarioExternoId) {
        UsuarioExterno usuario = UsuarioExterno.findById(usuarioExternoId);
        if (!belongsToCurrentTenant(usuario)) {
            throw new jakarta.ws.rs.NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_EXTERNO_NOT_FOUND));
        }
        List<UsuarioExternoDocumento> docs = UsuarioExternoDocumento.findByUsuarioExterno(usuarioExternoId);
        return mapper.toDocumentoDtoList(docs);
    }
    
    @Transactional
    public void concederAcessoDocumento(Integer usuarioExternoId, Long osFileId, Long tpFileId,
            String nomeArquivo, String descricao, Boolean podeDownload, 
            LocalDate dataExpiracao, Integer concedidoPor) {
        
        UsuarioExterno usuario = UsuarioExterno.findById(usuarioExternoId);
        if (!belongsToCurrentTenant(usuario)) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.USER_EXTERNO_NOT_FOUND));
        }

        if (osFileId != null) {
            tenantDataAccess.requireActiveOSFile(osFileId);
        }
        
        // Verificar se já existe permissão para este documento
        UsuarioExternoDocumento existente = null;
        if (osFileId != null) {
            existente = UsuarioExternoDocumento.find(
                "usuarioExterno.id = ?1 and osFileId = ?2", usuarioExternoId, osFileId
            ).firstResult();
        } else if (tpFileId != null) {
            existente = UsuarioExternoDocumento.find(
                "usuarioExterno.id = ?1 and tpFileId = ?2", usuarioExternoId, tpFileId
            ).firstResult();
        }
        
        // Se já existe, apenas atualizar
        if (existente != null) {
            existente.descricao = descricao;
            existente.podeDownload = podeDownload != null ? podeDownload : true;
            existente.dataExpiracao = dataExpiracao;
            existente.persist();
            return;
        }
        
        // Criar novo registro
        UsuarioExternoDocumento doc = new UsuarioExternoDocumento();
        doc.usuarioExterno = usuario;
        doc.osFileId = osFileId;
        doc.tpFileId = tpFileId;
        doc.nomeArquivo = nomeArquivo;
        doc.descricao = descricao;
        doc.podeDownload = podeDownload != null ? podeDownload : true;
        doc.dataExpiracao = dataExpiracao;
        doc.concedidoPor = concedidoPor;
        doc.dataConcessao = LocalDateTime.now();
        doc.visualizacoes = 0;
        doc.persist();
        
        // Conceder funcionalidade de documentos se ainda não tiver
        FuncionalidadeExterna docsExterna = FuncionalidadeExterna.findByCodigo("documentos-externos");
        if (docsExterna != null && !UsuarioExternoFuncionalidade.existsAssociacao(usuarioExternoId, docsExterna.id)) {
            concederFuncionalidade(usuarioExternoId, docsExterna.id, concedidoPor);
        }
    }
    
    @Transactional
    public void revogarAcessoDocumento(Integer documentoId) {
        UsuarioExternoDocumento doc = UsuarioExternoDocumento.findById(documentoId);
        if (doc != null) {
            doc.delete();
        }
    }
    
    // ========================================
    // Autenticação
    // ========================================
    
    public List<com.aerosuite.dto.TenantLoginOptionDto> listLoginTenantsForEmail(String email) {
        return tenantLoginService.listTenantsForExternalEmail(email);
    }

    @Transactional
    public LoginExternoResponse login(String email, String senha, String tenantCodigo, String ip, String userAgent) {
        TenantLoginService.ResolvedLogin<UsuarioExterno> resolved =
                tenantLoginService.resolveExternalLogin(email, tenantCodigo);
        UsuarioExterno usuario = resolved.user();

        if (!usuario.senha.equals(senha)) {
            throw new AuthLoginException("INVALID_CREDENTIALS", AuthI18nCodes.encodedMessage("INVALID_CREDENTIALS"));
        }
        
        // Atualizar último acesso
        usuario.ultimoAcesso = LocalDateTime.now();
        usuario.persist();
        
        // Registrar login no log
        LogAcessoExterno.registrarAcesso(usuario, LogAcessoExterno.ACAO_LOGIN, 
            null, null, null, null, null);
        accessAuditService.loginSuccess(
                usuario.orgTenantId,
                usuario.id,
                usuario.email,
                ip,
                userAgent,
                "/api/auth-externo/login");
        
        // Gerar token
        String token = generateToken(usuario);
        
        // Buscar funcionalidades
        List<FuncionalidadeExterna> funcionalidades = 
            UsuarioExternoFuncionalidade.findFuncionalidadesByUsuarioExterno(usuario.id);
        
        UsuarioExternoDto userDto = mapper.toDto(usuario);
        List<FuncionalidadeExternaDto> funcionalidadesDto = mapper.toFuncionalidadeDtoList(funcionalidades);
        
        return new LoginExternoResponse(token, userDto, funcionalidadesDto);
    }
    
    private String generateToken(UsuarioExterno usuario) {
        long tid = usuario.orgTenantId != null ? usuario.orgTenantId : 1L;
        String tokenData = "EXT:" + usuario.id + ":" + usuario.email + ":" + tid + ":"
                + System.currentTimeMillis();
        return Base64.getEncoder().encodeToString(tokenData.getBytes());
    }
    
    /**
     * Gera token de reset apenas se existir usuário externo ativo com o e-mail.
     */
    @Transactional
    public java.util.Optional<String> createPasswordResetTokenIfUserExists(String email) {
        String normalized = email != null ? email.trim().toLowerCase() : "";
        if (normalized.isEmpty()) {
            return java.util.Optional.empty();
        }
        UsuarioExterno usuario = UsuarioExterno.findByEmailAndAtivo(normalized);
        if (usuario == null) {
            return java.util.Optional.empty();
        }
        return java.util.Optional.of(createPasswordSetupTokenExterno(normalized));
    }

    @Transactional
    public String createPasswordSetupTokenExterno(String email) {
        // Invalidar tokens anteriores
        PasswordResetTokenExterno.invalidateTokensByEmail(email);
        
        // Gerar novo token
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        
        // Criar registro
        PasswordResetTokenExterno resetToken = new PasswordResetTokenExterno();
        resetToken.token = token;
        resetToken.email = email;
        resetToken.expiresAt = LocalDateTime.now().plusDays(7);
        resetToken.used = false;
        resetToken.persist();
        
        return token;
    }
    
    @Transactional
    public void resetPassword(String token, String novaSenha) {
        PasswordResetTokenExterno resetToken = PasswordResetTokenExterno.findByToken(token);
        
        if (resetToken == null || !resetToken.isValid()) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_TOKEN_INVALID));
        }
        
        PasswordPolicyValidator.requireValidRuntime(novaSenha);
        
        UsuarioExterno usuario = UsuarioExterno.findByEmail(resetToken.email);
        if (usuario == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_USER_NOT_FOUND));
        }
        
        usuario.senha = novaSenha;
        usuario.precisaTrocarSenha = false;
        usuario.persist();
        
        resetToken.used = true;
        resetToken.persist();
        
        // Registrar no log
        LogAcessoExterno.registrarAcesso(usuario, LogAcessoExterno.ACAO_TROCA_SENHA,
            null, null, null, null, null);
    }
    
    @Transactional
    public void changePasswordForNewUser(String email, String senhaTemporaria, String novaSenha) {
        UsuarioExterno usuario = UsuarioExterno.findByEmail(email.trim().toLowerCase());
        
        if (usuario == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_USER_NOT_FOUND));
        }
        
        if (usuario.precisaTrocarSenha == null || !usuario.precisaTrocarSenha) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_NO_PASSWORD_CHANGE_REQUIRED));
        }
        
        if (!usuario.senha.equals(senhaTemporaria)) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_TEMP_PASSWORD_WRONG));
        }
        
        PasswordPolicyValidator.requireValidRuntime(novaSenha);
        
        usuario.senha = novaSenha;
        usuario.precisaTrocarSenha = false;
        usuario.persist();
        
        // Registrar no log
        LogAcessoExterno.registrarAcesso(usuario, LogAcessoExterno.ACAO_TROCA_SENHA,
            null, null, null, null, null);
    }
}
