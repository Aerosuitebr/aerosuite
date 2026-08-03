package com.aerosuite.controller;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.domain.Tenant;
import com.aerosuite.dto.FuncionalidadeDTO;
import com.aerosuite.model.Funcionalidade;
import com.aerosuite.p1.TenantModuleCatalog;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.FuncionalidadeService;
import com.aerosuite.service.TenantModuleService;
import java.util.Set;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/api/funcionalidades")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FuncionalidadeController {
    
    @Inject
    FuncionalidadeService funcionalidadeService;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    TenantModuleService tenantModuleService;

    @GET
    @RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "FUNCIONALIDADES"})
    public Response listarTodas() {
        try {
            List<Funcionalidade> funcionalidades = funcionalidadeService.listarTodas();
            List<FuncionalidadeDTO> dtos = funcionalidades.stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
            return Response.ok(dtos).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.FUNCIONALIDADE_LIST_FAILED, e.getMessage())))
                .build();
        }
    }
    
    @GET
    @Path("/gestao-rbac")
    @RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "FUNCIONALIDADES"})
    public Response listarParaGestaoRbac() {
        try {
            List<Funcionalidade> funcionalidades = funcionalidadeService.listarParaGestaoRbac();
            List<FuncionalidadeDTO> dtos = funcionalidades.stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
            return Response.ok(dtos).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.FUNCIONALIDADE_LIST_FAILED, e.getMessage())))
                .build();
        }
    }

    @GET
    @Path("/{id}")
    @RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "FUNCIONALIDADES"})
    public Response buscarPorId(@PathParam("id") Long id) {
        try {
            Funcionalidade funcionalidade = funcionalidadeService.buscarPorId(id);
            if (funcionalidade == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.FUNCIONALIDADE_NOT_FOUND)))
                    .build();
            }
            return Response.ok(converterParaDTO(funcionalidade)).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.FUNCIONALIDADE_FETCH_FAILED, e.getMessage())))
                .build();
        }
    }
    
    @POST
    @RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "FUNCIONALIDADES"})
    public Response criar(FuncionalidadeDTO dto) {
        try {
            Funcionalidade funcionalidade = funcionalidadeService.criar(dto);
            return Response.status(Response.Status.CREATED)
                .entity(converterParaDTO(funcionalidade))
                .build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.FUNCIONALIDADE_CREATE_FAILED, e.getMessage())))
                .build();
        }
    }
    
    @PUT
    @Path("/{id}")
    @RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "FUNCIONALIDADES"})
    public Response atualizar(@PathParam("id") Long id, FuncionalidadeDTO dto) {
        try {
            Funcionalidade funcionalidade = funcionalidadeService.atualizar(id, dto);
            if (funcionalidade == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.FUNCIONALIDADE_NOT_FOUND)))
                    .build();
            }
            return Response.ok(converterParaDTO(funcionalidade)).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.FUNCIONALIDADE_UPDATE_FAILED, e.getMessage())))
                .build();
        }
    }

    @DELETE
    @Path("/{id}")
    @RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "FUNCIONALIDADES"})
    public Response deletar(@PathParam("id") Long id) {
        try {
            boolean deletado = funcionalidadeService.deletar(id);
            if (!deletado) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", ApiI18nMessages.encode(ApiI18nMessages.FUNCIONALIDADE_NOT_FOUND));
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(error)
                        .build();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", ApiI18nMessages.encode(ApiI18nMessages.FUNCIONALIDADE_DEACTIVATED));
            response.put("id", id);
            return Response.ok(response).build();
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", ApiI18nMessages.withDetail(
                    ApiI18nMessages.FUNCIONALIDADE_DEACTIVATE_FAILED, e.getMessage()));
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(error)
                    .build();
        }
    }


    @GET
    @Path("/perfil/{perfilId}")
    @RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "FUNCIONALIDADES"})
    public Response listarPorPerfil(@PathParam("perfilId") Long perfilId) {
        try {
            List<Funcionalidade> funcionalidades = funcionalidadeService.listarPorPerfil(perfilId);
            List<FuncionalidadeDTO> dtos = funcionalidades.stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
            return Response.ok(dtos).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.FUNCIONALIDADE_LIST_BY_PROFILE_FAILED, e.getMessage())))
                .build();
        }
    }
    
    @GET
    @Path("/secao/{secao}")
    @RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "FUNCIONALIDADES"})
    public Response listarPorSecao(@PathParam("secao") String secao) {
        try {
            List<Funcionalidade> funcionalidades = funcionalidadeService.listarPorSecao(secao);
            List<FuncionalidadeDTO> dtos = funcionalidades.stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
            return Response.ok(dtos).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.FUNCIONALIDADE_LIST_BY_SECTION_FAILED, e.getMessage())))
                .build();
        }
    }
    
    @GET
    @Path("/meu-menu")
    @RequiresFuncionalidades(onlyAuthenticated = true)
    public Response listarMeuMenu() {
        try {
            Integer uid = internalUserContext.getUserId();
            if (uid == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.COMMON_NOT_AUTHENTICATED)))
                        .build();
            }
            List<Funcionalidade> funcionalidades = funcionalidadeService.listarMenuEfetivoPorUsuarioId(uid);
            Long tenantId = internalUserContext.getTenantId();
            Tenant tenant = tenantId != null ? Tenant.findById(tenantId) : null;
            Set<String> enabledModules = tenantModuleService.enabledModules(tenant);
            List<FuncionalidadeDTO> dtos = funcionalidades.stream()
                    .filter(f -> tenantId == null || TenantModuleCatalog.isFuncionalidadeAllowed(
                            enabledModules, f.getCodigo()))
                    .map(this::converterParaDTO)
                    .collect(Collectors.toList());
            return Response.ok(dtos).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.FUNCIONALIDADE_MENU_BUILD_FAILED, e.getMessage())))
                .build();
        }
    }

    @GET
    @Path("/menu")
    @RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "FUNCIONALIDADES"})
    public Response listarParaMenu() {
        try {
            List<Funcionalidade> funcionalidades = funcionalidadeService.listarParaMenu();
            List<FuncionalidadeDTO> dtos = funcionalidades.stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
            return Response.ok(dtos).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.FUNCIONALIDADE_LIST_MENU_FAILED, e.getMessage())))
                .build();
        }
    }

    @GET
    @Path("/usuario/{usuarioId}")
    @RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "FUNCIONALIDADES", "USUARIOS"})
    public Response listarPorUsuario(@PathParam("usuarioId") Long usuarioId) {
        try {
            List<Funcionalidade> funcionalidades = funcionalidadeService.listarPorUsuario(usuarioId);
            List<FuncionalidadeDTO> dtos = funcionalidades.stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
            return Response.ok(dtos).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.FUNCIONALIDADE_LIST_BY_USER_FAILED, e.getMessage())))
                .build();
        }
    }
    
    private FuncionalidadeDTO converterParaDTO(Funcionalidade funcionalidade) {
        FuncionalidadeDTO dto = new FuncionalidadeDTO();
        dto.setId(funcionalidade.getId());
        dto.setNome(funcionalidade.getNome());
        dto.setDescricao(funcionalidade.getDescricao());
        dto.setCodigo(funcionalidade.getCodigo());
        dto.setIcone(funcionalidade.getIcone());
        dto.setRota(funcionalidade.getRota());
        dto.setOrdem(funcionalidade.getOrdem());
        dto.setSecao(funcionalidade.getSecao());
        dto.setParentId(funcionalidade.getParentId());
        dto.setTipo(funcionalidade.getTipo());
        dto.setVisivel(funcionalidade.getVisivel());
        dto.setCorIcone(funcionalidade.getCorIcone());
        dto.setPosicao(funcionalidade.getPosicao());
        dto.setAtivo(funcionalidade.getAtivo());
        dto.setCreatedAt(funcionalidade.getCreatedAt());
        dto.setUpdatedAt(funcionalidade.getUpdatedAt());
        
        // Relacionamento com perfis será gerenciado pelo PerfilService
        // dto.setPerfilIds(new HashSet<>());
        
        return dto;
    }
}
