package com.aerosuite.service;

import com.aerosuite.domain.StudioRenderJob;
import com.aerosuite.domain.SistemaEmpresaConfig;
import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.TipoServico;
import com.aerosuite.dto.studio.AeroStudioCanvasElementDto;
import com.aerosuite.dto.studio.AeroStudioCanvasLayoutDto;
import com.aerosuite.dto.studio.AeroStudioIdentityDto;
import com.aerosuite.dto.studio.AeroStudioJobDto;
import com.aerosuite.dto.studio.AeroStudioRenderRequestDto;
import com.aerosuite.dto.studio.AeroStudioTemplateDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.dto.studio.AeroStudioCollabPublishDto;
import com.aerosuite.dto.studio.AeroStudioCollabStateDto;
import com.aerosuite.dto.studio.AeroStudioStockImageDto;
import com.aerosuite.studio.AeroStudioCanvasStyleUtil;
import com.aerosuite.studio.AeroStudioCustomHtmlBuilder;
import com.aerosuite.studio.AeroStudioGifUtil;
import com.aerosuite.studio.AeroStudioHtmlBuilder;
import com.aerosuite.studio.AeroStudioLetterheadPresets;
import com.aerosuite.studio.AeroStudioPdfPreviewUtil;
import com.aerosuite.studio.AeroStudioQrUtil;
import com.aerosuite.studio.AeroStudioRenderContext;
import com.aerosuite.util.HtmlToPdfConverter;
import com.aerosuite.util.ServerUrlUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@ApplicationScoped
public class AeroStudioService {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_PROCESSING = "PROCESSING";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_FAILED = "FAILED";
    public static final String TEMPLATE_BANNER = "banner-hangar";
    public static final String TEMPLATE_CUSTOM = "custom-canvas";

    private static final int HISTORY_LIMIT = 10;
    private static final long ASYNC_LAYOUT_AREA_MM2 = 400_000L;
    private static final int PREVIEW_MAX_WIDTH_PX = 900;
    private static final int PREVIEW_DPI = 120;

    private static final String DEFAULT_PRIMARY = "#0ea5e9";
    private static final String DEFAULT_SECONDARY = "#1e293b";

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    HtmlToPdfConverter htmlToPdfConverter;

    @Inject
    ServerUrlUtil serverUrlUtil;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    StudioFileStorage fileStorage;

    @Inject
    Instance<AeroStudioService> self;

    @Inject
    AeroStudioStockService stockService;

    @Inject
    EmpresaAssetService empresaAssetService;

    @Inject
    StudioCollaborationBroadcaster collaborationBroadcaster;

    public List<AeroStudioTemplateDto> listTemplates() {
        return List.of(
                tplEditor("custom-canvas", "studio.template.editor", "studio.category.editor", 210, 297, 3, true),
                tpl("cartao-visita", "studio.template.cartao", "studio.category.print", 90, 50, 3, true),
                tpl("papel-timbrado", "studio.template.timbrado", "studio.category.print", 210, 297, 3, false),
                tpl("folder-1dobra", "studio.template.folder", "studio.category.print", 210, 297, 3, false),
                tpl("banner-hangar", "studio.template.banner", "studio.category.large", 2000, 800, 5, true));
    }

    public boolean requiresAsync(AeroStudioRenderRequestDto request) {
        if (request == null || request.templateId == null) {
            return false;
        }
        if (Boolean.TRUE.equals(request.async)) {
            return true;
        }
        if (request.customLayout != null && isLargeCustomLayout(request.customLayout)) {
            return true;
        }
        return TEMPLATE_BANNER.equals(request.templateId.trim());
    }

