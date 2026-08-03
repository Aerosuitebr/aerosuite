package com.aerosuite.service;

import org.jboss.logging.Logger;
import com.aerosuite.domain.Ticket;
import com.aerosuite.domain.TicketAttachment;
import com.aerosuite.domain.TicketComment;
import com.aerosuite.dto.TicketDto;
import com.aerosuite.dto.TicketSlaPreviewDto;
import com.aerosuite.dto.TicketAttachmentDto;
import com.aerosuite.dto.TicketCommentDto;
import com.aerosuite.mapping.TicketMapper;
import com.aerosuite.mapping.TicketAttachmentMapper;
import com.aerosuite.mapping.TicketCommentMapper;
import com.aerosuite.security.TenantDataAccess;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDateTime;
import java.util.*;

@ApplicationScoped
public class TicketService {

    private static final Logger LOG = Logger.getLogger(TicketService.class);
    @Inject TicketMapper mapper;
    @Inject TicketAttachmentMapper attachmentMapper;
    @Inject TicketCommentMapper commentMapper;
    @Inject EmailService emailService;
    @Inject TicketUserNotificationService ticketUserNotificationService;
    @Inject TenantDataAccess tenantDataAccess;

    public record SearchResult(List<TicketDto> items, long total) {}

    private Ticket requireTicket(Long id) {
        Ticket ticket = Ticket.find("id = ?1 and isActive = true", id).firstResult();
        if (ticket == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.TICKET_NOT_FOUND));
        }
        return ticket;
    }

    public TicketDto getById(Long id) {
        Ticket ticket = Ticket.find("id = ?1 and isActive = true", id).firstResult();
        return ticket != null ? mapper.toDto(ticket) : null;
    }

    public TicketDto getByNumero(String numero) {
        Ticket ticket = Ticket.find("numero = ?1 and isActive = true", numero).firstResult();
        return ticket != null ? mapper.toDto(ticket) : null;
    }

    public SearchResult search(Integer page, Integer size, String sort, String q, 
                                String status, String prioridade, String tipo,
                                Long usuarioId, Long atendenteId, Boolean isActive) {
        int p = page != null && page >= 0 ? page : 0;
        int s = size != null && size > 0 ? size : 10;

        Sort sortObj = Sort.by("dataAbertura").descending();
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            boolean desc = parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc");
            sortObj = desc ? Sort.by(field).descending() : Sort.by(field).ascending();
        }

        StringJoiner where = new StringJoiner(" and ");
        Map<String, Object> params = new HashMap<>();

        // Filtrar apenas ativos por padrão
        if (isActive == null || isActive) {
            where.add("isActive = :isActive");
            params.put("isActive", true);
        }

        if (q != null && !q.isBlank()) {
            where.add("(LOWER(titulo) like :q or LOWER(descricao) like :q or LOWER(numero) like :q)");
            params.put("q", "%" + q.toLowerCase() + "%");
        }

        if (status != null && !status.isBlank()) {
            where.add("status = :status");
            params.put("status", status);
        }

        if (prioridade != null && !prioridade.isBlank()) {
            where.add("prioridade = :prioridade");
            params.put("prioridade", prioridade);
        }

        if (tipo != null && !tipo.isBlank()) {
            where.add("tipo = :tipo");
            params.put("tipo", tipo);
        }

        if (usuarioId != null) {
            where.add("usuarioId = :usuarioId");
            params.put("usuarioId", usuarioId);
        }

        if (atendenteId != null) {
            where.add("atendenteId = :atendenteId");
            params.put("atendenteId", atendenteId);
        }

        PanacheQuery<Ticket> query = where.length() > 0
            ? Ticket.find(where.toString(), sortObj, params)
            : Ticket.findAll(sortObj);

        long total = query.count();
        List<TicketDto> items = query.page(Page.of(p, s)).list().stream().map(mapper::toDto).toList();
        return new SearchResult(items, total);
    }

    @Transactional
    public TicketDto create(TicketDto dto) {
        Ticket ticket = mapper.toEntity(dto);
        ticket.isActive = true;
        ticket.tenantId = tenantDataAccess.currentTenantIdStr();
        ticket.persist();
        
        // Enviar email para o responsável
        try {
            emailService.notificarNovoChamado(ticket);
        } catch (Exception e) {
            // Log error but don't fail the transaction
            LOG.warnf(e, "Erro ao enviar email de novo chamado: %s", e.getMessage());
        }
        
        return mapper.toDto(ticket);
    }

    @Transactional
    public TicketDto update(Long id, TicketDto dto) {
        Ticket ticket = requireTicket(id);
        String statusAnterior = ticket.status;
        String prioridadeAnterior = ticket.prioridade;
        String ambienteAnterior = ticket.ambiente;
        String categoriaAnterior = ticket.categoria;
        mapper.updateEntity(dto, ticket);
        
        if (slaInputsChanged(prioridadeAnterior, ambienteAnterior, categoriaAnterior, ticket)) {
            ticket.aplicarPoliticaSla();
        }
        
        // Se status mudou, registrar comentário
        if (dto.status() != null && !dto.status().equals(statusAnterior)) {
            registrarMudancaStatus(ticket, statusAnterior, dto.status(), dto.atendenteId(), dto.atendenteNome());
            
            // Atualizar datas relevantes
            if ("RESOLVIDO".equals(dto.status()) || "FECHADO".equals(dto.status())) {
                if (ticket.dataResolucao == null) {
                    ticket.dataResolucao = LocalDateTime.now();
                }
                if ("FECHADO".equals(dto.status())) {
                    ticket.dataFechamento = LocalDateTime.now();
                }
            }
        }
        
        return mapper.toDto(ticket);
    }

    public TicketSlaPreviewDto previewSla(String prioridade, String ambiente, String categoria) {
        TicketSlaPolicy.SlaTargets sla = TicketSlaPolicy.calcular(prioridade, ambiente, categoria);
        return new TicketSlaPreviewDto(
                sla.primeiraRespostaMinutos(),
                sla.resolucaoMinutos(),
                sla.primeiraRespostaHoras(),
                sla.resolucaoHoras(),
                sla.ambienteModifier());
    }

    private static boolean slaInputsChanged(
            String prioridadeAnterior,
            String ambienteAnterior,
            String categoriaAnterior,
            Ticket ticket) {
        return !Objects.equals(normalizeSlaInput(prioridadeAnterior), normalizeSlaInput(ticket.prioridade))
                || !Objects.equals(normalizeSlaInput(ambienteAnterior), normalizeSlaInput(ticket.ambiente))
                || !Objects.equals(normalizeSlaInput(categoriaAnterior), normalizeSlaInput(ticket.categoria));
    }

    private static String normalizeSlaInput(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    @Transactional
    public TicketDto atribuirAtendente(Long id, Long atendenteId, String atendenteNome) {
        Ticket ticket = requireTicket(id);
        ticket.atendenteId = atendenteId;
        ticket.atendenteNome = atendenteNome;
        
        // Se é primeira resposta, registrar data
        if (ticket.dataPrimeiraResposta == null) {
            ticket.dataPrimeiraResposta = LocalDateTime.now();
            verificarSLAPrimeiraResposta(ticket);
        }
        
        // Mudar status para EM_ANALISE se estiver ABERTO
        if ("ABERTO".equals(ticket.status)) {
            String statusAnterior = ticket.status;
            ticket.status = "EM_ANALISE";
            registrarMudancaStatus(ticket, statusAnterior, "EM_ANALISE", atendenteId, atendenteNome);
            ticketUserNotificationService.onStatusChanged(ticket, statusAnterior, "EM_ANALISE", null);
        }
        
        return mapper.toDto(ticket);
    }

    @Transactional
    public TicketDto alterarStatus(Long id, String novoStatus, Long usuarioId, String usuarioNome, String usuarioTipo) {
        Ticket ticket = requireTicket(id);
        String statusAnterior = ticket.status;
        ticket.status = novoStatus;
        
        registrarMudancaStatus(ticket, statusAnterior, novoStatus, usuarioId, usuarioNome);
        
        // Atualizar datas relevantes
        if ("RESOLVIDO".equals(novoStatus) || "FECHADO".equals(novoStatus)) {
            if (ticket.dataResolucao == null) {
                ticket.dataResolucao = LocalDateTime.now();
                verificarSLAResolucao(ticket);
            }
            if ("FECHADO".equals(novoStatus)) {
                ticket.dataFechamento = LocalDateTime.now();
            }
        }

        String motivoAguardando = null;
        if ("AGUARDANDO_USUARIO".equals(novoStatus)) {
            motivoAguardando = "Por favor, verifique o chamado no sistema.";
            if (ticket.comentarios != null && !ticket.comentarios.isEmpty()) {
                TicketComment ultimoComentario = ticket.comentarios.get(ticket.comentarios.size() - 1);
                if (ultimoComentario.conteudo != null) {
                    motivoAguardando = ultimoComentario.conteudo;
                }
            }
        }

        try {
            ticketUserNotificationService.onStatusChanged(ticket, statusAnterior, novoStatus, motivoAguardando);
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao enviar notificações de status: %s", e.getMessage());
        }
        
        return mapper.toDto(ticket);
    }

    @Transactional
    public TicketCommentDto addComment(Long ticketId, TicketCommentDto dto) {
        Ticket ticket = requireTicket(ticketId);
        if (ticket == null) throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.TICKET_NOT_FOUND));
        
        TicketComment comment = commentMapper.toEntity(dto);
        comment.ticket = ticket;
        comment.isActive = true;
        comment.persist();
        
        // Se é resposta de atendente, notificar o usuário
        if ("ATENDENTE".equals(dto.usuarioTipo())) {
            try {
                ticketUserNotificationService.onAttendantReply(ticket, dto.conteudo(), dto.usuarioNome());
            } catch (Exception e) {
                LOG.warnf(e, "Erro ao enviar notificações de resposta: %s", e.getMessage());
            }
        }
        
        // Se é resposta de usuário, notificar o suporte
        if ("USUARIO".equals(dto.usuarioTipo())) {
            try {
                emailService.notificarRespostaUsuario(ticket, dto.conteudo(), dto.usuarioNome());
                // Se estava aguardando usuário, mudar para em andamento
                if ("AGUARDANDO_USUARIO".equals(ticket.status)) {
                    String statusAnterior = ticket.status;
                    ticket.status = "EM_ANDAMENTO";
                    ticketUserNotificationService.onStatusChanged(ticket, statusAnterior, "EM_ANDAMENTO", null);
                }
            } catch (Exception e) {
                LOG.warnf(e, "Erro ao enviar notificação de resposta do usuário: %s", e.getMessage());
            }
        }
        
        // Se é primeira resposta de atendente
        if ("ATENDENTE".equals(dto.usuarioTipo()) && ticket.dataPrimeiraResposta == null) {
            ticket.dataPrimeiraResposta = LocalDateTime.now();
            verificarSLAPrimeiraResposta(ticket);
        }
        
        return commentMapper.toDto(comment);
    }

    @Transactional
    public TicketAttachmentDto addAttachment(Long ticketId, TicketAttachmentDto dto) {
        Ticket ticket = requireTicket(ticketId);
        if (ticket == null) throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.TICKET_NOT_FOUND));
        
        TicketAttachment attachment = attachmentMapper.toEntity(dto);
        attachment.ticket = ticket;
        attachment.isActive = true;
        attachment.persist();
        
        return attachmentMapper.toDto(attachment);
    }

    @Transactional
    public TicketDto avaliar(Long id, Integer avaliacao, String comentario) {
        Ticket ticket = requireTicket(id);
        if (ticket == null) throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.TICKET_NOT_FOUND));
        
        ticket.avaliacao = avaliacao;
        ticket.comentarioAvaliacao = comentario;
        
        return mapper.toDto(ticket);
    }

    @Transactional
    public void delete(Long id) {
        Ticket ticket = requireTicket(id);
        if (ticket != null) {
            ticket.isActive = false;
        }
    }

    // Métodos de estatísticas
    public Map<String, Long> getEstatisticas(Long usuarioId) {
        Map<String, Long> stats = new HashMap<>();
        
        String baseQuery = usuarioId != null ? "usuarioId = ?1 and isActive = true" : "isActive = true";
        Object[] baseParams = usuarioId != null ? new Object[]{usuarioId} : new Object[]{};
        
        stats.put("total", Ticket.count(baseQuery, baseParams));
        stats.put("abertos", Ticket.count(baseQuery + " and status = 'ABERTO'", baseParams));
        stats.put("emAnalise", Ticket.count(baseQuery + " and status = 'EM_ANALISE'", baseParams));
        stats.put("emAndamento", Ticket.count(baseQuery + " and status = 'EM_ANDAMENTO'", baseParams));
        stats.put("aguardandoUsuario", Ticket.count(baseQuery + " and status = 'AGUARDANDO_USUARIO'", baseParams));
        stats.put("resolvidos", Ticket.count(baseQuery + " and status = 'RESOLVIDO'", baseParams));
        stats.put("fechados", Ticket.count(baseQuery + " and status = 'FECHADO'", baseParams));
        
        return stats;
    }

    /** Métricas da fila de atendimento (tenant atual). */
    public Map<String, Long> getEstatisticasAtendimento(Long atendenteId) {
        Map<String, Long> stats = new HashMap<>();
        String active = "isActive = true and status not in ('FECHADO', 'CANCELADO')";

        stats.put("totalAtivos", Ticket.count(active));
        stats.put("abertos", Ticket.count(active + " and status = 'ABERTO'"));
        stats.put("emAnalise", Ticket.count(active + " and status = 'EM_ANALISE'"));
        stats.put("emAndamento", Ticket.count(active + " and status = 'EM_ANDAMENTO'"));
        stats.put("aguardandoUsuario", Ticket.count(active + " and status = 'AGUARDANDO_USUARIO'"));
        stats.put("semAtendente", Ticket.count(
                active + " and status in ('ABERTO', 'EM_ANALISE') and atendenteId is null"));
        stats.put("slaEstourado", Ticket.count(
                active + " and status not in ('RESOLVIDO') and (slaPrimeiraRespostaEstourado = true or slaResolucaoEstourado = true)"));
        if (atendenteId != null) {
            stats.put("meusAtendimentos", Ticket.count(active + " and atendenteId = ?1", atendenteId));
            stats.put("meusAbertos", Ticket.count(
                    active + " and atendenteId = ?1 and status in ('EM_ANDAMENTO', 'EM_ANALISE', 'AGUARDANDO_USUARIO')",
                    atendenteId));
        } else {
            stats.put("meusAtendimentos", 0L);
            stats.put("meusAbertos", 0L);
        }
        stats.put("resolvidos", Ticket.count("isActive = true and status = 'RESOLVIDO'"));
        return stats;
    }

    // Métodos auxiliares privados
    private void registrarMudancaStatus(Ticket ticket, String statusAnterior, String statusNovo, Long usuarioId, String usuarioNome) {
        TicketComment comment = new TicketComment();
        comment.ticket = ticket;
        comment.tipo = "ALTERACAO_STATUS";
        comment.conteudo = String.format("Status alterado de %s para %s", statusAnterior, statusNovo);
        comment.statusAnterior = statusAnterior;
        comment.statusNovo = statusNovo;
        comment.usuarioId = usuarioId;
        comment.usuarioNome = usuarioNome;
        comment.usuarioTipo = "SISTEMA";
        comment.visivelUsuario = true;
        comment.isActive = true;
        comment.persist();
    }

    private void verificarSLAPrimeiraResposta(Ticket ticket) {
        if (ticket.dataAbertura == null) {
            return;
        }
        long minutos = slaPrimeiraRespostaMinutos(ticket);
        if (minutos <= 0) {
            return;
        }
        LocalDateTime limiteResposta = ticket.dataAbertura.plusMinutes(minutos);
        ticket.slaPrimeiraRespostaEstourado = LocalDateTime.now().isAfter(limiteResposta);
    }

    private void verificarSLAResolucao(Ticket ticket) {
        if (ticket.dataAbertura == null) {
            return;
        }
        long minutos = slaResolucaoMinutos(ticket);
        if (minutos <= 0) {
            return;
        }
        LocalDateTime limiteResolucao = ticket.dataAbertura.plusMinutes(minutos);
        ticket.slaResolucaoEstourado = LocalDateTime.now().isAfter(limiteResolucao);
    }

    private static long slaPrimeiraRespostaMinutos(Ticket ticket) {
        if (ticket.slaPrimeiraRespostaMinutos != null && ticket.slaPrimeiraRespostaMinutos > 0) {
            return ticket.slaPrimeiraRespostaMinutos;
        }
        if (ticket.slaPrimeiraRespostaHoras != null && ticket.slaPrimeiraRespostaHoras > 0) {
            return ticket.slaPrimeiraRespostaHoras.longValue() * 60L;
        }
        return 0L;
    }

    private static long slaResolucaoMinutos(Ticket ticket) {
        if (ticket.slaResolucaoMinutos != null && ticket.slaResolucaoMinutos > 0) {
            return ticket.slaResolucaoMinutos;
        }
        if (ticket.slaResolucaoHoras != null && ticket.slaResolucaoHoras > 0) {
            return ticket.slaResolucaoHoras.longValue() * 60L;
        }
        return 0L;
    }
}
