package com.aerosuite.api;

import org.jboss.logging.Logger;
import com.aerosuite.dto.MessageResponse;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.PageResponse;
import com.aerosuite.dto.UsuarioDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.UsuarioFotoUploadService;
import com.aerosuite.service.UsuarioService;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import java.util.Map;
import java.util.HashMap;

@Path("/api/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"USUARIOS"})
@jakarta.enterprise.context.ApplicationScoped
public class UsuarioResource {

    private static final Logger LOG = Logger.getLogger(UsuarioResource.class);
    @Inject UsuarioService service;

    @Inject UsuarioFotoUploadService usuarioFotoUploadService;

    @GET
    public PageResponse<UsuarioDto> list(@QueryParam("page") @DefaultValue("0") int page,
                                       @QueryParam("size") @DefaultValue("10") int size,
                                       @QueryParam("sort") @DefaultValue("id,asc") String sort,
                                       @QueryParam("q") String q,
                                       @QueryParam("ativo") String ativoParam) {
        // Converter string para Boolean (null = true por padrão para filtrar apenas ativos)
        Boolean ativo = null;
        if (ativoParam != null && !ativoParam.isBlank()) {
            ativo = Boolean.parseBoolean(ativoParam);
        }
        
        var result = service.search(page, size, sort, q, ativo);
        long total = result.total();
        int totalPages = (int)Math.ceil((double) total / Math.max(size, 1));
        return new PageResponse<>(result.items(), total, totalPages, page, size, sort);
    }

    @GET @Path("/{id}")
    public UsuarioDto get(@PathParam("id") Integer id) {
        UsuarioDto dto = service.getById(id);
        if (dto == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND_BY_ID, "id", String.valueOf(id)));
        }
        return dto;
    }

    @POST
    public Response create(UsuarioDto dto) {
        UsuarioDto created = service.create(dto);
        return Response.created(URI.create("/api/usuarios/" + created.id())).entity(created).build();
    }

    @POST
    @Path("/{id}/solicitar-reset-senha")
    public MessageResponse solicitarResetSenha(@PathParam("id") Integer id) {
        return service.solicitarResetSenha(id);
    }

    @PUT @Path("/{id}")
    public UsuarioDto update(@PathParam("id") Integer id, UsuarioDto dto) {
        
        try {
            UsuarioDto resultado = service.update(id, dto);
            return resultado;
        } catch (Exception e) {
            LOG.warnf(e, "ERRO no endpoint update: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            throw e;
        }
    }

    @OPTIONS
    @Path("/{id}")
    public Response optionsDelete(@PathParam("id") Integer id) {
        return Response.ok()
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
            .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            .build();
    }

    @DELETE 
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response delete(@PathParam("id") Integer id) {
        
        try {
            if (id == null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", ApiI18nMessages.encode(ApiI18nMessages.USER_ID_REQUIRED));
                return Response.status(Response.Status.BAD_REQUEST)
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                    .type(MediaType.APPLICATION_JSON)
                    .entity(errorResponse)
                    .build();
            }
            
            UsuarioDto usuario = service.getById(id);
            if (usuario == null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", ApiI18nMessages.encode(ApiI18nMessages.USER_NOT_FOUND));
                return Response.status(Response.Status.NOT_FOUND)
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
                    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                    .type(MediaType.APPLICATION_JSON)
                    .entity(errorResponse)
                    .build();
            }
            
            // Soft delete - inativar ao invés de deletar fisicamente
            UsuarioDto inactivated = service.delete(id);
            
            // Retornar JSON de sucesso em vez de 204 para evitar problemas de parsing no frontend
            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("success", true);
            successResponse.put("message", ApiI18nMessages.encode(ApiI18nMessages.USER_DEACTIVATED));
            successResponse.put("usuario", inactivated);
            return Response.ok()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .type(MediaType.APPLICATION_JSON)
                .entity(successResponse)
                .build();
        } catch (IllegalArgumentException e) {
            LOG.warnf(e, "ERRO IllegalArgumentException: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ApiI18nMessages.messageOrFallback(
                    ApiI18nMessages.USER_DELETE_FAILED, e.getMessage()));
            return Response.status(Response.Status.BAD_REQUEST)
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .type(MediaType.APPLICATION_JSON)
                .entity(errorResponse)
                .build();
        } catch (jakarta.persistence.PersistenceException e) {
            LOG.warn("==========================================");
            LOG.warnf("ERRO PersistenceException ao excluir usuário ID: %s", id);
            LOG.warnf(e, "Mensagem: %s", e.getMessage());
            LOG.warnf(e, "Causa: %s", (e.getCause() != null ? e.getCause().getMessage() : "N/A"));
            LOG.warn("==========================================");
            LOG.warnf(e, "Erro inesperado");
            
            String errorMsg = e.getMessage();
            if (errorMsg != null) {
                if (errorMsg.contains("foreign key") || errorMsg.contains("constraint")) {
                    errorMsg = ApiI18nMessages.encode(ApiI18nMessages.USER_DELETE_HAS_RELATIONS);
                } else if (errorMsg.contains("Cannot delete")) {
                    errorMsg = ApiI18nMessages.encode(ApiI18nMessages.USER_DELETE_CANNOT_DELETE);
                }
            } else {
                errorMsg = ApiI18nMessages.encode(ApiI18nMessages.USER_DELETE_CONSTRAINT);
            }
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", errorMsg);
            return Response.status(Response.Status.CONFLICT)
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .type(MediaType.APPLICATION_JSON)
                .entity(errorResponse)
                .build();
        } catch (RuntimeException e) {
            // Capturar RuntimeException separadamente (pode ser lançada pelo service)
            LOG.warn("==========================================");
            LOG.warnf("ERRO RuntimeException ao excluir usuário ID: %s", id);
            LOG.warnf("Tipo: %s", e.getClass().getName());
            LOG.warnf(e, "Mensagem: %s", e.getMessage());
            if (e.getCause() != null) {
                LOG.warnf(e, "Causa: %s", e.getCause().getMessage());
                LOG.warnf("Tipo da causa: %s", e.getCause().getClass().getName());
            }
            LOG.warn("==========================================");
            LOG.warnf(e, "Erro inesperado");
            
            String errorMsg = e.getMessage();
            if (errorMsg == null || errorMsg.isEmpty()) {
                errorMsg = ApiI18nMessages.encode(ApiI18nMessages.USER_DELETE_SERVER_ERROR);
            }

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", errorMsg);
            return Response.status(Response.Status.BAD_REQUEST)
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .type(MediaType.APPLICATION_JSON)
                .entity(errorResponse)
                .build();
        } catch (Exception e) {
            LOG.warn("==========================================");
            LOG.warnf("ERRO Exception ao excluir usuário ID: %s", id);
            LOG.warnf("Tipo: %s", e.getClass().getName());
            LOG.warnf(e, "Mensagem: %s", e.getMessage());
            if (e.getCause() != null) {
                LOG.warnf(e, "Causa: %s", e.getCause().getMessage());
                LOG.warnf("Tipo da causa: %s", e.getCause().getClass().getName());
            }
            LOG.warn("==========================================");
            LOG.warnf(e, "Erro inesperado");
            
            String errorMsg = e.getMessage();
            if (errorMsg == null || errorMsg.isEmpty()) {
                errorMsg = ApiI18nMessages.encode(ApiI18nMessages.USER_DELETE_UNEXPECTED);
            }

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put(
                    "error",
                    errorMsg != null ? errorMsg : ApiI18nMessages.encode(ApiI18nMessages.USER_DELETE_UNKNOWN));
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .type(MediaType.APPLICATION_JSON)
                .entity(errorResponse)
                .build();
        } finally {
        }
    }

    @PUT @Path("/{id}/perfil/{perfilId}")
    public Response associarPerfil(@PathParam("id") Integer id, @PathParam("perfilId") Integer perfilId) {
        try {
            UsuarioDto updated = service.associarPerfil(id, perfilId);
            return Response.ok(updated).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(ApiI18nMessages.messageOrFallback(ApiI18nMessages.USER_NOT_FOUND, e.getMessage()))
                .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(ApiI18nMessages.withDetail(ApiI18nMessages.USER_ASSOCIATE_PROFILE_FAILED, e.getMessage()))
                .build();
        }
    }

    @OPTIONS
    @Path("/{id}/foto")
    public Response uploadFotoOptions() {
        return Response.ok().build();
    }

    @POST
    @Path("/{id}/foto")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response uploadFoto(@PathParam("id") Integer id, @RestForm("imagem") FileUpload file) {
        return usuarioFotoUploadService.upload(id, file);
    }

}
