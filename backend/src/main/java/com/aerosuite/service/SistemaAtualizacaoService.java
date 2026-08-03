package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.SistemaAtualizacao;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.SistemaAtualizacaoDto;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import io.quarkus.runtime.StartupEvent;
import io.quarkus.arc.Arc;
import io.quarkus.arc.ManagedContext;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import java.time.LocalDateTime;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.Properties;
import java.io.InputStream;
import java.io.BufferedReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Collectors;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import com.aerosuite.service.GitHubApiService.GitHubRelease;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import com.aerosuite.i18n.I18nMessageCodec;
import com.aerosuite.i18n.SistemaAtualizacaoMessages;
import org.jboss.logging.Logger;

@ApplicationScoped
public class SistemaAtualizacaoService {
    private static final Logger LOGGER = Logger.getLogger(SistemaAtualizacaoService.class);
    private static ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private static volatile boolean schedulerInitialized = false;
    private static final String CURRENT_VERSION = getCurrentVersion();
    
    @Inject
    SistemaAtualizacaoBroadcaster broadcaster;
    
    @Inject
    EmailService emailService;
    
    @Inject
    @RestClient
    jakarta.enterprise.inject.Instance<GitHubApiService> githubApiInstance;
    
    @Inject
    OneDriveService oneDriveService;
    
    @Inject
    HttpUpdateService httpUpdateService;
    
    @Inject
    UpdateInstallerService updateInstallerService;
    
    @Inject
    @ConfigProperty(name = "update.check.scheduler.enabled", defaultValue = "true")
    boolean schedulerEnabled;
    
    @PostConstruct
    void init() {
        // Verificar se as dependências foram injetadas corretamente
        if (broadcaster == null) {
            LOGGER.warnf("Erro ao inicializar scheduler de atualizações: %s", "AVISO: SistemaAtualizacaoBroadcaster não foi injetado!");
        }
        if (emailService == null) {
            LOGGER.warnf("AVISO: EmailService não foi injetado!");
        }
    }
    
    // Inicializar scheduler quando a aplicação iniciar (apenas se habilitado)
    void onStart(@Observes StartupEvent ev) {
        if (!schedulerEnabled) {
            return;
        }
        
        try {
            Thread.sleep(2000);
            startUpdateMonitor();
            schedulerInitialized = true;
        } catch (Exception e) {
            LOGGER.warnf(e.getMessage());
            LOGGER.warnf(e, "Erro inesperado");
        }
    }
    
    // Monitor que verifica atualizações disponíveis
    private void startUpdateMonitor() {
        Runnable monitorTask = () -> {
            ManagedContext requestContext = Arc.container().requestContext();
            try {
                requestContext.activate();
                verificarAtualizacoesComContexto();
            } catch (Exception e) {
                LOGGER.warnf("Erro ao verificar atualizações: %s", e.getMessage());
                LOGGER.warnf(e, "Erro inesperado");
            } finally {
                if (requestContext.isActive()) {
                    requestContext.terminate();
                }
            }
        };
        
        scheduler.scheduleAtFixedRate(monitorTask, 0, 30, TimeUnit.MINUTES);
    }
    
    // Método com contexto transacional para verificar atualizações
    @Transactional
    public void verificarAtualizacoesComContexto() {
        try {
            
            // Verificar se já existe uma atualização em andamento
            SistemaAtualizacao atualizacaoAtiva = SistemaAtualizacao.find(
                "status IN (?1, ?2, ?3) ORDER BY id DESC",
                "DISPONIVEL", "APROVADA", "EM_ANDAMENTO"
            ).firstResult();
            
            if (atualizacaoAtiva != null) {
                return;
            }
            
            // Verificar atualização disponível (HTTP/Google Drive, OneDrive ou GitHub)
            String novaVersao = verificarAtualizacaoDisponivel();
            
            
            if (novaVersao != null && !novaVersao.equals(CURRENT_VERSION)) {
                criarAtualizacaoDisponivel(novaVersao);
            } else if (novaVersao != null && novaVersao.equals(CURRENT_VERSION)) {
            } else {
            }
        } catch (Exception e) {
            LOGGER.warnf("Erro: %s", "\\n==========================================");
            LOGGER.warnf("ERRO AO VERIFICAR ATUALIZAÇÕES");
            LOGGER.warnf("==========================================");
            LOGGER.warnf(e.getMessage());
            LOGGER.warnf("Tipo: %s", e.getClass().getName());
            LOGGER.warnf("==========================================");
            LOGGER.warnf(e, "Erro inesperado");
        }
    }
    
