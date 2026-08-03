package com.aerosuite.controller;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.PerfilDTO;
import com.aerosuite.dto.FuncionalidadeDTO;
import com.aerosuite.model.Perfil;
import com.aerosuite.model.Funcionalidade;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.PerfilService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Path("/api/perfis")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "PERFIS"})
public class PerfilController {
    
    @Inject
    PerfilService perfilService;
    
    @GET
    public Response listarTodos() {
        try {
            List<Perfil> perfis = perfilService.listarParaGestaoRbac();
            List<PerfilDTO> dtos = perfis.stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
            return Response.ok(dtos).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.PERFIL_LIST_FAILED, e.getMessage())))
                .build();
        }
    }
    
    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        try {
            Perfil perfil = perfilService.buscarPorId(id);
            if (perfil == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.PERFIL_NOT_FOUND)))
                    .build();
            }
            return Response.ok(converterParaDTO(perfil)).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.PERFIL_FETCH_FAILED, e.getMessage())))
                .build();
        }
    }
    
    @POST
    public Response criar(PerfilDTO dto) {
        try {
            Perfil perfil = perfilService.criar(dto);
            return Response.status(Response.Status.CREATED)
                .entity(converterParaDTO(perfil))
                .build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.PERFIL_CREATE_FAILED, e.getMessage())))
                .build();
        }
    }
    
    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") Long id, PerfilDTO dto) {
        try {
            Perfil perfil = perfilService.atualizar(id, dto);
            if (perfil == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.PERFIL_NOT_FOUND)))
                    .build();
            }
            return Response.ok(converterParaDTO(perfil)).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.PERFIL_UPDATE_FAILED, e.getMessage())))
                .build();
        }
    }

    @DELETE
    @Path("/{id}")
    public Response deletar(@PathParam("id") Long id) {
        try {
            boolean deletado = perfilService.deletar(id);
            if (!deletado) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", ApiI18nMessages.encode(ApiI18nMessages.PERFIL_NOT_FOUND));
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(error)
                        .build();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", ApiI18nMessages.encode(ApiI18nMessages.PERFIL_DEACTIVATED));
            response.put("id", id);
            return Response.ok(response).build();
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", ApiI18nMessages.withDetail(
                    ApiI18nMessages.PERFIL_DEACTIVATE_FAILED, e.getMessage()));
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(error)
                    .build();
        }
    }


    @POST
    @Path("/{perfilId}/funcionalidades")
    public Response atribuirFuncionalidades(@PathParam("perfilId") Long perfilId, List<Long> funcionalidadeIds) {
        try {
            perfilService.atribuirFuncionalidades(perfilId, funcionalidadeIds);
            return Response.ok().build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.PERFIL_ASSIGN_FUNCIONALIDADES_FAILED, e.getMessage())))
                .build();
        }
    }
    
    @GET
    @Path("/{perfilId}/funcionalidades")
    public Response listarFuncionalidades(@PathParam("perfilId") Long perfilId) {
        try {
            List<Funcionalidade> funcionalidades = perfilService.listarFuncionalidades(perfilId);
            List<FuncionalidadeDTO> dtos = funcionalidades.stream()
                .map(this::converterFuncionalidadeParaDTO)
                .collect(Collectors.toList());
            return Response.ok(dtos).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("message", ApiI18nMessages.withDetail(
                        ApiI18nMessages.PERFIL_LIST_FUNCIONALIDADES_FAILED, e.getMessage())))
                .build();
        }
    }
    
    private PerfilDTO converterParaDTO(Perfil perfil) {
        PerfilDTO dto = new PerfilDTO();
        dto.setId(perfil.getId());
        dto.setNome(perfil.getNome());
        dto.setDescricao(perfil.getDescricao());
        dto.setCodigo(perfil.getCodigo());
        dto.setAtivo(perfil.getAtivo());
        dto.setCreatedAt(perfil.getCreatedAt());
        dto.setUpdatedAt(perfil.getUpdatedAt());
        
        if (perfil.getFuncionalidades() != null) {
            dto.setFuncionalidadeIds(perfil.getFuncionalidades().stream()
                .map(Funcionalidade::getId)
                .collect(Collectors.toSet()));
        }
        
        return dto;
    }
    
    private FuncionalidadeDTO converterFuncionalidadeParaDTO(Funcionalidade funcionalidade) {
        FuncionalidadeDTO dto = new FuncionalidadeDTO();
        dto.setId(funcionalidade.getId());
        dto.setNome(funcionalidade.getNome());
        dto.setDescricao(funcionalidade.getDescricao());
        dto.setCodigo(funcionalidade.getCodigo());
        dto.setIcone(funcionalidade.getIcone());
        dto.setRota(funcionalidade.getRota());
        dto.setOrdem(funcionalidade.getOrdem());
        dto.setAtivo(funcionalidade.getAtivo());
        dto.setCreatedAt(funcionalidade.getCreatedAt());
        dto.setUpdatedAt(funcionalidade.getUpdatedAt());
        return dto;
    }
}
