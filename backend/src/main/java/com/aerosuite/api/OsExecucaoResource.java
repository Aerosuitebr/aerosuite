package com.aerosuite.api;
import com.aerosuite.service.OsExecucaoService;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.dto.OSDto;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.*;
@Path("/api/os") @Produces(MediaType.APPLICATION_JSON) @Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
public class OsExecucaoResource {
    @Inject OsExecucaoService service;
    public record Encaminhar(Integer mecanicoId, String motivo) {}
    public record Execucao(String observacao) {}
    @GET @Path("/mecanicos") public Object mecanicos() { return service.mecanicos(); }
    @POST @Path("/{id}/encaminhar") public OSDto encaminhar(@PathParam("id") Long id, Encaminhar body) {
        if (body == null) throw new BadRequestException(); return service.encaminhar(id, body.mecanicoId(), body.motivo());
    }
    @POST @Path("/{id}/execucao/{acao}") public OSDto executar(@PathParam("id") Long id, @PathParam("acao") String acao, Execucao body) {
        return service.executar(id, acao, body == null ? null : body.observacao());
    }
    @GET @Path("/carga-mecanicos") public Object carga(@QueryParam("periodo") @DefaultValue("DIA") String periodo) { return service.dashboard(periodo); }
    @GET @Path("/carga-mecanicos/{id}/os") public Object ordens(@PathParam("id") Integer id,
            @QueryParam("periodo") @DefaultValue("DIA") String periodo, @QueryParam("tipo") @DefaultValue("ATRIBUIDAS") String tipo) {
        return service.listarCarga(id, periodo, tipo);
    }
    @GET @Path("/alerta-sem-atribuicao") public Object alerta() { return Map.of("diasLimite", 5, "total", service.semAtribuicao(true).size()); }
    @GET @Path("/alerta-sem-atribuicao/os") public Object atrasadas() { return service.semAtribuicao(true); }
    @GET @Path("/sem-atribuicao/os") public Object semAtribuicao() { return service.semAtribuicao(false); }
}
