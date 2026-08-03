package com.aerosuite.api;

import com.aerosuite.dto.PageResponse;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.ProductDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.BarcodeService;
import com.aerosuite.service.ProductService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.net.URI;

@Path("/api/products")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"PRODUTOS"})
public class ProductResource {

    @Inject ProductService service;
    @Inject BarcodeService barcodeService;

    @GET
    public PageResponse<ProductDto> list(@QueryParam("page") @DefaultValue("0") int page,
                                         @QueryParam("size") @DefaultValue("10") int size,
                                         @QueryParam("sort") @DefaultValue("id,asc") String sort,
                                         @QueryParam("q") String q,
                                         @QueryParam("status") String status,
                                         @QueryParam("local") String local,
                                         @QueryParam("pn") String pn,
                                         @QueryParam("invoice") Integer invoice,
                                         @QueryParam("qtyMin") Integer qtyMin,
                                         @QueryParam("qtyMax") Integer qtyMax,
                                         @QueryParam("priceMin") BigDecimal priceMin,
                                         @QueryParam("priceMax") BigDecimal priceMax,
                                         @QueryParam("isActive") String isActiveParam) {
        // isActive: omitido ou "true" = só ativos; "false" = só inativos; "all" = todos
        Boolean isActive = Boolean.TRUE;
        if (isActiveParam != null && !isActiveParam.isBlank()) {
            if ("all".equalsIgnoreCase(isActiveParam.trim())) {
                isActive = null;
            } else {
                isActive = Boolean.parseBoolean(isActiveParam);
            }
        }
        
        var result = service.search(page, size, sort, q, status, local, pn, invoice, qtyMin, qtyMax, priceMin, priceMax, isActive);
        long total = result.total();
        int totalPages = (int) Math.ceil((double) total / Math.max(size, 1));
        return new PageResponse<>(result.items(), total, totalPages, page, size, sort);
    }

