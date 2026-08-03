package com.aerosuite.api;

import org.jboss.logging.Logger;
import com.aerosuite.dto.SistemaAtualizacaoDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.i18n.SistemaAtualizacaoMessages;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.SistemaAtualizacaoService;
import com.aerosuite.service.SistemaAtualizacaoBroadcaster;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;
import jakarta.ws.rs.container.ContainerRequestContext;
import java.util.Map;
import java.util.function.Consumer;

@Path("/api/sistema-atualizacao")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SistemaAtualizacaoResource {

    private static final Logger LOG = Logger.getLogger(SistemaAtualizacaoResource.class);
    
    @Inject
    SistemaAtualizacaoService service;
    
    @Inject
    jakarta.enterprise.inject.Instance<SistemaAtualizacaoBroadcaster> broadcasterInstance;
    
    @Inject
    Sse sse;
    
    private SistemaAtualizacaoBroadcaster getBroadcaster() {
        if (broadcasterInstance.isResolvable()) {
            return broadcasterInstance.get();
        }
        return null;
    }
    
    @GET
    @Path("/status")
    public Response getStatus() {
        try {
            SistemaAtualizacaoDto status = service.getStatus();
            if (status == null) {
                // Sempre retornar a versão atual, mesmo quando não há atualização disponível
                // Usar o método do serviço para obter a versão atual
                String versaoAtual = service.getVersaoAtual();
                return Response.ok(Map.of(
                    "status", "ATUALIZADO", 
                    "versaoAtual", versaoAtual,
                    "message", ApiI18nMessages.encode(
                            SistemaAtualizacaoMessages.SYSTEM_UP_TO_DATE, "version", versaoAtual)
                )).build();
            }
            return Response.ok(status).build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao buscar status de atualização: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", true, "message", ApiI18nMessages.messageOrFallback(
                        ApiI18nMessages.COMMON_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }
    
    @OPTIONS
    @Path("/verificar")
    public Response verificarAtualizacaoOptions(@Context ContainerRequestContext requestContext) {
        String origin = requestContext.getHeaderString("Origin");
        String originHeader = origin != null && (origin.contains("localhost") || origin.contains("127.0.0.1") || 
            origin.contains("4200") || origin.contains("8081")) ? origin : "*";
        
        
        return Response.ok()
            .header("Access-Control-Allow-Origin", originHeader)
            .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
            .header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Last-Event-ID")
            .header("Access-Control-Allow-Credentials", "true")
            .header("Access-Control-Max-Age", "3600")
            .build();
    }
    
    @POST
    @Path("/verificar")
    public Response verificarAtualizacao() {
        
        try {
            String versaoAtual = service.getVersaoAtual();
            
            service.verificarAtualizacoesComContexto();
            
            // Buscar status atualizado após a verificação
            SistemaAtualizacaoDto status = service.getStatus();
            String versaoEncontrada = status != null ? status.versaoDisponivel() : null;
            
            // Se não houver versão disponível no status, tentar obter diretamente da verificação
            // Isso garante que mesmo quando as versões são iguais, a versão encontrada seja retornada
            if (versaoEncontrada == null) {
                // A verificação já foi executada, então vamos buscar a versão encontrada
                // através de uma chamada direta ao método de verificação
                // Mas como já foi executada, vamos usar o status que deve ter sido atualizado
                // Se ainda não tiver, vamos retornar a versão atual como encontrada
                versaoEncontrada = versaoAtual;
            }
            
            
            String message;
            if (versaoEncontrada != null && !versaoEncontrada.equals(versaoAtual)) {
                message = ApiI18nMessages.encode(
                        SistemaAtualizacaoMessages.VERIFY_NEW_VERSION_FOUND, "version", versaoEncontrada);
            } else if (versaoEncontrada != null && versaoEncontrada.equals(versaoAtual)) {
                message = ApiI18nMessages.encode(
                        SistemaAtualizacaoMessages.VERIFY_UP_TO_DATE_DRIVE,
                        java.util.Map.of("version", versaoAtual, "driveVersion", versaoEncontrada));
            } else {
                message = ApiI18nMessages.encode(
                        SistemaAtualizacaoMessages.SYSTEM_UP_TO_DATE, "version", versaoAtual);
            }

            return Response.ok(Map.of(
                "success", true,
                "message", message,
                "versaoAtual", versaoAtual,
                "versaoEncontrada", versaoEncontrada != null ? versaoEncontrada : versaoAtual,
                "status", status != null ? status.status() : "ATUALIZADO",
                "temAtualizacao", versaoEncontrada != null && !versaoEncontrada.equals(versaoAtual)
            )).build();
        } catch (Exception e) {
            LOG.warn("==========================================");
            LOG.warn("ERRO ao verificar atualização");
            LOG.warn("==========================================");
            LOG.warnf(e, "Erro: %s", e.getMessage());
            LOG.warnf("Tipo: %s", e.getClass().getName());
            LOG.warn("==========================================");
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", true, "message", ApiI18nMessages.messageOrFallback(
                        ApiI18nMessages.COMMON_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }
    
    @POST
    @Path("/{id}/aprovar")
    @Consumes(MediaType.APPLICATION_JSON)
    @RequiresFuncionalidades(allOf = {"CONFIGURACOES"})
    public Response aprovarAtualizacao(@PathParam("id") Integer id, Map<String, Object> request) {
        try {
            
            Object usuarioIdObj = request.get("usuarioId");
            Integer usuarioId = null;
            
            if (usuarioIdObj instanceof Integer) {
                usuarioId = (Integer) usuarioIdObj;
            } else if (usuarioIdObj instanceof Number) {
                usuarioId = ((Number) usuarioIdObj).intValue();
            } else if (usuarioIdObj != null) {
                try {
                    usuarioId = Integer.parseInt(usuarioIdObj.toString());
                } catch (NumberFormatException e) {
                    LOG.warnf(e, "Erro ao converter usuarioId: %s", e.getMessage());
                }
            }
            
            
            if (usuarioId == null) {
                LOG.warn("usuarioId é obrigatório mas não foi fornecido");
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", true, "message", ApiI18nMessages.encode(ApiI18nMessages.UPDATE_USER_ID_REQUIRED)))
                    .build();
            }
            
            SistemaAtualizacaoDto atualizacao = service.aprovarAtualizacao(id, usuarioId);
            return Response.ok(atualizacao).build();
        } catch (RuntimeException e) {
            LOG.warnf(e, "RuntimeException ao aprovar atualização: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", true, "message", ApiI18nMessages.messageOrFallback(
                        ApiI18nMessages.COMMON_OPERATION_ERROR, e.getMessage())))
                .build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao aprovar atualização: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", true, "message", ApiI18nMessages.messageOrFallback(
                        ApiI18nMessages.COMMON_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }
    
    @POST
    @Path("/{id}/cancelar")
    @RequiresFuncionalidades(allOf = {"CONFIGURACOES"})
    public Response cancelarAtualizacao(@PathParam("id") Integer id, Map<String, String> request) {
        try {
            String motivo = request.get("motivo");
            service.cancelarAtualizacao(id, motivo);
            return Response.ok(Map.of(
                    "success", true,
                    "message", SistemaAtualizacaoMessages.cancelledByUser()))
                    .build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao cancelar atualização: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", true, "message", ApiI18nMessages.messageOrFallback(
                        ApiI18nMessages.COMMON_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }
    
    @OPTIONS
    @Path("/events")
    public Response eventosOptions(@Context HttpHeaders headers) {
        String origin = headers.getHeaderString("Origin");
        String originHeader = getOriginHeader(origin);
        
        
        return Response.ok()
            .header("Access-Control-Allow-Origin", originHeader)
            .header("Access-Control-Allow-Methods", "GET, OPTIONS")
            .header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Last-Event-ID")
            .header("Access-Control-Allow-Credentials", "true")
            .header("Access-Control-Expose-Headers", "Content-Type, Cache-Control, Last-Event-ID")
            .header("Access-Control-Max-Age", "3600")
            .build();
    }
    
    @GET
    @Path("/events")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @RequiresFuncionalidades(onlyAuthenticated = true)
    public void eventos(@Context SseEventSink eventSink, @Context HttpHeaders headers, @Context ContainerRequestContext requestContext) {
        try {
            String origin = headers.getHeaderString("Origin");
            
            // Verificar se eventSink é válido
            if (eventSink == null) {
                LOG.warn("SseEventSink é null no endpoint SSE");
                return;
            }
            
            // Verificar se as dependências estão injetadas
            if (sse == null) {
                LOG.warn("Sse é null no endpoint SSE");
                return;
            }
            
            SistemaAtualizacaoBroadcaster broadcaster = getBroadcaster();
            if (broadcaster == null) {
                LOG.warn("SistemaAtualizacaoBroadcaster é null no endpoint SSE");
                return;
            }
            
            // IMPORTANTE: Para SSE, os headers CORS devem ser adicionados ANTES de qualquer evento
            // O problema é que SSE não passa pelo ContainerResponseFilter normalmente
            // Vamos tentar enviar um evento inicial com headers explícitos
            String originHeader = getOriginHeader(origin);
            
            // Enviar um evento inicial imediatamente para estabelecer a conexão SSE
            @SuppressWarnings("unchecked")
            final Consumer<SistemaAtualizacaoBroadcaster.AtualizacaoProgress>[] listenerRef = new Consumer[1];
            
            Consumer<SistemaAtualizacaoBroadcaster.AtualizacaoProgress> listener = progress -> {
                try {
                    if (eventSink != null && !eventSink.isClosed()) {
                        // Serializar para JSON manualmente para garantir compatibilidade
                        String json = String.format(
                            "{\"updateId\":\"%s\",\"status\":\"%s\",\"contadorRegressivo\":%s,\"mensagem\":\"%s\",\"versaoDisponivel\":\"%s\",\"versaoAtual\":\"%s\",\"aprovadoPor\":%s}",
                            progress.updateId() != null ? escapeJson(progress.updateId()) : "",
                            progress.status() != null ? escapeJson(progress.status()) : "",
                            progress.contadorRegressivo() != null ? progress.contadorRegressivo() : "null",
                            progress.mensagem() != null ? escapeJson(progress.mensagem()) : "",
                            progress.versaoDisponivel() != null ? escapeJson(progress.versaoDisponivel()) : "",
                            progress.versaoAtual() != null ? escapeJson(progress.versaoAtual()) : "",
                            progress.aprovadoPor() != null ? progress.aprovadoPor() : "null"
                        );
                        eventSink.send(sse.newEventBuilder()
                            .name("atualizacao")
                            .data(json)
                            .build());
                    } else {
                        // Conexão fechada, remover listener
                        if (listenerRef[0] != null) {
                            SistemaAtualizacaoBroadcaster bc = getBroadcaster();
                            if (bc != null) {
                                bc.removeListener(listenerRef[0]);
                            }
                        }
                    }
                } catch (Exception e) {
                    LOG.warnf(e, "Erro ao enviar evento SSE: %s", e.getMessage());
                    LOG.warnf(e, "Erro inesperado");
                    // Se houver erro, pode ser que a conexão foi fechada
                    if (listenerRef[0] != null) {
                        SistemaAtualizacaoBroadcaster bc = getBroadcaster();
                        if (bc != null) {
                            bc.removeListener(listenerRef[0]);
                        }
                    }
                }
            };
            
            listenerRef[0] = listener;
            SistemaAtualizacaoBroadcaster bc = getBroadcaster();
            if (bc != null) {
                bc.addListener(listener);
            }
            
            // Enviar status atual se houver (com tratamento de erro robusto)
            if (service != null) {
                try {
                    SistemaAtualizacaoDto status = service.getStatus();
                    if (status != null && eventSink != null && !eventSink.isClosed()) {
                        SistemaAtualizacaoBroadcaster.AtualizacaoProgress progress = new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
                            status.id() != null ? status.id().toString() : "",
                            status.status(),
                            status.contadorRegressivo(),
                            status.mensagem(),
                            status.versaoDisponivel(),
                            status.versaoAtual(),
                            status.aprovadoPor()
                        );
                        // Serializar para JSON manualmente
                        String json = String.format(
                            "{\"updateId\":\"%s\",\"status\":\"%s\",\"contadorRegressivo\":%s,\"mensagem\":\"%s\",\"versaoDisponivel\":\"%s\",\"versaoAtual\":\"%s\",\"aprovadoPor\":%s}",
                            progress.updateId() != null ? escapeJson(progress.updateId()) : "",
                            progress.status() != null ? escapeJson(progress.status()) : "",
                            progress.contadorRegressivo() != null ? progress.contadorRegressivo() : "null",
                            progress.mensagem() != null ? escapeJson(progress.mensagem()) : "",
                            progress.versaoDisponivel() != null ? escapeJson(progress.versaoDisponivel()) : "",
                            progress.versaoAtual() != null ? escapeJson(progress.versaoAtual()) : "",
                            progress.aprovadoPor() != null ? progress.aprovadoPor() : "null"
                        );
                        eventSink.send(sse.newEventBuilder()
                            .name("atualizacao")
                            .data(json)
                            .build());
                    }
                } catch (Exception e) {
                    LOG.warnf(e, "Erro ao buscar/enviar status inicial SSE: %s", e.getMessage());
                    LOG.warnf(e, "Erro inesperado");
                    // Não remover o listener aqui, apenas logar o erro
                    // A conexão SSE ainda pode funcionar para eventos futuros
                }
            }
        } catch (Exception e) {
            LOG.warnf(e, "Erro crítico no endpoint SSE: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            // Tentar fechar o eventSink se possível
            if (eventSink != null && !eventSink.isClosed()) {
                try {
                    eventSink.close();
                } catch (Exception closeEx) {
                    LOG.warnf(closeEx, "Erro ao fechar eventSink: %s", closeEx.getMessage());
                }
            }
        }
    }
    
    private String getOriginHeader(String origin) {
        // Para desenvolvimento local, aceitar qualquer origem localhost
        if (origin != null && (origin.contains("localhost") || origin.contains("127.0.0.1") || 
            origin.contains("4200") || origin.contains("8081"))) {
            return origin;
        }
        // Se não houver origin, retornar * para permitir
        return "*";
    }
    
    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }
}

