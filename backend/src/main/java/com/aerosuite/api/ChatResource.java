package com.aerosuite.api;

import com.aerosuite.domain.MensagemAnexo;
import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ChatService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.File;
import java.util.List;

@Path("/api/chat")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"chat"})
public class ChatResource {

    @Inject
    ChatService chatService;

    // ==================== CONVERSAS ====================

    @GET
    @Path("/conversas")
    public List<ConversaDto> listarConversas(@QueryParam("usuarioId") Long usuarioId) {
        return chatService.listarConversas(usuarioId);
    }

    @GET
    @Path("/conversas/{id}")
    public ConversaDto buscarConversa(
            @PathParam("id") Long id,
            @QueryParam("usuarioId") Long usuarioId) {
        return chatService.buscarConversa(id, usuarioId);
    }

    @POST
    @Path("/conversas")
    public Response criarConversa(
            CriarConversaRequest request,
            @QueryParam("criadorId") Long criadorId) {
        try {
            ConversaDto conversa = chatService.criarConversa(request, criadorId);
            return Response.ok(conversa).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    // ==================== MENSAGENS ====================

    @GET
    @Path("/conversas/{id}/mensagens")
    public List<MensagemDto> listarMensagens(
            @PathParam("id") Long conversaId,
            @QueryParam("usuarioId") Long usuarioId,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("50") int size) {
        return chatService.listarMensagens(conversaId, usuarioId, page, size);
    }

    @POST
    @Path("/conversas/{id}/mensagens")
    public Response enviarMensagem(
            @PathParam("id") Long conversaId,
            @QueryParam("remetenteId") Long remetenteId,
            EnviarMensagemRequest request) {
        try {
            MensagemDto mensagem = chatService.enviarMensagem(conversaId, remetenteId, request);
            return Response.ok(mensagem).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/conversas/{id}/mensagens/arquivo")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response enviarMensagemComAnexo(
            @PathParam("id") Long conversaId,
            @QueryParam("remetenteId") Long remetenteId,
            @RestForm("conteudo") String conteudo,
            @RestForm("file") FileUpload file) {
        try {
            MensagemDto mensagem = chatService.enviarMensagemComAnexo(conversaId, remetenteId, conteudo, file);
            return Response.ok(mensagem).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/conversas/{id}/lida")
    public Response marcarComoLida(
            @PathParam("id") Long conversaId,
            @QueryParam("usuarioId") Long usuarioId) {
        try {
            chatService.marcarComoLida(conversaId, usuarioId);
            return Response.ok().build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    // ==================== CONTADORES ====================

    @GET
    @Path("/nao-lidas")
    public Response contarNaoLidas(@QueryParam("usuarioId") Long usuarioId) {
        long count = chatService.contarNaoLidas(usuarioId);
        return Response.ok(new ContadorResponse(count)).build();
    }

    // ==================== BUSCA DE USUÁRIOS ====================

    @GET
    @Path("/usuarios/buscar")
    public List<ParticipanteResumoDto> buscarUsuarios(
            @QueryParam("termo") String termo,
            @QueryParam("usuarioId") Long usuarioId) {
        return chatService.buscarUsuarios(termo, usuarioId);
    }

    // ==================== DOWNLOAD DE ANEXOS ====================

    @GET
    @Path("/anexos/{id}/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response downloadAnexo(@PathParam("id") Long anexoId) {
        MensagemAnexo anexo = MensagemAnexo.findById(anexoId);
        if (anexo == null || !anexo.ativo) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        File file = new File(anexo.caminho);
        if (!file.exists()) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        return Response.ok(file)
                .header("Content-Disposition", "attachment; filename=\"" + anexo.nomeOriginal + "\"")
                .header("Content-Type", anexo.tipoArquivo)
                .build();
    }

    // ==================== CLASSES AUXILIARES ====================

    public record ErrorResponse(String message) {}
    public record ContadorResponse(long count) {}
}
