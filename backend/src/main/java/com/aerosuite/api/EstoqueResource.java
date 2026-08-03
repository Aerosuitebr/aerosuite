package com.aerosuite.api;

import org.jboss.logging.Logger;
import com.aerosuite.dto.*;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.p1.TenantFeatureCodes;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.security.RequiresTenantFeature;
import com.aerosuite.service.EstoqueQuarentenaService;
import com.aerosuite.service.EstoqueService;
import com.aerosuite.service.ItemRastreioService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.jboss.resteasy.reactive.RestForm;

import java.nio.file.Files;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Path("/api/estoque")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyCodigoStartingWith = {"ESTOQUE"})
public class EstoqueResource {

    private static final Logger LOG = Logger.getLogger(EstoqueResource.class);
    
    @Inject
    EstoqueService service;

    @Inject
    EstoqueQuarentenaService quarentenaService;

    @Inject
    ItemRastreioService itemRastreioService;

    @Inject
    InternalUserContext internalUser;

    private Long resolveUsuarioId(Long headerFallback) {
        if (internalUser.isAuthenticated() && internalUser.getUserId() != null) {
            return internalUser.getUserId().longValue();
        }
        return headerFallback;
    }

    private String resolveUsuarioNome(String headerFallback) {
        if (internalUser.isAuthenticated() && internalUser.getNome() != null && !internalUser.getNome().isBlank()) {
            return internalUser.getNome();
        }
        if (headerFallback != null && !headerFallback.isBlank()) {
            return headerFallback;
        }
        return "Sistema";
    }

    /** Movimentações de estoque exigem utilizador autenticado (sem fallback para id 1). */
    private Long requireAuthenticatedUserId(Long headerFallback) {
        Long uid = resolveUsuarioId(headerFallback);
        if (uid == null) {
            throw new BadRequestException(ApiI18nMessages.domain("estoque.error.usuario_nao_autenticado"));
        }
        return uid;
    }

    // ==================== FORNECEDORES ====================
    
