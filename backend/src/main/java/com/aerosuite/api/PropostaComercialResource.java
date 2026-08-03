package com.aerosuite.api;

import com.aerosuite.dto.GerarOsPropostaResultDto;
import com.aerosuite.dto.PropostaAditivoDto;
import com.aerosuite.dto.PropostaAditivoWriteDto;
import com.aerosuite.dto.PropostaAnexoDto;
import com.aerosuite.dto.PropostaCamposExtrasRegrasDto;
import com.aerosuite.dto.PropostaComercialDto;
import com.aerosuite.dto.PropostaDisponibilizarPortalRequest;
import com.aerosuite.dto.PropostaDisponibilizarPortalResultDto;
import com.aerosuite.dto.PropostaPortalAcessoDto;
import com.aerosuite.dto.EnviarPropostaEmailDto;
import com.aerosuite.dto.EnviarPropostaWhatsAppDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.PropostaComercialOsBridgeService;
import com.aerosuite.service.PropostaComercialService;
import com.aerosuite.service.PropostaPortalPublicacaoService;
import com.aerosuite.service.WhatsAppService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;

/**
 * REST API para Propostas Comerciais
 */
@Path("/api/propostas-comerciais")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"propostas-comerciais"})
public class PropostaComercialResource {

    @Inject
    PropostaComercialService service;

    @Inject
    PropostaComercialOsBridgeService propostaOsBridgeService;

    @Inject
    WhatsAppService whatsAppService;

    @Inject
    com.aerosuite.service.PropostaPortalV11Service propostaPortalV11Service;

    @Inject
    PropostaPortalPublicacaoService propostaPortalPublicacaoService;

    /**
     * Indica se o envio com PDF em anexo via API WhatsApp está disponível no servidor.
     */
    @GET
    @Path("/whatsapp-envio/status")
    public Response whatsappEnvioStatus() {
        return Response.ok(Map.of("configured", whatsAppService.isApiConfigured())).build();
    }

    /** Indica se campos extras de proposta estão habilitados para o tenant. */
    @GET
    @Path("/campos-extras/regras")
    public PropostaCamposExtrasRegrasDto camposExtrasRegras() {
        return service.camposExtrasRegras();
    }

    /**
     * Lista propostas com filtros e paginação
     */
    @GET
    public Response list(
            @QueryParam("page") @DefaultValue("0") Integer page,
            @QueryParam("size") @DefaultValue("10") Integer size,
            @QueryParam("sort") String sort,
            @QueryParam("q") String q,
            @QueryParam("status") String status) {
        
        PropostaComercialService.SearchResult result = service.search(page, size, sort, q, status);
        return Response.ok(result).build();
    }

