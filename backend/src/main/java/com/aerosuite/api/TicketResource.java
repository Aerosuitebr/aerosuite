package com.aerosuite.api;

import com.aerosuite.dto.TicketDto;
import com.aerosuite.dto.TicketSlaPreviewDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.TicketAttachmentDto;
import com.aerosuite.dto.TicketCommentDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.TicketService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Path("/api/tickets")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"suporte", "suporte-chamados", "suporte-novo", "suporte-atendimento"})
public class TicketResource {

    @Inject
    TicketService service;

    private static final String UPLOAD_DIR = "uploads/tickets/";

    @GET
    public Response list(
            @QueryParam("page") @DefaultValue("0") Integer page,
            @QueryParam("size") @DefaultValue("10") Integer size,
            @QueryParam("sort") String sort,
            @QueryParam("q") String q,
            @QueryParam("status") String status,
            @QueryParam("prioridade") String prioridade,
            @QueryParam("tipo") String tipo,
            @QueryParam("usuarioId") Long usuarioId,
            @QueryParam("atendenteId") Long atendenteId,
            @QueryParam("isActive") Boolean isActive) {
        
        var result = service.search(page, size, sort, q, status, prioridade, tipo, usuarioId, atendenteId, isActive);
        return Response.ok(Map.of(
            "items", result.items(),
            "totalElements", result.total(),
            "totalPages", (int) Math.ceil((double) result.total() / size),
            "page", page,
            "size", size
        )).build();
    }

