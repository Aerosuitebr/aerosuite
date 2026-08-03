package com.aerosuite.service;

import org.jboss.logging.Logger;

import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TicketEmailModo;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.MessageResponse;
import com.aerosuite.dto.UsuarioDto;
import com.aerosuite.dto.UsuarioNotificacaoPreferenciasDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.i18n.UserLocaleResolver;
import com.aerosuite.mapping.UsuarioMapper;
import com.aerosuite.model.Perfil;
import com.aerosuite.repository.UsuarioRepository;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.PasswordCredentials;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.util.PasswordGenerator;
import com.aerosuite.util.ServerUrlUtil;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import java.util.Objects;

import java.util.*;

@ApplicationScoped
public class UsuarioService {
    private static final Logger LOG = Logger.getLogger(UsuarioService.class);

    @Inject UsuarioMapper mapper;
    @Inject UsuarioRepository repository;
    @Inject PerfilService perfilService;
    @Inject AuthService authService;
    @Inject EmailService emailService;
    @Inject ServerUrlUtil serverUrlUtil;
    @Inject TenantDataAccess tenantDataAccess;
    @Inject InternalUserContext internalUserContext;

    public UsuarioDto getById(Integer id) {
        Usuario e = Usuario.find(
                "id = ?1 and ativo = ?2 and orgTenantId = ?3",
                id,
                true,
                tenantDataAccess.currentTenantId()).firstResult();
        return e != null ? mapper.toDto(e) : null;
    }

    public record SearchResult(List<UsuarioDto> items, long total) {} 

    public SearchResult search(Integer page, Integer size, String sort, String q, Boolean ativo) {
        int p = page != null && page >= 0 ? page : 0;
        int s = size != null && size > 0 ? size : 10;

        Sort sortObj = Sort.by("id").ascending();
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            boolean desc = parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc");
            sortObj = desc ? Sort.by(field).descending() : Sort.by(field).ascending();
        }

        StringJoiner where = new StringJoiner(" and ");
        Map<String,Object> params = new HashMap<>();

        // Filtrar apenas ativos por padrão (se ativo não for especificado ou for true)
        if (ativo == null || ativo) {
            where.add("ativo = :ativo");
            params.put("ativo", true);
        }

        if (q != null && !q.isBlank()) { where.add("LOWER(nome) like :q or LOWER(email) like :q"); params.put("q", "%"+q.toLowerCase()+"%"); }

        where.add("orgTenantId = :filterTid");
        params.put("filterTid", tenantDataAccess.currentTenantId());

        PanacheQuery<Usuario> query = where.length() > 0
            ? repository.findWithFilters(where.toString(), sortObj, params)
            : repository.findAll(sortObj);

