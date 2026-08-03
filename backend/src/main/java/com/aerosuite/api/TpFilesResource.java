package com.aerosuite.api;

import com.aerosuite.dto.TpFilesDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.openapi.OpenApiDescriptions;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.TpFilesService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/api/tp-files")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "TpFiles", description = OpenApiDescriptions.TP_FILES_TAG)
@RequiresFuncionalidades(allOf = {"ARQUIVOS_TIPO_SERVICO"})
public class TpFilesResource {
    
    @Inject
    TpFilesService service;
    
    @GET
    @Operation(
        summary = OpenApiDescriptions.TP_FILES_LIST_SUMMARY,
        description = OpenApiDescriptions.TP_FILES_LIST_DESC
    )
    @APIResponse(
        responseCode = "200",
        description = OpenApiDescriptions.TP_FILES_LIST_200,
        content = @Content(schema = @Schema(implementation = TpFilesService.SearchResult.class))
    )
    public Response list(
        @Parameter(description = OpenApiDescriptions.PAGE_NUMBER) @QueryParam("page") @DefaultValue("0") int page,
        @Parameter(description = OpenApiDescriptions.PAGE_SIZE) @QueryParam("size") @DefaultValue("10") int size,
        @Parameter(description = OpenApiDescriptions.SORT) @QueryParam("sort") @DefaultValue("id,desc") String sort,
        @Parameter(description = OpenApiDescriptions.SEARCH_TERM) @QueryParam("q") String q,
        @Parameter(description = OpenApiDescriptions.FILTER_ACTIVE) @QueryParam("isActive") String isActiveParam
    ) {
        try {
            Boolean isActive = null;
            if (isActiveParam != null && !isActiveParam.isBlank()) {
                isActive = Boolean.parseBoolean(isActiveParam);
            }
            
            TpFilesService.SearchResult result = service.list(page, size, sort, q, isActive);
            return Response.ok(result).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(ApiI18nMessages.withDetail(ApiI18nMessages.TP_FILES_LIST_FAILED, e.getMessage()))
                .build();
        }
    }
    
    @GET
    @Path("/{id}")
    @Operation(
        summary = OpenApiDescriptions.TP_FILES_FIND_SUMMARY,
        description = OpenApiDescriptions.TP_FILES_FIND_DESC
    )
    @APIResponse(
        responseCode = "200",
        description = OpenApiDescriptions.TP_FILES_FOUND,
        content = @Content(schema = @Schema(implementation = TpFilesDto.class))
    )
    @APIResponse(
        responseCode = "404",
        description = OpenApiDescriptions.TP_FILES_NOT_FOUND
    )
    public Response findById(
        @Parameter(description = OpenApiDescriptions.FILE_ID) @PathParam("id") Long id
    ) {
        try {
            TpFilesDto dto = service.findById(id);
            return Response.ok(dto).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(ApiI18nMessages.messageOrFallback(ApiI18nMessages.FILE_NOT_FOUND_GENERIC, e.getMessage()))
                .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(ApiI18nMessages.withDetail(ApiI18nMessages.TP_FILES_FIND_FAILED, e.getMessage()))
                .build();
        }
    }
    
    @POST
    @Operation(
        summary = OpenApiDescriptions.TP_FILES_CREATE_SUMMARY,
        description = OpenApiDescriptions.TP_FILES_CREATE_DESC
    )
    @APIResponse(
        responseCode = "201",
        description = OpenApiDescriptions.TP_FILES_CREATED,
        content = @Content(schema = @Schema(implementation = TpFilesDto.class))
    )
    @APIResponse(
        responseCode = "400",
        description = OpenApiDescriptions.TP_FILES_INVALID_DATA
    )
    public Response create(TpFilesDto dto) {
        try {
            TpFilesDto created = service.create(dto);
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(ApiI18nMessages.withDetail(ApiI18nMessages.TP_FILES_CREATE_FAILED, e.getMessage()))
                .build();
        }
    }
    
