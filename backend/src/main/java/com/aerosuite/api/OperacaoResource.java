package com.aerosuite.api;
import com.aerosuite.domain.*;
import com.aerosuite.service.OperacaoService;
import com.aerosuite.security.RequiresFuncionalidades;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.*;
@Path("/api/operacoes") @Produces(MediaType.APPLICATION_JSON) @Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf={"CENTRAL_OPERACIONAL","CUSTOS_OPERACIONAIS"})
public class OperacaoResource {
 @Inject OperacaoService service;
 @GET @Path("/contexto") public Map<String,Object> contexto(@QueryParam("q") String q){return service.contexto(q);}
 @GET @Path("/os/{id}/resumo") public Map<String,Object> resumo(@PathParam("id") Long id){return service.resumo(id);}
 @GET @Path("/{modulo}") public List<OperacaoRegistro> listar(@PathParam("modulo") String m,@QueryParam("osId") Long osId){return service.listar(m,osId);}
 @POST @Path("/{modulo}") public OperacaoRegistro criar(@PathParam("modulo") String m,OperacaoRegistro b){if(b!=null)b.modulo=m;return service.salvar(null,b);}
 @PUT @Path("/{modulo}/{id}") public OperacaoRegistro editar(@PathParam("modulo") String m,@PathParam("id") Long id,OperacaoRegistro b){if(b!=null)b.modulo=m;return service.salvar(id,b);}
 @RequiresFuncionalidades(allOf={"CENTRAL_OPERACIONAL","ESTOQUE_SAIDA"})
 @POST @Path("/materiais/{id}/consumir") public OperacaoRegistro consumir(@PathParam("id") Long id,OperacaoRegistro b){if(b==null)throw new BadRequestException();return service.consumir(id,b.version);}
 @GET @Path("/eventos/{id}") public List<OperacaoEvento> eventos(@PathParam("id") Long id){return service.eventos(id);}
}
