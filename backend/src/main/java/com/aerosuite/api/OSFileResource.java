package com.aerosuite.api;

import org.jboss.logging.Logger;
import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.openapi.OpenApiDescriptions;
import com.aerosuite.dto.OSFileDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.OSFileService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.jboss.resteasy.reactive.RestForm;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@jakarta.ws.rs.Path("/api/os-files")
@Produces(MediaType.APPLICATION_JSON)
@ApplicationScoped
@RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
public class OSFileResource {

    private static final Logger LOG = Logger.getLogger(OSFileResource.class);
    
    @Inject
    OSFileService service;

    private static AuditoriaUsuarioContext auditCtx(
            String forwardedFor,
            String realIp,
            HttpHeaders headers,
            String authorization,
            Long xUserId,
            String xUserName,
            String xUserEmail) {
        return AuditoriaUsuarioContext.from(
                headers, forwardedFor, realIp, authorization, xUserId, xUserName, xUserEmail);
    }
    
    /**
     * Upload de arquivos para uma OS
     * Aceita qualquer tipo de arquivo e qualquer tamanho
     */
    @POST
    @jakarta.ws.rs.Path("/os/{osId}/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadFiles(
            @Parameter(description = OpenApiDescriptions.WORK_ORDER_ID_SHORT) @PathParam("osId") Long osId,
            @RestForm("files") List<FileUpload> files,
            @HeaderParam("Authorization") String authorization,
            @HeaderParam("X-User-Id") Long xUserId,
            @HeaderParam("X-User-Name") String xUserName,
            @HeaderParam("X-User-Email") String xUserEmail,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {
        try {
            if (files == null || files.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.OS_FILE_NO_FILES_SENT)))
                        .build();
            }
            