    /**
     * Busca proposta por ID
     */
    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        PropostaComercialDto dto = service.findById(id);
        return Response.ok(dto).build();
    }

    /** Itens da proposta — leve, para preview na listagem. */
    @GET
    @Path("/{id}/itens")
    public List<PropostaComercialDto.PropostaItemDto> listItens(@PathParam("id") Long id) {
        return service.listItens(id);
    }

    /**
     * Cria nova proposta
     */
    @POST
    public Response create(PropostaComercialDto dto) {
        PropostaComercialDto created = service.create(dto);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    /**
     * Atualiza proposta existente
     */
    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Long id, PropostaComercialDto dto) {
        PropostaComercialDto updated = service.update(id, dto);
        return Response.ok(updated).build();
    }

    /**
     * Exclui proposta
     */
    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        service.delete(id);
        return Response.noContent().build();
    }

    /**
     * Altera status da proposta
     */
    @PUT
    @Path("/{id}/status")
    public Response changeStatus(@PathParam("id") Long id, @QueryParam("status") String status) {
        PropostaComercialDto updated = service.changeStatus(id, status);
        return Response.ok(updated).build();
    }

    /**
     * Gera ordem de serviço a partir de proposta aprovada (P4.1).
     */
    @POST
    @Path("/{id}/gerar-os")
    @RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
    public Response gerarOs(@PathParam("id") Long id) {
        GerarOsPropostaResultDto result = propostaOsBridgeService.gerarOs(id);
        return Response.status(Response.Status.CREATED).entity(result).build();
    }

    /**
     * Diagnóstico de acesso do cliente ao portal externo.
     */
    @GET
    @Path("/{id}/portal-acesso")
    public Response verificarPortalAcesso(@PathParam("id") Long id) {
        PropostaPortalAcessoDto dto = propostaPortalPublicacaoService.verificarAcesso(id);
        return Response.ok(dto).build();
    }

    /**
     * Disponibiliza proposta no portal (status ENVIADA) e concede acesso externo se necessário.
     */
    @POST
    @Path("/{id}/disponibilizar-portal")
    public Response disponibilizarPortal(
            @PathParam("id") Long id,
            PropostaDisponibilizarPortalRequest body) {
        PropostaDisponibilizarPortalResultDto result =
                propostaPortalPublicacaoService.disponibilizarPortal(id, body);
        return Response.ok(result).build();
    }

    /**
     * Duplica uma proposta
     */
    @POST
    @Path("/{id}/duplicar")
    public Response duplicate(@PathParam("id") Long id) {
        PropostaComercialDto duplicated = service.duplicate(id);
        return Response.status(Response.Status.CREATED).entity(duplicated).build();
    }

    /**
     * Envia proposta por email
     */
    @POST
    @Path("/{id}/enviar-email")
    public Response enviarPorEmail(@PathParam("id") Long id, EnviarPropostaEmailDto dto) {
        dto.propostaId = id;
        Map<String, Object> result = service.enviarPorEmail(dto);
        boolean success = (boolean) result.getOrDefault("success", false);
        if (success) {
            return Response.ok(result).build();
        } else {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(result).build();
        }
    }

    /**
     * Salva assinatura na proposta
     */
    @PUT
    @Path("/{id}/assinatura")
    public Response salvarAssinatura(@PathParam("id") Long id, EnviarPropostaEmailDto.SignatureDto signature) {
        PropostaComercialDto updated = service.salvarAssinatura(id, signature);
        return Response.ok(updated).build();
    }

    /**
     * Retorna HTML da proposta para impressão (com logo incluída)
     */
    @GET
    @Path("/{id}/imprimir")
    @Produces(MediaType.TEXT_HTML)
    public Response imprimir(@PathParam("id") Long id) {
        try {
            String html = service.gerarHtmlImpressao(id);
            return Response.ok(html).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(ApiI18nMessages.withDetail(ApiI18nMessages.PROPOSTA_PRINT_HTML_FAILED, e.getMessage()))
                .build();
        }
    }

    /**
     * Envia proposta via WhatsApp
     */
    @POST
    @Path("/{id}/enviar-whatsapp")
    public Response enviarPorWhatsApp(@PathParam("id") Long id, EnviarPropostaWhatsAppDto dto) {
        dto.propostaId = id;
        Map<String, Object> result = service.enviarPorWhatsApp(dto.propostaId, dto.telefoneDestino, dto.mensagemAdicional, dto.signature);
        boolean success = (boolean) result.getOrDefault("success", false);
        if (success) {
            return Response.ok(result).build();
        } else {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(result).build();
        }
    }

    /** P4.2 v1.1 — aditivos e anexos do portal. */
    @GET
    @Path("/{id}/aditivos")
    public Response listarAditivos(@PathParam("id") Long id) {
        return Response.ok(propostaPortalV11Service.listarAditivosInterno(id)).build();
    }

    @POST
    @Path("/{id}/aditivos")
    public Response criarAditivoOficina(@PathParam("id") Long id, PropostaAditivoWriteDto body) {
        PropostaAditivoDto dto = propostaPortalV11Service.criarAditivoOficina(id, body);
        return Response.status(Response.Status.CREATED).entity(dto).build();
    }

    @GET
    @Path("/{id}/anexos")
    public Response listarAnexos(@PathParam("id") Long id) {
        return Response.ok(propostaPortalV11Service.listarAnexosInterno(id)).build();
    }

    @GET
    @Path("/{id}/anexos/{anexoId}/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response downloadAnexo(@PathParam("id") Long id, @PathParam("anexoId") Long anexoId) {
        var anexo = propostaPortalV11Service.requireAnexoInterno(id, anexoId);
        java.nio.file.Path path = propostaPortalV11Service.resolverArquivo(anexo);
        if (!java.nio.file.Files.exists(path)) {
            throw new jakarta.ws.rs.NotFoundException("proposta.anexo.error.nao_encontrado");
        }
        return Response.ok(path.toFile())
                .header("Content-Disposition", "attachment; filename=\"" + anexo.nomeArquivo + "\"")
                .build();
    }
}