    // Método para verificar atualização disponível (HTTP, OneDrive ou GitHub)
    private String verificarAtualizacaoDisponivel() {
        try {
            
            // Priorizar HTTP Update se estiver habilitado (mais simples e sem limites)
            if (httpUpdateService != null) {
                boolean httpEnabled = httpUpdateService.isEnabled();
                
                if (httpEnabled) {
                    
                    String versaoHttp = httpUpdateService.verificarAtualizacaoDisponivel();
                    
                    if (versaoHttp != null) {
                        
                        // Comparar versões semanticamente
                        int comparacao = compararVersoes(versaoHttp, CURRENT_VERSION);
                        
                        // Se a versão encontrada for diferente (maior ou menor), considerar como atualização
                        // Nota: Normalmente só atualizamos para versões maiores, mas permitir qualquer diferença
                        // para permitir downgrades se necessário
                        if (comparacao != 0) {
                            if (comparacao > 0) {
                            } else {
                            }
                            return versaoHttp;
                        } else {
                            // Retornar a versão encontrada mesmo quando são iguais, para exibição
                            return versaoHttp;
                        }
                    } else {
                    }
                } else {
                }
            } else {
            }
            
            
            // Fallback para OneDrive se estiver habilitado
            if (oneDriveService != null && oneDriveService.isEnabled()) {
                String versaoOneDrive = oneDriveService.verificarAtualizacaoDisponivel();
                if (versaoOneDrive != null) {
                    // Usar comparação semântica de versões (não apenas equals)
                    if (compararVersoes(versaoOneDrive, CURRENT_VERSION) != 0) {
                        return versaoOneDrive;
                    } else {
                    }
                }
                return null;
            }
            
            // Fallback para GitHub se OneDrive não estiver habilitado
            String githubEnabled = System.getenv("GITHUB_ENABLED");
            if (githubEnabled == null || githubEnabled.isEmpty()) {
                githubEnabled = System.getProperty("github.enabled", "true");
            }
            
            if (!Boolean.parseBoolean(githubEnabled)) {
                return null;
            }
            
            // Obter configurações do GitHub
            String owner = System.getenv("GITHUB_OWNER");
            if (owner == null || owner.isEmpty()) {
                owner = System.getProperty("github.owner", "");
            }
            
            String repo = System.getenv("GITHUB_REPO");
            if (repo == null || repo.isEmpty()) {
                repo = System.getProperty("github.repo", "");
            }
            
            if (owner.isEmpty() || repo.isEmpty()) {
                return null;
            }
            
            
            // Verificar se deve usar releases ou tags
            String useReleases = System.getenv("GITHUB_USE_RELEASES");
            if (useReleases == null || useReleases.isEmpty()) {
                useReleases = System.getProperty("github.use-releases", "true");
            }
            
            String latestVersion = null;
            
            // Verificar se o cliente GitHub está disponível
            if (!githubApiInstance.isResolvable()) {
                LOGGER.warnf("GitHubApiService não está disponível. Verifique as dependências.");
                return null;
            }
            
            GitHubApiService githubApi = githubApiInstance.get();
            
            if (Boolean.parseBoolean(useReleases)) {
                // Buscar última release
                try {
                    GitHubRelease latestRelease = githubApi.getLatestRelease(owner, repo);
                    if (latestRelease != null && !latestRelease.prerelease() && !latestRelease.draft()) {
                        latestVersion = latestRelease.tag_name();
                    }
                } catch (Exception e) {
                    LOGGER.warnf("Erro ao buscar release do GitHub: %s", e.getMessage());
                    // Tentar buscar tags como fallback
                    latestVersion = buscarUltimaTag(owner, repo, githubApi);
                }
            } else {
                // Buscar última tag
                latestVersion = buscarUltimaTag(owner, repo, githubApi);
            }
            
            if (latestVersion != null) {
                // Remover prefixo 'v' se existir (ex: v1.0.0 -> 1.0.0)
                latestVersion = latestVersion.replaceFirst("^v", "");
                
                // Comparar versões
                if (compararVersoes(latestVersion, CURRENT_VERSION) > 0) {
                    return latestVersion;
                } else {
                }
            }
            
            return null;
        } catch (Exception e) {
            LOGGER.warnf("Erro ao verificar atualização no GitHub: %s", e.getMessage());
            LOGGER.warnf(e, "Erro inesperado");
            return null;
        }
    }
    
    private String buscarUltimaTag(String owner, String repo, GitHubApiService githubApi) {
        try {
            var tags = githubApi.getTags(owner, repo);
            if (tags != null && !tags.isEmpty()) {
                // A primeira tag geralmente é a mais recente
                String tagName = tags.get(0).name();
                // Remover prefixo 'v' se existir
                return tagName.replaceFirst("^v", "");
            }
        } catch (Exception e) {
            LOGGER.warnf("Erro ao buscar tags do GitHub: %s", e.getMessage());
        }
        return null;
    }
    