        long total = query.count();
        List<UsuarioDto> items = query.page(Page.of(p, s)).list().stream().map(mapper::toDto).toList();
        return new SearchResult(items, total);
    }

    @Transactional
    public UsuarioDto create(UsuarioDto dto) {
        // Validar campos obrigatórios
        if (dto.email() == null || dto.email().trim().isEmpty()) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.USER_EMAIL_REQUIRED));
        }
        if (dto.nome() == null || dto.nome().trim().isEmpty()) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.USER_NAME_REQUIRED));
        }
        
        // Verificar se email já existe
        String emailNorm = dto.email().trim().toLowerCase();
        Usuario existing = repository.findByEmailAndOrgTenantId(
                emailNorm, tenantDataAccess.currentTenantId());
        if (existing != null) {
            throw new IllegalArgumentException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_EMAIL_ALREADY_REGISTERED, "email", dto.email()));
        }
        
        Usuario e = new Usuario();
        
        // Mapear campos manualmente para garantir que tudo seja preenchido
        e.email = dto.email().trim().toLowerCase();
        e.nome = dto.nome().trim();
        
        // SEMPRE gerar senha aleatória segura para novos usuários
        // (não aceitamos senha do DTO por segurança)
        String senhaTemporaria = PasswordGenerator.generateSecurePassword();
        e.senha = PasswordCredentials.hash(senhaTemporaria);
        
        // Garantir que dataCadastro seja definida se não fornecida
        if (dto.dataCadastro() != null) {
            e.dataCadastro = dto.dataCadastro();
        } else {
            e.dataCadastro = java.time.LocalDate.now();
        }
        
        // Garantir que ativo seja true por padrão
        e.ativo = true;
        
        // Marcar que usuário precisa trocar senha na primeira vez
        e.precisaTrocarSenha = true;

        e.orgTenantId = tenantDataAccess.currentTenantId();
        
        // Definir último acesso no momento da criação
        e.ultimoAcesso = java.time.LocalDateTime.now();
        
        // Foto de perfil se fornecida
        if (dto.fotoPerfil() != null) {
            e.fotoPerfil = dto.fotoPerfil();
        }
        
        // Associar perfil se fornecido
        if (dto.perfilId() != null) {
            Perfil perfil = perfilService.buscarPorId(dto.perfilId().longValue());
            if (perfil == null) {
                throw new IllegalArgumentException(
                        ApiI18nMessages.encode(
                                ApiI18nMessages.USER_PROFILE_NOT_FOUND, "id", String.valueOf(dto.perfilId())));
            }
            e.perfil = perfil;
        }
        
        // Persistir usuário via repository
        repository.persist(e);
        repository.flush(); // Forçar flush para garantir que o ID seja gerado antes de continuar
        
        // Log para debug
        
        // Criar token de redefinição e enviar email
        // SEMPRE envia email quando cria novo usuário (senha sempre é gerada automaticamente)
        try {
            
            // Criar token de setup
            String token = authService.createPasswordSetupToken(e.email, e.orgTenantId);
            
            // Obter URL do frontend usando ServerUrlUtil que detecta automaticamente o IP do servidor
            String frontendUrl = serverUrlUtil.getFrontendUrl();
            String setupUrl = frontendUrl + "/setup-password?token=" + token;
            
            // Verificar se EmailService está injetado
            if (emailService == null) {
                LOG.warnf("ERRO CRÍTICO: EmailService não está injetado!");
                throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.USER_EMAIL_SERVICE_UNAVAILABLE));
            }
            
            // Enviar email
            
            boolean emailEnviado = emailService.sendPasswordSetupEmail(
                    e.email, e.nome, senhaTemporaria, setupUrl, com.aerosuite.i18n.UserLocaleResolver.resolve(e));
            
            if (emailEnviado) {
            } else {
            }
            
        } catch (RuntimeException ex) {
            LOG.warnf(ex, "Falha ao enviar e-mail de setup de senha para %s", e.email);
        } catch (Exception ex) {
            LOG.warnf(ex, "Falha ao enviar e-mail de setup de senha para %s", e.email);
        }
        
        // Garantir que o ID foi gerado antes de retornar
        if (e.id == null) {
            // Forçar flush novamente se necessário
            repository.flush();
        }
        
        
        // Retornar DTO sem a senha por segurança
        Integer perfilId = e.perfil != null ? e.perfil.getId().intValue() : null;
        UsuarioDto.PerfilInfo perfilInfo = e.perfil != null ? 
            new UsuarioDto.PerfilInfo(
                e.perfil.getId().intValue(),
                e.perfil.getNome(),
                e.perfil.getCodigo()
            ) : null;
        return new UsuarioDto(
            e.id,
            e.orgTenantId,
            e.email,
            e.nome,
            null, // Não retornar senha
            e.dataCadastro,
            e.ultimoAcesso,
            e.fotoPerfil,
            perfilId,
            perfilInfo,
            e.idioma
        );
    }

    @Transactional
    public void atualizarIdiomaUsuarioLogado(String idioma) {
        Integer userId = internalUserContext.getUserId();
        if (userId == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_AUTHENTICATED));
        }
        Usuario usuario = repository.findById(userId);
        if (usuario == null || usuario.ativo == null || !usuario.ativo) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(userId)));
        }
        if (!Objects.equals(usuario.orgTenantId, tenantDataAccess.currentTenantId())) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(userId)));
        }
        usuario.idioma = UserLocaleResolver.normalize(idioma);
    }

    public UsuarioNotificacaoPreferenciasDto getNotificacoesUsuarioLogado() {
        Integer userId = internalUserContext.getUserId();
        if (userId == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_AUTHENTICATED));
        }
        Usuario usuario = repository.findById(userId);
        if (usuario == null || usuario.ativo == null || !usuario.ativo) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(userId)));
        }
        return new UsuarioNotificacaoPreferenciasDto(
                TicketEmailModo.normalize(usuario.notifTicketEmailModo));
    }

    @Transactional
    public void atualizarNotificacoesUsuarioLogado(String ticketEmailModo) {
        Integer userId = internalUserContext.getUserId();
        if (userId == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_AUTHENTICATED));
        }
        Usuario usuario = repository.findById(userId);
        if (usuario == null || usuario.ativo == null || !usuario.ativo) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(userId)));
        }
        if (!Objects.equals(usuario.orgTenantId, tenantDataAccess.currentTenantId())) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(userId)));
        }
        usuario.notifTicketEmailModo = TicketEmailModo.normalize(ticketEmailModo);
    }

    @Transactional
    public UsuarioDto update(Integer id, UsuarioDto dto) {
        
        // Usar findById diretamente do Panache para garantir que a entidade esteja gerenciada
        Usuario e = Usuario.findById(id);
        if (e == null) {
            LOG.warnf("ERRO: Usuário não encontrado com ID: %s", id);
            throw new IllegalArgumentException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(id)));
        }
        long tid = tenantDataAccess.currentTenantId();
        if (e.orgTenantId == null || e.orgTenantId != tid) {
            LOG.warnf("ERRO: Usuário não encontrado com ID: %s", id);
            throw new IllegalArgumentException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(id)));
        }
        
        
        // Salvar o valor atual de ativo antes do update (não permitir alterar diretamente pelo update normal)
        Boolean currentAtivo = e.ativo;
        
        // Atualizar apenas os campos que foram enviados no DTO (não-null)
        // O frontend agora envia apenas os campos que realmente mudaram
        boolean changed = false;
        
        // Verificar cada campo do DTO
        
        // Atualizar nome apenas se foi enviado no DTO (não-null)
        if (dto.nome() != null && !dto.nome().trim().isEmpty()) {
            String novoNome = dto.nome().trim();
            String nomeAtual = e.nome != null ? e.nome : "";
            if (!novoNome.equals(nomeAtual)) {
                e.nome = novoNome;
                changed = true;
            } else {
            }
        } else {
        }
        
        // Atualizar email apenas se foi enviado no DTO (não-null)
        if (dto.email() != null && !dto.email().trim().isEmpty()) {
            String novoEmail = dto.email().trim().toLowerCase();
            String emailAtual = e.email != null ? e.email : "";
            if (!novoEmail.equalsIgnoreCase(emailAtual)) {
                e.email = novoEmail;
                changed = true;
            } else {
            }
        } else {
        }
        
        // Atualizar foto de perfil se fornecida
        if (dto.fotoPerfil() != null && !dto.fotoPerfil().equals(e.fotoPerfil)) {
            e.fotoPerfil = dto.fotoPerfil();
            changed = true;
        }
        
        // Atualizar perfil se foi enviado no DTO
        if (dto.perfilId() != null) {
            Integer perfilAtualId = e.perfil != null ? e.perfil.getId().intValue() : null;
            if (!dto.perfilId().equals(perfilAtualId)) {
                Perfil novoPerfil = perfilService.buscarPorId(dto.perfilId().longValue());
                if (novoPerfil != null) {
                    e.perfil = novoPerfil;
                    changed = true;
                } else {
                }
            } else {
            }
        } else {
        }
        
        // Garantir que ativo não seja alterado pelo update normal (só pode ser alterado via delete)
        e.ativo = currentAtivo;
        
        if (changed) {
            // Com Panache, quando você modifica uma entidade gerenciada dentro de @Transactional,
            // as mudanças são automaticamente detectadas. Mas vamos forçar o persist para garantir.
            e.persist();
            e.flush(); // Forçar flush para garantir que as mudanças sejam salvas imediatamente
        } else {
        }
        
        
        return mapper.toDto(e);
    }

    @Transactional
    public UsuarioDto delete(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.USER_ID_REQUIRED));
        }
        
        // Validação de negócio: verificar se existe
        Usuario usuario = repository.findById(id);
        if (usuario == null) {
            throw new IllegalArgumentException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(id)));
        }
        if (usuario.orgTenantId == null || usuario.orgTenantId != tenantDataAccess.currentTenantId()) {
            throw new IllegalArgumentException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(id)));
        }
        
        // Soft delete - inativar ao invés de deletar fisicamente
        usuario.ativo = false;
        repository.persist(usuario);
        repository.flush();
        
        return mapper.toDto(usuario);
    }
    
    @Transactional
    public UsuarioDto inactivate(Integer id) {
        return delete(id); // Alias para delete (soft delete)
    }

    @Transactional
    public UsuarioDto associarPerfil(Integer usuarioId, Integer perfilId) {
        Usuario usuario = repository.findById(usuarioId);
        if (usuario == null) {
            throw new IllegalArgumentException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(usuarioId)));
        }
        if (usuario.orgTenantId == null || usuario.orgTenantId != tenantDataAccess.currentTenantId()) {
            throw new IllegalArgumentException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(usuarioId)));
        }
        
        // Buscar o perfil
        Perfil perfil = perfilService.buscarPorId(perfilId.longValue());
        if (perfil == null) {
            throw new IllegalArgumentException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_PROFILE_NOT_FOUND, "id", String.valueOf(perfilId)));
        }
        
        // Associar o perfil ao usuário
        usuario.perfil = perfil;
        repository.persist(usuario);
        
        return mapper.toDto(usuario);
    }

    @Transactional
    public String atualizarFotoPerfil(Integer id, String caminhoFoto) {
        return atualizarFotoPerfil(id, caminhoFoto, null);
    }

    @Transactional
    public String atualizarFotoPerfil(Integer id, String caminhoFoto, byte[] dadosImagem) {
        Usuario usuario = repository.findById(id);
        if (usuario == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(id)));
        }
        Integer authUserId = internalUserContext.getUserId();
        boolean selfUpdate = authUserId != null && authUserId.equals(id);
        if (!selfUpdate) {
            Long ctxTenant = internalUserContext.getTenantId();
            if (ctxTenant != null && usuario.orgTenantId != null && !ctxTenant.equals(usuario.orgTenantId)) {
                throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(id)));
            }
        }
        usuario.fotoPerfil = caminhoFoto;
        if (dadosImagem != null && dadosImagem.length > 0) {
            usuario.fotoPerfilDados = dadosImagem;
        }
        repository.flush();
        return usuario.fotoPerfil;
    }

    @Transactional
    public MessageResponse solicitarResetSenha(Integer id) {
        Usuario usuario = repository.findById(id);
        if (usuario == null || usuario.ativo == null || !usuario.ativo) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(id)));
        }
        if (!Objects.equals(usuario.orgTenantId, tenantDataAccess.currentTenantId())) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND, "id", String.valueOf(id)));
        }
        if (usuario.email == null || usuario.email.isBlank()) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.USER_NO_EMAIL));
        }
        Tenant tenant = Tenant.findById(usuario.orgTenantId);
        String tenantCodigo = tenant != null ? tenant.codigo : null;
        return authService.requestPasswordReset(usuario.email.trim().toLowerCase(), tenantCodigo);
    }

}
