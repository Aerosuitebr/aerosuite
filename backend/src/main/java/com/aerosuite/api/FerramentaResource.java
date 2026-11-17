package com.aerosuite.api;

import com.aerosuite.domain.*;
import com.aerosuite.service.FerramentaService;
import com.aerosuite.service.FerramentaService.*;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.time.LocalDate;
import java.util.Map;
import java.util.function.Supplier;

@com.aerosuite.security.RequiresFuncionalidades(anyCodigoStartingWith = {"FERRAMENTAS"})
@Path("/api/ferramentas") @Produces(MediaType.APPLICATION_JSON) @Consumes(MediaType.APPLICATION_JSON)
public class FerramentaResource {
    @Inject FerramentaService service;
    @Inject com.aerosuite.service.FerramentaTerminalContext terminal;
    @Inject com.aerosuite.service.OsFluxoEstacaoService estacoes;
    @Context HttpHeaders headers;
    private Usuario usuarioAutenticado(){return service.autenticar();}
    private Usuario usuario(){Usuario u=usuarioAutenticado();service.exigirOperador(u);terminal.identificar(headers.getHeaderString("X-Terminal-Id"));return u;}
    private Response executar(Supplier<?> fn) {
        try{return Response.ok(fn.get()).build();}
        catch(WebApplicationException e){return Response.status(e.getResponse().getStatus()).entity(Map.of("message",e.getMessage()==null?"Operação inválida.":e.getMessage())).build();}
        catch(jakarta.persistence.OptimisticLockException | jakarta.persistence.PessimisticLockException e){return Response.status(409).entity(Map.of("message","O exemplar foi atualizado em outra estação. Atualize e tente novamente.")).build();}
    }
    @GET @Path("/minhas") public Response minhas(){return executar(()->service.minhasFerramentas(usuarioAutenticado()));}
    @GET @Path("/contexto") public Response contexto(){return executar(()->service.contexto(usuario()));}
    @GET @Path("/terminal") public Response terminal(){return executar(()->{usuario();var info=terminal.info();if(info.vinculada())estacoes.registrarPresenca(info.terminalId(),null,headers.getHeaderString("User-Agent"));return info;});}
    @POST @Path("/terminal/pareamento") public Response pareamento(){return executar(()->{usuario();return estacoes.solicitar(headers.getHeaderString("X-Terminal-Id"),null,headers.getHeaderString("User-Agent"));});}
    @GET public Response listar(){return executar(()->{usuario();return service.itens();});}
    @POST public Response criar(Ferramenta r){return executar(()->service.salvar(null,r,usuario(),null));}
    public record Cadastro(Ferramenta ferramenta,String justificativa){}
    @PUT @Path("/{id}") public Response editar(@PathParam("id") Long id,Cadastro r){return executar(()->service.salvar(id,r.ferramenta(),usuario(),r.justificativa()));}
    @GET @Path("/movimentos") public Response movimentos(){return executar(()->service.movimentos(usuario()));}
    @POST @Path("/movimentos") public Response preparar(MovimentoRequest r){return executar(()->service.preparar(r,usuario()));}
    @POST @Path("/movimentos/{id}/confirmar") public Response confirmar(@PathParam("id") Long id,Confirmacao r){return executar(()->service.confirmar(id,r,usuario()));}
    @POST @Path("/{id}/devolver") public Response devolver(@PathParam("id") Long id,Acao r){return executar(()->{service.devolver(id,r,usuario());return Map.of("ok",true);});}
    @POST @Path("/{id}/previsao") public Response previsao(@PathParam("id") Long id,Acao r){return executar(()->{service.previsao(id,r,usuario());return Map.of("ok",true);});}
    @POST @Path("/{id}/ocorrencia") public Response ocorrencia(@PathParam("id") Long id,Acao r){return executar(()->{service.ocorrencia(id,r,usuario());return Map.of("ok",true);});}
    @GET @Path("/{id}/historico") public Response historico(@PathParam("id") Long id){return executar(()->{usuario();return service.historico(id);});}
    @GET @Path("/{id}/impacto") public Response impacto(@PathParam("id") Long id,@QueryParam("de") LocalDate de,@QueryParam("ate") LocalDate ate){return executar(()->{service.exigir(usuario(),FerramentaService.CAL);return service.impacto(id,de,ate);});}
    @POST @Path("/laboratorios") public Response laboratorio(FerramentaLaboratorio r){return executar(()->service.laboratorio(r,usuario()));}
    @GET @Path("/calibracoes") public Response calibracoes(){return executar(()->{usuario();return service.calibracoes();});}
    @POST @Path("/{id}/calibracoes") public Response enviar(@PathParam("id") Long id,Envio r){return executar(()->service.enviar(id,r,usuario()));}
    @POST @Path("/calibracoes/{id}/receber") public Response receber(@PathParam("id") Long id,Recebimento r){return executar(()->service.receber(id,r,usuario()));}
    @POST @Path("/calibracoes/{id}/analisar") public Response analisar(@PathParam("id") Long id,Analise r){return executar(()->service.analisar(id,r,usuario()));}
    @GET @Path("/calibracoes/{id}/certificado") @Produces("application/pdf")
    public Response certificado(@PathParam("id") Long id){
        try {
            service.exigir(usuario(),FerramentaService.CAL,FerramentaService.GESTAO,FerramentaService.ESTACAO);
            FerramentaCalibracao c=FerramentaCalibracao.find("id", id).firstResult();
            if(c==null || c.arquivo==null)throw new NotFoundException("Certificado não encontrado.");
            return Response.ok(c.arquivo,"application/pdf").header("Content-Disposition","attachment; filename=certificado-"+id+".pdf").header("Cache-Control","no-store").header("X-Content-Type-Options","nosniff").build();
        } catch(WebApplicationException e){return Response.status(e.getResponse().getStatus()).type(MediaType.APPLICATION_JSON).entity(Map.of("message",e.getMessage())).build();}
    }
}