    @GET @Path("/{id}")
    public ProductDto get(@PathParam("id") Integer id) {
        ProductDto dto = service.getById(id);
        if (dto == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_NOT_FOUND, "id", String.valueOf(id)));
        }
        return dto;
    }

    @POST
    public Response create(ProductDto dto) {
        ProductDto created = service.create(dto);
        return Response.created(URI.create("/api/products/" + created.id())).entity(created).build();
    }

    @PUT @Path("/{id}")
    public ProductDto update(@PathParam("id") Integer id, ProductDto dto) {
        // Se o body contém isActive=false, fazer soft delete
        if (dto.isActive() != null && !dto.isActive()) {
            return service.inactivate(id);
        }
        // Caso contrário, atualizar normalmente
        return service.update(id, dto);
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

    @DELETE @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response delete(@PathParam("id") Integer id) {
        try {
            // Soft delete - inativar ao invés de deletar fisicamente
            ProductDto inactivated = service.delete(id);
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_DEACTIVATED));
            response.put("product", inactivated);
            return Response.ok()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .entity(response)
                .build();
        } catch (Exception e) {
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put(
                    "error",
                    e.getMessage() != null
                            ? e.getMessage()
                            : ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_DEACTIVATE_FAILED));
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .entity(errorResponse)
                .build();
        }
    }

    // ==========================================================
    // Upload e leitura de foto do produto
    // ==========================================================

    @POST
    @Path("/{id}/photo")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadPhoto(@PathParam("id") Integer id,
                                @FormParam("file") FileUpload single,
                                @FormParam("file") List<FileUpload> multiple) {
        try {
            List<FileUpload> files = new ArrayList<>();
            if (multiple != null && !multiple.isEmpty()) files.addAll(multiple);
            else if (single != null) files.add(single);

            if (files.isEmpty()) {
                throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_FILES_NOT_SENT));
            }

            // Respeitar limite de até 5 imagens
            if (files.size() > 5) files = files.subList(0, 5);

            java.nio.file.Path dir = Paths.get("data", "uploads", "products");
            Files.createDirectories(dir);

            List<String> publicUrls = new ArrayList<>();
            for (FileUpload fu : files) {
                String original = fu.fileName();
                String ext = "";
                int dot = original != null ? original.lastIndexOf('.') : -1;
                if (dot > -1) ext = original.substring(dot);
                String filename = "product-" + id + "-" + System.currentTimeMillis() + "-" + Math.abs(original != null ? original.hashCode() : (int)System.nanoTime()) + ext;
                java.nio.file.Path target = dir.resolve(filename);
                try (InputStream is = Files.newInputStream(fu.uploadedFile())) {
                    Files.copy(is, target, StandardCopyOption.REPLACE_EXISTING);
                }
                publicUrls.add("/api/products/photo/" + filename);
            }

            // Atualiza a entidade com a primeira URL como foto principal
            String mainUrl = publicUrls.get(0);
            ProductDto updated = service.updatePhoto(id, mainUrl);

            Map<String, Object> body = new HashMap<>();
            body.put("photoUrl", mainUrl);
            body.put("photoUrls", publicUrls);
            body.put("product", updated);

            return Response.ok(body).build();
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiI18nMessages.withDetail(
                            ApiI18nMessages.PRODUCT_IMAGE_SAVE_FAILED, e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/photo/{file}")
    @Produces({"image/jpeg", "image/png", "image/gif"})
    public Response getPhoto(@PathParam("file") String fileName) {
        return streamPhoto(fileName);
    }

    @GET
    @Path("/{id}/photo")
    @Produces({"image/jpeg", "image/png", "image/gif"})
    public Response getPhotoByProductId(@PathParam("id") Integer id) {
        ProductDto dto = service.getById(id);
        if (dto == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_NOT_FOUND, "id", String.valueOf(id)));
        }

        String fileName = extractFileName(dto.photoUrl());
        if (fileName == null || fileName.isBlank()) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_NO_PHOTO, "id", String.valueOf(id)));
        }

        return streamPhoto(fileName);
    }

    private Response streamPhoto(String fileName) {
        try {
            if (fileName == null || fileName.contains("..")) {
                throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_INVALID_FILENAME));
            }

            java.nio.file.Path path = Paths.get("data", "uploads", "products", fileName);
            if (!Files.exists(path)) {
                throw new NotFoundException(
                        ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_PHOTO_NOT_FOUND, "fileName", fileName));
            }
            String lc = fileName.toLowerCase();
            String media = lc.endsWith(".png") ? "image/png" : lc.endsWith(".gif") ? "image/gif" : "image/jpeg";
            return Response.ok(Files.readAllBytes(path)).type(media).build();
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiI18nMessages.withDetail(
                            ApiI18nMessages.PRODUCT_IMAGE_READ_FAILED, e.getMessage()))
                    .build();
        }
    }

    private String extractFileName(String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) {
            return null;
        }

        try {
            URI uri = URI.create(photoUrl);
            String path = uri.getPath();
            if (path != null && !path.isBlank()) {
                int idx = path.lastIndexOf('/');
                return idx >= 0 ? path.substring(idx + 1) : path;
            }
        } catch (IllegalArgumentException ignored) {
            // Se não for uma URI válida, cai no fallback abaixo
        }

        int idx = photoUrl.lastIndexOf('/');
        return idx >= 0 ? photoUrl.substring(idx + 1) : photoUrl;
    }

    // ==========================================================
    // Geração de código de barras para produtos existentes
    // ==========================================================

    @POST
    @Path("/gerar-codigos-barras")
    public Response gerarCodigosBarrasParaProdutosExistentes() {
        try {
            Map<String, Object> resultado = service.gerarCodigosBarrasParaTodos();
            return Response.ok(resultado).build();
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put(
                    "error",
                    e.getMessage() != null
                            ? e.getMessage()
                            : ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_BARCODE_GENERATE_FAILED));
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse)
                    .build();
        }
    }

    // ==========================================================
    // Geração de imagem do código de barras
    // ==========================================================

    /**
     * Gera imagem PNG do código de barras de um produto
     * @param id ID do produto
     * @param width Largura da imagem (padrão 200)
     * @param height Altura da imagem (padrão 80)
     */
    @GET
    @Path("/{id}/barcode")
    @Produces("image/png")
    public Response getBarcodeImage(@PathParam("id") Integer id,
                                    @QueryParam("width") @DefaultValue("200") int width,
                                    @QueryParam("height") @DefaultValue("80") int height) {
        try {
            ProductDto dto = service.getById(id);
            if (dto == null) {
                throw new NotFoundException(
                        ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_NOT_FOUND, "id", String.valueOf(id)));
            }

            String codigoBarras = dto.codigoBarras();
            if (codigoBarras == null || codigoBarras.isBlank()) {
                throw new NotFoundException(
                        ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_NO_BARCODE, "id", String.valueOf(id)));
            }

            // Limitar dimensões por segurança
            width = Math.min(Math.max(width, 100), 600);
            height = Math.min(Math.max(height, 40), 200);

            byte[] imageBytes = barcodeService.gerarImagemCodigoBarrasParaExibicao(codigoBarras, width, height);
            
            return Response.ok(imageBytes)
                    .type("image/png")
                    .header("Cache-Control", "public, max-age=86400") // Cache por 24h
                    .build();
        } catch (NotFoundException e) {
            throw e;
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put(
                    "error",
                    e.getMessage() != null
                            ? e.getMessage()
                            : ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_BARCODE_IMAGE_FAILED));
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse)
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    /**
     * Gera imagem PNG de um código de barras específico (sem precisar do produto)
     * @param codigo Código de barras EAN-13
     * @param width Largura da imagem (padrão 200)
     * @param height Altura da imagem (padrão 80)
     */
    @GET
    @Path("/barcode/{codigo}")
    @Produces("image/png")
    public Response getBarcodeImageByCodigo(@PathParam("codigo") String codigo,
                                            @QueryParam("width") @DefaultValue("200") int width,
                                            @QueryParam("height") @DefaultValue("80") int height) {
        try {
            if (codigo == null || codigo.isBlank()) {
                throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_INVALID_BARCODE));
            }

            // Limitar dimensões por segurança
            width = Math.min(Math.max(width, 100), 600);
            height = Math.min(Math.max(height, 40), 200);

            byte[] imageBytes = barcodeService.gerarImagemCodigoBarrasParaExibicao(codigo, width, height);
            
            return Response.ok(imageBytes)
                    .type("image/png")
                    .header("Cache-Control", "public, max-age=86400") // Cache por 24h
                    .build();
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put(
                    "error",
                    e.getMessage() != null
                            ? e.getMessage()
                            : ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_BARCODE_IMAGE_FAILED));
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse)
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }
}
