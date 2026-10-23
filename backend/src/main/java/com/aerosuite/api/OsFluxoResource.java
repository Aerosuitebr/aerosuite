package com.aerosuite.api;

import com.aerosuite.dto.OsFluxoDtos.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.time.*;
import java.util.*;
import static com.aerosuite.service.OsFluxoService.map;

@Path("/api/os-fluxo") @Produces(MediaType.APPLICATION_JSON) @Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyCodigoStartingWith = {"OS_FLUXO"})
public class OsFluxoResource {
    @Inject OsFluxoService service;
    @Inject OsFluxoEstacaoService estacoes;
    public record Meta(Integer metaMinutos) {}
    public record Motivo(String motivo) {}
    public record Terminal(String terminalId, String estacaoCodigo, String apelido) {}
    public record Nome(String nome) {}
    public record NovaEstacao(String nome,String setor) {}
    private static LocalDate data(String value) {
        if(value==null||value.isBlank())return null;
        try{return LocalDate.parse(value);}catch(Exception e){throw new BadRequestException("Data inválida.");}
    }
    @GET @Path("/etapas") public Object etapas(){return service.etapas();}
    @PUT @Path("/etapas/{id}/meta") public Object meta(@PathParam("id")Long id,Meta body){return service.meta(id,body==null?null:body.metaMinutos());}
    @POST @Path("/bipar") @RequiresFuncionalidades(allOf={"OS_FLUXO_ESTACAO"})
    public Response bipar(BiparRequest body){
        try{return Response.ok(service.bipar(body)).build();}
        catch(WebApplicationException e){
            if(body!=null)service.registrarRejeicao(body,e.getMessage());
            return Response.status(e.getResponse().getStatus()).entity(map("sucesso",false,"codigo","LEITURA_REJEITADA","mensagem",e.getMessage(),"message",e.getMessage(),
                    "detalhes",map("podeForcar",service.podeGerir()&&e.getMessage()!=null&&e.getMessage().contains("sequência")))).build();
        }
    }
    @GET @Path("/estado") public Object estado(@QueryParam("codigo")String codigo){return service.estado(codigo);}
    @GET @Path("/dashboard") @RequiresFuncionalidades(allOf={"OS_FLUXO_PAINEL"})
    public Object dashboard(@QueryParam("de")String de,@QueryParam("ate")String ate){return service.dashboard(data(de),data(ate));}
    @GET @Path("/eventos") public Object eventos(@QueryParam("de")String de,@QueryParam("ate")String ate,@QueryParam("sucesso")Boolean sucesso,@QueryParam("limite")@DefaultValue("500")int limite){return service.eventos(data(de),data(ate),sucesso,limite);}
    @GET @Path("/os") public Object listar(@QueryParam("situacao")String situacao,@QueryParam("etapaId")Long etapaId,@QueryParam("q")String q,@QueryParam("page")@DefaultValue("0")int page,@QueryParam("size")@DefaultValue("25")int size){return service.listar(situacao,etapaId,q,page,size);}
    @GET @Path("/os/sugestoes") public Object sugerir(@QueryParam("q")String q,@QueryParam("limite")@DefaultValue("8")int limite){return service.sugestoes(q,limite);}
    @GET @Path("/os/{id}") public Object detalhe(@PathParam("id")Long id){return service.detalhe(id);}
    @POST @Path("/os/{id}/estornar") public Object estornar(@PathParam("id")Long id,Motivo body){return service.estornar(id,body==null?null:body.motivo());}
    @POST @Path("/os/{id}/ajuste/simular") public Object simular(@PathParam("id")Long id,AjusteRequest body){return service.simular(id,body);}
    @POST @Path("/os/{id}/ajuste") public Object ajustar(@PathParam("id")Long id,AjusteRequest body){return service.ajustar(id,body);}
    @GET @Path("/fila") public Object fila(@QueryParam("etapaIds")String ids,@QueryParam("limite")@DefaultValue("60")int limite,@QueryParam("terminal")String terminal){
        Set<Long> etapas=new HashSet<>();
        if(ids!=null&&!ids.isBlank())try{for(String id:ids.split(","))etapas.add(Long.valueOf(id.trim()));}catch(NumberFormatException e){throw new BadRequestException("Etapas inválidas.");}
        return service.fila(etapas,limite,terminal);
    }
    @GET @Path("/estacoes") public Object estacoes(@QueryParam("terminal")String terminal){return estacoes.listar(terminal);}
    @GET @Path("/estacoes/gestao") public Object gestao(){return estacoes.gestaoEstacoes();}
    @POST @Path("/estacoes") public Object criarEstacao(NovaEstacao body){if(body==null)throw new BadRequestException();return estacoes.criar(body.nome(),body.setor());}
    @DELETE @Path("/estacoes/{codigo}") public Object excluirEstacao(@PathParam("codigo")String codigo){return estacoes.excluirEstacao(codigo);}
    @PUT @Path("/estacoes/vinculo") public Object vincular(Terminal body){if(body==null)throw new BadRequestException();return estacoes.vincularEstacao(body.terminalId(),body.estacaoCodigo());}
    @PUT @Path("/estacoes/{codigo}/nome") public Object renomear(@PathParam("codigo")String codigo,Nome body){if(body==null)throw new BadRequestException();return estacoes.renomear(codigo,body.nome());}
    @PUT @Path("/maquinas/{id}") public Object atualizar(@PathParam("id")String id,Terminal body){if(body==null)throw new BadRequestException();return estacoes.atualizar(id,body.estacaoCodigo(),body.apelido());}
    @DELETE @Path("/maquinas/{id}") public Object remover(@PathParam("id")String id){return estacoes.remover(id);}
    @POST @Path("/estacoes/pareamento") public Object solicitar(Terminal body,@Context HttpHeaders headers){if(body==null)throw new BadRequestException();return estacoes.solicitar(body.terminalId(),null,headers.getHeaderString("User-Agent"));}
    @GET @Path("/estacoes/pareamento/{codigo}") public Object consultar(@PathParam("codigo")String codigo){return estacoes.consultar(codigo);}
    @POST @Path("/estacoes/pareamento/{codigo}") public Object concluir(@PathParam("codigo")String codigo,Terminal body){if(body==null)throw new BadRequestException();return estacoes.concluir(codigo,body.estacaoCodigo(),body.apelido());}
}