    @GET
    @Path("/sla-preview")
    public Response previewSla(
            @QueryParam("prioridade") String prioridade,
            @QueryParam("ambiente") String ambiente,
            @QueryParam("categoria") String categoria) {
        TicketSlaPreviewDto preview = service.previewSla(prioridade, ambiente, categoria);
        return Response.ok(preview).build();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        TicketDto dto = service.getById(id);
        if (dto == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.TICKET_NOT_FOUND)))
                .build();
        }
        return Response.ok(dto).build();
    }

    @GET
    @Path("/numero/{numero}")
    public Response getByNumero(@PathParam("numero") String numero) {
        TicketDto dto = service.getByNumero(numero);
        if (dto == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.TICKET_NOT_FOUND)))
                .build();
        }
        return Response.ok(dto).build();
    }

    @POST
    public Response create(TicketDto dto) {
        try {
            TicketDto created = service.create(dto);
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("message", ApiI18nMessages.messageOrFallback(ApiI18nMessages.TICKET_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Long id, TicketDto dto) {
        try {
            TicketDto updated = service.update(id, dto);
            return Response.ok(updated).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("message", ApiI18nMessages.messageOrFallback(ApiI18nMessages.TICKET_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }

    @PUT
    @Path("/{id}/atribuir")
    public Response atribuirAtendente(
            @PathParam("id") Long id,
            @QueryParam("atendenteId") Long atendenteId,
            @QueryParam("atendenteNome") String atendenteNome) {
        try {
            TicketDto updated = service.atribuirAtendente(id, atendenteId, atendenteNome);
            return Response.ok(updated).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("message", ApiI18nMessages.messageOrFallback(ApiI18nMessages.TICKET_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }

    @PUT
    @Path("/{id}/status")
    public Response alterarStatus(
            @PathParam("id") Long id,
            @QueryParam("status") String status,
            @QueryParam("usuarioId") Long usuarioId,
            @QueryParam("usuarioNome") String usuarioNome,
            @QueryParam("usuarioTipo") String usuarioTipo) {
        try {
            TicketDto updated = service.alterarStatus(id, status, usuarioId, usuarioNome, usuarioTipo);
            return Response.ok(updated).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("message", ApiI18nMessages.messageOrFallback(ApiI18nMessages.TICKET_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }

    @POST
    @Path("/{id}/comentarios")
    public Response addComment(@PathParam("id") Long id, TicketCommentDto dto) {
        try {
            TicketCommentDto created = service.addComment(id, dto);
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("message", ApiI18nMessages.messageOrFallback(ApiI18nMessages.TICKET_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }

    @POST
    @Path("/{id}/anexos")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadAttachment(
            @PathParam("id") Long id,
            @RestForm("file") FileUpload file,
            @RestForm("descricao") String descricao,
            @RestForm("tipoAnexo") String tipoAnexo,
            @RestForm("usuarioId") Long usuarioId,
            @RestForm("usuarioNome") String usuarioNome) {
        try {
            // Criar diretório se não existir
            java.nio.file.Path uploadPath = Paths.get(UPLOAD_DIR, id.toString());
            Files.createDirectories(uploadPath);

            // Gerar nome único para o arquivo
            String extension = "";
            String originalName = file.fileName();
            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex > 0) {
                extension = originalName.substring(dotIndex);
            }
            String uniqueName = UUID.randomUUID().toString() + extension;
            
            // Salvar arquivo
            java.nio.file.Path filePath = uploadPath.resolve(uniqueName);
            Files.copy(file.uploadedFile(), filePath);

            // Criar registro do anexo
            TicketAttachmentDto attachmentDto = new TicketAttachmentDto(
                null,
                id,
                uniqueName,
                originalName,
                file.contentType(),
                file.size(),
                filePath.toString(),
                "/api/tickets/" + id + "/anexos/" + uniqueName,
                descricao,
                tipoAnexo != null ? tipoAnexo : "OUTRO",
                usuarioId,
                usuarioNome,
                LocalDateTime.now(),
                true
            );

            TicketAttachmentDto created = service.addAttachment(id, attachmentDto);
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of(
                        "message",
                        ApiI18nMessages.withDetail(ApiI18nMessages.TICKET_FILE_SAVE_ERROR, e.getMessage())))
                .build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("message", ApiI18nMessages.messageOrFallback(ApiI18nMessages.TICKET_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }

    @GET
    @Path("/{id}/anexos/{filename}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response downloadAttachment(
            @PathParam("id") Long id,
            @PathParam("filename") String filename) {
        try {
            java.nio.file.Path filePath = Paths.get(UPLOAD_DIR, id.toString(), filename);
            if (!Files.exists(filePath)) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.TICKET_FILE_NOT_FOUND)))
                    .build();
            }
            
            byte[] fileContent = Files.readAllBytes(filePath);
            String mimeType = Files.probeContentType(filePath);
            
            return Response.ok(fileContent)
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .header("Content-Type", mimeType != null ? mimeType : "application/octet-stream")
                .build();
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of(
                        "message",
                        ApiI18nMessages.withDetail(ApiI18nMessages.TICKET_FILE_READ_ERROR, e.getMessage())))
                .build();
        }
    }

    @PUT
    @Path("/{id}/avaliar")
    public Response avaliar(
            @PathParam("id") Long id,
            @QueryParam("avaliacao") Integer avaliacao,
            @QueryParam("comentario") String comentario) {
        try {
            TicketDto updated = service.avaliar(id, avaliacao, comentario);
            return Response.ok(updated).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("message", ApiI18nMessages.messageOrFallback(ApiI18nMessages.TICKET_OPERATION_ERROR, e.getMessage())))
                .build();
        }
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        service.delete(id);
        return Response.noContent().build();
    }

    @GET
    @Path("/estatisticas")
    public Response getEstatisticas(@QueryParam("usuarioId") Long usuarioId) {
        Map<String, Long> stats = service.getEstatisticas(usuarioId);
        return Response.ok(stats).build();
    }

    @GET
    @Path("/estatisticas/atendimento")
    public Response getEstatisticasAtendimento(@QueryParam("atendenteId") Long atendenteId) {
        Map<String, Long> stats = service.getEstatisticasAtendimento(atendenteId);
        return Response.ok(stats).build();
    }
}