    @PUT
    @Path("/{id}")
    @Operation(
        summary = OpenApiDescriptions.TP_FILES_UPDATE_SUMMARY,
        description = OpenApiDescriptions.TP_FILES_UPDATE_DESC
    )
    @APIResponse(
        responseCode = "200",
        description = OpenApiDescriptions.TP_FILES_UPDATED,
        content = @Content(schema = @Schema(implementation = TpFilesDto.class))
    )
    @APIResponse(
        responseCode = "404",
        description = OpenApiDescriptions.TP_FILES_NOT_FOUND
    )
    public Response update(
        @Parameter(description = OpenApiDescriptions.FILE_ID) @PathParam("id") Long id,
        TpFilesDto dto
    ) {
        try {
            if (dto.isActive != null && !dto.isActive) {
                TpFilesDto inactivated = service.inactivate(id);
                return Response.ok(inactivated).build();
            }
            TpFilesDto updated = service.update(id, dto);
            return Response.ok(updated).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(ApiI18nMessages.messageOrFallback(ApiI18nMessages.FILE_NOT_FOUND_GENERIC, e.getMessage()))
                .build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(ApiI18nMessages.withDetail(ApiI18nMessages.TP_FILES_UPDATE_FAILED, e.getMessage()))
                .build();
        }
    }
    
    @DELETE
    @Path("/{id}")
    @Operation(
        summary = OpenApiDescriptions.TP_FILES_DELETE_SUMMARY,
        description = OpenApiDescriptions.TP_FILES_DELETE_DESC
    )
    @APIResponse(
        responseCode = "200",
        description = OpenApiDescriptions.TP_FILES_INACTIVATED
    )
    @APIResponse(
        responseCode = "404",
        description = OpenApiDescriptions.TP_FILES_NOT_FOUND
    )
    public Response delete(
        @Parameter(description = OpenApiDescriptions.FILE_ID) @PathParam("id") Long id
    ) {
        try {
            TpFilesDto inactivated = service.delete(id);
            return Response.ok(inactivated).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(ApiI18nMessages.messageOrFallback(ApiI18nMessages.FILE_NOT_FOUND_GENERIC, e.getMessage()))
                .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(ApiI18nMessages.withDetail(ApiI18nMessages.TP_FILES_INACTIVATE_FAILED, e.getMessage()))
                .build();
        }
    }
    
    @GET
    @Path("/tipo-servico/{tipoServicoId}")
    @Operation(
        summary = OpenApiDescriptions.TP_FILES_BY_TIPO_SUMMARY,
        description = OpenApiDescriptions.TP_FILES_BY_TIPO_DESC
    )
    @APIResponse(
        responseCode = "200",
        description = OpenApiDescriptions.TP_FILES_BY_TIPO_200,
        content = @Content(schema = @Schema(implementation = TpFilesDto.class))
    )
    public Response findByTipoServicoId(
        @Parameter(description = OpenApiDescriptions.SERVICE_TYPE_ID) @PathParam("tipoServicoId") Integer tipoServicoId
    ) {
        try {
            List<TpFilesDto> files = service.findByTipoServicoId(tipoServicoId);
            return Response.ok(files).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(ApiI18nMessages.withDetail(ApiI18nMessages.TP_FILES_FIND_BY_TIPO_SERVICO_FAILED, e.getMessage()))
                .build();
        }
    }
    
    @PUT
    @Path("/{id}/deactivate")
    @Operation(
        summary = OpenApiDescriptions.TP_FILES_DEACTIVATE_SUMMARY,
        description = OpenApiDescriptions.TP_FILES_DEACTIVATE_DESC
    )
    @APIResponse(
        responseCode = "200",
        description = OpenApiDescriptions.TP_FILES_DEACTIVATED
    )
    @APIResponse(
        responseCode = "404",
        description = OpenApiDescriptions.TP_FILES_NOT_FOUND
    )
    public Response deactivate(
        @Parameter(description = OpenApiDescriptions.FILE_ID) @PathParam("id") Long id
    ) {
        try {
            TpFilesDto inactivated = service.inactivate(id);
            return Response.ok(inactivated).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(ApiI18nMessages.messageOrFallback(ApiI18nMessages.FILE_NOT_FOUND_GENERIC, e.getMessage()))
                .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(ApiI18nMessages.withDetail(ApiI18nMessages.TP_FILES_DEACTIVATE_FAILED, e.getMessage()))
                .build();
        }
    }
}
