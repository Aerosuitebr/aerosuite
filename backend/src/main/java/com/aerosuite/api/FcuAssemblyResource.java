package com.aerosuite.api;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.domain.FcuAssemblyDocEntity;
import com.aerosuite.dto.FcuAssemblyDoc;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.DocxAssemblyParser;
import com.aerosuite.service.FcuAssemblyService;
import com.aerosuite.service.FcuAssemblyPdfExporter;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.InputStream;
import java.net.URI;
import java.util.List;

@Path("/api/fcu/assembly")
@Consumes({ MediaType.APPLICATION_JSON, MediaType.MULTIPART_FORM_DATA })
@Produces(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"EDITOR_DOCUMENTOS"})
public class FcuAssemblyResource {

    @Inject
    FcuAssemblyService service;

    @Inject
    DocxAssemblyParser parser;

    @Inject
    FcuAssemblyPdfExporter pdfExporter;

    // ==========================================================
    // 🔹 CREATE
    // ==========================================================
    @POST
    public Response create(FcuAssemblyDoc doc) {
        Long id = service.save(doc, null);
        return Response.created(URI.create("/api/fcu/assembly/" + id))
                       .entity(id)
                       .build();
    }

    // ==========================================================
    // 🔹 UPDATE
    // ==========================================================
    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Long id, FcuAssemblyDoc doc) {
        Long updatedId = service.save(doc, id);
        return Response.ok(updatedId).build();
    }

    // ==========================================================
    // 🔹 GET ONE
    // ==========================================================
    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") Long id) {
        FcuAssemblyDoc doc = service.get(id);
        return Response.ok(doc).build();
    }

    // ==========================================================
    // 🔹 LIST / PAGINATION
    // ==========================================================
    @GET
    public Response list(@QueryParam("page") @DefaultValue("0") int page,
                         @QueryParam("size") @DefaultValue("10") int size) {
        List<FcuAssemblyDocEntity> items = service.list(page, size);
        return Response.ok(items).build();
    }

    // ==========================================================
    // 🔹 IMPORT DOCX
    // ==========================================================
    @POST
    @Path("/import")
    public Response importDocx(@FormParam("file") FileUpload file) {
        try {
            if (file == null) {
                throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.FCU_ASSEMBLY_FILE_REQUIRED));
            }

            try (InputStream is = java.nio.file.Files.newInputStream(file.uploadedFile())) {
                FcuAssemblyDoc doc = parser.parse(is);
                return Response.ok(doc).build();
            }

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                           .entity(e.getMessage())
                           .build();
        }
    }

    // ==========================================================
    // 🔹 EXPORT PDF
    // ==========================================================
    @GET
    @Path("/{id}/pdf")
    @Produces("application/pdf")
    public Response exportPdf(@PathParam("id") Long id) {
        FcuAssemblyDoc doc = service.get(id);
        byte[] bytes = pdfExporter.export(doc);
        return Response.ok(bytes)
                .header("Content-Disposition", "inline; filename=assembly-" + id + ".pdf")
                .build();
    }
}
