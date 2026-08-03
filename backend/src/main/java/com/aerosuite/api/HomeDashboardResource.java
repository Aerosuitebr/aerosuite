package com.aerosuite.api;

import com.aerosuite.dto.HomeDashboardMetricsDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.HomeDashboardService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/dashboard")
@Produces(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(onlyAuthenticated = true)
public class HomeDashboardResource {

    @Inject
    HomeDashboardService homeDashboardService;

    @GET
    @Path("/home-metrics")
    public Response homeMetrics() {
        HomeDashboardMetricsDto dto = homeDashboardService.metrics();
        return Response.ok(dto).build();
    }
}
