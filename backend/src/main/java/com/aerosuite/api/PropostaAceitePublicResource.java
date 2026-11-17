package com.aerosuite.api;

import com.aerosuite.dto.PropostaAceiteRequest;
import com.aerosuite.dto.PropostaSolicitacaoRequest;
import com.aerosuite.service.PropostaAceiteService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

/**
 * API pública (token) para o cliente revisar, completar FORM-MNT-045 e autorizar a proposta.
 */
@Path("/api/public/propostas/{token}")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PropostaAceitePublicResource {

    @Inject
    PropostaAceiteService service;

    @GET
    public Response get(@PathParam("token") String token) {
        try {
            return Response.ok(service.getPublica(token)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("message", e.getMessage())).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("message", e.getMessage() != null ? e.getMessage() : "Erro ao carregar proposta"))
                .build();
        }
    }

    @PUT
    @Path("/solicitacao")
    public Response salvarSolicitacao(@PathParam("token") String token, PropostaSolicitacaoRequest body) {
        try {
            return Response.ok(service.salvarSolicitacao(token, body)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("message", e.getMessage())).build();
        } catch (BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("message", e.getMessage())).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("message", e.getMessage() != null ? e.getMessage() : "Erro ao salvar solicitação"))
                .build();
        }
    }

    @POST
    @Path("/aceitar")
    public Response aceitar(@PathParam("token") String token, PropostaAceiteRequest body, @Context HttpHeaders headers) {
        try {
            return Response.ok(service.aceitar(token, body, clientIp(headers), userAgent(headers))).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("message", e.getMessage())).build();
        } catch (BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("message", e.getMessage())).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("message", e.getMessage() != null ? e.getMessage() : "Erro ao aceitar proposta"))
                .build();
        }
    }

    @POST
    @Path("/recusar")
    public Response recusar(@PathParam("token") String token, PropostaAceiteRequest body, @Context HttpHeaders headers) {
        try {
            return Response.ok(service.recusar(token, body, clientIp(headers), userAgent(headers))).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("message", e.getMessage())).build();
        } catch (BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("message", e.getMessage())).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("message", e.getMessage() != null ? e.getMessage() : "Erro ao recusar proposta"))
                .build();
        }
    }

    private static String clientIp(HttpHeaders headers) {
        if (headers == null) return null;
        String xff = headers.getHeaderString("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String real = headers.getHeaderString("X-Real-IP");
        return real != null && !real.isBlank() ? real.trim() : null;
    }

    private static String userAgent(HttpHeaders headers) {
        return headers == null ? null : headers.getHeaderString("User-Agent");
    }
}