            List<OSFileDto> uploadedFiles = service.uploadFilesToOS(
                    osId, files, auditCtx(forwardedFor, realIp, headers, authorization, xUserId, xUserName, xUserEmail));
            return Response.ok(Map.of(
                    "message", ApiI18nMessages.encode(ApiI18nMessages.OS_FILE_UPLOAD_SUCCESS),
                    "files", uploadedFiles,
                    "count", uploadedFiles.size()
            )).build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(fileError(ApiI18nMessages.OS_FILE_UPLOAD_FAILED, e))
                    .build();
        }
    }
    
    /**
     * Lista todos os arquivos disponíveis na pasta raiz "os"
     */
    @GET
    @jakarta.ws.rs.Path("/available")
    public Response listAvailableFiles() {
        try {
            List<OSFileDto> files = service.listAvailableFiles();
            return Response.ok(files).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(fileError(ApiI18nMessages.OS_FILE_LIST_FAILED, e))
                    .build();
        }
    }
    
    /**
     * Lista todos os arquivos associados a uma OS
     */
    @GET
    @jakarta.ws.rs.Path("/os/{osId}")
    public Response getFilesByOSId(@Parameter(description = OpenApiDescriptions.WORK_ORDER_ID_SHORT) @PathParam("osId") Long osId) {
        try {
            List<OSFileDto> files = service.getFilesByOSId(osId);
            return Response.ok(files).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(fileError(ApiI18nMessages.OS_FILE_LIST_OS_FAILED, e))
                    .build();
        }
    }
    
    /**
     * Associa arquivos a uma OS
     */
    @POST
    @jakarta.ws.rs.Path("/os/{osId}/associate")
    public Response associateFilesToOS(
            @Parameter(description = OpenApiDescriptions.WORK_ORDER_ID_SHORT) @PathParam("osId") Long osId,
            List<String> fileNames,
            @HeaderParam("Authorization") String authorization,
            @HeaderParam("X-User-Id") Long xUserId,
            @HeaderParam("X-User-Name") String xUserName,
            @HeaderParam("X-User-Email") String xUserEmail,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {
        try {
            if (fileNames == null || fileNames.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.OS_FILE_EMPTY_LIST)))
                        .build();
            }
            
            List<OSFileDto> associatedFiles = service.associateFilesToOS(
                osId, fileNames, auditCtx(forwardedFor, realIp, headers, authorization, xUserId, xUserName, xUserEmail));
            return Response.ok(Map.of(
                    "message", ApiI18nMessages.encode(ApiI18nMessages.OS_FILE_ASSOCIATE_SUCCESS),
                    "files", associatedFiles,
                    "count", associatedFiles.size()
            )).build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(fileError(ApiI18nMessages.OS_FILE_ASSOCIATE_FAILED, e))
                    .build();
        }
    }
    
    /**
     * Remove um arquivo da OS
     */
    @DELETE
    @jakarta.ws.rs.Path("/{fileId}")
    public Response removeFileFromOS(
            @Parameter(description = OpenApiDescriptions.FILE_ID) @PathParam("fileId") Long fileId,
            @HeaderParam("Authorization") String authorization,
            @HeaderParam("X-User-Id") Long xUserId,
            @HeaderParam("X-User-Name") String xUserName,
            @HeaderParam("X-User-Email") String xUserEmail,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {
        try {
            service.removeFileFromOS(
                    fileId, auditCtx(forwardedFor, realIp, headers, authorization, xUserId, xUserName, xUserEmail));
            return Response.ok(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.OS_FILE_REMOVED))).build();
        } catch (jakarta.ws.rs.NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(fileError(ApiI18nMessages.OS_FILE_REMOVE_FAILED, e))
                    .build();
        }
    }
    
    /**
     * CORS preflight para download de arquivos
     */
    @OPTIONS
    @jakarta.ws.rs.Path("/{fileId}/download")
    public Response downloadFileOptions(@PathParam("fileId") Long fileId) {
        return Response.ok()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, OPTIONS")
                .header("Access-Control-Allow-Headers", "Authorization, Content-Type")
                .header("Access-Control-Max-Age", "3600")
                .build();
    }
    
    /**
     * Visualiza/baixa um arquivo da OS
     */
    @GET
    @jakarta.ws.rs.Path("/{fileId}/download")
    public Response downloadFile(@Parameter(description = OpenApiDescriptions.FILE_ID) @PathParam("fileId") Long fileId) {
        try {
            
            OSFileDto fileDto = service.getFileById(fileId);
            
            Path filePath = service.getFilePath(fileId);
            
            if (!Files.exists(filePath)) {
                LOG.warnf("OSFileResource.downloadFile - ERRO: Arquivo físico não existe em: %s", filePath.toAbsolutePath());
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of(
                                "error", ApiI18nMessages.encode(ApiI18nMessages.OS_FILE_PHYSICAL_NOT_FOUND),
                                "path", filePath.toString()))
                        .build();
            }
            
            
            String contentType = fileDto.contentType != null ? fileDto.contentType : "application/octet-stream";
            // Garantir content-type correto para PDFs
            String ext = fileDto.fileExtension != null ? fileDto.fileExtension.toLowerCase() : "";
            if ("pdf".equals(ext)) {
                contentType = "application/pdf";
            } else if ("png".equals(ext)) {
                contentType = "image/png";
            } else if ("jpg".equals(ext) || "jpeg".equals(ext)) {
                contentType = "image/jpeg";
            }
            
            
            StreamingOutput stream = output -> {
                try (InputStream inputStream = Files.newInputStream(filePath)) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        output.write(buffer, 0, bytesRead);
                    }
                } catch (IOException e) {
                    LOG.warnf(e, "OSFileResource.downloadFile - ERRO ao ler arquivo: %s", e.getMessage());
                    throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.OS_FILE_READ_FAILED, e.getMessage()), e);
                }
            };
            
            // Headers para permitir visualização em iframe e CORS
            // Remover X-Frame-Options ou usar SAMEORIGIN para permitir iframes da mesma origem
            Response.ResponseBuilder responseBuilder = Response.ok(stream)
                    .header("Content-Disposition", "inline; filename=\"" + fileDto.fileName + "\"")
                    .header("Content-Type", contentType)
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Access-Control-Allow-Methods", "GET, OPTIONS")
                    .header("Access-Control-Allow-Headers", "Authorization, Content-Type")
                    .header("Access-Control-Expose-Headers", "Content-Disposition, Content-Type")
                    .header("Cache-Control", "private, max-age=3600")
                    // Não definir X-Frame-Options para permitir iframes (ou usar SAMEORIGIN se necessário)
                    // .header("X-Frame-Options", "SAMEORIGIN")
                    ;
            
            return responseBuilder.build();
                    
        } catch (jakarta.ws.rs.NotFoundException e) {
            LOG.warnf(e, "OSFileResource.downloadFile - Arquivo não encontrado: %s", e.getMessage());
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (Exception e) {
            LOG.warnf(e, "OSFileResource.downloadFile - ERRO: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(fileError(ApiI18nMessages.OS_FILE_PROCESS_FAILED, e))
                    .build();
        }
    }
    
    /**
     * Obtém informações de um arquivo específico
     */
    @GET
    @jakarta.ws.rs.Path("/{fileId}")
    public Response getFileById(@Parameter(description = OpenApiDescriptions.FILE_ID) @PathParam("fileId") Long fileId) {
        try {
            OSFileDto file = service.getFileById(fileId);
            return Response.ok(file).build();
        } catch (jakarta.ws.rs.NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(fileError(ApiI18nMessages.OS_FILE_GET_FAILED, e))
                    .build();
        }
    }
    
    /**
     * Upload de arquivos para a pasta "diversos" (documentos avulsos)
     */
    @POST
    @jakarta.ws.rs.Path("/diversos/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadDiversosFiles(
            @RestForm("files") List<FileUpload> files,
            @HeaderParam("Authorization") String authorization,
            @HeaderParam("X-User-Id") Long xUserId,
            @HeaderParam("X-User-Name") String xUserName,
            @HeaderParam("X-User-Email") String xUserEmail,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {
        try {
            if (files == null || files.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.OS_FILE_NO_FILES_SENT)))
                        .build();
            }
            
            List<OSFileDto> uploadedFiles = service.uploadFilesToDiversos(
                    files, auditCtx(forwardedFor, realIp, headers, authorization, xUserId, xUserName, xUserEmail));
            return Response.ok(Map.of(
                    "message", ApiI18nMessages.encode(ApiI18nMessages.OS_FILE_UPLOAD_DIVERSOS_SUCCESS),
                    "files", uploadedFiles,
                    "count", uploadedFiles.size()
            )).build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(fileError(ApiI18nMessages.OS_FILE_UPLOAD_FAILED, e))
                    .build();
        }
    }
    
    /**
     * Upload de arquivos para a pasta "diversos" dentro de uma OS específica
     * Os arquivos serão salvos em os/{osId}/diversos/
     */
    @POST
    @jakarta.ws.rs.Path("/os/{osId}/diversos/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadDiversosFilesToOS(
            @Parameter(description = OpenApiDescriptions.WORK_ORDER_ID_SHORT) @PathParam("osId") Long osId,
            @RestForm("files") List<FileUpload> files,
            @HeaderParam("Authorization") String authorization,
            @HeaderParam("X-User-Id") Long xUserId,
            @HeaderParam("X-User-Name") String xUserName,
            @HeaderParam("X-User-Email") String xUserEmail,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {
        try {
            if (files == null || files.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.OS_FILE_NO_FILES_SENT)))
                        .build();
            }
            
            List<OSFileDto> uploadedFiles = service.uploadFilesToOSDiversos(
                osId, files, auditCtx(forwardedFor, realIp, headers, authorization, xUserId, xUserName, xUserEmail));
            return Response.ok(Map.of(
                    "message", ApiI18nMessages.encode(
                            ApiI18nMessages.OS_FILE_UPLOAD_OS_DIVERSOS_SUCCESS, "osId", String.valueOf(osId)),
                    "files", uploadedFiles,
                    "count", uploadedFiles.size()
            )).build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(fileError(ApiI18nMessages.OS_FILE_UPLOAD_FAILED, e))
                    .build();
        }
    }
    
    /**
     * Lista todos os arquivos da pasta "diversos"
     */
    @GET
    @jakarta.ws.rs.Path("/diversos")
    public Response listDiversosFiles() {
        try {
            List<OSFileDto> files = service.getFilesByDiversos();
            return Response.ok(files).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(fileError(ApiI18nMessages.OS_FILE_LIST_DIVERSOS_FAILED, e))
                    .build();
        }
    }

    private static Map<String, String> fileError(String key, Exception e) {
        return Map.of(
                "error", ApiI18nMessages.encode(key),
                "message", ApiI18nMessages.messageOrFallback(key, e.getMessage()));
    }
}

