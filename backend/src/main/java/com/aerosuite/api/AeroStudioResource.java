package com.aerosuite.api;

import com.aerosuite.dto.studio.AeroStudioCollabPublishDto;
import com.aerosuite.dto.studio.AeroStudioJobStartedDto;
import com.aerosuite.dto.studio.AeroStudioRenderRequestDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.AeroStudioService;
import com.aerosuite.service.StudioCollaborationBroadcaster;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.util.function.Consumer;

/**
 * P5.1 Aero Studio — templates, editor, stock, colaboração, render.
 */
@Path("/api/studio")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"STUDIO_MARCA", "CONFIGURACOES", "GERENCIAR_PERMISSOES"})
public class AeroStudioResource {

    @Inject
    AeroStudioService studioService;

    @Inject
    StudioCollaborationBroadcaster collaborationBroadcaster;

    @Inject
    Sse sse;

    @Context
    UriInfo uriInfo;

    @GET
    @Path("/templates")
    public Response templates() {
        return Response.ok(studioService.listTemplates()).build();
    }

    @GET
    @Path("/context")
    public Response context() {
        return Response.ok(studioService.identity()).build();
    }

    @GET
    @Path("/history")
    public Response history() {
        return Response.ok(studioService.listHistory()).build();
    }

    @GET
    @Path("/stock")
    public Response stock(@QueryParam("q") String query, @QueryParam("limit") @DefaultValue("12") int limit) {
        return Response.ok(studioService.searchStock(query, limit)).build();
    }

    @POST
    @Path("/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response upload(@RestForm("file") FileUpload file) {
        try {
            String path = studioService.uploadCanvasImage(file);
            return Response.ok(new UploadResult(path)).build();
        } catch (BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(new Err(e.getMessage())).build();
        } catch (Exception e) {
            return error(e);
        }
    }

    @GET
    @Path("/assets")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "image/png", "image/jpeg", "image/webp", "image/gif"})
    public Response asset(@QueryParam("path") String path) {
        try {
            byte[] bytes = studioService.readStudioAsset(path);
            return Response.ok(bytes).type(guessImageType(path)).build();
        } catch (BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(new Err(e.getMessage())).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(new Err(e.getMessage())).build();
        } catch (Exception e) {
            return error(e);
        }
    }

    @GET
    @Path("/collab/{sessionId}")
    public Response collabLatest(@PathParam("sessionId") String sessionId) {
        var state = studioService.getCollaboration(sessionId);
        if (state == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(state).build();
    }

    @PUT
    @Path("/collab/{sessionId}")
    public Response collabPublish(@PathParam("sessionId") String sessionId, AeroStudioCollabPublishDto body) {
        try {
            return Response.ok(studioService.publishCollaboration(sessionId, body)).build();
        } catch (BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(new Err(e.getMessage())).build();
        }
    }

    @GET
    @Path("/collab/{sessionId}/stream")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public void collabStream(@PathParam("sessionId") String sessionId, @Context SseEventSink sink) {
        if (sink == null || sessionId == null || sessionId.isBlank()) {
            return;
        }
        var latest = studioService.getCollaboration(sessionId);
        if (latest != null) {
            try {
                sink.send(sse.newEventBuilder().name("collab").data(latest).build());
            } catch (Exception ignored) {
            }
        }
        @SuppressWarnings("unchecked")
        final Consumer<com.aerosuite.dto.studio.AeroStudioCollabStateDto>[] listenerRef = new Consumer[1];
        listenerRef[0] =
                state -> {
                    try {
                        if (!sink.isClosed()) {
                            sink.send(sse.newEventBuilder().name("collab").data(state).build());
                        } else {
                            collaborationBroadcaster.removeListener(sessionId, listenerRef[0]);
                        }
                    } catch (Exception e) {
                        collaborationBroadcaster.removeListener(sessionId, listenerRef[0]);
                    }
                };
        collaborationBroadcaster.addListener(sessionId, listenerRef[0]);
    }

    @GET
    @Path("/jobs/{id}")
    public Response job(@PathParam("id") Long id) {
        return Response.ok(studioService.getJob(id)).build();
    }

    @GET
    @Path("/jobs/{id}/download")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "application/pdf", "application/zip"})
    public Response jobDownload(@PathParam("id") Long id) {
        try {
            var dto = studioService.getJob(id);
            byte[] bytes = studioService.readJobDownload(id);
            return Response.ok(bytes)
                    .type(dto.mediaType != null ? dto.mediaType : "application/octet-stream")
                    .header("Content-Disposition", "attachment; filename=\"" + dto.fileName + "\"")
                    .build();
        } catch (Exception e) {
            return error(e);
        }
    }

    @GET
    @Path("/jobs/{id}/preview")
    @Produces("image/png")
    public Response jobPreview(@PathParam("id") Long id) {
        try {
            byte[] png = studioService.readJobPreview(id);
            return Response.ok(png).type("image/png").build();
        } catch (Exception e) {
            return error(e);
        }
    }

    @POST
    @Path("/preview")
    @Produces("image/png")
    public Response preview(AeroStudioRenderRequestDto body) {
        try {
            String apiBase = apiBase();
            byte[] png = studioService.previewPng(body, apiBase);
            return Response.ok(png).type("image/png").build();
        } catch (BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(new Err(e.getMessage())).build();
        } catch (Exception e) {
            return error(e);
        }
    }

    @POST
    @Path("/render")
    public Response render(AeroStudioRenderRequestDto body) {
        try {
            String apiBase = apiBase();
            if (studioService.requiresAsync(body)) {
                Long jobId = studioService.enqueueRender(body, apiBase);
                return Response.status(Response.Status.ACCEPTED)
                        .entity(new AeroStudioJobStartedDto(jobId, AeroStudioService.STATUS_PENDING, true))
                        .build();
            }
            AeroStudioService.RenderResult result = studioService.renderSync(body, apiBase);
            return Response.ok(result.bytes())
                    .type(result.mediaType())
                    .header("Content-Disposition", "attachment; filename=\"" + result.fileName() + "\"")
                    .header("X-Studio-Job-Id", result.jobId() != null ? result.jobId().toString() : "")
                    .build();
        } catch (BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(new Err(e.getMessage())).build();
        } catch (Exception e) {
            return error(e);
        }
    }

    private String apiBase() {
        return uriInfo.getBaseUri().toString().replaceAll("/$", "");
    }

    private static String guessImageType(String path) {
        if (path == null) {
            return "image/png";
        }
        String p = path.toLowerCase();
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (p.endsWith(".webp")) {
            return "image/webp";
        }
        if (p.endsWith(".gif")) {
            return "image/gif";
        }
        return "image/png";
    }

    private Response error(Exception e) {
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new Err(e.getMessage() != null ? e.getMessage() : "studio error"))
                .build();
    }

    public static class Err {
        public String message;

        public Err(String message) {
            this.message = message;
        }
    }

    public static class UploadResult {
        public String path;

        public UploadResult(String path) {
            this.path = path;
        }
    }
}
