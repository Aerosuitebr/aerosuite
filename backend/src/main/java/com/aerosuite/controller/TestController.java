package com.aerosuite.controller;

import io.quarkus.arc.profile.UnlessBuildProfile;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@ApplicationScoped
@UnlessBuildProfile("prod")
@Path("/api/test")
@Produces(MediaType.APPLICATION_JSON)
public class TestController {
    
    @GET
    @Path("/funcionalidades")
    public Response testFuncionalidades() {
        List<Map<String, Object>> funcionalidades = Arrays.asList(
            Map.of(
                "id", 1,
                "nome", "Dashboard",
                "codigo", "DASHBOARD",
                "icone", "pi pi-home",
                "rota", "/",
                "secao", "Principal",
                "tipo", "FUNCIONALIDADE",
                "visivel", true,
                "posicao", 1,
                "ativo", true
            ),
            Map.of(
                "id", 2,
                "nome", "Produtos",
                "codigo", "PRODUTOS",
                "icone", "pi pi-box",
                "rota", "/products",
                "secao", "Cadastro",
                "tipo", "FUNCIONALIDADE",
                "visivel", true,
                "posicao", 1,
                "ativo", true
            )
        );
        
        return Response.ok(funcionalidades).build();
    }
}
