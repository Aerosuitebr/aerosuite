package com.aerosuite.api;

import org.jboss.logging.Logger;
import com.aerosuite.domain.OSAuditoria.AcaoAuditoria;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.OSAuditoriaDto;
import com.aerosuite.dto.PageResponse;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.OSAuditoriaService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import io.quarkus.runtime.LaunchMode;

/**
 * API REST para consulta de auditoria de Ordens de Serviço
 */
@Path("/api/os-auditoria")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"ORDEM_SERVICO", "CONSULTA_TROCAS_EVENTUAIS"})
public class OSAuditoriaResource {

    private static final Logger LOG = Logger.getLogger(OSAuditoriaResource.class);

    @Inject
    OSAuditoriaService auditoriaService;

    /**
     * Busca histórico de auditoria por ID da OS
     */
    @GET
    @Path("/os/{idOs}")
    public Response buscarPorOs(@PathParam("idOs") Long idOs) {
        try {
            List<OSAuditoriaDto> historico = auditoriaService.buscarHistoricoPorOs(idOs);
            return Response.ok(historico).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse(ApiI18nMessages.withDetail(ApiI18nMessages.AUDIT_FETCH_HISTORY_FAILED, e.getMessage())))
                .build();
        }
    }

    /**
     * Busca histórico de auditoria por número da OS
     */
    @GET
    @Path("/numero/{numeroOs}")
    public Response buscarPorNumeroOs(@PathParam("numeroOs") Integer numeroOs) {
        try {
            List<OSAuditoriaDto> historico = auditoriaService.buscarHistoricoPorNumeroOs(numeroOs);
            return Response.ok(historico).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse(ApiI18nMessages.withDetail(ApiI18nMessages.AUDIT_FETCH_HISTORY_FAILED, e.getMessage())))
                .build();
        }
    }

    /**
     * Busca auditoria com filtros e paginação
     */
    @GET
    public Response buscarComFiltros(
        @QueryParam("idOs") Long idOs,
        @QueryParam("numeroOs") Integer numeroOs,
        @QueryParam("refOs") Long refOs,
        @QueryParam("acao") String acao,
        @QueryParam("dataInicio") String dataInicio,
        @QueryParam("dataFim") String dataFim,
        @QueryParam("usuario") String usuario,
        @QueryParam("page") @DefaultValue("0") int page,
        @QueryParam("size") @DefaultValue("20") int size
    ) {
        try {
            // Converter parâmetros
            AcaoAuditoria acaoEnum = null;
            if (acao != null && !acao.isEmpty()) {
                try {
                    acaoEnum = AcaoAuditoria.valueOf(acao.toUpperCase());
                } catch (IllegalArgumentException e) {
                    // Ignorar ação inválida
                }
            }

            LocalDateTime dataInicioLdt = null;
            LocalDateTime dataFimLdt = null;
            DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

            if (dataInicio != null && !dataInicio.isEmpty()) {
                try {
                    // Tentar parse com hora
                    dataInicioLdt = LocalDateTime.parse(dataInicio, formatter);
                } catch (Exception e) {
                    // Se falhar, tentar apenas data
                    try {
                        dataInicioLdt = LocalDateTime.parse(dataInicio + "T00:00:00");
                    } catch (Exception e2) {
                        // Ignorar
                    }
                }
            }

            if (dataFim != null && !dataFim.isEmpty()) {
                try {
                    dataFimLdt = LocalDateTime.parse(dataFim, formatter);
                } catch (Exception e) {
                    try {
                        dataFimLdt = LocalDateTime.parse(dataFim + "T23:59:59");
                    } catch (Exception e2) {
                        // Ignorar
                    }
                }
            }

            // Buscar dados
            List<OSAuditoriaDto> auditorias = auditoriaService.buscarComFiltros(
                idOs, numeroOs, refOs, acaoEnum, dataInicioLdt, dataFimLdt, usuario, page, size
            );

            long total = auditoriaService.contarComFiltros(
                idOs, numeroOs, refOs, acaoEnum, dataInicioLdt, dataFimLdt, usuario
            );
            

            // Montar resposta paginada
            PageResponse<OSAuditoriaDto> response = new PageResponse<>();
            response.items = auditorias;
            response.totalElements = total;
            response.page = page;
            response.size = size;
            response.totalPages = (int) Math.ceil((double) total / size);

            return Response.ok(response).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse(ApiI18nMessages.withDetail(ApiI18nMessages.AUDIT_FETCH_FAILED, e.getMessage())))
                .build();
        }
    }

    /**
     * Retorna os tipos de ação disponíveis
     */
    @GET
    @Path("/acoes")
    public Response listarAcoes() {
        return Response.ok(AcaoAuditoria.values()).build();
    }

    /**
     * Endpoint de teste para verificar se a auditoria está funcionando
     * Acesse: GET /os-auditoria/teste
     */
    @GET
    @Path("/teste")
    @RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
    @jakarta.transaction.Transactional
    public Response testeAuditoria() {
        if (LaunchMode.current() == LaunchMode.NORMAL) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        try {
            
            // Criar um registro de teste diretamente
            com.aerosuite.domain.OSAuditoria teste = new com.aerosuite.domain.OSAuditoria();
            teste.idOs = 0L;
            teste.numeroOs = 0;
            teste.acao = AcaoAuditoria.CRIACAO;
            teste.usuarioNome = "TESTE";
            teste.usuarioEmail = "teste@teste.com";
            teste.campoAlterado = "TESTE_CAMPO";
            teste.valorAnterior = "valor_anterior_teste";
            teste.valorNovo = "valor_novo_teste";
            teste.dataHora = java.time.LocalDateTime.now();
            teste.snapshotOs = "{\"teste\": true}";
            
            teste.persist();
            
            // Contar registros na tabela
            long total = com.aerosuite.domain.OSAuditoria.count();
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", ApiI18nMessages.encode(ApiI18nMessages.AUDIT_TEST_RECORD_CREATED));
            response.put("idCriado", teste.id);
            response.put("totalRegistros", total);
            
            
            return Response.ok(response).build();
        } catch (Exception e) {
            LOG.warn("========================================");
            LOG.warn("ERRO NO TESTE DE AUDITORIA!");
            LOG.warnf(e, "Mensagem: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            LOG.warn("========================================");
            
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("tipo", e.getClass().getName());
            
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(errorResponse)
                .build();
        }
    }

    /**
     * Classe para resposta de erro
     */
    public static class ErrorResponse {
        public String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
    }
}
