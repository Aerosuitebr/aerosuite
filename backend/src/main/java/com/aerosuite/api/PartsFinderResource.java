package com.aerosuite.api;

import com.aerosuite.dto.parts.PartsFinderSearchRequest;
import com.aerosuite.dto.parts.PartsRfqRequest;
import com.aerosuite.dto.parts.PartsRfqSendRequest;
import com.aerosuite.parts.PartsFinderService;
import com.aerosuite.security.RequiresFuncionalidades;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

@Path("/api/parts-finder")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"PARTS_FINDER_CONSULTAR"})
public class PartsFinderResource {
    @Inject PartsFinderService service;

    @POST
    @Path("/search")
    public Response search(PartsFinderSearchRequest request) {
        var results = service.search(request);
        return Response.ok(Map.of("results", results, "total", results.size())).build();
    }

    @POST
    @Path("/rfqs")
    public Response createRfq(PartsRfqRequest request) {
        return Response.status(Response.Status.CREATED).entity(service.createRfq(request)).build();
    }

    @GET
    @Path("/rfqs")
    public Response listRfqs(@QueryParam("q") String query) { return Response.ok(service.listRfqs(query)).build(); }

    @GET
    @Path("/rfqs/{id}")
    public Response getRfq(@PathParam("id") Long id) { return Response.ok(service.getRfq(id)).build(); }

    @GET
    @Path("/rfqs/{id}/pdf")
    @Produces("application/pdf")
    public Response pdf(@PathParam("id") Long id) {
        var rfq = service.getRfq(id);
        return Response.ok(service.generateRfqPdf(id)).header("Content-Disposition", "attachment; filename=\"" + rfq.number + ".pdf\"").build();
    }

    @POST
    @Path("/rfqs/{id}/send-email")
    public Response sendEmail(@PathParam("id") Long id, PartsRfqSendRequest request) { return Response.ok(service.sendRfqEmail(id, request)).build(); }

    @POST
    @Path("/rfqs/{id}/send-whatsapp")
    public Response sendWhatsApp(@PathParam("id") Long id, PartsRfqSendRequest request) { return Response.ok(service.sendRfqWhatsApp(id, request)).build(); }

    @GET @Path("/rfqs/whatsapp/status") public Response whatsappStatus() { return Response.ok(service.whatsappStatus()).build(); }
    @POST @Path("/rfqs/whatsapp/activate") public Response activateWhatsapp() { return Response.ok(service.activateWhatsapp()).build(); }
    @GET @Path("/rfqs/whatsapp/qrcode") public Response whatsappQrCode() { return Response.ok(service.whatsappQrCode()).build(); }
    @jakarta.ws.rs.DELETE @Path("/rfqs/whatsapp/disconnect") public Response disconnectWhatsapp() { service.disconnectWhatsapp(); return Response.ok(Map.of("ok", true)).build(); }
}
