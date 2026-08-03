package com.aerosuite.api;

import org.jboss.logging.Logger;
import com.aerosuite.dto.*;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.BackupConfigService;
import com.aerosuite.service.BackupProgressBroadcaster;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.concurrent.atomic.AtomicReference;

@Path("/api/backup-config")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"CONFIGURACOES"})
public class BackupConfigResource {

    private static final Logger LOG = Logger.getLogger(BackupConfigResource.class);
    @Inject BackupConfigService service;
    @Inject BackupProgressBroadcaster broadcaster;
    @Inject Sse sse;

    @GET
    public Response getConfig() {
        try {
            BackupConfigDto config = service.getConfig();
            if (config == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_CONFIG_NOT_FOUND)))
                    .build();
            }
            return Response.ok(config).build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao buscar configuração: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of(
                        "error",
                        true,
                        "message",
                        ApiI18nMessages.messageOrFallback(ApiI18nMessages.COMMON_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }

    @POST
    public Response saveConfig(BackupConfigDto config) {
        BackupConfigDto saved = service.saveConfig(config);
        return Response.ok(saved).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateConfig(@PathParam("id") Long id, BackupConfigDto config) {
        BackupConfigDto saved = service.saveConfig(config);
        return Response.ok(saved).build();
    }

    @POST
    @Path("/test-connection")
    public Response testConnection(DatabaseConnectionDto connection) {
        Map<String, Object> result = service.testConnection(connection);
        return Response.ok(result).build();
    }

    @POST
    @Path("/execute")
    public Response executeBackup() {
        Map<String, Object> result = service.executeBackup();
        return Response.ok(result).build();
    }

    @GET
    @Path("/history")
    public Response getBackupHistory(@QueryParam("limit") @DefaultValue("50") int limit) {
        List<BackupHistoryDto> history = service.getBackupHistory(limit);
        return Response.ok(history).build();
    }

    @GET
    @Path("/status/{backupId}")
    public Response getBackupStatus(@PathParam("backupId") String backupId) {
        Map<String, Object> status = service.getBackupStatus(backupId);
        return Response.ok(status).build();
    }

    @DELETE
    @Path("/history/{id}")
    public Response deleteBackup(@PathParam("id") Long id) {
        service.deleteBackup(id);
        return Response.noContent().build();
    }

    @POST
    @Path("/validate-path")
    public Response validatePath(Map<String, String> request) {
        String path = request.get("path");
        if (path == null || path.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("valid", false, "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_PATH_NOT_INFORMED)))
                .build();
        }
        Map<String, Object> result = service.validatePath(path);
        return Response.ok(result).build();
    }

    @GET
    @Path("/list-directories")
    public Response listDirectories(@QueryParam("path") String path) {
        try {
            Map<String, Object> result = service.listDirectories(path);
            return Response.ok(result).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of(
                        "error",
                        true,
                        "message",
                        ApiI18nMessages.messageOrFallback(ApiI18nMessages.COMMON_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }

    @POST
    @Path("/open-folder")
    public Response openFolder(Map<String, String> request) {
        try {
            String folderPath = request.get("path");
            if (folderPath == null || folderPath.isBlank()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("success", false, "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_PATH_NOT_INFORMED)))
                    .build();
            }
            Map<String, Object> result = service.openFolder(folderPath);
            return Response.ok(result).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("success", false, "message", ApiI18nMessages.messageOrFallback(
                        ApiI18nMessages.COMMON_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }

    @GET
    @Path("/progress-stream")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public void progressStream(@Context SseEventSink eventSink) {
        AtomicReference<Consumer<BackupProgressBroadcaster.BackupProgress>> listenerRef = new AtomicReference<>();
        
        Consumer<BackupProgressBroadcaster.BackupProgress> listener = progress -> {
            try {
                if (eventSink != null && !eventSink.isClosed()) {
                    String json = String.format(
                        "{\"backupId\":\"%s\",\"status\":\"%s\",\"progress\":%d,\"message\":\"%s\",\"errorMessage\":%s,\"backupDate\":%s,\"backupPath\":%s}",
                        progress.backupId(),
                        progress.status(),
                        progress.progress(),
                        escapeJson(progress.message()),
                        progress.errorMessage() != null ? "\"" + escapeJson(progress.errorMessage()) + "\"" : "null",
                        progress.backupDate() != null ? "\"" + progress.backupDate() + "\"" : "null",
                        progress.backupPath() != null ? "\"" + escapeJson(progress.backupPath()) + "\"" : "null"
                    );
                    eventSink.send(sse.newEvent("progress", json));
                } else {
                    // Conexão fechada, remover listener
                    if (listenerRef.get() != null) {
                        broadcaster.removeListener(listenerRef.get());
                    }
                }
            } catch (Exception e) {
                LOG.warnf(e, "Erro ao enviar evento SSE: %s", e.getMessage());
                LOG.warnf(e, "Erro inesperado");
                // Se houver erro, pode ser que a conexão foi fechada
                if (listenerRef.get() != null) {
                    broadcaster.removeListener(listenerRef.get());
                }
            }
        };
        
        listenerRef.set(listener);
        broadcaster.addListener(listener);
        
        // Enviar evento inicial para manter conexão viva
        try {
            eventSink.send(sse.newEvent("connected", "{\"status\":\"connected\"}"));
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao enviar evento inicial SSE: %s", e.getMessage());
            broadcaster.removeListener(listener);
        }
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
