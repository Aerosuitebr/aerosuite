package com.aerosuite.api;

import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.dto.*;
import com.aerosuite.service.NrcService;
import com.aerosuite.util.NrcBusinessException;
import com.aerosuite.util.NrcErrorCode;
import com.aerosuite.util.NrcNotFoundException;
import com.aerosuite.util.NrcRelatorioMessages;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Path("/api/nrc")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {
    "NRC_DASHBOARD", "NRC_LIST", "NRC_RELATORIO", "NRC_ABRIR", "NRC_ANALISAR", "NRC_ENCERRAR"
})
public class NrcResource {

    private static final String UPLOAD_DIR = "uploads/nrc/evidencias/";
    private static final long MAX_UPLOAD_BYTES = 25L * 1024 * 1024;
    private static final Set<String> ALLOWED_UPLOAD_MIMES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"
    );

    @Inject
    NrcService service;

    @Inject
    TenantDataAccess tenants;

    @Context
    HttpHeaders httpHeaders;

    @GET
    public Response list(
            @QueryParam("page") @DefaultValue("0") Integer page,
            @QueryParam("size") @DefaultValue("10") Integer size,
            @QueryParam("sort") String sort,
            @QueryParam("q") String q,
            @QueryParam("status") String status,
            @QueryParam("origem") String origem,
            @QueryParam("severidade") String severidade,
            @QueryParam("osId") Long osId,
            @QueryParam("dataInicio") LocalDate dataInicio,
            @QueryParam("dataFim") LocalDate dataFim,
            @QueryParam("responsavelTratamentoId") Long responsavelTratamentoId,
            @QueryParam("responsavelTratamentoOuHistoricoId") Long responsavelTratamentoOuHistoricoId,
            @QueryParam("excluirStatus") String excluirStatus,
            @QueryParam("prontaParaEficacia") Boolean prontaParaEficacia,
            @QueryParam("vencidas") Boolean vencidas,
            @QueryParam("proximasVencimento") Boolean proximasVencimento,
            @QueryParam("etapaAtual") String etapaAtual,
            @QueryParam("dataEncerramentoInicio") LocalDate dataEncerramentoInicio,
            @QueryParam("dataEncerramentoFim") LocalDate dataEncerramentoFim,
            @QueryParam("emTratamento") Boolean emTratamento,
            @QueryParam("localOcorrencia") String localOcorrencia,
            @QueryParam("origemInterna") Boolean origemInterna) {
        try {
            requireAuthenticated();
            AuditoriaUsuarioContext audit = AuditoriaUsuarioContext.from(httpHeaders, null, null);
            var result = service.search(page, size, sort, q, status, origem, severidade, osId, dataInicio, dataFim,
                responsavelTratamentoId, responsavelTratamentoOuHistoricoId, excluirStatus, prontaParaEficacia,
                vencidas, proximasVencimento, etapaAtual, dataEncerramentoInicio, dataEncerramentoFim, emTratamento,
                localOcorrencia, origemInterna, audit.userId);
            return Response.ok(Map.of(
                "items", result.items(),
                "totalElements", result.total(),
                "totalPages", (int) Math.ceil((double) result.total() / Math.max(size, 1)),
                "page", page,
                "size", size
            )).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @GET
    @Path("/catalog")
    public Response catalog() {
        try {
            requireAuthenticated();
            AuditoriaUsuarioContext audit = AuditoriaUsuarioContext.from(httpHeaders, null, null);
            return Response.ok(service.catalog(audit.userId)).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @GET
    @Path("/dashboard")
    public Response dashboard(
            @QueryParam("meses") Integer meses,
            @QueryParam("origem") String origem,
            @QueryParam("localOcorrencia") String localOcorrencia,
            @QueryParam("origemInterna") Boolean origemInterna,
            @QueryParam("dataInicio") LocalDate dataInicio,
            @QueryParam("dataFim") LocalDate dataFim) {
        try {
            requireAuthenticated();
            AuditoriaUsuarioContext audit = AuditoriaUsuarioContext.from(httpHeaders, null, null);
            if (dataInicio != null && dataFim != null && dataInicio.isAfter(dataFim)) {
                return Response.status(400).build();
            }
            NrcDashboardFilter filter = new NrcDashboardFilter(meses, origem, localOcorrencia, origemInterna, dataInicio, dataFim);
            return Response.ok(service.dashboard(audit.userId, filter)).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @GET
    @Path("/counts-by-os")
    public Response countsByOs(@QueryParam("osIds") String osIdsParam) {
        try {
            requireAuthenticated();
            AuditoriaUsuarioContext audit = AuditoriaUsuarioContext.from(httpHeaders, null, null);
            if (osIdsParam == null || osIdsParam.isBlank()) {
                return Response.ok(Map.of()).build();
            }
            List<Long> ids = java.util.Arrays.stream(osIdsParam.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::valueOf)
                .toList();
            if (ids.size() > 200) {
                return conflict(NrcErrorCode.OS_IDS_LIMIT);
            }
            return Response.ok(service.countAbertasByOsIds(ids, audit.userId)).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @GET
    @Path("/os/{osId}")
    public Response listByOs(@PathParam("osId") Long osId) {
        try {
            requireAuthenticated();
            AuditoriaUsuarioContext audit = AuditoriaUsuarioContext.from(httpHeaders, null, null);
            return Response.ok(service.listByOsId(osId, audit.userId)).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @GET
    @Path("/{id}/pode-tratar")
    public Response podeTratar(@PathParam("id") Long id, @QueryParam("usuarioId") Long usuarioId) {
        try {
            requireAuthenticated();
            NrcUsuarioContext ctx = requireCtx(usuarioId, null);
            boolean allowed = service.canShowTratarWorkflow(id, ctx.usuarioId());
            return Response.ok(Map.of("allowed", allowed)).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        try {
            AuditoriaUsuarioContext audit = AuditoriaUsuarioContext.from(httpHeaders, null, null);
            requireAuthenticated();
            return Response.ok(service.getById(id, audit.userId)).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @POST
    public Response create(NrcDto dto,
                           @QueryParam("usuarioId") Long usuarioId,
                           @QueryParam("usuarioNome") String usuarioNome) {
        try {
            NrcDto created = service.create(dto, requireCtx(usuarioId, usuarioNome));
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Long id, NrcAberturaUpdateDto dto,
                           @QueryParam("usuarioId") Long usuarioId,
                           @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.updateAbertura(id, dto, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/assumir-tratamento")
    public Response assumirTratamento(@PathParam("id") Long id,
                                      @QueryParam("usuarioId") Long usuarioId,
                                      @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.assumirTratamento(id, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/delegar-tratamento")
    public Response delegarTratamento(@PathParam("id") Long id, NrcDelegarRequest req,
                                      @QueryParam("usuarioId") Long usuarioId,
                                      @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.delegarTratamento(id, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/contencao")
    public Response contencao(@PathParam("id") Long id, NrcContencaoRequest req,
                              @QueryParam("usuarioId") Long usuarioId,
                              @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.registrarContencao(id, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/contencao/solicitar-aprovacao")
    public Response solicitarAprovacaoContencao(@PathParam("id") Long id, NrcContencaoRequest req,
                                                @QueryParam("usuarioId") Long usuarioId,
                                                @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.solicitarAprovacaoContencao(id, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/contencao/aprovar")
    public Response aprovarContencao(@PathParam("id") Long id,
                                    @QueryParam("usuarioId") Long usuarioId,
                                    @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.aprovarContencao(id, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/contencao/rejeitar")
    public Response rejeitarContencao(@PathParam("id") Long id, NrcContencaoRejeicaoRequest req,
                                      @QueryParam("usuarioId") Long usuarioId,
                                      @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.rejeitarContencao(id, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/analise")
    public Response analise(@PathParam("id") Long id, NrcAnaliseRequest req,
                            @QueryParam("usuarioId") Long usuarioId,
                            @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.registrarAnalise(id, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/analise/solicitar-aprovacao")
    public Response solicitarAprovacaoAnaliseCausa(@PathParam("id") Long id, NrcAnaliseRequest req,
                                                  @QueryParam("usuarioId") Long usuarioId,
                                                  @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.solicitarAprovacaoAnaliseCausa(id, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/analise/aprovar")
    public Response aprovarAnaliseCausa(@PathParam("id") Long id,
                                        @QueryParam("usuarioId") Long usuarioId,
                                        @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.aprovarAnaliseCausa(id, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/analise/rejeitar")
    public Response rejeitarAnaliseCausa(@PathParam("id") Long id, NrcContencaoRejeicaoRequest req,
                                         @QueryParam("usuarioId") Long usuarioId,
                                         @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.rejeitarAnaliseCausa(id, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/acoes")
    public Response acoes(@PathParam("id") Long id, NrcAcoesRequest req,
                          @QueryParam("usuarioId") Long usuarioId,
                          @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.registrarAcoes(id, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/acoes/solicitar-aprovacao")
    public Response solicitarAprovacaoPlanoAcoes(@PathParam("id") Long id, NrcAcoesRequest req,
                                                 @QueryParam("usuarioId") Long usuarioId,
                                                 @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.solicitarAprovacaoPlanoAcoes(id, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/acoes/aprovar")
    public Response aprovarPlanoAcoes(@PathParam("id") Long id,
                                      @QueryParam("usuarioId") Long usuarioId,
                                      @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.aprovarPlanoAcoes(id, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/acoes/rejeitar")
    public Response rejeitarPlanoAcoes(@PathParam("id") Long id, NrcContencaoRejeicaoRequest req,
                                       @QueryParam("usuarioId") Long usuarioId,
                                       @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.rejeitarPlanoAcoes(id, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/proposta-tratamento")
    public Response propostaTratamento(@PathParam("id") Long id, NrcPropostaTratamentoRequest req,
                                       @QueryParam("usuarioId") Long usuarioId,
                                       @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.propostaTratamento(id, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/aprovar-tratamento")
    public Response aprovarTratamento(@PathParam("id") Long id,
                                      @QueryParam("usuarioId") Long usuarioId,
                                      @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.aprovarTratamento(id, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @POST
    @Path("/{id}/solicitar-apreciacao-qualidade")
    public Response solicitarApreciacaoQualidade(@PathParam("id") Long id,
                                                 @QueryParam("usuarioId") Long usuarioId,
                                                 @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.solicitarApreciacaoQualidade(id, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/acoes/{acaoId}/concluir")
    public Response concluirAcao(@PathParam("id") Long id, @PathParam("acaoId") Long acaoId,
                                 NrcConcluirAcaoRequest req,
                                 @QueryParam("usuarioId") Long usuarioId,
                                 @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.concluirAcao(id, acaoId, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/verificacao-eficacia")
    public Response verificacaoEficacia(@PathParam("id") Long id, NrcVerificacaoEficaciaRequest req,
                                        @QueryParam("usuarioId") Long usuarioId,
                                        @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.registrarVerificacaoEficacia(id, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @PUT
    @Path("/{id}/encerrar")
    public Response encerrar(@PathParam("id") Long id, NrcEncerramentoRequest req,
                             @QueryParam("usuarioId") Long usuarioId,
                             @QueryParam("usuarioNome") String usuarioNome) {
        try {
            return Response.ok(service.encerrar(id, req, requireCtx(usuarioId, usuarioNome))).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @GET
    @Path("/{id}/auditoria")
    public Response auditoria(@PathParam("id") Long id) {
        try {
            AuditoriaUsuarioContext audit = AuditoriaUsuarioContext.from(httpHeaders, null, null);
            requireAuthenticated();
            return Response.ok(service.listAuditoria(id, audit.userId)).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @POST
    @Path("/{id}/anexos")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadAnexo(
            @PathParam("id") Long id,
            @RestForm("file") FileUpload file,
            @RestForm("descricao") String descricao,
            @RestForm("categoria") String categoria,
            @RestForm("usuarioId") Long usuarioId,
            @RestForm("usuarioNome") String usuarioNome) {
        try {
            if (file == null || file.fileName() == null) {
                return conflict(NrcErrorCode.FILE_REQUIRED);
            }
            if (file.size() > MAX_UPLOAD_BYTES) {
                return conflict(NrcErrorCode.FILE_TOO_LARGE);
            }
            String mimeType = file.contentType();
            if (mimeType == null || mimeType.isBlank() || !isAllowedUploadMime(mimeType)) {
                return conflict(NrcErrorCode.FILE_TYPE_NOT_ALLOWED);
            }
            String originalName = file.fileName();
            String extension = "";
            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex > 0) {
                extension = originalName.substring(dotIndex).toLowerCase(Locale.ROOT);
            }
            if (extension.isBlank() || !ALLOWED_EXTENSIONS.contains(extension)) {
                return conflict(NrcErrorCode.FILE_EXTENSION_NOT_ALLOWED);
            }
            NrcUsuarioContext ctx = requireCtx(usuarioId, usuarioNome);
            service.assertCanUploadAnexo(id, ctx);

            java.nio.file.Path uploadPath = Paths.get(UPLOAD_DIR, "tenant-" + tenants.currentTenantIdStr(), id.toString());
            Files.createDirectories(uploadPath);

            String uniqueName = UUID.randomUUID().toString() + extension;
            java.nio.file.Path filePath = uploadPath.resolve(uniqueName);
            Files.copy(file.uploadedFile(), filePath);

            NrcAnexoDto dto = new NrcAnexoDto(
                null,
                id,
                uniqueName,
                originalName,
                file.contentType(),
                file.size(),
                filePath.toString(),
                "/api/nrc/" + id + "/anexos/" + uniqueName,
                descricao,
                categoria,
                usuarioId,
                usuarioNome,
                LocalDateTime.now(),
                true
            );

            try {
                NrcAnexoDto created = service.addAnexo(id, dto, ctx);
                return Response.status(Response.Status.CREATED).entity(created).build();
            } catch (Exception e) {
                try {
                    Files.deleteIfExists(filePath);
                } catch (IOException ignored) {
                    // best effort cleanup
                }
                throw e;
            }
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(errorBody(NrcErrorCode.UPLOAD_FAILED, e.getMessage()))
                .build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @GET
    @Path("/{id}/anexos/{filename}")
    public Response downloadAnexo(
            @PathParam("id") Long id,
            @PathParam("filename") String filename,
            @QueryParam("inline") @DefaultValue("false") boolean inline) {
        try {
            requireAuthenticated();
            if (filename == null || filename.isBlank()
                || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                return notFound(NrcErrorCode.FILE_NOT_FOUND);
            }
            AuditoriaUsuarioContext audit = AuditoriaUsuarioContext.from(httpHeaders, null, null);
            service.getById(id, audit.userId);
            var anexo = service.findAnexo(id, filename);
            if (anexo == null) {
                return notFound(NrcErrorCode.FILE_NOT_FOUND);
            }
            java.nio.file.Path filePath = Paths.get(anexo.caminhoArquivo);
            if (!Files.exists(filePath)) {
                filePath = Paths.get(UPLOAD_DIR, "tenant-" + tenants.currentTenantIdStr(), id.toString(), filename);
            }
            if (!Files.exists(filePath)) {
                return notFound(NrcErrorCode.FILE_NOT_FOUND_DISK);
            }

            byte[] fileContent = Files.readAllBytes(filePath);
            String mimeType = anexo.tipoArquivo;
            if (mimeType == null || mimeType.isBlank()) {
                mimeType = Files.probeContentType(filePath);
            }
            if (mimeType == null || mimeType.isBlank()) {
                mimeType = MediaType.APPLICATION_OCTET_STREAM;
            }

            String downloadName = sanitizeDownloadFilename(
                anexo.nomeOriginal != null ? anexo.nomeOriginal : filename);
            String disposition = inline ? "inline" : "attachment";
            return Response.ok(fileContent)
                .header("Content-Disposition", disposition + "; filename=\"" + downloadName + "\"")
                .header("Content-Type", mimeType)
                .build();
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("message", "Erro ao ler arquivo: " + e.getMessage()))
                .build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @DELETE
    @Path("/{id}/anexos/{anexoId}")
    public Response deleteAnexo(
            @PathParam("id") Long id,
            @PathParam("anexoId") Long anexoId,
            @QueryParam("usuarioId") Long usuarioId,
            @QueryParam("usuarioNome") String usuarioNome) {
        try {
            service.deleteAnexo(id, anexoId, requireCtx(usuarioId, usuarioNome));
            return Response.noContent().build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @GET
    @Path("/export-relatorios-zip")
    @Produces("application/zip")
    public Response exportRelatoriosZip(
            @QueryParam("ids") String idsParam,
            @QueryParam("locale") String locale) {
        try {
            requireAuthenticated();
            if (idsParam == null || idsParam.isBlank()) {
                return conflict(NrcErrorCode.EXPORT_IDS_PARAM_REQUIRED);
            }
            List<Long> ids = java.util.Arrays.stream(idsParam.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::valueOf)
                .toList();
            AuditoriaUsuarioContext audit = AuditoriaUsuarioContext.from(httpHeaders, null, null);
            String localeTag = NrcRelatorioMessages.resolveLocaleTag(locale, httpHeaders.getHeaderString("Accept-Language"));
            byte[] zip = service.buildRelatoriosZip(ids, audit.userId, localeTag);
            String filename = "nrc-relatorios-" + java.time.LocalDate.now() + ".zip";
            return Response.ok(zip)
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @GET
    @Path("/{id}/relatorio")
    @Produces(MediaType.TEXT_HTML)
    public Response relatorio(@PathParam("id") Long id, @QueryParam("locale") String locale) {
        try {
            AuditoriaUsuarioContext audit = AuditoriaUsuarioContext.from(httpHeaders, null, null);
            requireAuthenticated();
            String localeTag = NrcRelatorioMessages.resolveLocaleTag(locale, httpHeaders.getHeaderString("Accept-Language"));
            return Response.ok(service.buildRelatorioHtml(id, audit.userId, localeTag)).build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id,
                           @QueryParam("usuarioId") Long usuarioId,
                           @QueryParam("usuarioNome") String usuarioNome) {
        try {
            service.delete(id, requireCtx(usuarioId, usuarioNome));
            return Response.noContent().build();
        } catch (Exception e) {
            return errorResponse(e);
        }
    }

    private void requireAuthenticated() {
        String authHeader = httpHeaders.getHeaderString("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new NrcBusinessException(NrcErrorCode.AUTH_REQUIRED);
        }
        AuditoriaUsuarioContext audit = AuditoriaUsuarioContext.from(httpHeaders, null, null);
        if (audit.userId == null || audit.userId <= 0) {
            throw new NrcBusinessException(NrcErrorCode.USUARIO_NAO_IDENTIFICADO);
        }
    }

    private NrcUsuarioContext requireCtx(Long usuarioId, String usuarioNome) {
        requireAuthenticated();
        AuditoriaUsuarioContext audit = AuditoriaUsuarioContext.from(httpHeaders, null, null);
        Long authId = audit.userId;
        if (usuarioId != null && !Objects.equals(usuarioId, authId)) {
            throw new NrcBusinessException(NrcErrorCode.IDENTITY_MISMATCH);
        }
        String nome = (usuarioNome != null && !usuarioNome.isBlank()) ? usuarioNome.trim() : audit.nome;
        String localeTag = NrcRelatorioMessages.resolveLocaleTag(null, httpHeaders.getHeaderString("Accept-Language"));
        return new NrcUsuarioContext(authId, nome, localeTag);
    }

    private static Map<String, String> errorBody(NrcErrorCode code) {
        return Map.of("code", code.name(), "message", code.defaultMessage());
    }

    private static Map<String, String> errorBody(NrcErrorCode code, String message) {
        String msg = message != null && !message.isBlank() ? message : code.defaultMessage();
        return Map.of("code", code.name(), "message", msg);
    }

    private static Response conflict(NrcErrorCode code) {
        return Response.status(Response.Status.CONFLICT).entity(errorBody(code)).build();
    }

    private static Response notFound(NrcErrorCode code) {
        return Response.status(Response.Status.NOT_FOUND).entity(errorBody(code)).build();
    }

    private static Response unauthorized(NrcErrorCode code) {
        return Response.status(Response.Status.UNAUTHORIZED).entity(errorBody(code)).build();
    }

    private static Response forbidden(NrcErrorCode code) {
        return Response.status(Response.Status.FORBIDDEN).entity(errorBody(code)).build();
    }

    private Response errorResponse(Exception e) {
        if (e instanceof NrcNotFoundException nf) {
            String msg = nf.getMessage() != null ? nf.getMessage() : nf.code().defaultMessage();
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("code", nf.code().name(), "message", msg))
                .build();
        }
        if (e instanceof NrcBusinessException nrcEx) {
            String msg = nrcEx.getMessage() != null ? nrcEx.getMessage() : nrcEx.code().defaultMessage();
            NrcErrorCode code = nrcEx.code();
            if (code == NrcErrorCode.AUTH_REQUIRED || code == NrcErrorCode.USUARIO_NAO_IDENTIFICADO
                || code == NrcErrorCode.IDENTITY_MISMATCH) {
                return unauthorized(code);
            }
            if (code == NrcErrorCode.SEM_ACESSO
                || code == NrcErrorCode.FUNCIONALIDADE_NEGADA
                || code == NrcErrorCode.FUNCIONALIDADE_NRC_NEGADA) {
                return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("code", code.name(), "message", msg))
                    .build();
            }
            return Response.status(Response.Status.CONFLICT)
                .entity(Map.of("code", code.name(), "message", msg))
                .build();
        }
        if (e instanceof IllegalStateException legacy) {
            String msg = legacy.getMessage() != null ? legacy.getMessage() : "";
            if (msg.startsWith("Sem permissão de funcionalidade: ")) {
                return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of(
                        "code", NrcErrorCode.FUNCIONALIDADE_NEGADA.name(),
                        "message", msg))
                    .build();
            }
            if (msg.contains("Sem permissão de funcionalidade RNC")) {
                return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of(
                        "code", NrcErrorCode.FUNCIONALIDADE_NRC_NEGADA.name(),
                        "message", msg))
                    .build();
            }
            return Response.status(Response.Status.CONFLICT)
                .entity(Map.of("code", "ERRO_NEGOCIO", "message", msg))
                .build();
        }
        return Response.status(Response.Status.BAD_REQUEST)
            .entity(Map.of("message", e.getMessage() != null ? e.getMessage() : ""))
            .build();
    }

    private static boolean isAllowedUploadMime(String mimeType) {
        String normalized = mimeType.split(";")[0].trim().toLowerCase();
        return ALLOWED_UPLOAD_MIMES.contains(normalized);
    }

    private static String sanitizeDownloadFilename(String name) {
        if (name == null || name.isBlank()) {
            return "anexo";
        }
        String cleaned = name.replaceAll("[\\r\\n\"\\\\]", "_").trim();
        cleaned = cleaned.replace("..", "_").replace("/", "_").replace("\\", "_");
        if (cleaned.contains(":")) {
            cleaned = cleaned.replace(":", "_");
        }
        return cleaned.isBlank() ? "anexo" : cleaned;
    }
}