    /**
     * Compara duas versões no formato semântico (ex: 1.2.3)
     * Retorna: > 0 se versao1 > versao2, < 0 se versao1 < versao2, 0 se iguais
     */
    private int compararVersoes(String versao1, String versao2) {
        try {
            // Remover prefixo 'v' se existir
            versao1 = versao1.replaceFirst("^v", "").trim();
            versao2 = versao2.replaceFirst("^v", "").trim();
            
            String[] partes1 = versao1.split("\\.");
            String[] partes2 = versao2.split("\\.");
            
            int maxLength = Math.max(partes1.length, partes2.length);
            
            for (int i = 0; i < maxLength; i++) {
                int num1 = i < partes1.length ? parseVersionPart(partes1[i]) : 0;
                int num2 = i < partes2.length ? parseVersionPart(partes2[i]) : 0;
                
                if (num1 != num2) {
                    return Integer.compare(num1, num2);
                }
            }
            
            return 0; // Versões iguais
        } catch (Exception e) {
            LOGGER.warnf("Erro ao comparar versões: %s", e.getMessage());
            // Em caso de erro, assumir que são diferentes e retornar 0 (sem atualização)
            return 0;
        }
    }
    
    /**
     * Parseia uma parte da versão (ex: "1", "2", "3-beta" -> 3)
     */
    private int parseVersionPart(String parte) {
        if (parte == null || parte.isEmpty()) {
            return 0;
        }
        
        // Remover sufixos como -beta, -alpha, etc.
        parte = parte.split("-")[0].trim();
        
        // Extrair apenas números
        Pattern pattern = Pattern.compile("(\\d+)");
        Matcher matcher = pattern.matcher(parte);
        
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        
        return 0;
    }
    
