package com.aerosuite.api;

import org.jboss.logging.Logger;
import com.aerosuite.dto.ChamadaDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ChamadaService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/chamadas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(onlyAuthenticated = true)
public class ChamadaResource {

    private static final Logger LOG = Logger.getLogger(ChamadaResource.class);

    @Inject
    ChamadaService chamadaService;

    /**
     * Inicia uma nova chamada de áudio (SDP no corpo JSON — query string estoura limite de URL).
     */
    @POST
    @Path("/iniciar")
    public Response iniciarChamada(IniciarChamadaRequest request) {
        try {
            if (request == null
                    || request.conversaId == null
                    || request.chamadorId == null
                    || request.receptorId == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_INICIAR_FIELDS_REQUIRED)))
                        .build();
            }
            
            ChamadaDto chamada = chamadaService.iniciarChamada(
                    request.conversaId, 
                    request.chamadorId, 
                    request.receptorId, 
                    request.ofertaSdp
            );
            
            return Response.ok(chamada).build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.messageOrFallback(ApiI18nMessages.CHAMADA_OPERATION_FAILED, e.getMessage())))
                    .build();
        }
    }

    /**
     * Atende uma chamada recebida
     */
    @POST
    @Path("/{id}/atender")
    public Response atenderChamada(
            @PathParam("id") Long chamadaId,
            AtenderChamadaRequest body) {
        try {
            
            if (body == null || body.receptorId == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_RECEPTOR_ID_REQUIRED)))
                        .build();
            }
            
            ChamadaDto chamada = chamadaService.atenderChamada(
                    chamadaId, body.receptorId, body.respostaSdp != null ? body.respostaSdp : "");
            
            return Response.ok(chamada).build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.messageOrFallback(ApiI18nMessages.CHAMADA_OPERATION_FAILED, e.getMessage())))
                    .build();
        }
    }

    /**
     * Recusa uma chamada recebida
     */
    @POST
    @Path("/{id}/recusar")
    public Response recusarChamada(
            @PathParam("id") Long chamadaId,
            @QueryParam("receptorId") Long receptorId) {
        try {
            ChamadaDto chamada = chamadaService.recusarChamada(chamadaId, receptorId);
            return Response.ok(chamada).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.messageOrFallback(ApiI18nMessages.CHAMADA_OPERATION_FAILED, e.getMessage())))
                    .build();
        }
    }

    /**
     * Encerra uma chamada ativa
     */
    @POST
    @Path("/{id}/encerrar")
    public Response encerrarChamada(
            @PathParam("id") Long chamadaId,
            @QueryParam("usuarioId") Long usuarioId) {
        try {
            
            ChamadaDto chamada = chamadaService.encerrarChamada(chamadaId, usuarioId);
            
            return Response.ok(chamada).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.messageOrFallback(ApiI18nMessages.CHAMADA_OPERATION_FAILED, e.getMessage())))
                    .build();
        }
    }

    /**
     * Marca chamada como não atendida (timeout)
     */
    @POST
    @Path("/{id}/nao-atendida")
    public Response marcarNaoAtendida(@PathParam("id") Long chamadaId) {
        try {
            ChamadaDto chamada = chamadaService.marcarNaoAtendida(chamadaId);
            return Response.ok(chamada).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.messageOrFallback(ApiI18nMessages.CHAMADA_OPERATION_FAILED, e.getMessage())))
                    .build();
        }
    }

    /**
     * Atualiza ICE candidates do chamador
     */
    @PUT
    @Path("/{id}/ice-chamador")
    public Response atualizarIceCandidatesChamador(
            @PathParam("id") Long chamadaId,
            IceCandidatesRequest body) {
        try {
            String ice = body != null ? body.iceCandidates : null;
            chamadaService.atualizarIceCandidatesChamador(chamadaId, ice);
            return Response.ok().build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.messageOrFallback(ApiI18nMessages.CHAMADA_OPERATION_FAILED, e.getMessage())))
                    .build();
        }
    }

    /**
     * Atualiza ICE candidates do receptor
     */
    @PUT
    @Path("/{id}/ice-receptor")
    public Response atualizarIceCandidatesReceptor(
            @PathParam("id") Long chamadaId,
            IceCandidatesRequest body) {
        try {
            String ice = body != null ? body.iceCandidates : null;
            chamadaService.atualizarIceCandidatesReceptor(chamadaId, ice);
            return Response.ok().build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.messageOrFallback(ApiI18nMessages.CHAMADA_OPERATION_FAILED, e.getMessage())))
                    .build();
        }
    }

    /**
     * Atualiza o SDP de resposta (chamado após o atendimento configurar WebRTC)
     */
    @POST
    @Path("/{id}/atualizar-sdp")
    public Response atualizarSdpResposta(
            @PathParam("id") Long chamadaId,
            AtualizarSdpRequest body) {
        try {
            String respostaSdp = body != null ? body.respostaSdp : null;
            
            ChamadaDto chamada = chamadaService.atualizarSdpResposta(chamadaId, respostaSdp);
            
            return Response.ok(chamada).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.messageOrFallback(ApiI18nMessages.CHAMADA_OPERATION_FAILED, e.getMessage())))
                    .build();
        }
    }

    /**
     * Busca uma chamada por ID
     */
    @GET
    @Path("/{id}")
    public Response buscarChamada(@PathParam("id") Long chamadaId) {
        ChamadaDto chamada = chamadaService.buscarChamada(chamadaId);
        if (chamada == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.CHAMADA_NOT_FOUND)))
                    .build();
        }
        return Response.ok(chamada).build();
    }

    /**
     * Verifica se há chamada recebida (tocando) para o usuário
     */
    @GET
    @Path("/recebida")
    public Response buscarChamadaRecebida(@QueryParam("receptorId") Long receptorId) {
        ChamadaDto chamada = chamadaService.buscarChamadaRecebida(receptorId);
        if (chamada == null) {
            return Response.noContent().build(); // 204 No Content quando não há chamada
        }
        return Response.ok(chamada).build();
    }

    /**
     * Lista histórico de chamadas do usuário
     */
    @GET
    @Path("/historico")
    public List<ChamadaDto> listarHistorico(
            @QueryParam("usuarioId") Long usuarioId,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        return chamadaService.listarHistorico(usuarioId, page, size);
    }

    /**
     * Verifica se usuário está em chamada
     */
    @GET
    @Path("/em-chamada")
    public Response verificarEmChamada(@QueryParam("usuarioId") Long usuarioId) {
        boolean emChamada = chamadaService.isEmChamada(usuarioId);
        return Response.ok(new EmChamadaResponse(emChamada)).build();
    }

    // ==================== DTOs INTERNOS ====================

    public static class IniciarChamadaRequest {
        public Long conversaId;
        public Long receptorId;
        public Long chamadorId;
        /** JSON stringificado da RTCSessionDescription (oferta). */
        public String ofertaSdp;
    }

    public static class AtenderChamadaRequest {
        public Long receptorId;
        public String respostaSdp;
    }

    public static class AtualizarSdpRequest {
        public String respostaSdp;
    }

    public static class IceCandidatesRequest {
        public String iceCandidates;
    }

    public static class EmChamadaResponse {
        public boolean emChamada;

        public EmChamadaResponse(boolean emChamada) {
            this.emChamada = emChamada;
        }
    }

    public static class ErrorResponse {
        public String message;

        public ErrorResponse(String message) {
            this.message = message;
        }
    }
}