    public AeroStudioIdentityDto identity() {
        SistemaEmpresaConfig c = SistemaEmpresaConfig.findForTenant(tenantDataAccess.currentTenantId());
        AeroStudioIdentityDto dto = new AeroStudioIdentityDto();
        Tenant tenant = Tenant.findById(tenantDataAccess.currentTenantId());
        dto.tenantCodigo = tenant != null ? tenant.codigo : TenantConstants.DEFAULT_TENANT_ID_STR;
        dto.portalQrUrl = portalUrl(dto.tenantCodigo);
        dto.portalQrPreviewDataUri = AeroStudioQrUtil.toDataUriPng(dto.portalQrUrl, 120);
        if (c == null) {
            dto.onboardingCompleto = false;
            dto.displayName = "";
            dto.servicosTop = topServicos();
            return dto;
        }
        dto.onboardingCompleto = Boolean.TRUE.equals(c.onboardingCompleto);
        dto.displayName = nz(c.displayName);
        dto.tagline = nz(c.tagline);
        dto.supportEmail = nz(c.supportEmail);
        dto.telefone = nz(c.telefone);
        dto.siteUrl = nz(c.siteUrl);
        dto.logoUrl = nz(c.logoUrl);
        dto.enderecoFormatado = formatEndereco(c);
        dto.servicosTop = topServicos();
        return dto;
    }