    @GET
    @Path("/fornecedores")
    public Response listarFornecedores(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("search") String search) {
        try {
            EstoqueService.FornecedorPageResult pageResult = service.listarFornecedoresPagina(page, size, search);
            return Response.ok(Map.of(
                "content", pageResult.content(),
                "totalElements", pageResult.totalElements(),
                "page", pageResult.page(),
                "size", pageResult.size()
            )).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    @GET
    @Path("/fornecedores/{id}")
    public Response buscarFornecedor(@PathParam("id") Long id) {
        try {
            return Response.ok(service.buscarFornecedor(id)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    @POST
    @Path("/fornecedores")
    public Response criarFornecedor(FornecedorDto dto) {
        try {
            FornecedorDto criado = service.salvarFornecedor(dto);
            return Response.status(Response.Status.CREATED).entity(criado).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    @DELETE
    @Path("/fornecedores/{id}")
    public Response excluirFornecedor(@PathParam("id") Long id) {
        try {
            service.excluirFornecedor(id);
            return Response.noContent().build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.ESTOQUE_OPERATION_ERROR, e.getMessage())))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.ESTOQUE_OPERATION_ERROR, e.getMessage())))
                    .build();
        }
    }

    @PUT
    @Path("/fornecedores/{id}")
    public Response atualizarFornecedor(@PathParam("id") Long id, FornecedorDto dto) {
        try {
            dto.id = id;
            return Response.ok(service.salvarFornecedor(dto)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    // ==================== INVOICES ====================
    
    @GET
    @Path("/invoices")
    public Response listarInvoices(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("search") String search,
            @QueryParam("status") String status,
            @QueryParam("incluirInativas") @DefaultValue("false") boolean incluirInativas,
            @QueryParam("somenteUtilizaveis") @DefaultValue("false") boolean somenteUtilizaveis) {
        try {
            List<InvoiceDto> invoices = service.listarInvoices(page, size, search, status, incluirInativas, somenteUtilizaveis);
            return Response.ok(Map.of(
                "content", invoices,
                "page", page,
                "size", size
            )).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    @GET
    @Path("/invoices/{id}")
    public Response buscarInvoice(@PathParam("id") Long id) {
        try {
            return Response.ok(service.buscarInvoice(id)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/invoices/{id}/validacao-inativacao")
    public Response validarInativacaoInvoice(@PathParam("id") Long id) {
        try {
            return Response.ok(service.validarInativacaoInvoice(id)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/invoices/{id}/auditoria")
    public Response listarAuditoriaInvoice(@PathParam("id") Long id) {
        try {
            return Response.ok(service.listarAuditoriaInvoice(id)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/invoices/{id}/inativar")
    public Response inativarInvoice(@PathParam("id") Long id, InvoiceAcaoRequest body,
            @HeaderParam("X-User-Id") Long usuarioId,
            @HeaderParam("X-User-Name") String usuarioNome) {
        try {
            Long uid = resolveUsuarioId(usuarioId);
            if (uid == null) {
                uid = 0L;
            }
            String nome = resolveUsuarioNome(usuarioNome);
            if (body != null && (body.usuarioEmail == null || body.usuarioEmail.isBlank())
                    && internalUser.isAuthenticated() && internalUser.getEmail() != null) {
                body.usuarioEmail = internalUser.getEmail();
            }
            service.inativarInvoice(id, body, uid, nome, null, null);
            return Response.ok(Map.of(
                    "sucesso", true,
                    "mensagem", "estoque.invoiceList.toast.inativada"
            )).build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/invoices/{id}/cancelar")
    public Response cancelarInvoice(@PathParam("id") Long id, InvoiceAcaoRequest body,
            @HeaderParam("X-User-Id") Long usuarioId,
            @HeaderParam("X-User-Name") String usuarioNome) {
        try {
            Long uid = resolveUsuarioId(usuarioId);
            if (uid == null) {
                uid = 0L;
            }
            String nome = resolveUsuarioNome(usuarioNome);
            if (body != null && (body.usuarioEmail == null || body.usuarioEmail.isBlank())
                    && internalUser.isAuthenticated() && internalUser.getEmail() != null) {
                body.usuarioEmail = internalUser.getEmail();
            }
            InvoiceDto atualizada = service.cancelarInvoice(id, body, uid, nome, null, null);
            return Response.ok(Map.of(
                    "sucesso", true,
                    "mensagem", "estoque.invoice.toast.cancelada",
                    "invoice", atualizada
            )).build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    @POST
    @Path("/invoices/{id}/restaurar")
    public Response restaurarInvoice(@PathParam("id") Long id, InvoiceAcaoRequest body,
            @HeaderParam("X-User-Id") Long usuarioId,
            @HeaderParam("X-User-Name") String usuarioNome) {
        try {
            Long uid = resolveUsuarioId(usuarioId);
            if (uid == null) {
                uid = 0L;
            }
            String nome = resolveUsuarioNome(usuarioNome);
            if (body != null && (body.usuarioEmail == null || body.usuarioEmail.isBlank())
                    && internalUser.isAuthenticated() && internalUser.getEmail() != null) {
                body.usuarioEmail = internalUser.getEmail();
            }
            InvoiceDto atualizada = service.restaurarInvoice(id, body, uid, nome, null, null);
            return Response.ok(Map.of(
                    "sucesso", true,
                    "mensagem", "estoque.invoiceList.toast.restaurada",
                    "invoice", atualizada
            )).build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/invoices")
    public Response criarInvoice(InvoiceDto dto, @HeaderParam("X-User-Id") Long usuarioId) {
        try {
            InvoiceDto criada = service.salvarInvoice(dto, resolveUsuarioId(usuarioId));
            return Response.status(Response.Status.CREATED).entity(criada).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    @PUT
    @Path("/invoices/{id}")
    public Response atualizarInvoice(@PathParam("id") Long id, InvoiceDto dto, 
            @HeaderParam("X-User-Id") Long usuarioId) {
        try {
            dto.id = id;
            return Response.ok(service.salvarInvoice(dto, resolveUsuarioId(usuarioId))).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    @POST
    @Path("/invoices/{invoiceId}/itens")
    public Response adicionarItemInvoice(@PathParam("invoiceId") Long invoiceId, InvoiceItemDto dto) {
        try {
            return Response.status(Response.Status.CREATED)
                    .entity(service.salvarInvoiceItem(invoiceId, dto))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    /**
     * Consulta disponibilidade de estoque (soma itens DISPONÍVEIS) por Part Number para validação em OS / propostas.
     */
    @POST
    @Path("/disponibilidade/consulta")
    public Response consultarDisponibilidade(List<ConsultaDisponibilidadeLinhaDto> linhas) {
        try {
            return Response.ok(service.consultarDisponibilidadeParaLinhas(linhas)).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    // ==================== ITENS DE ESTOQUE ====================
    
    @GET
    @Path("/itens")
    public Response listarItensEstoque(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("search") String search,
            @QueryParam("status") String status,
            @QueryParam("fornecedorId") Long fornecedorId,
            @QueryParam("invoiceId") Long invoiceId,
            @QueryParam("loteId") Long loteId) {
        try {
            List<ItemEstoqueDto> itens = service.listarItensEstoque(page, size, search, status, fornecedorId, invoiceId, loteId);
            long total = service.contarItensEstoque(search, status, fornecedorId, invoiceId, loteId);
            return Response.ok(Map.of(
                "content", itens,
                "totalElements", total,
                "page", page,
                "size", size
            )).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    @GET
    @Path("/itens/{id}")
    public Response buscarItemEstoque(@PathParam("id") Long id) {
        try {
            return Response.ok(service.buscarItemEstoque(id)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    @GET
    @Path("/itens/{id}/certificado")
    public Response obterCertificado(@PathParam("id") Long id) {
        try {
            return Response.ok(service.obterCertificado(id)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", e.getMessage())).build();
        }
    }

    @PUT
    @Path("/itens/{id}/certificado")
    public Response salvarCertificado(@PathParam("id") Long id, CertificadoPecaDto body) {
        try {
            return Response.ok(service.salvarCertificado(id, body)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", e.getMessage())).build();
        } catch (jakarta.ws.rs.BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", e.getMessage())).build();
        }
    }

    @POST
    @Path("/itens/{id}/certificado/anexo")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadCertificadoAnexo(
            @PathParam("id") Long id, @RestForm("file") FileUpload file) {
        try {
            return Response.ok(service.uploadCertificadoAnexo(id, file)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", e.getMessage())).build();
        } catch (jakarta.ws.rs.BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", e.getMessage())).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/itens/{id}/certificado/anexo")
    public Response downloadCertificadoAnexo(@PathParam("id") Long id) {
        try {
            var path = service.caminhoAnexoCertificado(id);
            CertificadoPecaDto meta = service.obterCertificado(id);
            String contentType =
                    meta.certAnexoNome != null && meta.temAnexo
                            ? Files.probeContentType(path)
                            : null;
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            StreamingOutput stream = output -> Files.copy(path, output);
            return Response.ok(stream)
                    .header(
                            "Content-Disposition",
                            "attachment; filename=\""
                                    + (meta.certAnexoNome != null ? meta.certAnexoNome : "certificado")
                                    + "\"")
                    .type(contentType)
                    .build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", e.getMessage())).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/itens/{id}")
    public Response atualizarItemEstoque(@PathParam("id") Long id, ItemEstoqueDto dto,
            @HeaderParam("X-User-Id") Long usuarioId,
            @HeaderParam("X-User-Name") String usuarioNome) {
        try {
            Long uid = requireAuthenticatedUserId(usuarioId);
            String unome = resolveUsuarioNome(usuarioNome);
            dto.id = id;
            return Response.ok(service.atualizarItemEstoque(id, dto, uid, unome)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @DELETE
    @Path("/itens/{id}")
    public Response excluirItemEstoque(@PathParam("id") Long id,
            @QueryParam("motivo") String motivo,
            @HeaderParam("X-User-Id") Long usuarioId,
            @HeaderParam("X-User-Name") String usuarioNome) {
        try {
            Long uid = requireAuthenticatedUserId(usuarioId);
            String unome = resolveUsuarioNome(usuarioNome);
            return Response.ok(service.excluirItemEstoque(id, uid, unome, motivo)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    /**
     * Atualiza estoque mínimo e ideal em lote a partir de planilha.
     * Body: array de { partNumber, estoqueMinimo, estoqueIdeal }.
     * Atualiza todos os itens com o mesmo Part Number.
     */
    @POST
    @Path("/itens/atualizar-estoque-minimo-lote")
    public Response atualizarEstoqueMinimoLote(List<EstoqueMinimoLoteDto> body) {
        try {
            if (body == null || body.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.ESTOQUE_MIN_BATCH_LINE_REQUIRED)))
                        .build();
            }
            return Response.ok(service.atualizarEstoqueMinimoLote(body)).build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    /**
     * Consulta item por qualquer código (rastreio, part number, serial number ou número da invoice).
     * Usado pelo leitor de código de barras ou QR Code
     */
    /**
     * Linha do tempo de rastreabilidade (compliance): item + movimentações + OS resolvida.
     */
    @GET
    @Path("/rastreio/{codigo}/linha-tempo")
    public Response linhaTempoPorCodigo(@PathParam("codigo") String codigo) {
        try {
            return Response.ok(itemRastreioService.linhaTempoPorCodigo(codigo)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage(), "codigo", codigo))
                    .build();
        }
    }

    @GET
    @Path("/itens/{id}/linha-tempo")
    public Response linhaTempoPorItemId(@PathParam("id") Long id) {
        try {
            return Response.ok(itemRastreioService.linhaTempoPorItemId(id)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/rastreio/{codigo}/linha-tempo/pdf")
    @Produces("application/pdf")
    public Response linhaTempoPdfPorCodigo(
            @PathParam("codigo") String codigo, @QueryParam("locale") @DefaultValue("pt-BR") String locale) {
        try {
            var data = itemRastreioService.linhaTempoPorCodigo(codigo);
            byte[] pdf = itemRastreioService.exportPdfPorCodigo(codigo, locale);
            String filename = itemRastreioService.suggestedFileName(data);
            return Response.ok(pdf)
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/consulta/{codigo}")
    public Response consultarPorCodigo(@PathParam("codigo") String codigo) {
        try {
            return Response.ok(service.buscarItemPorCodigoRastreio(codigo)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", ApiI18nMessages.encode(
                            ApiI18nMessages.ESTOQUE_ITEM_NOT_FOUND_BY_CODE, "codigo", codigo)))
                    .build();
        }
    }
    
    /**
     * Busca todos os itens com um determinado part number
     * Retorna lista de itens (pode haver múltiplos com mesmo P/N)
     */
    @GET
    @Path("/consulta/pn/{partNumber}")
    public Response consultarPorPartNumber(@PathParam("partNumber") String partNumber) {
        try {
            List<ItemEstoqueDto> itens = service.buscarItensPorPartNumber(partNumber);
            if (itens.isEmpty()) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", ApiI18nMessages.encode(
                                ApiI18nMessages.ESTOQUE_NO_ITEMS_BY_PN, "partNumber", partNumber)))
                        .build();
            }
            return Response.ok(Map.of(
                "content", itens,
                "totalElements", itens.size(),
                "partNumber", partNumber
            )).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    /**
     * Entrada de mercadoria no estoque
     */
    @POST
    @Path("/entrada")
    public Response entradaEstoque(EntradaEstoqueDto dto,
            @HeaderParam("X-User-Id") Long usuarioId,
            @HeaderParam("X-User-Name") String usuarioNome) {
        try {
            Long uid = requireAuthenticatedUserId(usuarioId);
            String unome = resolveUsuarioNome(usuarioNome);

            ItemEstoqueDto item = service.entradaEstoque(dto, uid, unome);
            return Response.status(Response.Status.CREATED).entity(item).build();
        } catch (IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro inesperado");
            String msg = e.getMessage();
            Throwable cause = e.getCause();
            while (cause != null && (msg == null || msg.isBlank() || msg.contains("work") || msg.contains("execute"))) {
                if (cause.getMessage() != null && !cause.getMessage().isBlank()) msg = cause.getMessage();
                cause = cause.getCause();
            }
            if (msg == null || msg.isBlank()) {
                msg = ApiI18nMessages.encode(ApiI18nMessages.ESTOQUE_ENTRY_REGISTER_FAILED);
            }
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", msg))
                    .build();
        }
    }
    
    @GET
    @Path("/quarentena")
    public Response listarQuarentena(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("search") String search) {
        try {
            List<ItemEstoqueDto> itens = quarentenaService.listar(page, size, search);
            long total = quarentenaService.contar(search);
            return Response.ok(
                            Map.of(
                                    "content", itens,
                                    "totalElements", total,
                                    "page", page,
                                    "size", size))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/itens/{id}/quarentena")
    public Response enviarQuarentena(
            @PathParam("id") Long id,
            QuarentenaEnviarRequest body,
            @HeaderParam("X-User-Id") Long usuarioId,
            @HeaderParam("X-User-Name") String usuarioNome) {
        try {
            Long uid = requireAuthenticatedUserId(usuarioId);
            ItemEstoqueDto dto =
                    quarentenaService.enviar(id, body, uid, resolveUsuarioNome(usuarioNome));
            return Response.ok(dto).build();
        } catch (IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", e.getMessage())).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", e.getMessage())).build();
        }
    }

    @POST
    @Path("/itens/{id}/quarentena/liberar")
    public Response liberarQuarentena(
            @PathParam("id") Long id,
            QuarentenaLiberarRequest body,
            @HeaderParam("X-User-Id") Long usuarioId,
            @HeaderParam("X-User-Name") String usuarioNome) {
        try {
            Long uid = requireAuthenticatedUserId(usuarioId);
            ItemEstoqueDto dto =
                    quarentenaService.liberar(id, body, uid, resolveUsuarioNome(usuarioNome));
            return Response.ok(dto).build();
        } catch (IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", e.getMessage())).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", e.getMessage())).build();
        }
    }

    /** Regras de saída (validação extra, certificado obrigatório, etc.). */
    @GET
    @Path("/saida/regras")
    public EstoqueSaidaRegrasDto regrasSaida() {
        return service.regrasSaida();
    }

    /**
     * Regras de saída customizadas do tenant (somente com flag {@link TenantFeatureCodes#ESTOQUE_SAIDA_VALIDACAO_EXTRA}).
     */
    @GET
    @Path("/saida/regras-customizadas")
    @RequiresTenantFeature(allOf = {TenantFeatureCodes.ESTOQUE_SAIDA_VALIDACAO_EXTRA})
    public SaidaRegrasCustomizadasDto regrasSaidaCustomizadas() {
        return service.regrasSaidaCustomizadas();
    }

    /**
     * Saída de mercadoria do estoque (consumo em OS)
     */
    @POST
    @Path("/saida")
    public Response saidaEstoque(SaidaEstoqueRequest request,
            @HeaderParam("X-User-Id") Long usuarioId,
            @HeaderParam("X-User-Name") String usuarioNome) {
        try {
            Long uid = requireAuthenticatedUserId(usuarioId);
            String unome = resolveUsuarioNome(usuarioNome);

            ItemEstoqueDto item = service.saidaEstoque(
                request.itemId, request.osId, request.quantidade,
                uid, unome, request.motivo);
            return Response.ok(item).build();
        } catch (IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    // ==================== LOTES ====================
    
    @GET
    @Path("/lotes")
    public Response listarLotes(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("search") String search,
            @QueryParam("status") String status,
            @QueryParam("invoiceId") Long invoiceId) {
        try {
            List<LoteDto> lotes = service.listarLotes(page, size, search, status, invoiceId);
            long total = service.contarLotes(search, status, invoiceId);
            return Response.ok(Map.of(
                "content", lotes,
                "totalElements", total,
                "page", page,
                "size", size
            )).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    @GET
    @Path("/lotes/{id}")
    public Response buscarLote(@PathParam("id") Long id) {
        try {
            return Response.ok(service.buscarLote(id)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    @POST
    @Path("/lotes")
    public Response criarLote(LoteDto dto, @HeaderParam("X-User-Id") Long usuarioId) {
        try {
            Long uid = requireAuthenticatedUserId(usuarioId);
            LoteDto criado = service.salvarLote(dto, uid);
            return Response.status(Response.Status.CREATED).entity(criado).build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    @PUT
    @Path("/lotes/{id}")
    public Response atualizarLote(@PathParam("id") Long id, LoteDto dto, 
            @HeaderParam("X-User-Id") Long usuarioId) {
        try {
            Long uid = requireAuthenticatedUserId(usuarioId);
            dto.id = id;
            return Response.ok(service.salvarLote(dto, uid)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    /**
     * Recalcula quantidade disponível de todos os lotes a partir dos itens em estoque (correção de dados).
     */
    @POST
    @Path("/lotes/sincronizar-quantidades")
    public Response sincronizarQuantidadesLotes() {
        try {
            int lotes = service.recalcularQuantidadesTodosLotes();
            return Response.ok(Map.of(
                    "message", "Quantidades dos lotes recalculadas com base nos itens.",
                    "lotesProcessados", lotes)).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    /** Regras da consulta QR (limite de histórico por flag de tenant). */
    @GET
    @Path("/consulta-qr/regras")
    public ConsultaQrRegrasDto consultaQrRegras() {
        return service.consultaQrRegras();
    }

    // ==================== MOVIMENTAÇÕES ====================
    
    @GET
    @Path("/movimentacoes")
    public Response listarMovimentacoes(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("itemId") Long itemId,
            @QueryParam("tipo") String tipo,
            @QueryParam("partNumber") String partNumber,
            @QueryParam("dataInicio") LocalDate dataInicio,
            @QueryParam("dataFim") LocalDate dataFim) {
        try {
            PageResponse<MovimentacaoEstoqueDto> pg = service.listarMovimentacoes(
                    page, size, itemId, tipo, partNumber, dataInicio, dataFim);
            return Response.ok(Map.of(
                "content", pg.items,
                "totalElements", pg.totalElements,
                "totalPages", pg.totalPages,
                "page", pg.page,
                "size", pg.size
            )).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    /**
     * Relatório de saídas automáticas: kit FCU na OS e trocas eventuais marcadas como pagas.
     */
    @GET
    @Path("/rastreio/saidas-automaticas")
    public Response listarRastreioSaidasAutomaticas(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("30") int size,
            @QueryParam("partNumber") String partNumber,
            @QueryParam("origemSaida") String origemSaida,
            @QueryParam("osId") Long osPk,
            @QueryParam("produtoCatalogoId") Integer produtoCatalogoId,
            @QueryParam("dataInicio") LocalDate dataInicio,
            @QueryParam("dataFim") LocalDate dataFim) {
        try {
            PageResponse<SaidaProdutoRastreioLinhaDto> pg = service.listarRastreioSaidasAutomaticas(
                    page, size, partNumber, origemSaida, osPk, produtoCatalogoId, dataInicio, dataFim);
            return Response.ok(Map.of(
                    "content", pg.items,
                    "totalElements", pg.totalElements,
                    "totalPages", pg.totalPages,
                    "page", pg.page,
                    "size", pg.size
            )).build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    /**
     * Rastreio principal: produtos do kit do FCU por OS (cadastro). Cruza com movimentação quando existir saída de kit compatível.
     */
    @GET
    @Path("/rastreio/kit-catalogo-por-os-legado")
    public Response listarKitCatalogoFcuPorOsLegado(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("30") int size,
            @QueryParam("partNumber") String partNumber,
            @QueryParam("osId") Long osPk,
            @QueryParam("produtoCatalogoId") Integer produtoCatalogoId,
            @QueryParam("dataInicio") LocalDate dataInicio,
            @QueryParam("dataFim") LocalDate dataFim) {
        try {
            PageResponse<OsKitRastreioResumoDto> pg = service.listarKitCatalogoFcuPorOsLegado(
                    page, size, partNumber, osPk, produtoCatalogoId, dataInicio, dataFim);
            return Response.ok(Map.of(
                    "content", pg.items,
                    "totalElements", pg.totalElements,
                    "totalPages", pg.totalPages,
                    "page", pg.page,
                    "size", pg.size
            )).build();
        } catch (Exception e) {
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    // ==================== QR CODE ====================

    /**
     * Base URL para montar QR de etiquetas (resolve localhost → IP da LAN em dev).
     */
    @GET
    @Path("/qr-scan-base-url")
    public Response qrScanBaseUrl() {
        try {
            return Response.ok(Map.of("baseUrl", service.getQrScanBaseUrl())).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", ApiI18nMessages.messageOrFallback(
                            ApiI18nMessages.ESTOQUE_QR_URL_RESOLVE_FAILED, e.getMessage())))
                    .build();
        }
    }
    
    /**
     * Gera imagem do QR Code para um item
     */
    @GET
    @Path("/itens/{id}/qrcode")
    @Produces("image/png")
    public Response gerarQrCode(
            @PathParam("id") Long id,
            @QueryParam("tamanho") @DefaultValue("200") int tamanho) {
        try {
            byte[] qrCodeBytes = service.gerarQrCodeImagem(id, tamanho);
            return Response.ok(qrCodeBytes)
                    .header("Content-Disposition", "inline; filename=\"qrcode-" + id + ".png\"")
                    .build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    
    // ==================== CLASSES AUXILIARES ====================
    
    public static class SaidaEstoqueRequest {
        public Long itemId;
        public Long osId;
        public java.math.BigDecimal quantidade;
        public String motivo;
    }
}
