package com.aerosuite.api;

import com.aerosuite.dto.RelatorioResumoDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.RelatorioAnalyticsService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Path("/api/relatorios")
@Produces(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"RELATORIO", "PRODUTOS", "GERENCIAR_PERMISSOES"})
public class RelatorioResource {

    @Inject
    RelatorioAnalyticsService service;

    @GET
    @Path("/resumo")
    public RelatorioResumoDto resumo(
            @QueryParam("tipo") String tipo,
            @QueryParam("dataInicio") String dataInicio,
            @QueryParam("dataFim") String dataFim) {
        return service.resumo(tipo, parseDate(dataInicio), parseDate(dataFim));
    }

    private static LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            if (raw.contains("/")) {
                return LocalDate.parse(raw.trim(), DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            }
            return LocalDate.parse(raw.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}