    @Transactional
    public Long enqueueRender(AeroStudioRenderRequestDto request, String apiBaseUrl) {
        validateTemplate(request);
        StudioRenderJob job = new StudioRenderJob();
        job.tenantId = TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());
        job.templateId = request.templateId.trim();
        job.status = STATUS_PENDING;
        job.fileName = "AeroStudio_" + job.templateId + ".pdf";
        try {
            job.parametersJson = objectMapper.writeValueAsString(request);
        } catch (Exception e) {
            job.parametersJson = "{}";
        }
        job.createdBy = internalUserContext.getUserId();
        job.persist();
        Long jobId = job.id;
        java.util.concurrent.CompletableFuture.runAsync(
                () -> self.get().processJob(jobId, request, apiBaseUrl));
        return jobId;
    }

    @Transactional
    public void processJob(Long jobId, AeroStudioRenderRequestDto request, String apiBaseUrl) {
        StudioRenderJob job = StudioRenderJob.findById(jobId);
        if (job == null) {
            return;
        }
        job.status = STATUS_PROCESSING;
        try {
            ProducedArtifact artifact = produce(request, apiBaseUrl, job.id);
            persistArtifactFiles(job, artifact);
            job.status = STATUS_COMPLETED;
            job.errorMessage = null;
        } catch (Exception e) {
            job.status = STATUS_FAILED;
            job.errorMessage = truncate(e.getMessage(), 500);
        }
    }

    @Transactional
    public RenderResult renderSync(AeroStudioRenderRequestDto request, String apiBaseUrl) throws Exception {
        validateTemplate(request);
        StudioRenderJob job = new StudioRenderJob();
        job.tenantId = TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());
        job.templateId = request.templateId.trim();
        job.status = STATUS_PROCESSING;
        job.createdBy = internalUserContext.getUserId();
        job.persist();

        ProducedArtifact artifact = produce(request, apiBaseUrl, job.id);
        persistArtifactFiles(job, artifact);
        job.status = STATUS_COMPLETED;

        return new RenderResult(artifact.downloadBytes, artifact.downloadFileName, artifact.downloadMediaType, job.id);
    }

    public byte[] previewPng(AeroStudioRenderRequestDto request, String apiBaseUrl) throws Exception {
        validateTemplate(request);
        ProducedArtifact artifact = produce(request, apiBaseUrl, null);
        return artifact.previewPng;
    }

    public List<AeroStudioJobDto> listHistory() {
        String tenantId = TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());
        List<StudioRenderJob> jobs =
                StudioRenderJob.find("tenantId = ?1 order by createdAt desc", tenantId)
                        .page(0, HISTORY_LIMIT)
                        .list();
        List<AeroStudioJobDto> out = new ArrayList<>();
        for (StudioRenderJob j : jobs) {
            out.add(toJobDto(j));
        }
        return out;
    }

    public AeroStudioJobDto getJob(Long jobId) {
        StudioRenderJob job = requireJob(jobId);
        return toJobDto(job);
    }

    public byte[] readJobDownload(Long jobId) throws Exception {
        StudioRenderJob job = requireJob(jobId);
        if (!STATUS_COMPLETED.equals(job.status)) {
            throw new BadRequestException(
                    ApiI18nMessages.encode(
                            ApiI18nMessages.STUDIO_JOB_NOT_COMPLETE, "status", String.valueOf(job.status)));
        }
        return fileStorage.read(fileStorage.resolveStoredPath(job.filePath));
    }

    public byte[] readJobPreview(Long jobId) throws Exception {
        StudioRenderJob job = requireJob(jobId);
        if (job.previewPath == null || job.previewPath.isBlank()) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_PREVIEW_UNAVAILABLE));
        }
        byte[] png = fileStorage.read(fileStorage.resolveStoredPath(job.previewPath));
        if (png == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_PREVIEW_FILE_NOT_FOUND));
        }
        return png;
    }

    private StudioRenderJob requireJob(Long jobId) {
        if (jobId == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_JOB_NOT_FOUND));
        }
        StudioRenderJob job = StudioRenderJob.findById(jobId);
        if (job == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_JOB_NOT_FOUND));
        }
        return job;
    }

    private void persistArtifactFiles(StudioRenderJob job, ProducedArtifact artifact) throws Exception {
        long tenantId = tenantDataAccess.currentTenantId();
        Path mainPath = fileStorage.writeJobFile(tenantId, job.id, artifact.downloadFileName, artifact.downloadBytes);
        job.filePath = relativize(mainPath);
        job.fileName = artifact.downloadFileName;
        job.mediaType = artifact.downloadMediaType;

        if (artifact.previewPng != null && artifact.previewPng.length > 0) {
            Path previewPath = fileStorage.writeJobFile(tenantId, job.id, "preview.png", artifact.previewPng);
            job.previewPath = relativize(previewPath);
        }
        try {
            job.parametersJson = objectMapper.writeValueAsString(artifact.requestSnapshot);
        } catch (Exception ignored) {
            // keep existing
        }
    }

    private String relativize(Path absolute) {
        if (absolute == null) {
            return null;
        }
        return absolute.toString().replace('\\', '/');
    }

    private ProducedArtifact produce(AeroStudioRenderRequestDto request, String apiBaseUrl, Long jobIdForStorage)
            throws Exception {
        AeroStudioRenderContext ctx = buildContext(request, apiBaseUrl);
        String html = AeroStudioHtmlBuilder.build(ctx);
        byte[] pdf = htmlToPdfConverter.toPdf(html);
        String pdfName = "AeroStudio_" + ctx.templateId + ".pdf";

        byte[] png = AeroStudioPdfPreviewUtil.firstPageToPng(pdf, previewDpiFor(ctx.templateId));
        png = AeroStudioPdfPreviewUtil.scalePngMaxWidth(png, PREVIEW_MAX_WIDTH_PX);

        boolean zip = Boolean.TRUE.equals(request.packageZip);
        boolean includePngInZip = zip && (Boolean.TRUE.equals(request.includePngInZip)
                || "cartao-visita".equals(ctx.templateId));

        byte[] download;
        String downloadName;
        String downloadType;
        byte[] animatedHtml = null;
        byte[] animatedGif = null;
        if (ctx.customLayout != null
                && (Boolean.TRUE.equals(request.includeAnimatedExport)
                        || AeroStudioCanvasStyleUtil.hasAnimatedElements(ctx.customLayout))) {
            animatedHtml =
                    AeroStudioCustomHtmlBuilder.buildAnimatedPreview(ctx, ctx.customLayout).getBytes(java.nio.charset.StandardCharsets.UTF_8);
            if (AeroStudioCanvasStyleUtil.hasAnimatedElements(ctx.customLayout)) {
                animatedGif = buildAnimatedGif(ctx, apiBaseUrl);
            }
        }

        if (zip) {
            download = buildZip(
                    pdf,
                    pdfName,
                    readme(ctx.templateId, ctx),
                    includePngInZip ? png : null,
                    animatedHtml,
                    animatedGif);
            downloadName = pdfName.replace(".pdf", ".zip");
            downloadType = "application/zip";
        } else {
            download = pdf;
            downloadName = pdfName;
            downloadType = "application/pdf";
        }

        ProducedArtifact a = new ProducedArtifact();
        a.downloadBytes = download;
        a.downloadFileName = downloadName;
        a.downloadMediaType = downloadType;
        a.previewPng = png;
        a.requestSnapshot = request;
        return a;
    }

    private int previewDpiFor(String templateId) {
        if (TEMPLATE_BANNER.equals(templateId)) {
            return 72;
        }
        return PREVIEW_DPI;
    }

    private AeroStudioRenderContext buildContext(AeroStudioRenderRequestDto request, String apiBaseUrl) {
        AeroStudioIdentityDto id = identity();
        AeroStudioRenderContext ctx = new AeroStudioRenderContext();
        ctx.templateId = request.templateId.trim();
        ctx.displayName = overrideOr(request.displayNameOverride, id.displayName);
        ctx.tagline = request.taglineOverride != null && !request.taglineOverride.isBlank()
                ? request.taglineOverride.trim()
                : nz(id.tagline);
        ctx.supportEmail = overrideOr(request.supportEmailOverride, id.supportEmail);
        ctx.telefone = overrideOr(request.telefoneOverride, id.telefone);
        ctx.siteUrl = overrideOr(request.siteUrlOverride, id.siteUrl);
        ctx.enderecoFormatado = overrideOr(request.enderecoOverride, id.enderecoFormatado);
        ctx.servicesText = request.servicesText != null && !request.servicesText.isBlank()
                ? request.servicesText.trim()
                : String.join("\n", id.servicosTop);
        ctx.primaryColor = colorOr(request.primaryColor, DEFAULT_PRIMARY);
        ctx.secondaryColor = colorOr(request.secondaryColor, DEFAULT_SECONDARY);
        ctx.includeCropMarks = Boolean.TRUE.equals(request.includeCropMarks);
        ctx.includeQrPortal = request.includeQrPortal == null || request.includeQrPortal;
        ctx.logoAbsoluteUrl = embedLogoAsDataUri(id, resolveLogoUrl(id, apiBaseUrl));
        if (ctx.includeQrPortal) {
            ctx.qrDataUri = AeroStudioQrUtil.toDataUriPng(id.portalQrUrl, 120);
        }
        if (request.letterheadPresetId != null && !request.letterheadPresetId.isBlank()) {
            ctx.letterheadPresetId = request.letterheadPresetId.trim();
            AeroStudioLetterheadPresets.validate(ctx.letterheadPresetId);
        } else if (request.customLayout != null) {
            ctx.customLayout = validateCustomLayout(request.customLayout);
            embedCustomLayoutAssets(ctx.customLayout);
        }
        ctx.animationCaptureSec = request.animationCaptureSec;
        return ctx;
    }

    public List<AeroStudioStockImageDto> searchStock(String query, int limit) {
        return stockService.search(query, limit);
    }

    public String uploadCanvasImage(org.jboss.resteasy.reactive.multipart.FileUpload file) throws Exception {
        if (file == null || file.uploadedFile() == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_FILE_REQUIRED));
        }
        String ext = extensionFromContentType(file.contentType());
        String name = "img-" + System.currentTimeMillis() + ext;
        byte[] bytes = java.nio.file.Files.readAllBytes(file.uploadedFile());
        long tenantId = tenantDataAccess.currentTenantId();
        fileStorage.writeUpload(tenantId, name, bytes);
        return fileStorage.uploadPublicPath(tenantId, name);
    }

    public byte[] readStudioAsset(String relativePath) throws Exception {
        if (relativePath == null || relativePath.isBlank() || relativePath.contains("..")) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.STUDIO_INVALID_PATH));
        }
        String tenantSeg = TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());
        String norm = relativePath.replace('\\', '/');
        if (!norm.startsWith("studio/" + tenantSeg + "/")) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.STUDIO_ASSET_ACCESS_DENIED));
        }
        byte[] data = fileStorage.read(fileStorage.resolveStoredPath(relativePath));
        if (data == null) {
            throw new NotFoundException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.STUDIO_ASSET_NOT_FOUND));
        }
        return data;
    }

    public AeroStudioCollabStateDto publishCollaboration(String sessionId, AeroStudioCollabPublishDto body) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_SESSION_REQUIRED));
        }
        if (body == null || body.document == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_DOCUMENT_REQUIRED));
        }
        AeroStudioCollabStateDto state = new AeroStudioCollabStateDto();
        state.revision = body.revision;
        state.userName = body.userName != null ? body.userName.trim() : "user";
        state.document = validateCustomLayout(body.document);
        return collaborationBroadcaster.publish(sessionId.trim(), state);
    }

    public AeroStudioCollabStateDto getCollaboration(String sessionId) {
        return collaborationBroadcaster.getLatest(sessionId);
    }

    private void validateTemplate(AeroStudioRenderRequestDto request) {
        if (request == null || request.templateId == null || request.templateId.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_TEMPLATE_ID_REQUIRED));
        }
        String templateId = request.templateId.trim();
        if (listTemplates().stream().noneMatch(t -> t.id.equals(templateId))) {
            throw new BadRequestException(
                    ApiI18nMessages.encode(ApiI18nMessages.STUDIO_TEMPLATE_INVALID, "templateId", templateId));
        }
        if (TEMPLATE_CUSTOM.equals(templateId) && request.customLayout == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_VISUAL_EDITOR_REQUIRES_LAYOUT));
        }
    }

    private AeroStudioCanvasLayoutDto validateCustomLayout(AeroStudioCanvasLayoutDto layout) {
        if (layout == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_CUSTOM_LAYOUT_REQUIRED));
        }
        if (layout.widthMm < 10 || layout.heightMm < 10) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_DIMENSIONS_MIN));
        }
        if (layout.widthMm > 3000 || layout.heightMm > 3000) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_DIMENSIONS_MAX));
        }
        if (layout.elements == null) {
            layout.elements = new ArrayList<>();
        }
        for (AeroStudioCanvasElementDto el : layout.elements) {
            if (el == null || el.type == null || el.type.isBlank()) {
                throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_ELEMENT_INVALID));
            }
            String type = el.type.trim().toLowerCase();
            if (!List.of("text", "shape", "logo", "qr", "image", "circle", "line", "icon").contains(type)) {
                throw new BadRequestException(
                        ApiI18nMessages.encode(ApiI18nMessages.STUDIO_ELEMENT_TYPE_INVALID, "type", el.type));
            }
            if ("text".equals(type) && el.text != null && el.text.length() > 4000) {
                throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_TEXT_TOO_LONG));
            }
        }
        return layout;
    }

    private boolean isLargeCustomLayout(AeroStudioCanvasLayoutDto layout) {
        if (layout == null) {
            return false;
        }
        long area = (long) layout.widthMm * layout.heightMm;
        return area >= ASYNC_LAYOUT_AREA_MM2 || layout.widthMm >= 1500 || layout.heightMm >= 1500;
    }

    private byte[] buildZip(
            byte[] pdf,
            String pdfName,
            String readme,
            byte[] previewPng,
            byte[] animatedHtml,
            byte[] animatedGif)
            throws Exception {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            zos.putNextEntry(new ZipEntry(pdfName));
            zos.write(pdf);
            zos.closeEntry();
            if (previewPng != null && previewPng.length > 0) {
                zos.putNextEntry(new ZipEntry("preview.png"));
                zos.write(previewPng);
                zos.closeEntry();
            }
            if (animatedHtml != null && animatedHtml.length > 0) {
                zos.putNextEntry(new ZipEntry("animated-preview.html"));
                zos.write(animatedHtml);
                zos.closeEntry();
            }
            if (animatedGif != null && animatedGif.length > 0) {
                zos.putNextEntry(new ZipEntry("preview.gif"));
                zos.write(animatedGif);
                zos.closeEntry();
            }
            zos.putNextEntry(new ZipEntry("README-grafica.txt"));
            zos.write(readme.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            zos.closeEntry();
        }
        return baos.toByteArray();
    }

    private byte[] buildAnimatedGif(AeroStudioRenderContext ctx, String apiBaseUrl) throws Exception {
        if (ctx.customLayout == null) {
            return new byte[0];
        }
        List<byte[]> frames = new ArrayList<>();
        double total = 2.0;
        for (double t = 0; t <= total; t += 0.2) {
            AeroStudioRenderContext frameCtx = cloneContextForFrame(ctx, t);
            String html = AeroStudioCustomHtmlBuilder.build(frameCtx, frameCtx.customLayout, t, false);
            byte[] pdf = htmlToPdfConverter.toPdf(html);
            byte[] png = AeroStudioPdfPreviewUtil.firstPageToPng(pdf, PREVIEW_DPI);
            png = AeroStudioPdfPreviewUtil.scalePngMaxWidth(png, 480);
            if (png != null && png.length > 0) {
                frames.add(png);
            }
        }
        return frames.isEmpty() ? new byte[0] : AeroStudioGifUtil.encodeGif(frames, 20);
    }

    private AeroStudioRenderContext cloneContextForFrame(AeroStudioRenderContext ctx, double captureSec) {
        AeroStudioRenderContext c = new AeroStudioRenderContext();
        c.templateId = ctx.templateId;
        c.displayName = ctx.displayName;
        c.tagline = ctx.tagline;
        c.supportEmail = ctx.supportEmail;
        c.telefone = ctx.telefone;
        c.siteUrl = ctx.siteUrl;
        c.enderecoFormatado = ctx.enderecoFormatado;
        c.servicesText = ctx.servicesText;
        c.primaryColor = ctx.primaryColor;
        c.secondaryColor = ctx.secondaryColor;
        c.includeCropMarks = ctx.includeCropMarks;
        c.includeQrPortal = ctx.includeQrPortal;
        c.logoAbsoluteUrl = ctx.logoAbsoluteUrl;
        c.qrDataUri = ctx.qrDataUri;
        c.customLayout = ctx.customLayout;
        c.animationCaptureSec = captureSec;
        return c;
    }

    /** Incorpora imagens carregadas no layout como data URI (OpenHTMLToPDF não envia JWT). */
    private void embedCustomLayoutAssets(AeroStudioCanvasLayoutDto layout) {
        if (layout == null || layout.elements == null) {
            return;
        }
        for (AeroStudioCanvasElementDto el : layout.elements) {
            if (el == null || el.imageUrl == null || el.imageUrl.isBlank()) {
                continue;
            }
            if (el.imageUrl.startsWith("http") || el.imageUrl.startsWith("data:")) {
                continue;
            }
            try {
                String path = el.imageUrl.replace('\\', '/');
                byte[] data = readStudioAsset(path);
                String mime = guessImageMime(path);
                el.imageUrl = "data:" + mime + ";base64,"
                        + java.util.Base64.getEncoder().encodeToString(data);
            } catch (Exception e) {
                el.imageUrl = null;
            }
        }
    }

    private static String guessImageMime(String path) {
        if (path == null) {
            return "image/png";
        }
        String p = path.toLowerCase();
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (p.endsWith(".webp")) {
            return "image/webp";
        }
        if (p.endsWith(".gif")) {
            return "image/gif";
        }
        return "image/png";
    }

    private static String extensionFromContentType(String contentType) {
        if (contentType == null) {
            return ".png";
        }
        return switch (contentType.toLowerCase()) {
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".png";
        };
    }

    private String readme(String templateId, AeroStudioRenderContext ctx) {
        AeroStudioTemplateDto t =
                listTemplates().stream().filter(x -> x.id.equals(templateId)).findFirst().orElse(null);
        int w = t != null ? t.widthMm : 0;
        int h = t != null ? t.heightMm : 0;
        int bleed = t != null ? t.bleedMm : 3;
        if (ctx.customLayout != null) {
            w = ctx.customLayout.widthMm;
            h = ctx.customLayout.heightMm;
            bleed = ctx.customLayout.bleedMm > 0 ? ctx.customLayout.bleedMm : bleed;
        }
        return """
                Aero Studio — instruções para gráfica
                ==================================
                Template: %s
                Tamanho útil: %d x %d mm
                Sangria: %d mm por lado
                Perfil de cor: RGB (converter para CMYK na gráfica se necessário)
                Fontes: Arial / Helvetica (sistema)

                Ficheiros: PDF principal%s
                """
                .formatted(
                        templateId,
                        w,
                        h,
                        bleed,
                        (t != null && t.supportsPngPreview) ? " + preview.png (pré-visualização)" : "");
    }

    private AeroStudioJobDto toJobDto(StudioRenderJob job) {
        AeroStudioJobDto d = new AeroStudioJobDto();
        d.id = job.id;
        d.templateId = job.templateId;
        d.status = job.status;
        d.fileName = job.fileName;
        d.mediaType = job.mediaType;
        d.hasPreview = job.previewPath != null && !job.previewPath.isBlank();
        d.errorMessage = job.errorMessage;
        d.createdAt = job.createdAt;
        return d;
    }

    private String resolveLogoUrl(AeroStudioIdentityDto id, String apiBaseUrl) {
        String logo = nz(id.logoUrl);
        if (logo.startsWith("http://") || logo.startsWith("https://")) {
            return logo;
        }
        String base = apiBaseUrl != null ? apiBaseUrl.replaceAll("/$", "") : null;
        if (!logo.isBlank() && logo.startsWith("/")) {
            return base != null ? base + logo : logo;
        }
        if (base != null) {
            if (!logo.isBlank()) {
                return base + (logo.startsWith("/") ? logo : "/" + logo);
            }
            if (id.tenantCodigo != null && !id.tenantCodigo.isBlank()) {
                return base + EmpresaAssetService.publicLogoUrlForTenantCodigo(id.tenantCodigo);
            }
            return base + EmpresaAssetService.PUBLIC_LOGO_URL;
        }
        return logo;
    }

    /**
     * OpenHTMLToPDF não envia JWT; incorporar o logo do disco evita falha ao buscar URL HTTP interna.
     */
    private String embedLogoAsDataUri(AeroStudioIdentityDto id, String httpFallback) {
        try (InputStream in = openLogoStreamForIdentity(id)) {
            if (in == null) {
                return httpFallback;
            }
            byte[] data = in.readAllBytes();
            if (data.length == 0) {
                return httpFallback;
            }
            String mime = empresaAssetService.guessLogoMediaTypeForTenantCodigo(
                    id.tenantCodigo != null ? id.tenantCodigo : "");
            if (mime == null || mime.isBlank() || "application/octet-stream".equals(mime)) {
                mime = "image/png";
            }
            return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(data);
        } catch (IOException e) {
            return httpFallback;
        }
    }

    private InputStream openLogoStreamForIdentity(AeroStudioIdentityDto id) throws IOException {
        if (id.tenantCodigo != null && !id.tenantCodigo.isBlank()) {
            InputStream tenantLogo = empresaAssetService.openLogoForTenantCodigo(id.tenantCodigo);
            if (tenantLogo != null) {
                return tenantLogo;
            }
        }
        return empresaAssetService.openLogo();
    }

    private String portalUrl(String tenantCodigo) {
        String front = serverUrlUtil.getPublicFrontendUrl();
        if (front == null || front.isBlank()) {
            front = "https://app.aerosuite.app";
        }
        front = front.replaceAll("/$", "");
        String code = tenantCodigo != null ? tenantCodigo.trim() : "";
        if (code.isEmpty()) {
            return front + "/externo/login";
        }
        return front + "/externo/login?tenant=" + java.net.URLEncoder.encode(code, java.nio.charset.StandardCharsets.UTF_8);
    }

    private List<String> topServicos() {
        List<TipoServico> list = TipoServico.list("isActive = true order by nome");
        List<String> names = new ArrayList<>();
        int n = 0;
        for (TipoServico ts : list) {
            if (ts.nome != null && !ts.nome.isBlank()) {
                names.add(ts.nome.trim());
                n++;
                if (n >= 6) {
                    break;
                }
            }
        }
        return names;
    }

    private static String formatEndereco(SistemaEmpresaConfig c) {
        StringBuilder sb = new StringBuilder();
        appendPart(sb, c.enderecoLogradouro);
        appendPart(sb, c.enderecoNumero);
        appendPart(sb, c.enderecoBairro);
        appendPart(sb, c.cidade);
        appendPart(sb, c.uf);
        appendPart(sb, c.cep);
        return sb.toString().trim();
    }

    private static void appendPart(StringBuilder sb, String part) {
        if (part != null && !part.isBlank()) {
            if (!sb.isEmpty()) {
                sb.append(", ");
            }
            sb.append(part.trim());
        }
    }

    private static AeroStudioTemplateDto tpl(
            String id, String i18n, String cat, int w, int h, int bleed, boolean pngPreview) {
        AeroStudioTemplateDto t = baseTpl(id, i18n, cat, w, h, bleed, pngPreview);
        t.supportsEditor = true;
        return t;
    }

    private static AeroStudioTemplateDto tplEditor(
            String id, String i18n, String cat, int w, int h, int bleed, boolean pngPreview) {
        AeroStudioTemplateDto t = baseTpl(id, i18n, cat, w, h, bleed, pngPreview);
        t.supportsEditor = true;
        t.asyncRecommended = false;
        return t;
    }

    private static AeroStudioTemplateDto baseTpl(
            String id, String i18n, String cat, int w, int h, int bleed, boolean pngPreview) {
        AeroStudioTemplateDto t = new AeroStudioTemplateDto();
        t.id = id;
        t.i18nKey = i18n;
        t.categoryI18nKey = cat;
        t.widthMm = w;
        t.heightMm = h;
        t.bleedMm = bleed;
        t.supportsCropMarks = true;
        t.supportsPngPreview = pngPreview;
        t.asyncRecommended = TEMPLATE_BANNER.equals(id);
        t.supportsEditor = false;
        return t;
    }

    private static String nz(String s) {
        return s != null ? s.trim() : "";
    }

    private static String overrideOr(String override, String fallback) {
        if (override != null && !override.isBlank()) {
            return override.trim();
        }
        return nz(fallback);
    }

    private static String colorOr(String c, String def) {
        if (c == null || c.isBlank() || !c.matches("#?[0-9A-Fa-f]{6}")) {
            return def;
        }
        return c.startsWith("#") ? c : "#" + c;
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() <= max ? s : s.substring(0, max);
    }

    public record RenderResult(byte[] bytes, String fileName, String mediaType, Long jobId) {}

    private static class ProducedArtifact {
        byte[] downloadBytes;
        String downloadFileName;
        String downloadMediaType;
        byte[] previewPng;
        AeroStudioRenderRequestDto requestSnapshot;
    }
}
