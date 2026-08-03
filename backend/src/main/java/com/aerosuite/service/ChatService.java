package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.domain.*;
import com.aerosuite.dto.*;
import com.aerosuite.util.PanacheMaps;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class ChatService {

    @Inject
    EntityManager em;

    @ConfigProperty(name = "chat.upload.path", defaultValue = "./chat_uploads")
    String uploadPath;

    // ==================== CONVERSAS ====================

    public List<ConversaDto> listarConversas(Long usuarioId) {
        List<Conversa> conversas = Conversa.findByUsuarioId(usuarioId);
        if (conversas.isEmpty()) {
            return List.of();
        }

        List<Long> conversaIds = conversas.stream().map(c -> c.id).collect(Collectors.toList());
        List<ConversaParticipante> allParticipantes = ConversaParticipante.list(
                "conversa.id in ?1 and ativo = true", conversaIds);
        Map<Long, List<ConversaParticipante>> participantesPorConversa = allParticipantes.stream()
                .filter(cp -> cp.conversa != null && cp.conversa.id != null)
                .collect(Collectors.groupingBy(cp -> cp.conversa.id));

        Map<Long, Mensagem> ultimaPorConversa = loadUltimasMensagens(conversaIds);
        Map<Long, Long> naoLidasPorConversa = loadNaoLidasPorConversa(conversaIds, usuarioId);

        Set<Integer> usuarioIds = new HashSet<>();
        for (ConversaParticipante cp : allParticipantes) {
            if (cp.usuarioId != null) {
                usuarioIds.add(cp.usuarioId.intValue());
            }
        }
        for (Mensagem m : ultimaPorConversa.values()) {
            if (m.remetenteId != null) {
                usuarioIds.add(m.remetenteId.intValue());
            }
        }
        Map<Integer, Usuario> usuarios = loadUsuariosMap(usuarioIds);

        return conversas.stream()
                .map(c -> toConversaDtoBatch(
                        c,
                        usuarioId,
                        participantesPorConversa.getOrDefault(c.id, List.of()),
                        usuarios,
                        ultimaPorConversa.get(c.id),
                        naoLidasPorConversa.getOrDefault(c.id, 0L)))
                .collect(Collectors.toList());
    }

    public ConversaDto buscarConversa(Long conversaId, Long usuarioId) {
        Conversa conversa = Conversa.findById(conversaId);
        if (conversa == null || !conversa.ativo) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.CHAT_CONVERSATION_NOT_FOUND));
        }
        
        // Verificar se usuário é participante
        ConversaParticipante participante = ConversaParticipante.findByConversaAndUsuario(conversaId, usuarioId);
        if (participante == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.CHAT_NOT_PARTICIPANT));
        }
        
        return toConversaDto(conversa, usuarioId);
    }

    @Transactional
    public ConversaDto criarConversa(CriarConversaRequest request, Long criadorId) {
        // Para conversas diretas, verificar se já existe
        if ("DIRETA".equals(request.tipo()) && request.participantesIds().size() == 1) {
            Long outroUsuarioId = request.participantesIds().get(0);
            Conversa existente = Conversa.findConversaDireta(criadorId, outroUsuarioId);
            if (existente != null) {
                return toConversaDto(existente, criadorId);
            }
        }
        
        // Criar nova conversa
        Conversa conversa = new Conversa();
        conversa.tipo = request.tipo();
        conversa.nome = request.nome();
        conversa.descricao = request.descricao();
        conversa.criadorId = criadorId;
        conversa.persist();
        
        // Adicionar criador como admin
        ConversaParticipante criadorParticipante = new ConversaParticipante();
        criadorParticipante.conversa = conversa;
        criadorParticipante.usuarioId = criadorId;
        criadorParticipante.papel = "ADMIN";
        criadorParticipante.persist();
        
        // Adicionar outros participantes
        for (Long participanteId : request.participantesIds()) {
            if (!participanteId.equals(criadorId)) {
                ConversaParticipante participante = new ConversaParticipante();
                participante.conversa = conversa;
                participante.usuarioId = participanteId;
                participante.papel = "MEMBRO";
                participante.persist();
            }
        }
        
        return toConversaDto(conversa, criadorId);
    }

    // ==================== MENSAGENS ====================

    public List<MensagemDto> listarMensagens(Long conversaId, Long usuarioId, int page, int size) {
        // Verificar se usuário é participante
        ConversaParticipante participante = ConversaParticipante.findByConversaAndUsuario(conversaId, usuarioId);
        if (participante == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.CHAT_NOT_PARTICIPANT));
        }
        
        List<Mensagem> mensagens = Mensagem.findByConversaId(conversaId, page, size);
        Set<Integer> remetenteIds = mensagens.stream()
                .map(m -> m.remetenteId)
                .filter(id -> id != null)
                .map(Long::intValue)
                .collect(Collectors.toSet());
        Map<Integer, Usuario> usuarios = loadUsuariosMap(remetenteIds);
        return mensagens.stream()
                .map(m -> toMensagemDto(m, usuarios))
                .collect(Collectors.toList());
    }

    @Transactional
    public MensagemDto enviarMensagem(Long conversaId, Long remetenteId, EnviarMensagemRequest request) {
        // Verificar se usuário é participante
        ConversaParticipante participante = ConversaParticipante.findByConversaAndUsuario(conversaId, remetenteId);
        if (participante == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.CHAT_NOT_PARTICIPANT));
        }
        
        Conversa conversa = Conversa.findById(conversaId);
        
        Mensagem mensagem = new Mensagem();
        mensagem.conversa = conversa;
        mensagem.remetenteId = remetenteId;
        mensagem.conteudo = request.conteudo();
        mensagem.tipo = request.tipo() != null ? request.tipo() : "TEXTO";
        mensagem.persist();
        
        // Atualizar data da conversa
        conversa.dataAtualizacao = LocalDateTime.now();
        
        return toMensagemDto(mensagem);
    }

    @Transactional
    public MensagemDto enviarMensagemComAnexo(Long conversaId, Long remetenteId, String conteudo, FileUpload file) throws IOException {
        // Verificar se usuário é participante
        ConversaParticipante participante = ConversaParticipante.findByConversaAndUsuario(conversaId, remetenteId);
        if (participante == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.CHAT_NOT_PARTICIPANT));
        }
        
        Conversa conversa = Conversa.findById(conversaId);
        
        // Criar mensagem
        Mensagem mensagem = new Mensagem();
        mensagem.conversa = conversa;
        mensagem.remetenteId = remetenteId;
        mensagem.conteudo = conteudo;
        mensagem.tipo = "ARQUIVO";
        mensagem.persist();
        
        // Salvar arquivo
        String nomeOriginal = file.fileName();
        String extensao = nomeOriginal.contains(".") ? nomeOriginal.substring(nomeOriginal.lastIndexOf(".")) : "";
        String nomeUnico = UUID.randomUUID().toString() + extensao;
        
        Path diretorio = Path.of(uploadPath, conversaId.toString());
        Files.createDirectories(diretorio);
        Path destino = diretorio.resolve(nomeUnico);
        Files.copy(file.filePath(), destino, StandardCopyOption.REPLACE_EXISTING);
        
        // Criar anexo
        MensagemAnexo anexo = new MensagemAnexo();
        anexo.mensagem = mensagem;
        anexo.nomeOriginal = nomeOriginal;
        anexo.nomeArquivo = nomeUnico;
        anexo.tipoArquivo = file.contentType();
        anexo.tamanhoBytes = file.size();
        anexo.caminho = destino.toString();
        anexo.persist();
        
        // Atualizar data da conversa
        conversa.dataAtualizacao = LocalDateTime.now();
        
        return toMensagemDto(mensagem);
    }

    @Transactional
    public void marcarComoLida(Long conversaId, Long usuarioId) {
        ConversaParticipante participante = ConversaParticipante.findByConversaAndUsuario(conversaId, usuarioId);
        if (participante != null) {
            participante.ultimaLeitura = LocalDateTime.now();
        }
    }

    // ==================== CONTADORES ====================

    public long contarNaoLidas(Long usuarioId) {
        String query = "SELECT COUNT(m) FROM Mensagem m " +
                      "JOIN ConversaParticipante cp ON m.conversa.id = cp.conversa.id " +
                      "WHERE cp.usuarioId = :usuarioId AND cp.ativo = true " +
                      "AND m.ativo = true AND m.remetenteId != :usuarioId " +
                      "AND (cp.ultimaLeitura IS NULL OR m.dataEnvio > cp.ultimaLeitura)";
        
        return em.createQuery(query, Long.class)
                .setParameter("usuarioId", usuarioId)
                .getSingleResult();
    }

    // ==================== BUSCA DE USUÁRIOS ====================

    public List<ParticipanteResumoDto> buscarUsuarios(String termo, Long usuarioAtualId) {
        String query = "SELECT u FROM Usuario u WHERE u.ativo = true AND u.id != :usuarioId " +
                      "AND (LOWER(u.nome) LIKE :termo OR LOWER(u.email) LIKE :termo) " +
                      "ORDER BY u.nome";
        
        List<Usuario> usuarios = em.createQuery(query, Usuario.class)
                .setParameter("usuarioId", usuarioAtualId)
                .setParameter("termo", "%" + termo.toLowerCase() + "%")
                .setMaxResults(20)
                .getResultList();
        
        return usuarios.stream()
                .map(u -> new ParticipanteResumoDto(
                        Long.valueOf(u.id),
                        u.nome,
                        u.email,
                        u.fotoPerfil,
                        null,
                        false
                ))
                .collect(Collectors.toList());
    }

    // ==================== CONVERSORES ====================

    private Map<Long, Mensagem> loadUltimasMensagens(List<Long> conversaIds) {
        if (conversaIds.isEmpty()) {
            return Map.of();
        }
        @SuppressWarnings("unchecked")
        List<Mensagem> ultimas = em.createQuery(
                        "SELECT m FROM Mensagem m WHERE m.ativo = true AND m.id IN ("
                                + "SELECT MAX(m2.id) FROM Mensagem m2 WHERE m2.conversa.id IN :ids "
                                + "AND m2.ativo = true GROUP BY m2.conversa.id)",
                        Mensagem.class)
                .setParameter("ids", conversaIds)
                .getResultList();
        Map<Long, Mensagem> map = new HashMap<>();
        for (Mensagem m : ultimas) {
            if (m.conversa != null && m.conversa.id != null) {
                map.put(m.conversa.id, m);
            }
        }
        return map;
    }

    private Map<Long, Long> loadNaoLidasPorConversa(List<Long> conversaIds, Long usuarioId) {
        if (conversaIds.isEmpty()) {
            return Map.of();
        }
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery(
                        "SELECT m.conversa.id, COUNT(m) FROM Mensagem m, ConversaParticipante cp "
                                + "WHERE m.conversa.id = cp.conversa.id AND cp.usuarioId = :uid AND cp.ativo = true "
                                + "AND m.conversa.id IN :ids AND m.ativo = true AND m.remetenteId != :uid "
                                + "AND (cp.ultimaLeitura IS NULL OR m.dataEnvio > cp.ultimaLeitura) "
                                + "GROUP BY m.conversa.id",
                        Object[].class)
                .setParameter("uid", usuarioId)
                .setParameter("ids", conversaIds)
                .getResultList();
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            if (row != null && row.length >= 2 && row[0] != null) {
                map.put((Long) row[0], ((Number) row[1]).longValue());
            }
        }
        return map;
    }

    private Map<Integer, Usuario> loadUsuariosMap(Set<Integer> usuarioIds) {
        if (usuarioIds == null || usuarioIds.isEmpty()) {
            return Map.of();
        }
        List<Usuario> usuarios = Usuario.list("id in ?1", usuarioIds);
        return PanacheMaps.<Usuario, Integer>byId(usuarios, u -> u.id);
    }

    private ConversaDto toConversaDtoBatch(
            Conversa conversa,
            Long usuarioId,
            List<ConversaParticipante> participantesEntidade,
            Map<Integer, Usuario> usuarios,
            Mensagem ultimaMensagem,
            long naoLidas) {
        MensagemDto ultimaMensagemDto = ultimaMensagem != null
                ? toMensagemDto(ultimaMensagem, usuarios)
                : null;

        List<ParticipanteResumoDto> participantes = new ArrayList<>();
        for (ConversaParticipante cp : participantesEntidade) {
            if (cp.ativo == null || !cp.ativo || cp.usuarioId == null) {
                continue;
            }
            Usuario u = usuarios.get(cp.usuarioId.intValue());
            if (u != null) {
                participantes.add(new ParticipanteResumoDto(
                        cp.usuarioId,
                        u.nome,
                        u.email,
                        u.fotoPerfil,
                        cp.papel,
                        false
                ));
            }
        }

        String nomeConversa = conversa.nome;
        if ("DIRETA".equals(conversa.tipo) && participantes.size() >= 2) {
            for (ParticipanteResumoDto p : participantes) {
                if (!p.usuarioId().equals(usuarioId)) {
                    nomeConversa = p.nome();
                    break;
                }
            }
        }

        return new ConversaDto(
                conversa.id,
                conversa.tipo,
                nomeConversa,
                conversa.descricao,
                conversa.imagem,
                conversa.criadorId,
                conversa.dataCriacao,
                conversa.dataAtualizacao,
                conversa.ativo,
                naoLidas,
                ultimaMensagemDto,
                participantes
        );
    }

    private ConversaDto toConversaDto(Conversa conversa, Long usuarioId) {
        // Buscar última mensagem
        Mensagem ultimaMensagem = Mensagem.findUltimaMensagem(conversa.id);
        MensagemDto ultimaMensagemDto = ultimaMensagem != null ? toMensagemDto(ultimaMensagem) : null;
        
        // Contar não lidas
        ConversaParticipante participante = ConversaParticipante.findByConversaAndUsuario(conversa.id, usuarioId);
        long naoLidas = 0;
        if (participante != null) {
            naoLidas = Mensagem.countNaoLidasPorConversa(conversa.id, usuarioId, participante.ultimaLeitura);
        }
        
        // Buscar participantes
        List<ParticipanteResumoDto> participantes = new ArrayList<>();
        if (conversa.participantes != null) {
            for (ConversaParticipante cp : conversa.participantes) {
                if (cp.ativo) {
                    Usuario u = Usuario.findById(cp.usuarioId.intValue());
                    if (u != null) {
                        participantes.add(new ParticipanteResumoDto(
                                cp.usuarioId,
                                u.nome,
                                u.email,
                                u.fotoPerfil,
                                cp.papel,
                                false
                        ));
                    }
                }
            }
        }
        
        // Para conversas diretas, usar o nome do outro participante
        String nomeConversa = conversa.nome;
        if ("DIRETA".equals(conversa.tipo) && participantes.size() >= 2) {
            for (ParticipanteResumoDto p : participantes) {
                if (!p.usuarioId().equals(usuarioId)) {
                    nomeConversa = p.nome();
                    break;
                }
            }
        }
        
        return new ConversaDto(
                conversa.id,
                conversa.tipo,
                nomeConversa,
                conversa.descricao,
                conversa.imagem,
                conversa.criadorId,
                conversa.dataCriacao,
                conversa.dataAtualizacao,
                conversa.ativo,
                naoLidas,
                ultimaMensagemDto,
                participantes
        );
    }

    private MensagemDto toMensagemDto(Mensagem mensagem) {
        return toMensagemDto(mensagem, null);
    }

    private MensagemDto toMensagemDto(Mensagem mensagem, Map<Integer, Usuario> usuarios) {
        Usuario remetente = null;
        if (mensagem.remetenteId != null) {
            remetente = usuarios != null
                    ? usuarios.get(mensagem.remetenteId.intValue())
                    : Usuario.findById(mensagem.remetenteId.intValue());
        }
        String remetenteNome = remetente != null ? remetente.nome : "Usuário";
        String remetenteFoto = remetente != null ? remetente.fotoPerfil : null;
        
        // Buscar anexos
        List<MensagemAnexoDto> anexosDto = null;
        if (mensagem.anexos != null && !mensagem.anexos.isEmpty()) {
            anexosDto = mensagem.anexos.stream()
                    .filter(a -> a.ativo)
                    .map(this::toAnexoDto)
                    .collect(Collectors.toList());
        }
        
        return new MensagemDto(
                mensagem.id,
                mensagem.conversa.id,
                mensagem.remetenteId,
                remetenteNome,
                remetenteFoto,
                mensagem.conteudo,
                mensagem.tipo,
                mensagem.dataEnvio,
                mensagem.dataEdicao,
                mensagem.editada,
                mensagem.ativo,
                anexosDto
        );
    }

    private MensagemAnexoDto toAnexoDto(MensagemAnexo anexo) {
        String urlDownload = "/api/chat/anexos/" + anexo.id + "/download";
        return new MensagemAnexoDto(
                anexo.id,
                anexo.mensagem.id,
                anexo.nomeOriginal,
                anexo.nomeArquivo,
                anexo.tipoArquivo,
                anexo.tamanhoBytes,
                anexo.caminho,
                urlDownload,
                anexo.dataUpload,
                anexo.ativo
        );
    }
}