    @Transactional
    public SistemaAtualizacaoDto criarAtualizacaoDisponivel(String novaVersao) {
        SistemaAtualizacao atualizacao = new SistemaAtualizacao();
        atualizacao.versaoDisponivel = novaVersao;
        atualizacao.versaoAtual = CURRENT_VERSION;
        atualizacao.status = "DISPONIVEL";
        atualizacao.mensagem =
                I18nMessageCodec.encode(SistemaAtualizacaoMessages.NEW_VERSION, "version", novaVersao);
        atualizacao.persist();
        
        // Notificar administradores e diretores
        notificarAdministradoresEDiretores(atualizacao);
        
        // Broadcast
        broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
            atualizacao.id.toString(),
            atualizacao.status,
            null,
            atualizacao.mensagem,
            atualizacao.versaoDisponivel,
            atualizacao.versaoAtual,
            null
        ));
        
        return toDto(atualizacao);
    }
    
    /**
     * Notifica administradores e diretores quando uma atualização está pronta para instalação
     */
    private void notificarAtualizacaoPronta(SistemaAtualizacao atualizacao) {
        try {
            // Buscar usuários com perfil ADMIN ou DIRETOR
            var usuarios = Usuario.<Usuario>find(
                "ativo = ?1",
                true
            ).list();
            
            // Filtrar apenas ADMIN e DIRETOR
            usuarios = usuarios.stream()
                .filter(u -> u.perfil != null && 
                    ("ADMIN".equals(u.perfil.getCodigo()) || "DIRETOR".equals(u.perfil.getCodigo())))
                .collect(Collectors.toList());
            
            for (Usuario usuario : usuarios) {
                try {
                    emailService.sendUpdateReadyEmail(
                        usuario.email,
                        usuario.nome,
                        atualizacao.versaoDisponivel,
                        atualizacao.versaoAtual,
                        com.aerosuite.i18n.UserLocaleResolver.resolve(usuario));
                } catch (Exception e) {
                    LOGGER.warnf(e, "Erro ao enviar email de atualização pronta para %s", usuario.email);
                }
            }
        } catch (Exception e) {
            LOGGER.warnf("Erro ao notificar administradores (atualização pronta)", e);
        }
    }
    
    private void notificarAdministradoresEDiretores(SistemaAtualizacao atualizacao) {
        try {
            // Buscar usuários com perfil ADMIN ou DIRETOR
            var usuarios = Usuario.<Usuario>find(
                "ativo = ?1",
                true
            ).list();
            
            // Filtrar apenas ADMIN e DIRETOR
            usuarios = usuarios.stream()
                .filter(u -> u.perfil != null && 
                    ("ADMIN".equals(u.perfil.getCodigo()) || "DIRETOR".equals(u.perfil.getCodigo())))
                .collect(Collectors.toList());
            
            for (Usuario usuario : usuarios) {
                try {
                    emailService.sendUpdateAvailableEmail(
                        usuario.email,
                        usuario.nome,
                        atualizacao.versaoDisponivel,
                        atualizacao.versaoAtual,
                        com.aerosuite.i18n.UserLocaleResolver.resolve(usuario));
                } catch (Exception e) {
                    LOGGER.warnf(e, "Erro ao enviar email de atualização disponível para %s", usuario.email);
                }
            }
        } catch (Exception e) {
            LOGGER.warnf("Erro ao notificar administradores (atualização disponível)", e);
        }
    }
    
    public String getVersaoAtual() {
        return CURRENT_VERSION;
    }
    
    public SistemaAtualizacaoDto getStatus() {
        SistemaAtualizacao atualizacao = SistemaAtualizacao.find(
            "status IN (?1, ?2, ?3) ORDER BY id DESC",
            "DISPONIVEL", "APROVADA", "EM_ANDAMENTO"
        ).firstResult();
        
        if (atualizacao != null) {
            return toDto(atualizacao);
        }
        
        // Sempre retornar pelo menos a versão atual, mesmo quando não há atualização disponível
        
        // Criar um DTO mínimo com a versão atual
        return new SistemaAtualizacaoDto(
            null, // id
            null, // versaoDisponivel
            CURRENT_VERSION, // versaoAtual
            "ATUALIZADO", // status
            null, // aprovadoPor
            null, // dataAprovacao
            null, // dataInicio
            null, // dataConclusao
            null, // contadorRegressivo
            I18nMessageCodec.encode(
                    SistemaAtualizacaoMessages.SYSTEM_UP_TO_DATE, "version", CURRENT_VERSION),
            null, // createdAt
            null  // updatedAt
        );
    }
    
    @Transactional
    public SistemaAtualizacaoDto aprovarAtualizacao(Integer atualizacaoId, Integer usuarioId) {
        SistemaAtualizacao atualizacao = SistemaAtualizacao.findById(atualizacaoId);
        if (atualizacao == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.UPDATE_NOT_FOUND));
        }
        
        if (!"DISPONIVEL".equals(atualizacao.status)) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.UPDATE_NOT_AVAILABLE));
        }
        
        // Verificar se o usuário tem permissão (ADMIN ou DIRETOR)
        Usuario usuario = Usuario.findById(usuarioId);
        if (usuario == null || usuario.perfil == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.UPDATE_USER_NOT_FOUND));
        }
        
        String codigoPerfil = usuario.perfil.getCodigo();
        if (!"ADMIN".equals(codigoPerfil) && !"DIRETOR".equals(codigoPerfil)) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.UPDATE_APPROVE_FORBIDDEN));
        }
        
        atualizacao.status = "APROVADA";
        atualizacao.aprovadoPor = usuarioId;
        atualizacao.dataAprovacao = LocalDateTime.now();
        atualizacao.persist();
        
        // Iniciar contador regressivo reduzido quando aprovado manualmente
        // Se foi aprovado manualmente pelo usuário, usar 30 segundos em vez de 5 minutos
        // Isso permite que o processo seja mais rápido quando o usuário clica em "Baixar e Instalar"
        atualizacao.contadorRegressivo = 30; // 30 segundos para aprovação manual
        atualizacao.persist();
        
        // Notificar todos os usuários logados
        broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
            atualizacao.id.toString(),
            atualizacao.status,
            atualizacao.contadorRegressivo,
            I18nMessageCodec.encode(
                    SistemaAtualizacaoMessages.APPROVED_COUNTDOWN,
                    "n",
                    String.valueOf(atualizacao.contadorRegressivo)),
            atualizacao.versaoDisponivel,
            atualizacao.versaoAtual,
            atualizacao.aprovadoPor
        ));
        
        // Iniciar contador regressivo
        iniciarContadorRegressivo(atualizacao);
        
        return toDto(atualizacao);
    }
    
    private void iniciarContadorRegressivo(SistemaAtualizacao atualizacao) {
        scheduler.schedule(() -> {
            ManagedContext requestContext = Arc.container().requestContext();
            try {
                requestContext.activate();
                executarContadorRegressivo(atualizacao.id);
            } catch (Exception e) {
                LOGGER.warnf("Erro no contador regressivo: %s", e.getMessage());
                LOGGER.warnf(e, "Erro inesperado");
            } finally {
                if (requestContext.isActive()) {
                    requestContext.terminate();
                }
            }
        }, 1, TimeUnit.SECONDS);
    }
    
    // Método com contexto transacional para executar contador regressivo
    private void executarContadorRegressivo(Integer atualizacaoId) {
        // Buscar atualização para obter o contador inicial
        SistemaAtualizacao atualizacao = SistemaAtualizacao.findById(atualizacaoId);
        if (atualizacao == null || !"APROVADA".equals(atualizacao.status)) {
            LOGGER.warnf("Atualização não encontrada ou não está aprovada: %s", atualizacaoId);
            return;
        }
        
        int contadorInicial = atualizacao.contadorRegressivo != null ? atualizacao.contadorRegressivo : 30;
        
        // Atualizar contador a cada segundo
        for (int i = contadorInicial - 1; i >= 0; i--) {
            try {
                Thread.sleep(1000);
                
                // Atualizar dentro de uma transação
                atualizarContadorRegressivo(atualizacaoId, i);
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                LOGGER.warnf("Contador regressivo interrompido para atualização ID: %s", atualizacaoId);
                return;
            }
        }
        
        // Quando o contador chegar a zero, iniciar atualização
        iniciarAtualizacao(atualizacaoId);
    }
    
    // Método auxiliar para atualizar contador com contexto transacional
    @Transactional
    public void atualizarContadorRegressivo(Integer atualizacaoId, int contador) {
        SistemaAtualizacao atualizacao = SistemaAtualizacao.findById(atualizacaoId);
        if (atualizacao == null || !"APROVADA".equals(atualizacao.status)) {
            return;
        }
        
        atualizacao.contadorRegressivo = contador;
        atualizacao.persist();
        
        // Broadcast do contador
        broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
            atualizacao.id.toString(),
            atualizacao.status,
            contador,
            I18nMessageCodec.encode(
                    SistemaAtualizacaoMessages.COUNTDOWN_SAVE_WORK, "n", String.valueOf(contador)),
            atualizacao.versaoDisponivel,
            atualizacao.versaoAtual,
            atualizacao.aprovadoPor
        ));
    }
    
    @Transactional
    public void iniciarAtualizacao(Integer atualizacaoId) {
        SistemaAtualizacao atualizacao = SistemaAtualizacao.findById(atualizacaoId);
        if (atualizacao == null) {
            return;
        }
        
        atualizacao.status = "EM_ANDAMENTO";
        atualizacao.dataInicio = LocalDateTime.now();
        atualizacao.contadorRegressivo = 0;
        atualizacao.persist();
        
        broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
            atualizacao.id.toString(),
            atualizacao.status,
            0,
            I18nMessageCodec.encode(SistemaAtualizacaoMessages.IN_PROGRESS),
            atualizacao.versaoDisponivel,
            atualizacao.versaoAtual,
            atualizacao.aprovadoPor
        ));
        
        // Executar atualização em thread separada
        // Obter instância do serviço através do CDI para garantir que métodos transacionais funcionem
        SistemaAtualizacaoService self = Arc.container().instance(SistemaAtualizacaoService.class).get();
        
        scheduler.execute(() -> {
            ManagedContext requestContext = Arc.container().requestContext();
            try {
                requestContext.activate();
                executarAtualizacaoComTransacao(self, atualizacao);
            } catch (RuntimeException e) {
                // Se foi cancelada pelo usuário, não tratar como erro
                if (e.getMessage() != null && e.getMessage().contains("cancelada")) {
                    // Verificar se o status já está CANCELADA
                    SistemaAtualizacao atualizacaoAtual = self.buscarAtualizacao(atualizacaoId);
                    if (atualizacaoAtual != null && !"CANCELADA".equals(atualizacaoAtual.status)) {
                        // Se não estiver cancelada ainda, atualizar usando método transacional
                        self.atualizarStatusCancelada(
                                atualizacaoId, SistemaAtualizacaoMessages.cancelledByUser());
                        
                        // Broadcast de cancelamento
                        broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
                            atualizacaoAtual.id.toString(),
                            "CANCELADA",
                            null,
                            SistemaAtualizacaoMessages.cancelledByUser(),
                            atualizacaoAtual.versaoDisponivel,
                            atualizacaoAtual.versaoAtual,
                            atualizacaoAtual.aprovadoPor
                        ));
                    }
                    // Não fazer mais nada - cancelamento já foi tratado
                    return;
                }
                // Verificar se já foi cancelada antes de tratar como erro
                SistemaAtualizacao atualizacaoAtual = self.buscarAtualizacao(atualizacaoId);
                if (atualizacaoAtual != null && "CANCELADA".equals(atualizacaoAtual.status)) {
                    // Já foi cancelada pelo usuário, não tratar como erro
                    return;
                }
                // Erro real - cancelar e notificar
                LOGGER.warnf("Erro ao executar atualização: %s", e.getMessage());
                LOGGER.warnf(e, "Erro inesperado");
                self.cancelarAtualizacao(
                        atualizacaoId,
                        ApiI18nMessages.withDetail(ApiI18nMessages.UPDATE_EXECUTE_FAILED, e.getMessage()));
            } catch (Exception e) {
                // Verificar se já foi cancelada antes de tratar como erro
                SistemaAtualizacao atualizacaoAtual = self.buscarAtualizacao(atualizacaoId);
                if (atualizacaoAtual != null && "CANCELADA".equals(atualizacaoAtual.status)) {
                    // Já foi cancelada pelo usuário, não tratar como erro
                    return;
                }
                // Erro real - cancelar e notificar
                LOGGER.warnf("Erro ao executar atualização: %s", e.getMessage());
                LOGGER.warnf(e, "Erro inesperado");
                self.cancelarAtualizacao(
                        atualizacaoId,
                        ApiI18nMessages.withDetail(ApiI18nMessages.UPDATE_EXECUTE_FAILED, e.getMessage()));
            } finally {
                if (requestContext.isActive()) {
                    requestContext.terminate();
                }
            }
        });
    }
    
    /**
     * Método que executa a atualização dentro de um contexto transacional
     * Chamado através de auto-injeção para garantir que métodos transacionais funcionem
     */
    @Transactional
    public void executarAtualizacaoComTransacao(SistemaAtualizacaoService self, SistemaAtualizacao atualizacao) {
        executarAtualizacao(self, atualizacao);
    }
    
    private void executarAtualizacao(SistemaAtualizacaoService self, SistemaAtualizacao atualizacao) {
        if (updateInstallerService != null) {
        }
        
        // Verificar se o serviço está disponível e habilitado
        if (updateInstallerService == null) {
            String erro = ApiI18nMessages.encode(ApiI18nMessages.UPDATE_INSTALLER_UNAVAILABLE);
            LOGGER.warnf("❌ %s", erro);
            LOGGER.error(erro);
            cancelarAtualizacao(atualizacao.id, erro);
            return;
        }
        
        if (!updateInstallerService.isInstallEnabled()) {
            String erro = ApiI18nMessages.encode(ApiI18nMessages.UPDATE_INSTALL_DISABLED);
            LOGGER.warnf("❌ %s", erro);
            LOGGER.error(erro);
            cancelarAtualizacao(atualizacao.id, erro);
            return;
        }
        
        // Usar UpdateInstallerService para instalação segura (protege configurações)
        String downloadUrl = obterDownloadUrl(atualizacao.versaoDisponivel);
        LOGGER.info("URL de download obtida: " + downloadUrl);
        
        // Passar ID da atualização e versão atual para permitir broadcast de progresso
        try {
            LOGGER.info("Chamando baixarAtualizacao para versão: " + atualizacao.versaoDisponivel);
            
            // Usar método simplificado que apenas baixa a atualização
            boolean sucesso = updateInstallerService.baixarAtualizacao(
                atualizacao.versaoDisponivel, 
                downloadUrl,
                atualizacao.id,
                atualizacao.versaoAtual
            );
            
            LOGGER.info("Resultado do download: " + sucesso);
            
            if (sucesso) {
                LOGGER.info("Atualização baixada com sucesso. Atualizando status para PRONTA_PARA_INSTALACAO.");
                
                // Atualizar status para PRONTA_PARA_INSTALACAO (não CONCLUIDA)
                SistemaAtualizacao atualizacaoAtual = self.buscarAtualizacao(atualizacao.id);
                if (atualizacaoAtual != null) {
                    atualizacaoAtual.status = "PRONTA_PARA_INSTALACAO";
                    atualizacaoAtual.mensagem =
                            I18nMessageCodec.encode(SistemaAtualizacaoMessages.DOWNLOAD_READY);
                    atualizacaoAtual.persist();
                    
                    // Notificar administradores e diretores
                    notificarAtualizacaoPronta(atualizacaoAtual);
                }
                
                // Limpar flag de cancelamento se existir
                updateInstallerService.limparCancelamento(atualizacao.id);
            } else {
                // Verificar se foi cancelado pelo usuário antes de tratar como erro
                SistemaAtualizacao atualizacaoAtual = self.buscarAtualizacao(atualizacao.id);
                if (atualizacaoAtual != null && "CANCELADA".equals(atualizacaoAtual.status)) {
                    // Já foi cancelada pelo usuário, não fazer nada
                    LOGGER.info("Atualização " + atualizacao.id + " já estava cancelada pelo usuário");
                    return;
                }
                // Não foi cancelamento - tratar como erro real
                String erro = ApiI18nMessages.encode(ApiI18nMessages.UPDATE_INSTALL_FAILED);
                LOGGER.warnf("❌ %s", erro);
                LOGGER.error(erro);
                self.cancelarAtualizacao(atualizacao.id, erro);
            }
        } catch (RuntimeException e) {
            // Se foi cancelada pelo usuário, tratar adequadamente
            if (e.getMessage() != null && e.getMessage().contains("cancelada")) {
                LOGGER.info("Atualização " + atualizacao.id + " foi cancelada pelo usuário durante instalação");
                // Usar método transacional para atualizar status cancelado
                self.atualizarStatusCancelada(
                        atualizacao.id, SistemaAtualizacaoMessages.cancelledByUser());
                
                // Limpar flag de cancelamento
                updateInstallerService.limparCancelamento(atualizacao.id);
                
                // Broadcast de cancelamento com mensagem clara
                broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
                    atualizacao.id.toString(),
                    "CANCELADA",
                    null,
                    SistemaAtualizacaoMessages.cancelledByUser(),
                    atualizacao.versaoDisponivel,
                    atualizacao.versaoAtual,
                    atualizacao.aprovadoPor
                ));
                // Não tratar como erro - apenas retornar
                return;
            } else {
                String erro = ApiI18nMessages.withDetail(ApiI18nMessages.UPDATE_EXECUTE_FAILED, e.getMessage());
                LOGGER.warnf("❌ %s", erro);
                LOGGER.error(erro, e);
                self.cancelarAtualizacao(atualizacao.id, erro);
            }
        }
    }
    
    /**
     * Inicia contagem regressiva de 10 segundos antes de reiniciar o sistema
     */
    @Transactional
    public void iniciarContagemRegressivaReinicio(SistemaAtualizacao atualizacao) {
        if (atualizacao == null) {
            LOGGER.warn("Tentativa de iniciar contagem regressiva com atualização null");
            return;
        }
        // Atualizar status para mostrar contagem regressiva
        atualizacao.contadorRegressivo = 10;
        atualizacao.persist();
        
        scheduler.schedule(() -> {
            ManagedContext requestContext = Arc.container().requestContext();
            try {
                requestContext.activate();
                executarContagemRegressivaReinicio(atualizacao.id);
            } catch (Exception e) {
                LOGGER.warnf("Erro na contagem regressiva de reinício: %s", e.getMessage());
                LOGGER.warnf(e, "Erro inesperado");
            } finally {
                if (requestContext.isActive()) {
                    requestContext.terminate();
                }
            }
        }, 1, TimeUnit.SECONDS);
    }
    
    /**
     * Executa contagem regressiva de 10 segundos e reinicia o sistema
     */
    private void executarContagemRegressivaReinicio(Integer atualizacaoId) {
        for (int i = 10; i >= 0; i--) {
            try {
                Thread.sleep(1000);
                
                // Atualizar contador regressivo
                atualizarContadorRegressivoReinicio(atualizacaoId, i);
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
        
        // Quando chegar a zero, reiniciar o sistema
        reiniciarSistema(atualizacaoId);
    }
    
    /**
     * Atualiza contador regressivo de reinicialização
     */
    @Transactional
    public void atualizarContadorRegressivoReinicio(Integer atualizacaoId, int contador) {
        SistemaAtualizacao atualizacao = SistemaAtualizacao.findById(atualizacaoId);
        if (atualizacao == null || !"CONCLUIDA".equals(atualizacao.status)) {
            return;
        }
        
        atualizacao.contadorRegressivo = contador;
        atualizacao.persist();
        
        String mensagem =
                contador > 0
                        ? I18nMessageCodec.encode(
                                SistemaAtualizacaoMessages.RESTART_COUNTDOWN, "n", String.valueOf(contador))
                        : I18nMessageCodec.encode(SistemaAtualizacaoMessages.RESTARTING_NOW);
        
        broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
            atualizacao.id.toString(),
            "REINICIANDO",
            contador,
            mensagem,
            atualizacao.versaoDisponivel,
            atualizacao.versaoAtual,
            atualizacao.aprovadoPor
        ));
    }
    
    /**
     * Reinicia o sistema (Docker container)
     */
    private void reiniciarSistema(Integer atualizacaoId) {
        try {
            
            // Verificar se há atualização de frontend pendente
            boolean temFrontend = false;
            
            // Ler flag para verificar se tem frontend
            try {
                Path flagFile = Paths.get(System.getProperty("user.dir"), "updates", "pending", "update-pending.flag");
                if (Files.exists(flagFile)) {
                    try (BufferedReader reader = Files.newBufferedReader(flagFile)) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            if (line.startsWith("hasFrontend=true")) {
                                temFrontend = true;
                                break;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                // Ignorar erro, continuar sem frontend
            }
            
            // Tentar reiniciar via Docker (backend e frontend se necessário)
            boolean reiniciado = updateInstallerService.reiniciarContainerDocker(temFrontend);
            
            if (!reiniciado) {
                // Se não conseguir reiniciar via Docker, apenas encerrar a aplicação
                // O Docker ou sistema de orquestração deve reiniciar automaticamente
                
                // Aguardar um pouco para garantir que a mensagem foi enviada
                Thread.sleep(2000);
                
                // Encerrar aplicação (Docker reiniciará automaticamente se configurado)
                System.exit(0);
            }
            
        } catch (Exception e) {
            LOGGER.warnf("Erro ao reiniciar sistema: %s", e.getMessage());
            LOGGER.warnf(e, "Erro inesperado");
            
            // Em caso de erro, apenas encerrar a aplicação
            try {
                Thread.sleep(2000);
                System.exit(0);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            }
        }
    }
    
    /**
     * Obtém URL de download para uma versão
     */
    private String obterDownloadUrl(String version) {
        if (httpUpdateService != null && httpUpdateService.isEnabled()) {
            return httpUpdateService.getDownloadUrl(version);
        }
        // Fallback para outras fontes se necessário
        return null;
    }
    
    // Método legado removido - não deve ser usado mais
    // A atualização agora sempre usa UpdateInstallerService para garantir execução real
    
    private void notificarConclusaoAtualizacao(SistemaAtualizacao atualizacao) {
        try {
            var usuarios = Usuario.<Usuario>find("ativo = ?1", true).list();
            for (Usuario usuario : usuarios) {
                try {
                    emailService.sendUpdateCompletedEmail(
                        usuario.email,
                        usuario.nome,
                        atualizacao.versaoDisponivel,
                        com.aerosuite.i18n.UserLocaleResolver.resolve(usuario));
                } catch (Exception e) {
                    LOGGER.warnf(e, "Erro ao enviar email de atualização concluída para %s", usuario.email);
                }
            }
        } catch (Exception e) {
            LOGGER.warnf("Erro ao notificar conclusão de atualização", e);
        }
    }
    
    @Transactional
    public void cancelarAtualizacao(Integer atualizacaoId, String motivo) {
        SistemaAtualizacao atualizacao = SistemaAtualizacao.findById(atualizacaoId);
        if (atualizacao == null) {
            return;
        }
        
        
        atualizacao.status = "CANCELADA";
        String encoded =
                motivo != null && I18nMessageCodec.isEncoded(motivo)
                        ? motivo
                        : SistemaAtualizacaoMessages.cancelledByUser();
        atualizacao.mensagem = encoded;
        atualizacao.persist();
        
        // Marcar como cancelada no UpdateInstallerService para interromper processos em andamento
        if (updateInstallerService != null) {
            updateInstallerService.marcarComoCancelada(atualizacaoId);
        }
        
        broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
            atualizacao.id.toString(),
            atualizacao.status,
            null,
            encoded,
            atualizacao.versaoDisponivel,
            atualizacao.versaoAtual,
            atualizacao.aprovadoPor
        ));
        
    }
    
    private SistemaAtualizacaoDto toDto(SistemaAtualizacao atualizacao) {
        return new SistemaAtualizacaoDto(
            atualizacao.id,
            atualizacao.versaoDisponivel,
            atualizacao.versaoAtual,
            atualizacao.status,
            atualizacao.aprovadoPor,
            atualizacao.dataAprovacao,
            atualizacao.dataInicio,
            atualizacao.dataConclusao,
            atualizacao.contadorRegressivo,
            atualizacao.mensagem,
            atualizacao.createdAt,
            atualizacao.updatedAt
        );
    }
    
    /**
     * Método transacional auxiliar para atualizar status para CONCLUIDA
     * Usado em threads separadas onde o contexto transacional precisa ser gerenciado manualmente
     */
    @Transactional
    public void atualizarStatusConcluida(Integer atualizacaoId, String versaoDisponivel) {
        SistemaAtualizacao atualizacao = SistemaAtualizacao.findById(atualizacaoId);
        if (atualizacao != null) {
            atualizacao.status = "CONCLUIDA";
            atualizacao.dataConclusao = LocalDateTime.now();
            atualizacao.persist();
            LOGGER.info("Status atualizado para CONCLUIDA - Atualização ID: " + atualizacaoId);
        }
    }
    
    /**
     * Método transacional auxiliar para atualizar status para CANCELADA
     * Usado em threads separadas onde o contexto transacional precisa ser gerenciado manualmente
     */
    @Transactional
    public void atualizarStatusCancelada(Integer atualizacaoId, String mensagem) {
        SistemaAtualizacao atualizacao = SistemaAtualizacao.findById(atualizacaoId);
        if (atualizacao != null) {
            atualizacao.status = "CANCELADA";
            atualizacao.mensagem = mensagem;
            atualizacao.persist();
            LOGGER.info("Status atualizado para CANCELADA - Atualização ID: " + atualizacaoId + ", Mensagem: " + mensagem);
        }
    }
    
    /**
     * Método transacional auxiliar para buscar atualização
     * Usado em threads separadas onde o contexto transacional precisa ser gerenciado manualmente
     */
    @Transactional
    public SistemaAtualizacao buscarAtualizacao(Integer atualizacaoId) {
        return SistemaAtualizacao.findById(atualizacaoId);
    }
    
    private static String getCurrentVersion() {
        try {
            Properties props = new Properties();
            InputStream is = SistemaAtualizacaoService.class.getClassLoader()
                .getResourceAsStream("application.properties");
            if (is != null) {
                props.load(is);
                String version = props.getProperty("app.version");
                if (version != null) {
                    return version;
                }
            }
        } catch (Exception e) {
            LOGGER.warnf("Erro ao ler versão: %s", e.getMessage());
        }
        return "1.0.0"; // Versão padrão
    }
}

