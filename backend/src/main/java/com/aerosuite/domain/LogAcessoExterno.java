package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidade para log de acessos de usuários externos (auditoria).
 */
@Entity
@Table(name = "log_acesso_externo")
public class LogAcessoExterno extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_externo_id", nullable = false)
    public UsuarioExterno usuarioExterno;
    
    @Column(name = "tipo_acao", nullable = false)
    public String tipoAcao;
    
    @Column(name = "recurso_id")
    public Long recursoId;
    
    @Column(name = "recurso_tipo")
    public String recursoTipo;
    
    @Column(name = "ip_acesso")
    public String ipAcesso;
    
    @Column(name = "user_agent")
    public String userAgent;
    
    @Column(name = "detalhes", columnDefinition = "TEXT")
    public String detalhes;
    
    @Column(name = "data_acesso")
    public LocalDateTime dataAcesso;

    @PrePersist
    protected void onCreate() {
        if (dataAcesso == null) {
            dataAcesso = LocalDateTime.now();
        }
    }
    
    // Tipos de ação
    public static final String ACAO_LOGIN = "LOGIN";
    public static final String ACAO_LOGOUT = "LOGOUT";
    public static final String ACAO_VISUALIZACAO_OS = "VISUALIZACAO_OS";
    public static final String ACAO_DOWNLOAD_DOC = "DOWNLOAD_DOC";
    public static final String ACAO_VISUALIZACAO_DOC = "VISUALIZACAO_DOC";
    public static final String ACAO_ALTERACAO_PERFIL = "ALTERACAO_PERFIL";
    public static final String ACAO_TROCA_SENHA = "TROCA_SENHA";
    
    // Métodos de busca estáticos
    public static List<LogAcessoExterno> findByUsuarioExterno(Integer usuarioExternoId) {
        return list("usuarioExterno.id = ?1 order by dataAcesso desc", usuarioExternoId);
    }
    
    public static List<LogAcessoExterno> findByUsuarioExternoEPeriodo(Integer usuarioExternoId, 
            LocalDateTime inicio, LocalDateTime fim) {
        return list("usuarioExterno.id = ?1 and dataAcesso between ?2 and ?3 order by dataAcesso desc",
            usuarioExternoId, inicio, fim);
    }
    
    public static void registrarAcesso(UsuarioExterno usuario, String tipoAcao, 
            Long recursoId, String recursoTipo, String ip, String userAgent, String detalhes) {
        LogAcessoExterno log = new LogAcessoExterno();
        log.usuarioExterno = usuario;
        log.tipoAcao = tipoAcao;
        log.recursoId = recursoId;
        log.recursoTipo = recursoTipo;
        log.ipAcesso = ip;
        log.userAgent = userAgent;
        log.detalhes = detalhes;
        log.dataAcesso = LocalDateTime.now();
        log.persist();
    }
}
